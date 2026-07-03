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
  const activeLogo = product.logoDarkUrl || product.logoUrl || product.logoLightUrl;
  let logoBottomY = pageHeight / 3;
  if (activeLogo) {
    try {
      const imgProps = doc.getImageProperties(activeLogo);
      const maxDim = 80; // Large logo for cover
      const ratio = Math.min(maxDim / imgProps.width, maxDim / imgProps.height);
      const targetWidth = imgProps.width * ratio;
      const targetHeight = imgProps.height * ratio;
      
      const logoX = (pageWidth - targetWidth) / 2;
      const logoY = (pageHeight / 3) - (targetHeight / 2);
      
      // Determine format based on data URL
      const format = activeLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(activeLogo, format, logoX, logoY, targetWidth, targetHeight);
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
    if (activeLogo) {
      try {
        const imgProps = doc.getImageProperties(activeLogo);
        const maxDim = 15; // Small logo for footer
        const ratio = Math.min(maxDim / imgProps.width, maxDim / imgProps.height);
        const targetWidth = imgProps.width * ratio;
        const targetHeight = imgProps.height * ratio;
        
        // Determine format based on data URL
        const format = activeLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(
          activeLogo, 
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
