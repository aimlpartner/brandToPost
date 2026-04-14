import { jsPDF } from 'jspdf';
import { WeeklyCampaign, ProductDNA } from '../types';
import { logSilentError } from './firestore-error';

export const generateCampaignPDF = async (campaign: WeeklyCampaign, product: ProductDNA): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // --- COVER PAGE ---
  // Background
  doc.setFillColor(42, 36, 32); // Dark elegant brown/gray
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Logo
  let logoBottomY = pageHeight / 3;
  if (product.logoUrl) {
    try {
      const imgProps = doc.getImageProperties(product.logoUrl);
      const maxDim = 80; // Large logo for cover
      const ratio = Math.min(maxDim / imgProps.width, maxDim / imgProps.height);
      const targetWidth = imgProps.width * ratio;
      const targetHeight = imgProps.height * ratio;
      
      const logoX = (pageWidth - targetWidth) / 2;
      const logoY = (pageHeight / 3) - (targetHeight / 2);
      
      // Determine format based on data URL
      const format = product.logoUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(product.logoUrl, format, logoX, logoY, targetWidth, targetHeight);
      logoBottomY = logoY + targetHeight;
    } catch (e) {
      logSilentError(e as Error, { context: "addLogoToCover" });
    }
  }

  // Cover Text
  doc.setTextColor(255, 255, 255);
  
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  const title = "Campaign Strategy";
  doc.text(title, pageWidth / 2, logoBottomY + 30, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text(product.name, pageWidth / 2, logoBottomY + 45, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(200, 189, 178); // Lighter text
  doc.text(`Theme: ${campaign.theme}`, pageWidth / 2, logoBottomY + 60, { align: 'center' });

  if (product.visualStyle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 140, 130);
    const styleText = `Brand Vibe: ${product.visualStyle}`;
    const styleLines = doc.splitTextToSize(styleText, pageWidth - 60);
    doc.text(styleLines, pageWidth / 2, pageHeight - 40, { align: 'center' });
  }

  // --- CONTENT PAGES ---
  doc.addPage();
  
  // Helper to add footer (logo) to content pages
  const addFooter = () => {
    if (product.logoUrl) {
      try {
        const imgProps = doc.getImageProperties(product.logoUrl);
        const maxDim = 15; // Small logo for footer
        const ratio = Math.min(maxDim / imgProps.width, maxDim / imgProps.height);
        const targetWidth = imgProps.width * ratio;
        const targetHeight = imgProps.height * ratio;
        
        // Determine format based on data URL
        const format = product.logoUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(
          product.logoUrl, 
          format, 
          pageWidth - margin - targetWidth, 
          pageHeight - margin - targetHeight, 
          targetWidth, 
          targetHeight
        );
      } catch (e) {
        logSilentError(e as Error, { context: "addLogoToFooter" });
      }
    }
    
    // Page border/accent
    doc.setFillColor(255, 191, 168); // Brand accent color
    doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
  };

  // Helper to add a new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 20) { // Leave room for footer
      addFooter();
      doc.addPage();
      y = margin + 10;
    }
  };

  y = margin + 10;

  // Strategy Overview Header
  doc.setFontSize(22);
  doc.setTextColor(74, 59, 50); // #111827
  doc.setFont("helvetica", "bold");
  doc.text("Strategy Overview", margin, y);
  
  // Accent line
  doc.setFillColor(255, 191, 168);
  doc.rect(margin, y + 5, 40, 2, 'F');
  y += 20;

  // Core Message
  doc.setFontSize(12);
  doc.setTextColor(107, 91, 82);
  doc.setFont("helvetica", "bold");
  doc.text("Core Message:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const coreMessageLines = doc.splitTextToSize(campaign.coreMessage, pageWidth - margin * 2);
  doc.text(coreMessageLines, margin, y);
  y += coreMessageLines.length * 7 + 5;

  // Target Audience
  checkPageBreak(25);
  doc.setFontSize(12);
  doc.setTextColor(107, 91, 82);
  doc.setFont("helvetica", "bold");
  doc.text("Target Audience:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const audienceLines = doc.splitTextToSize(campaign.targetAudience, pageWidth - margin * 2);
  doc.text(audienceLines, margin, y);
  y += audienceLines.length * 7 + 5;

  // Hook & CTA
  checkPageBreak(35);
  doc.setFillColor(245, 240, 230);
  doc.rect(margin, y, pageWidth - margin * 2, 45, 'F');
  
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(107, 91, 82);
  doc.setFont("helvetica", "bold");
  doc.text("Hook:", margin + 5, y);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(0, 0, 0);
  doc.text(doc.splitTextToSize(campaign.hook, pageWidth - margin * 2 - 20), margin + 20, y);
  
  y += 15;
  doc.setFontSize(12);
  doc.setTextColor(107, 91, 82);
  doc.setFont("helvetica", "bold");
  doc.text("CTA:", margin + 5, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(doc.splitTextToSize(campaign.cta, pageWidth - margin * 2 - 20), margin + 20, y);
  y += 30;

  // Daily Posts
  if (campaign.dailyPosts && campaign.dailyPosts.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(22);
    doc.setTextColor(74, 59, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Content Plan", margin, y);
    doc.setFillColor(255, 191, 168);
    doc.rect(margin, y + 5, 40, 2, 'F');
    y += 20;

    for (const dp of campaign.dailyPosts) {
      checkPageBreak(40);
      
      // Day Header
      doc.setFillColor(74, 59, 50); // Dark background for day
      doc.rect(margin, y - 5, pageWidth - margin * 2, 12, 'F');
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${dp.day} — ${dp.contentType}`, margin + 5, y + 3);
      y += 15;

      // Platform Versions
      for (const pv of dp.platformVersions) {
        checkPageBreak(35);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 91, 82);
        doc.text(pv.platform.toUpperCase(), margin, y);
        y += 6;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 150, 100);
        doc.text(`FORMAT: ${pv.format.toUpperCase()}`, margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const copyLines = doc.splitTextToSize(pv.copy, pageWidth - margin * 2);
        
        checkPageBreak(copyLines.length * 5 + 15);
        doc.text(copyLines, margin, y);
        y += copyLines.length * 5 + 12;
        
        // Small separator between platforms
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y - 6, pageWidth - margin, y - 6);
      }
      y += 5;
    }
  }

  // Repurposing Notes
  if (campaign.repurposingNotes) {
    checkPageBreak(40);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(74, 59, 50);
    doc.text("Repurposing Notes", margin, y);
    doc.setFillColor(255, 191, 168);
    doc.rect(margin, y + 5, 30, 2, 'F');
    y += 15;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const notesLines = doc.splitTextToSize(campaign.repurposingNotes, pageWidth - margin * 2);
    checkPageBreak(notesLines.length * 6);
    doc.text(notesLines, margin, y);
  }

  // Add footer to the final page
  addFooter();

  return doc;
};
