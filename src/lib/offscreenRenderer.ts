import { VisualData } from '../components/VisualEngine';
import { auth } from '../firebase';

/**
 * Calls the server-side Puppeteer renderer to generate visuals securely
 * and without CORS or race condition issues.
 */
export const renderVisualToJpegOffscreen = async (
  visualType: string,
  visualData: any,
  imageUrl: string,
  dna: any,
  productName: string,
  productLogo: string | null
): Promise<string> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    
    // We auto-retry once natively on the frontend
    const performFetch = async () => {
      const res = await fetch('/api/render-visual', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          visualType,
          visualData,
          imageUrl,
          dna,
          fallbackText: productName,
          activeLogo: productLogo
        })
      });

      if (!res.ok) {
        throw new Error("Server render failed");
      }
      return res.json();
    };

    let data;
    try {
      data = await performFetch();
    } catch (e) {
      console.warn("First render attempt failed, retrying once...", e);
      data = await performFetch();
    }

    return data.url || imageUrl;
  } catch (e) {
    console.error("Render to visual error (fallback to original):", e);
    return imageUrl;
  }
};
