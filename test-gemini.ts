import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY environment variable is not defined in process.env.");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Testing generateContent...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: "Hello, say test" }]
    });
    
    console.log("SUCCESS!");
    console.log("Response Keys:", Object.keys(response));
    console.log("Response usageMetadata:", JSON.stringify(response.usageMetadata));
    console.log("Response text:", response.text);
  } catch (error: any) {
    console.error("ERROR running generateContent:", error);
  }
}

test();
