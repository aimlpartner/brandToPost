import { admin, db } from '../config/firebase';
import {
  scheduleConfigs,
  postQueue,
  deleteFromLocalQueue,
  unshiftToLocalQueue,
  lastPostedDates,
  lastKnownHost,
  getToken,
} from '../utils/firestoreStorage';
import { publishPostToLinkedIn, publishToInstagramGraphAPI } from './socialService';
import {
  executeAutoCampaignGeneration,
  executeAutoDailyGeneration,
  executeAutoFounderPostGeneration,
} from './autoCampaignService';
import { runPeriodicEmailChecks } from './emailService';

let scheduledPostingTimer: NodeJS.Timeout | null = null;
let automationAgentTimer: NodeJS.Timeout | null = null;

export function startAutomationWorker(): void {
  console.log('[Automation Worker] Starting background scheduled posting and automation workers...');
// --- Cron Job for Scheduled Posting ---
  scheduledPostingTimer = setInterval(async () => {
  const now = new Date();
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const currentTimeUtc = `${hours}:${minutes}`;
  const currentDateUtc = now.toISOString().split('T')[0];

  let productsToProcess: string[] = [];

  if (db) {
    const snapshot = await db.collection('server_schedules').where('enabled', '==', true).get();
    for (const doc of snapshot.docs) {
      const config = doc.data();
      if (config.timeUtc === currentTimeUtc && config.lastPostedDate !== currentDateUtc) {
        productsToProcess.push(doc.id);
      }
    }
  } else {
    if (postQueue.length === 0) return;
    for (const [productId, config] of Object.entries(scheduleConfigs)) {
      if (config.enabled && config.timeUtc === currentTimeUtc && lastPostedDates[productId] !== currentDateUtc) {
        productsToProcess.push(productId);
      }
    }
  }

  for (const productId of productsToProcess) {
    let post: any = null;
    let postRef: any = null;

    if (db) {
      try {
        const result = await db.runTransaction(async (transaction) => {
          const scheduleRef = db!.collection('server_schedules').doc(productId);
          const scheduleSnap = await transaction.get(scheduleRef);

          if (scheduleSnap.exists) {
            const schedData = scheduleSnap.data();
            // Horizontal container double-posting prevent defense
            if (schedData?.lastPostedDate === currentDateUtc) {
              console.log(`[Scheduler Link Lock] Product ${productId} already processed by another instance for ${currentDateUtc}. Bypassing.`);
              return null;
            }
          }

          const queueColl = db!.collection(`server_queues/${productId}/posts`).orderBy('createdAt', 'asc').limit(1);
          const queueSnap = await transaction.get(queueColl);

          if (queueSnap.empty) return null;

          const targetPostDoc = queueSnap.docs[0];
          const postData = targetPostDoc.data();

          if (postData.processing) {
            console.log(`[Scheduler Concurrent Lock] Queue post ${targetPostDoc.id} is already locked by another container process.`);
            return null;
          }

          // Atomically reserve the schedule post execution slot and set lock
          transaction.update(scheduleRef, { lastPostedDate: currentDateUtc });
          transaction.update(targetPostDoc.ref, { processing: true });

          return {
            post: { id: targetPostDoc.id, ...postData },
            postRef: targetPostDoc.ref
          };
        });

        if (!result) continue;
        post = result.post;
        postRef = result.postRef;
      } catch (transErr) {
        console.error(`[Scheduler Locked Transaction Error] Claim failed for product ${productId}:`, transErr);
        continue;
      }
    } else {
      post = postQueue.find(p => p.productId === productId);
    }

    if (!post) continue;

    // Delete or pop the post immediately to prevent race conditions during long-lived HTTP publish API requests
    if (db) {
      await postRef.delete();
    } else {
      lastPostedDates[productId] = currentDateUtc;
      deleteFromLocalQueue(post.id);
    }

    const token = await getToken(productId, post.platform);
    if (!token) {
      console.error(`[Scheduler] No token found for product ${productId}, skipping post ${post.id}`);
      if (db) {
        await db.collection(`server_queues/${productId}/posts`).doc(post.id).set({
          ...post,
          processing: false
        });
        await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
      } else {
        unshiftToLocalQueue(post);
        lastPostedDates[productId] = "";
      }
      continue;
    }

    try {
      console.log(`[Scheduler] Attempting to publish post ${post.id} to ${post.platform}...`);
      if (post.platform === 'linkedin') {
        let targetImage = (post as any).approvedTemplateImage || post.imageUrl;
        if (typeof targetImage === 'string' && targetImage.startsWith('data:image/svg+xml')) {
          targetImage = post.imageUrl || null;
        }

        try {
          await publishPostToLinkedIn(token, post.text, targetImage);
          console.log('[Scheduler] Successfully published scheduled post to LinkedIn:', post.id);
        } catch (postErr: any) {
          const errorText = postErr?.message || String(postErr);
          console.error('[Scheduler] Failed to publish scheduled post:', errorText);
          if (errorText.includes('DUPLICATE_POST')) {
            console.log(`[Scheduler] Post ${post.id} is a duplicate, removing from queue.`);
          } else {
            if (db) {
              const attempt = (post.failCount || 0) + 1;
              if (attempt >= 3) {
                console.error(`[Scheduler] Post ${post.id} failed 3 times. Sending to Dead Letter storage (DLQ).`);
                await db.collection(`server_queues/${productId}/failed_posts`).doc(post.id).set({
                  ...post,
                  failedAt: admin.firestore.FieldValue.serverTimestamp(),
                  errorMessage: errorText
                });
              } else {
                await db.collection(`server_queues/${productId}/posts`).doc(post.id).set({
                  ...post,
                  failCount: attempt,
                  processing: false
                });
                await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
              }
            } else {
              postQueue.unshift(post);
              lastPostedDates[productId] = "";
            }
          }
        }
      } else if (post.platform === 'instagram') {
        if (typeof token === 'string' && token.startsWith('IGAAN')) {
          console.log('[Scheduler] Simulating Instagram Publish for Sandbox Mode...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else if (typeof token === 'string' && (token.startsWith('EAA') || !token.startsWith('IG'))) {
          console.log('[Scheduler] Attempting live Instagram Graph API publish for post', post.id);
          const publishId = await publishToInstagramGraphAPI(token, post.text || '', post.imageUrl || '', lastKnownHost);
          console.log('[Scheduler] Successfully published scheduled post to Instagram:', publishId);
        } else {
          throw new Error('Scheduled Instagram publishing requires a professional Meta Access Token (starts with EAA). Basic Display tokens (IGQV) do not support publishing.');
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error in scheduled post:', err);
      if (db) {
        const attempt = (post.failCount || 0) + 1;
        if (attempt >= 3) {
          console.error(`[Scheduler] Post ${post.id} failed 3 times. Sending to DLQ.`);
          await db.collection(`server_queues/${productId}/failed_posts`).doc(post.id).set({
            ...post,
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            errorMessage: err?.message || 'Unknown server exception'
          });
        } else {
          await db.collection(`server_queues/${productId}/posts`).doc(post.id).set({
            ...post,
            failCount: attempt,
            processing: false
          });
          await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
        }
      } else {
        postQueue.unshift(post);
        lastPostedDates[productId] = "";
      }
    }
  }
}, 30000);

// --- Automation Agent Background Check ---
  const processingProductIds = new Set<string>();
  const processingUserFounderPostIds = new Set<string>();
  let lastEmailCheckHour = -1;
  automationAgentTimer = setInterval(async () => {
  if (!db) return;

  const now = new Date();
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const currentTimeUtc = `${hours}:${minutes}`;
  const currentDateUtc = now.toISOString().split('T')[0];

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = weekdays[now.getUTCDay()];

  try {
    const productsSnap = await db.collection('products').where('automationAgentEnabled', '==', true).get();
    for (const productDoc of productsSnap.docs) {
      const product = productDoc.data();
      if (processingProductIds.has(product.id)) {
        console.log(`[Automation Agent] Skipping product ${product.id} because a generation is already in progress.`);
        continue;
      }

      if (!product.userId) continue;
      const userDoc = await db.collection('users').doc(product.userId).get();
      if (!userDoc.exists) continue;
      const userData = userDoc.data()!;
      if (!userData.founderAgentSynthesized) {
        continue;
      }

      processingProductIds.add(product.id);
      try {
        const triggerTime = product.automationTimeUtc || "14:00";
        const [trigH, trigM] = triggerTime.split(':');
        const trigMinutes = parseInt(trigH, 10) * 60 + parseInt(trigM, 10);
        const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        // Only trigger within a 2-minute window around the scheduled time to prevent immediate runs when enabling the agent
        const shouldRunToday = nowMinutes === trigMinutes || nowMinutes === (trigMinutes + 1) % 1440;

        if (!shouldRunToday) {
          continue;
        }

        // Weekly Campaign Automation
        if (product.automateWeeklyCampaigns) {
          const triggerDay = product.automationWeeklyDay || "Monday";
          if (currentDayName === triggerDay) {
            // Check last weekly run date to avoid double-running and excessive DB reads
            let needsGeneration = product.lastWeeklyRunDate !== currentDateUtc;
            if (needsGeneration) {
              // Additional safety check against DB (in case of server restarts)
              const campaignsSnap = await db.collection('campaigns')
                .where('productId', '==', product.id)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

              const weeklyCampaigns = campaignsSnap.docs.filter(doc => !doc.data().isOneDay);
              if (weeklyCampaigns.length > 0) {
                const lastCampaign = weeklyCampaigns[0].data();
                const lastCreatedDate = lastCampaign.createdAt.split('T')[0];
                if (lastCreatedDate === currentDateUtc) {
                  needsGeneration = false;
                  // Sync the field to avoid hitting DB again today
                  await db.collection('products').doc(product.id).update({
                    lastWeeklyRunDate: currentDateUtc
                  });
                }
              }
            }

            if (needsGeneration) {
              // Pre-update lastWeeklyRunDate immediately to prevent race conditions
              await db.collection('products').doc(product.id).update({
                lastWeeklyRunDate: currentDateUtc
              });

              console.log(`[Automation Agent] Triggering campaign generation for product ${product.id} automatically...`);
              try {
                await executeAutoCampaignGeneration(product.id);
              } catch (err: any) {
                console.error(`[Automation Agent] Generation failed for product ${product.id}:`, err);
                // Log failure
                const newLog = {
                  timestamp: new Date().toISOString(),
                  type: 'weekly_campaign',
                  theme: 'N/A',
                  focus: 'N/A',
                  status: `Error: ${err?.message || 'Unknown error'}`
                };
                const currentLogs = product.automationLogs || [];
                currentLogs.unshift(newLog);
                await db.collection('products').doc(product.id).update({
                  automationLogs: currentLogs.slice(0, 10),
                  lastWeeklyRunDate: currentDateUtc
                });
              }
            }
          }
        }

        // Daily Post & Blog Automation
        if (product.automateDailyPosts || product.automateDailyBlogs) {
          let needsDailyGeneration = product.lastDailyRunDate !== currentDateUtc;
          if (needsDailyGeneration) {
            // Additional safety check against DB
            const dailySnap = await db.collection('campaigns')
              .where('productId', '==', product.id)
              .where('isOneDay', '==', true)
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get();

            if (!dailySnap.empty) {
              const lastDaily = dailySnap.docs[0].data();
              const lastCreatedDate = lastDaily.createdAt.split('T')[0];
              if (lastCreatedDate === currentDateUtc) {
                needsDailyGeneration = false;
                // Sync the field
                await db.collection('products').doc(product.id).update({
                  lastDailyRunDate: currentDateUtc
                });
              }
            }
          }

          if (needsDailyGeneration) {
            // Pre-update lastDailyRunDate immediately to prevent race conditions during long-lived HTTP generation calls
            await db.collection('products').doc(product.id).update({
              lastDailyRunDate: currentDateUtc
            });

            console.log(`[Automation Agent] Triggering daily generation for product ${product.id} automatically...`);
            try {
              await executeAutoDailyGeneration(product.id, !!product.automateDailyPosts, !!product.automateDailyBlogs);
            } catch (err: any) {
              console.error(`[Automation Agent] Daily generation failed for product ${product.id}:`, err);
              // Log failure in database
              const newLog = {
                timestamp: new Date().toISOString(),
                type: 'daily_content',
                theme: 'N/A',
                focus: 'N/A',
                status: `Error: ${err?.message || 'Unknown error'}`
              };
              const currentLogs = product.automationLogs || [];
              currentLogs.unshift(newLog);
              await db.collection('products').doc(product.id).update({
                automationLogs: currentLogs.slice(0, 10),
                lastDailyRunDate: currentDateUtc
              });
            }
          }
        }
      } finally {
        processingProductIds.delete(product.id);
      }
    }

    // 2. Process Automated Founder Profile posts
    try {
      const usersSnap = await db.collection('users').where('automateFounderPosts', '==', true).get();
      for (const userDoc of usersSnap.docs) {
        const user = userDoc.data();
        const userId = userDoc.id;

        if (processingUserFounderPostIds.has(userId)) {
          console.log(`[Automation Agent] Skipping user ${userId} because founder post generation is already in progress.`);
          continue;
        }

        if (!user.founderAgentSynthesized) {
          continue;
        }

        // Check if it's trigger time
        const triggerTime = user.founderPostTimeUtc || "14:00";
        const [trigH, trigM] = triggerTime.split(':');
        const trigMinutes = parseInt(trigH, 10) * 60 + parseInt(trigM, 10);
        const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const shouldRunToday = nowMinutes === trigMinutes || nowMinutes === (trigMinutes + 1) % 1440;

        if (!shouldRunToday) {
          continue;
        }

        // Check if already run today to prevent double-runs
        if (user.lastFounderPostRunDate === currentDateUtc) {
          continue;
        }

        processingUserFounderPostIds.add(userId);
        try {
          // Pre-update date in Firestore immediately to prevent secondary containers / triggers from racing
          await db.collection('users').doc(userId).update({
            lastFounderPostRunDate: currentDateUtc
          });

          console.log(`[Automation Agent] Triggering automated founder post generation for user ${userId}...`);
          await executeAutoFounderPostGeneration(userId);
        } catch (err: any) {
          console.error(`[Automation Agent] Founder post generation failed for user ${userId}:`, err);
        } finally {
          processingUserFounderPostIds.delete(userId);
        }
      }
    } catch (errUser) {
      console.error('[Automation Agent User check failed]:', errUser);
    }

  } catch (err) {
    console.error('[Automation Agent Error] Check failed:', err);
  }

  // Hourly background email checks
  try {
    const currentHour = new Date().getUTCHours();
    if (currentHour !== lastEmailCheckHour) {
      lastEmailCheckHour = currentHour;
      runPeriodicEmailChecks().catch(e => console.error('[Background Email Check Error]:', e));
    }
  } catch (err) {
    console.error('[Background Email Check Trigger Error]:', err);
  }
}, 60 * 1000); // Check every 60 seconds

}

export function stopAutomationWorker(): void {
  if (scheduledPostingTimer) {
    clearInterval(scheduledPostingTimer);
    scheduledPostingTimer = null;
  }
  if (automationAgentTimer) {
    clearInterval(automationAgentTimer);
    automationAgentTimer = null;
  }
  console.log('[Automation Worker] Background automation workers stopped.');
}
