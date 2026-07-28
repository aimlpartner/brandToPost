import { auth } from '../firebase';

/**
 * Renders layout blueprint on client-side HTML5 Canvas as an instant fallback
 * if server-side Puppeteer renderer is unreachable.
 */
export const renderVisualCanvasFallback = async (
  headline: string,
  subtext: string,
  imageUrl: string,
  primaryColor: string = "#F59E0B",
  secondaryColor: string = "#08080C",
  logoUrl: string | null = null
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (!imageUrl || typeof window === 'undefined') return resolve(imageUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageUrl);

      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = imageUrl;
      bgImg.onload = () => {
        // Draw background color
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(0, 0, 1080, 1080);

        // Aspect ratio cover calculation
        const imgRatio = bgImg.width / bgImg.height || 1;
        let drawW = 1080;
        let drawH = 1080 / imgRatio;
        if (drawH < 1080) {
          drawH = 1080;
          drawW = 1080 * imgRatio;
        }
        const drawX = (1080 - drawW) / 2;
        const drawY = (1080 - drawH) / 2;
        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

        // Dark gradient scrim overlay
        const grad = ctx.createLinearGradient(0, 0, 0, 1080);
        grad.addColorStop(0, "rgba(8, 8, 12, 0.2)");
        grad.addColorStop(0.5, "rgba(8, 8, 12, 0.7)");
        grad.addColorStop(1, "rgba(8, 8, 12, 0.95)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1080);

        // Left accent bar
        ctx.fillStyle = primaryColor;
        ctx.fillRect(80, 680, 60, 6);

        // Subtext / Category Tag
        if (subtext) {
          ctx.fillStyle = "#A5B4FC";
          ctx.font = "bold 24px 'Inter', sans-serif";
          ctx.fillText(`— ${subtext.toUpperCase()}`, 80, 720);
        }

        // Headline Text (word-wrapped)
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 56px 'Inter', sans-serif";
        const words = (headline || "").split(" ");
        let line = "";
        let currentY = 780;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 900 && n > 0) {
            ctx.fillText(line, 80, currentY);
            line = words[n] + " ";
            currentY += 68;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 80, currentY);

        // Brand Logo if present
        if (logoUrl) {
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          logoImg.src = logoUrl;
          logoImg.onload = () => {
            ctx.drawImage(logoImg, 80, 80, 160, 50);
            resolve(canvas.toDataURL("image/jpeg", 0.92));
          };
          logoImg.onerror = () => resolve(canvas.toDataURL("image/jpeg", 0.92));
        } else {
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        }
      };
      bgImg.onerror = () => resolve(imageUrl);
    } catch (e) {
      resolve(imageUrl);
    }
  });
};

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
  productLogo: string | null,
  recentLayoutHistory?: string[]
): Promise<any> => {
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
          activeLogo: productLogo,
          recentLayoutHistory
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

    // Return the full data containing both url and layoutId
    return data;
  } catch (e) {
    console.error("Server render failed, executing client canvas visual composite fallback:", e);
    const fallbackCanvasUrl = await renderVisualCanvasFallback(
      visualData?.headline || productName || "",
      visualData?.subtext || "",
      imageUrl,
      visualData?.primaryColor || "#F59E0B",
      visualData?.secondaryColor || "#08080C",
      productLogo
    );
    return { url: fallbackCanvasUrl || imageUrl, layoutId: visualType || "custom-overlay" };
  }
};
