import { jsPDF } from 'jspdf';
import { WeeklyCampaign, ProductDNA } from '../types';
import { logSilentError } from './firestore-error';

const convertLogoToBase64 = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  let proxiedUrl = url;
  if (!url.startsWith('blob:') && !url.startsWith('/') && !url.startsWith('http://localhost') && !url.startsWith('https://localhost')) {
    proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  
  try {
    const res = await fetch(proxiedUrl);
    if (!res.ok) throw new Error(`Failed to fetch logo: ${res.statusText}`);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read blob as data URL"));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert logo to base64 via proxy:", err);
    return url;
  }
};

export function cleanPdfText(text: string | undefined | null): string {
  if (!text) return '';
  let str = String(text);

  // 1. Convert linebreaks and unescape HTML entities
  str = str.replace(/\\n/g, '\n')
           .replace(/<br\s*\/?>/gi, '\n')
           .replace(/\\r/g, '')
           .replace(/&amp;/g, '&')
           .replace(/&lt;/g, '<')
           .replace(/&gt;/g, '>')
           .replace(/&quot;/g, '"')
           .replace(/&#39;/g, "'");

  // 2. Remove raw markdown markers (**bold** -> bold, *italic* -> italic)
  str = str.replace(/\*\*(.*?)\*\*/g, '$1')
           .replace(/__(.*?)__/g, '$1')
           .replace(/\*(.*?)\*/g, '$1')
           .replace(/_(.*?)_/g, '$1');

  // 3. Clean bullet point symbols
  str = str.replace(/^\s*[\*\-]\s+/gm, '• ');

  // 4. Map special typographical characters & quotes
  str = str.replace(/[\u2018\u2019]/g, "'")
           .replace(/[\u201C\u201D]/g, '"')
           .replace(/[\u2013\u2014]/g, '-')
           .replace(/\u2026/g, '...')
           .replace(/[\u2022\u25CF]/g, '•');

  // 5. Remove surrogate pairs and multi-byte emojis/non-Latin1 characters
  // Standard Helvetica in jsPDF supports characters in Latin-1 range (ASCII <= 255).
  // High surrogate pairs / emojis cause garbled characters like Ø=Ý¤ and font-metric width distortion!
  str = str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
           .replace(/[\u2600-\u27BF]/g, '')
           .replace(/[^\x00-\xFF]/g, '');

  // 6. Normalize spacing
  str = str.replace(/[ \t]{2,}/g, ' ')
           .replace(/\n{3,}/g, '\n\n');

  return str.trim();
}

const hexToRgb = (hex: string | undefined, fallback: [number, number, number]): [number, number, number] => {
  if (!hex) return fallback;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? fallback : [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? fallback : [r, g, b];
  }
  return fallback;
};

export const generateCampaignPDF = async (
  campaign: WeeklyCampaign, 
  product: ProductDNA | { name: string; logoUrl?: string; logoDarkUrl?: string; logoLightUrl?: string; visualStyle?: string; primaryColor?: string; secondaryColor?: string; accentColor?: string; visualData?: any },
  campaignImages: Record<string, string> = {}
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const productName = cleanPdfText(product.name || 'BrandToPost');

  // Extract Brand DNA Colors dynamically
  const dnaColors: string[] = (product as any)?.visualData?.colors || (product as any)?.brandColors || [];
  const primaryRgb = hexToRgb(dnaColors[0] || (product as any)?.primaryColor, [124, 58, 237]); // Primary Brand Accent (#7C3AED default)
  const secondaryRgb = hexToRgb(dnaColors[1] || (product as any)?.secondaryColor, [15, 23, 42]); // Dark Slate (#0F172A default)
  const accentRgb = hexToRgb(dnaColors[2] || (product as any)?.accentColor, [184, 149, 252]); // Soft Accent (#B895FC default)

  // Helper to extract post image url or data
  const getPostImageUrl = (pv: any, dp?: any): string => {
    if (pv?.imageUrl) return pv.imageUrl;
    if (pv?.imageId && campaignImages[pv.imageId]) return campaignImages[pv.imageId];
    if (pv?.visualData?.baseImage) return pv.visualData.baseImage;
    if (dp?.imageUrl) return dp.imageUrl;
    if (dp?.imageId && campaignImages[dp.imageId]) return campaignImages[dp.imageId];
    if (dp?.visualData?.baseImage) return dp.visualData.baseImage;
    return '';
  };

  // Convert Logo to base64
  const rawLogo = product.logoDarkUrl || product.logoUrl || product.logoLightUrl;
  const activeLogo = rawLogo ? await convertLogoToBase64(rawLogo) : '';

  // Helper to draw watermark logo imprint on background of any page
  const drawBackgroundWatermark = () => {
    if (!activeLogo) return;
    try {
      const imgProps = doc.getImageProperties(activeLogo);
      const maxDim = 110; // Large centered watermark
      const ratio = Math.min(maxDim / imgProps.width, maxDim / imgProps.height);
      const wW = imgProps.width * ratio;
      const wH = imgProps.height * ratio;
      const wX = (pageWidth - wW) / 2;
      const wY = (pageHeight - wH) / 2;

      doc.saveGraphicsState();
      if ((doc as any).GState) {
        doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
      }
      const format = activeLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(activeLogo, format, wX, wY, wW, wH);
      doc.restoreGraphicsState();
    } catch (e) {
      logSilentError(e as Error, { context: "watermarkImprint" });
    }
  };

  // --- COVER PAGE ---
  doc.setFillColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Accent Bar (Brand DNA Primary Color)
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Cover Watermark
  drawBackgroundWatermark();

  let logoBottomY = pageHeight / 3.5;

  if (activeLogo) {
    try {
      const imgProps = doc.getImageProperties(activeLogo);
      const maxDim = 70;
      const ratio = Math.min(maxDim / imgProps.width, maxDim / imgProps.height);
      const targetWidth = imgProps.width * ratio;
      const targetHeight = imgProps.height * ratio;
      
      const logoX = (pageWidth - targetWidth) / 2;
      const logoY = (pageHeight / 3.5) - (targetHeight / 2);
      
      doc.setFillColor(255, 255, 255);
      doc.rect(logoX - 8, logoY - 8, targetWidth + 16, targetHeight + 16, 'F');
      
      const format = activeLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(activeLogo, format, logoX, logoY, targetWidth, targetHeight);
      logoBottomY = logoY + targetHeight + 15;
    } catch (e) {
      logSilentError(e as Error, { context: "addLogoToCover" });
    }
  }

  // Cover Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(30);
  doc.setFont("helvetica", "bold");
  doc.text("CAMPAIGN STRATEGY DECK", pageWidth / 2, logoBottomY + 20, { align: 'center' });

  // Accent Line (Primary Brand Color)
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect((pageWidth - 60) / 2, logoBottomY + 28, 60, 2, 'F');

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.text(productName.toUpperCase(), pageWidth / 2, logoBottomY + 42, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(226, 232, 240);
  const themeText = `Theme: ${cleanPdfText(campaign.theme || 'Omni-channel Curation')}`;
  const themeLines = doc.splitTextToSize(themeText, pageWidth - 40);
  doc.text(themeLines, pageWidth / 2, logoBottomY + 56, { align: 'center' });

  // Footer Tagline
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated by BrandToPost • ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

  // --- CONTENT PAGES ---
  doc.addPage();
  
  const addFooter = (pageNum: number) => {
    // Top border line
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`${productName} — Official Campaign Deck`, margin, pageHeight - 10);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    // Page accent bar at bottom (Primary Brand Color)
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');
  };

  let pageCounter = 2;

  // Background watermark on Page 2
  drawBackgroundWatermark();

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 22) {
      addFooter(pageCounter++);
      doc.addPage();
      drawBackgroundWatermark(); // Imprint logo watermark on new page
      y = margin + 10;
    }
  };

  y = margin + 10;

  // Strategy Overview Header
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Strategy Overview", margin, y);
  
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(margin, y + 4, 45, 2.5, 'F');
  y += 18;

  // Core Message Box
  if (campaign.coreMessage) {
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text("CORE CAMPAIGN MESSAGE", margin, y);
    y += 6;

    const cleanedCore = cleanPdfText(campaign.coreMessage);
    const coreLines = doc.splitTextToSize(cleanedCore, pageWidth - margin * 2 - 12);
    const boxH = coreLines.length * 6 + 12;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - margin * 2, boxH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - margin * 2, boxH, 'S');

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(coreLines, margin + 6, y + 8);
    y += boxH + 14;
  }

  // Research Briefing Insights
  if (campaign.researchSummary) {
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text("RESEARCH & AUDIENCE BRIEFING", margin, y);
    y += 6;

    const cleanedRes = cleanPdfText(campaign.researchSummary);
    const resLines = doc.splitTextToSize(cleanedRes, pageWidth - margin * 2 - 12);
    const boxH = Math.min(resLines.length * 5.5 + 12, 100);

    doc.setFillColor(245, 243, 255);
    doc.rect(margin, y, pageWidth - margin * 2, boxH, 'F');
    doc.setDrawColor(221, 214, 254);
    doc.rect(margin, y, pageWidth - margin * 2, boxH, 'S');

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    doc.text(resLines.slice(0, 18), margin + 6, y + 8);
    y += boxH + 14;
  }

  // Hook & CTA Cards
  if (campaign.hook || campaign.cta) {
    checkPageBreak(40);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text("HOOK & CALL-TO-ACTION FRAMEWORK", margin, y);
    y += 6;

    if (campaign.hook) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.text("Primary Hook:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const hookLines = doc.splitTextToSize(cleanPdfText(campaign.hook), pageWidth - margin * 2 - 35);
      doc.text(hookLines, margin + 32, y);
      y += hookLines.length * 6 + 6;
    }

    if (campaign.cta) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.text("Call to Action:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const ctaLines = doc.splitTextToSize(cleanPdfText(campaign.cta), pageWidth - margin * 2 - 35);
      doc.text(ctaLines, margin + 32, y);
      y += ctaLines.length * 6 + 12;
    }
  }

  // Daily Posts / Deliverables Content Plan
  if (campaign.dailyPosts && campaign.dailyPosts.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Content Deliverables & Visuals", margin, y);
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(margin, y + 4, 40, 2.5, 'F');
    y += 18;

    for (const dp of campaign.dailyPosts) {
      checkPageBreak(35);
      
      // Day Banner (Secondary Brand DNA Color)
      doc.setFillColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
      doc.rect(margin, y, pageWidth - margin * 2, 11, 'F');
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${cleanPdfText(dp.day).toUpperCase()} — ${cleanPdfText(dp.contentType).toUpperCase()}`, margin + 6, y + 7.5);
      y += 18;

      // Platform Versions
      for (const pv of dp.platformVersions) {
        checkPageBreak(35);
        
        // Platform Label (Primary Brand DNA Color)
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
        doc.text(cleanPdfText(pv.platform).toUpperCase(), margin, y);
        
        if (pv.format) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(`FORMAT: ${cleanPdfText(pv.format).toUpperCase()}`, margin + 45, y);
        }
        y += 7;

        // Post Copy Text (cleaned & formatted line by line)
        const cleanedCopy = cleanPdfText(pv.copy);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);

        const paragraphs = cleanedCopy.split('\n');
        for (const para of paragraphs) {
          if (!para.trim()) {
            y += 3;
            continue;
          }
          const copyLines = doc.splitTextToSize(para.trim(), pageWidth - margin * 2);
          checkPageBreak(copyLines.length * 5 + 4);
          doc.text(copyLines, margin, y);
          y += copyLines.length * 5 + 3;
        }
        y += 6;

        // EMBED POST IMAGE GRAPHIC (If available)
        const rawImgUrl = getPostImageUrl(pv, dp);
        if (rawImgUrl) {
          try {
            const base64Img = await convertLogoToBase64(rawImgUrl);
            if (base64Img && base64Img.length > 50) {
              const imgProps = doc.getImageProperties(base64Img);
              const maxW = 120;
              const maxH = 75;
              const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);
              const imgW = imgProps.width * ratio;
              const imgH = imgProps.height * ratio;

              checkPageBreak(imgH + 16);

              const imgX = (pageWidth - imgW) / 2;
              
              doc.setFillColor(248, 250, 252);
              doc.rect(imgX - 3, y - 3, imgW + 6, imgH + 6, 'F');
              doc.setDrawColor(226, 232, 240);
              doc.rect(imgX - 3, y - 3, imgW + 6, imgH + 6, 'S');

              const format = base64Img.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
              doc.addImage(base64Img, format, imgX, y, imgW, imgH);
              y += imgH + 14;
            }
          } catch (imgErr) {
            logSilentError(imgErr as Error, { context: "pdfImageEmbed" });
          }
        }
        
        // Separator Line
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
      y += 6;
    }
  }

  // Repurposing Notes
  if (campaign.repurposingNotes) {
    checkPageBreak(35);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Repurposing & Multi-Channel Notes", margin, y);
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(margin, y + 4, 30, 2, 'F');
    y += 14;
    
    const cleanedNotes = cleanPdfText(campaign.repurposingNotes);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const notesLines = doc.splitTextToSize(cleanedNotes, pageWidth - margin * 2);
    checkPageBreak(notesLines.length * 5 + 10);
    doc.text(notesLines, margin, y);
  }

  // Add final footer
  addFooter(pageCounter);

  return doc;
};

export const generateDNAPDF = async (product: ProductDNA): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Cover Page
  doc.setFillColor(42, 36, 32); // Dark elegant gray/brown
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("Product DNA Research", pageWidth / 2, pageHeight / 3, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text(product.name, pageWidth / 2, pageHeight / 3 + 20, { align: 'center' });

  if (product.website) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(200, 189, 178);
    doc.text(product.website, pageWidth / 2, pageHeight / 3 + 35, { align: 'center' });
  }

  // Content Pages
  doc.addPage();
  y = margin + 10;

  const addHeader = (title: string) => {
    doc.setFontSize(20);
    doc.setTextColor(74, 59, 50);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    doc.setFillColor(255, 191, 168);
    doc.rect(margin, y + 3, 40, 2, 'F');
    y += 15;
  };

  const addField = (label: string, value?: string) => {
    if (!value) return;
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setTextColor(107, 91, 82);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const valueLines = doc.splitTextToSize(value, pageWidth - margin * 2);
    doc.text(valueLines, margin, y);
    y += valueLines.length * 6 + 8;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.setFillColor(255, 191, 168);
      doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
      doc.addPage();
      y = margin + 10;
    }
  };

  addHeader("Brand Positioning & Audience");
  addField("Value Proposition & Positioning", product.positioning);
  addField("Target Audience Description", product.audience);
  addField("Tone of Voice Guidelines", product.tone);
  if (product.visualStyle) {
    addField("Visual Brand Vibe", product.visualStyle);
  }

  // Strategic variables page
  checkPageBreak(50);
  addHeader("Deep Strategic DNA");
  addField("The Brand's Enemy / Competitor Weakness", product.enemy);
  addField("Earned Secret / Unique Insights", product.earnedSecret);
  addField("Founder Origin Story", product.originStory);
  addField("Customer Hell State (Pain Points)", product.hellState);
  addField("Customer Heaven State (Desired Outcome)", product.heavenState);
  addField("Core Objections Handled", product.objections);
  addField("Unique Mechanism (How it works)", product.uniqueMechanism);
  addField("Social Proof Points / Credibility", product.proofPoints);

  // Vocabulary Page
  if (product.vocabularyAlways || product.vocabularyNever) {
    checkPageBreak(50);
    addHeader("Brand Vocabulary Guidelines");
    addField("Keywords / Phrases to ALWAYS Use", product.vocabularyAlways);
    addField("Keywords / Phrases to NEVER Use", product.vocabularyNever);
  }

  // Content Pillars page
  if (product.contentPillars && product.contentPillars.length > 0) {
    checkPageBreak(50);
    addHeader("Content Pillars");
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    product.contentPillars.forEach((pillar) => {
      checkPageBreak(12);
      doc.text(`• ${pillar}`, margin, y);
      y += 8;
    });
    y += 5;
  }

  // Target ICPs page
  if (product.targetIcps && product.targetIcps.length > 0) {
    checkPageBreak(50);
    addHeader("Target Ideal Customer Profiles (ICPs)");
    product.targetIcps.forEach((icp, i) => {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setTextColor(74, 59, 50);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${icp.name}`, margin, y);
      y += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(107, 91, 82);
      doc.text("Key Pain Points:", margin + 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      icp.painPoints.forEach(pt => {
        checkPageBreak(10);
        const lines = doc.splitTextToSize(`- ${pt}`, pageWidth - margin * 2 - 10);
        doc.text(lines, margin + 10, y);
        y += lines.length * 6 + 2;
      });
      y += 6;
    });
  }

  // Add final page accent border
  doc.setFillColor(255, 191, 168);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');

  return doc;
};

export const generateFounderAgentPDF = async (product: ProductDNA): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Cover Page
  doc.setFillColor(74, 59, 50); // Dark executive brown/gray
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("Founder Agent Profile", pageWidth / 2, pageHeight / 3, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  const personaName = product.founderAgentSynthesized?.personaName || "Founder Doppelganger";
  doc.text(`Doppelganger: ${personaName}`, pageWidth / 2, pageHeight / 3 + 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(200, 189, 178);
  doc.text(`Generated for workspace: ${product.name}`, pageWidth / 2, pageHeight / 3 + 35, { align: 'center' });

  // Content Pages
  doc.addPage();
  y = margin + 10;

  const addHeader = (title: string) => {
    doc.setFontSize(20);
    doc.setTextColor(74, 59, 50);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    doc.setFillColor(255, 191, 168);
    doc.rect(margin, y + 3, 40, 2, 'F');
    y += 15;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.setFillColor(255, 191, 168);
      doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
      doc.addPage();
      y = margin + 10;
    }
  };

  addHeader("Synthesized Personality & Behavior");

  // Voice description
  if (product.founderVoiceDescription) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setTextColor(107, 91, 82);
    doc.setFont("helvetica", "bold");
    doc.text("Voice Description Input:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const voiceLines = doc.splitTextToSize(product.founderVoiceDescription, pageWidth - margin * 2);
    doc.text(voiceLines, margin, y);
    y += voiceLines.length * 6 + 10;
  }

  const agent = product.founderAgentSynthesized;
  if (agent) {
    // Behavioral Traits
    if (agent.behavioralTraits && agent.behavioralTraits.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setTextColor(74, 59, 50);
      doc.setFont("helvetica", "bold");
      doc.text("Key Behavioral Traits", margin, y);
      y += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      agent.behavioralTraits.forEach(trait => {
        checkPageBreak(12);
        const traitLines = doc.splitTextToSize(`• ${trait}`, pageWidth - margin * 2 - 5);
        doc.text(traitLines, margin, y);
        y += traitLines.length * 6 + 2;
      });
      y += 6;
    }

    // Communication Style
    if (agent.communicationStyle && agent.communicationStyle.length > 0) {
      checkPageBreak(40);
      addHeader("Communication Style & Tone");
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      agent.communicationStyle.forEach(style => {
        checkPageBreak(12);
        const styleLines = doc.splitTextToSize(`• ${style}`, pageWidth - margin * 2 - 5);
        doc.text(styleLines, margin, y);
        y += styleLines.length * 6 + 2;
      });
      y += 6;
    }

    // Core Values
    if (agent.coreValues && agent.coreValues.length > 0) {
      checkPageBreak(40);
      addHeader("Core Business Values");
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      agent.coreValues.forEach(val => {
        checkPageBreak(12);
        const valLines = doc.splitTextToSize(`• ${val}`, pageWidth - margin * 2 - 5);
        doc.text(valLines, margin, y);
        y += valLines.length * 6 + 2;
      });
      y += 6;
    }

    // Decision Heuristics
    if (agent.decisionHeuristics && agent.decisionHeuristics.length > 0) {
      checkPageBreak(40);
      addHeader("Decision Heuristics & Automation Principles");
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      agent.decisionHeuristics.forEach(h => {
        checkPageBreak(12);
        const hLines = doc.splitTextToSize(`• ${h}`, pageWidth - margin * 2 - 5);
        doc.text(hLines, margin, y);
        y += hLines.length * 6 + 2;
      });
      y += 6;
    }
  }

  // Add final page accent border
  doc.setFillColor(255, 191, 168);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');

  return doc;
};
