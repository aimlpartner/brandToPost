import { GoogleGenAI, Type } from '@google/genai';
import './env';

let cachedApiKey: string | undefined = undefined;
let genAIInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini Config] Warning: GEMINI_API_KEY is not defined in environment.');
  }
  if (!genAIInstance || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    genAIInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAIInstance;
}

import { callGpt56SolReasoning, GPT_56_SOL_MODEL } from '../services/gpt56Service';

export const ai: GoogleGenAI = new Proxy({} as GoogleGenAI, {
  get(target, prop, receiver) {
    const client = getGeminiClient();
    if (prop === 'models') {
      const models = client.models;
      return new Proxy(models, {
        get(mTarget, mProp, mReceiver) {
          if (mProp === 'generateContent') {
            return async (params: any) => {
              if (
                params?.model === GPT_56_SOL_MODEL ||
                params?.model === 'gpt-5.6'
              ) {
                return await callGpt56SolReasoning(params);
              }
              return models.generateContent(params);
            };
          }
          const val = Reflect.get(models, mProp, mReceiver);
          return typeof val === 'function' ? val.bind(models) : val;
        }
      });
    }
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
export { Type };

// Standard Model Names used across the platform
export const MODELS = {
  // Primary Reasoning & Cognitive Engine: Gemini 3.1 Pro
  PRIMARY: 'gemini-3.1-pro-preview',
  PRIMARY_REASONING: 'gemini-3.1-pro-preview',
  // Creative Director & Visual Prompt Generation Engine: Gemini 4 Argon
  IMAGE_PROMPT: 'gemini-4-argon',
  ARGON: 'gemini-4-argon',
  GPT_56_SOL: GPT_56_SOL_MODEL,
  FLASH: 'gemini-3.5-flash',
  CHEAP: 'gemini-2.5-flash',
  FALLBACK: 'gemini-2.5-pro',
  // Google Nano Banana & Flash Image Generation Models (generateContent + imageConfig)
  NANO_BANANA: 'gemini-nano-banana-2.1',
  NANO_BANANA_FLASH: 'gemini-3.1-flash-image',
  NANO_BANANA_PRO: 'gemini-3-pro-image',
  NANO_BANANA_LITE: 'gemini-3.1-flash-lite-image',
  IMAGEN: 'gemini-3.1-flash-image-preview',
  // Dedicated Imagen Models (generateImages)
  IMAGEN_3: 'imagen-3.0-generate-002',
  IMAGEN_3_FAST: 'imagen-3.0-fast-generate-001',
} as const;

