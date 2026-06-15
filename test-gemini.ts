import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY environment variable is not defined in process.env.");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Testing image generation with imageSize: 1K...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: { parts: [{ text: "A photorealistic, highly detailed image of a sleek, glowing futuristic digital interface dissolving a massive, messy stack of paper documents and chaotic spreadsheets into clean, organized digital light. Minimalist executive desk environment, cinematic lighting, sharp focus, professional tech aesthetic. NO TEXT." }] } as any,
      config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } } as any
    });
    
    console.log("SUCCESS!");
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
      console.log("Found inlineData, mimeType:", part.inlineData.mimeType);
      const base64Data = part.inlineData.data;
      console.log("base64Data length:", base64Data.length);
      
      console.log("Initializing Firestore...");
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        const app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        const db = getFirestore(app, 'productiondb');
        const imageId = 'test_img_' + Math.random().toString(36).substring(2, 10);
        console.log(`Attempting to save image to Firestore with ID: ${imageId}...`);
        await db.collection('whatsapp_images').doc(imageId).set({
          base64Data,
          mimeType: part.inlineData.mimeType || 'image/png',
          prompt: "test",
          createdAt: new Date().toISOString()
        });
        console.log("WRITE SUCCESSFUL!");
      } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT not set in env.");
      }
    } else {
      console.log("No inlineData found in response.");
    }
  } catch (error: any) {
    console.error("ERROR running image generation or Firestore write:", error);
  }
}

test();
