import { GoogleGenAI, Type } from '@google/genai';
import './env';

let genAIInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini Config] Warning: GEMINI_API_KEY is not defined in environment.');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAIInstance;
}

export const ai = getGeminiClient();
export { Type };

// Standard Model Names used across the platform
export const MODELS = {
  PRIMARY: 'gemini-3.1-pro-preview',
  FLASH: 'gemini-3.5-flash',
  CHEAP: 'gemini-2.5-flash',
  FALLBACK: 'gemini-2.5-pro',
  IMAGEN: 'gemini-3.1-flash-image-preview',
} as const;
