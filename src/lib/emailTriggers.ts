import { auth } from '../firebase';
import { logSilentError } from './firestore-error';

export async function triggerBrandedEmail(
  type: 'signup' | 'onboarding_complete' | 'product_dna' | 'first_campaign' | 'founder_agent',
  email: string,
  metadata?: any,
  pdfBase64?: string
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn(`[emailTriggers] No authenticated user to send email type: ${type}`);
      return false;
    }
    const token = await user.getIdToken();
    const response = await fetch('/api/emails/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type,
        email,
        metadata,
        pdfBase64
      })
    });

    if (!response.ok) {
      const data = await response.json();
      console.error(`[emailTriggers] Failed to send email type ${type}:`, data.error);
      return false;
    }
    return true;
  } catch (error) {
    logSilentError(error as Error, { context: `triggerBrandedEmail:${type}` });
    return false;
  }
}
