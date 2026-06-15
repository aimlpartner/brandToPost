import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

// Date & Time Helper Functions
function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function test() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = getFirestore(app, 'productiondb');
  
  // Find a product with a synthesized founder agent
  const productsSnapshot = await db.collection('products').get();
  let product: any = null;
  let productId: string = '';
  
  productsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.founderAgentSynthesized) {
      product = data;
      productId = doc.id;
    }
  });
  
  if (!product) {
    console.error("No product with a synthesized Founder Agent found in the database. Please synthesize one first.");
    return;
  }
  
  console.log(`Found product: ${product.name} (ID: ${productId}) with Founder Agent: ${product.founderAgentSynthesized.personaName}`);
  
  const founderAgent = product.founderAgentSynthesized;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    // 1. Get campaign inputs / blog topic from Founder Agent
    console.log(`[test] Querying Founder Agent Doppelganger "${founderAgent.personaName}" for blog direction...`);
    const founderPrompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

Company Position & Product DNA:
- Product Name: ${product.name}
- Positioning: ${product.positioning}
- Target Audience: ${product.audience}
- Tone of Voice: ${product.tone}

Based on your profile, values, behavioral traits, and positioning, identify a highly specific, compelling blog post topic or focus area, a sub-category/niche, and an engaging blog title/theme for today.
Return the result in a JSON object with the following fields:
- focusInput: A punchy focus area (e.g. "early stage B2B SaaS", "manual spreadsheet fatigue")
- subCategory: A specific sub-category or niche (e.g. "productivity tools", "accounting automation")
- blogTitle: An engaging, click-worthy blog title (e.g. "The Hidden Cost of Manual Data Entry in B2B Teams")
`;

    const founderResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ text: founderPrompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusInput: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            blogTitle: { type: Type.STRING }
          },
          required: ["focusInput", "subCategory", "blogTitle"]
        }
      }
    });

    const founderInputs = JSON.parse(founderResponse.text || "{}");
    console.log("Founder inputs:", founderInputs);
    if (!founderInputs.focusInput || !founderInputs.blogTitle) throw new Error("Founder Agent failed to generate daily blog focus.");

    // 2. Research focus area
    console.log(`[test] Researching focus area: ${founderInputs.focusInput}...`);
    const researchPrompt = `
      You are an expert market researcher.
      
      Research the following industry or focus area: "${founderInputs.focusInput}"
      Specifically focus on this sub-category or niche: "${founderInputs.subCategory}"
      
      Generate 4-6 highly engaging key insights about this focus area, including:
      - Current trends and emerging topics
      - Audience pain points and desires
      - Competitor landscape or market gaps
      
      Return a JSON array of strings, where each string is a detailed key insight.
    `;

    const researchResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ text: researchPrompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const insights = JSON.parse(researchResponse.text || "[]");
    console.log("Insights:", insights);

    // 3. Generate blog body and image prompt
    console.log(`[test] Drafting daily blog for "${founderInputs.blogTitle}"...`);
    const blogPrompt = `
      You are an expert B2B SaaS copywriter and growth marketer.
      
      Generate a full-length, highly engaging blog post and newsletter based on the provided Brand Position, Key Insights, and specific topic.
      The writing style MUST reflect the virtual Founder Agent "${founderAgent.personaName}" who has the following traits:
      - Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
      - Core Values: ${founderAgent.coreValues?.join(", ") || ""}
      - Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
      - Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

      Blog Title: ${founderInputs.blogTitle}
      Industry Focus Area: ${founderInputs.focusInput}
      Industry Sub-Category/Niche: ${founderInputs.subCategory}
      
      Key Insights about this Focus:
      ${insights.map((i: string) => `- ${i}`).join('\n')}
      
      Brand Position:
      Website: ${product.website}
      Positioning: ${product.positioning}
      Audience: ${product.audience}
      Tone: ${product.tone}
      Stage: ${product.stage}
      
      Advanced DNA:
      ${product.enemy ? `- The Enemy / Status Quo: ${product.enemy}` : ''}
      ${product.earnedSecret ? `- The Earned Secret: ${product.earnedSecret}` : ''}
      ${product.originStory ? `- Origin Story: ${product.originStory}` : ''}
      ${product.hellState ? `- 'Hell' State (Before): ${product.hellState}` : ''}
      ${product.heavenState ? `- 'Heaven' State (After): ${product.heavenState}` : ''}
      ${product.uniqueMechanism ? `- Unique Mechanism: ${product.uniqueMechanism}` : ''}
      ${product.proofPoints ? `- Proof Points: ${product.proofPoints}` : ''}

      The output must contain:
      - blogContent: A full-length (500-800 words) detailed, insightful blog post written in a conversational, authoritative founder voice. Format with markdown headings (##, ###) and clean paragraphs.
      - blogImagePrompt: A detailed, scenic background image prompt for Imagen AI to generate a header graphic for this blog. Should be photographic, professional, and contain NO text.
      - targetAudience: The specific reader persona targeted.
      - coreMessage: A 1-sentence value proposition of this blog post.
      - cta: A clear newsletter or product call-to-action at the end (e.g. "Try ${product.name} today").
    `;

    const blogResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ text: blogPrompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blogContent: { type: Type.STRING },
            blogImagePrompt: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            coreMessage: { type: Type.STRING },
            cta: { type: Type.STRING }
          },
          required: ["blogContent", "blogImagePrompt", "targetAudience", "coreMessage", "cta"]
        }
      }
    });

    const blogData = JSON.parse(blogResponse.text || "{}");
    console.log("Blog data generated. Prompt:", blogData.blogImagePrompt);

    // 4. Generate AI image for the blog
    let blogImageUrl = null;
    if (blogData.blogImagePrompt) {
      try {
        console.log(`[test] Generating Imagen header image for blog: "${blogData.blogImagePrompt}"...`);
        const imgRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts: [{ text: blogData.blogImagePrompt }] },
          config: { imageConfig: { aspectRatio: "16:9" } }
        });

        console.log("Image response received. Checking candidates...");
        if (imgRes?.candidates?.[0]?.content?.parts) {
          for (const pt of imgRes.candidates[0].content.parts) {
            console.log("Checking part:", Object.keys(pt));
            if (pt.inlineData) {
              const base64Data = pt.inlineData.data;
              const mimeType = pt.inlineData.mimeType || 'image/png';
              console.log(`Found inlineData, size: ${base64Data.length}, mimeType: ${mimeType}`);
              
              const imageId = 'img_blog_test_' + Math.random().toString(36).substring(2, 10);
              
              let dbSuccess = false;
              try {
                await db.collection('whatsapp_images').doc(imageId).set({
                  base64Data,
                  mimeType,
                  prompt: blogData.blogImagePrompt,
                  createdAt: new Date().toISOString()
                });
                dbSuccess = true;
                console.log(`[test] Image ${imageId} saved to Firestore.`);
              } catch (dbErr: any) {
                console.warn(`[test] Firestore save failed for ${imageId}: ${dbErr.message}`);
              }

              try {
                const dirPath = path.join(process.cwd(), 'public', 'whatsapp_images');
                await fs.mkdir(dirPath, { recursive: true });
                await fs.writeFile(path.join(dirPath, `${imageId}.png`), Buffer.from(base64Data, 'base64'));
                console.log(`[test] Image ${imageId} saved to local disk.`);
              } catch (fsErr: any) {
                console.error(`[test] Local disk save failed for ${imageId}:`, fsErr);
                if (!dbSuccess) {
                  throw new Error(`Failed to save image ${imageId} to both Firestore and local disk`);
                }
              }

              blogImageUrl = `/api/whatsapp/images/${imageId}.png`;
              console.log(`[test] Blog image successfully saved. Local path: ${blogImageUrl}`);
              break;
            }
          }
        } else {
          console.warn("No content parts found in image response. Candidates:", JSON.stringify(imgRes?.candidates));
        }
      } catch (eImg: any) {
        console.error('[test Image Gen Failed]', eImg);
      }
    }
    
    console.log("FINISHED TEST. blogImageUrl:", blogImageUrl);
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

test().catch(console.error);
