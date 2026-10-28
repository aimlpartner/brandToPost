import '../config/env';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export const GPT_56_SOL_MODEL = 'gpt-5.6-sol';

export function getOpenAiApiKey(): string | undefined {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) {
    return process.env.OPENAI_API_KEY.trim();
  }
  try {
    const envPaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '.env.local'),
      path.resolve(__dirname, '..', '..', '..', '.env'),
      path.resolve(__dirname, '..', '..', '.env'),
    ];
    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        for (const line of content.split('\n')) {
          if (line.startsWith('OPENAI_API_KEY=')) {
            const key = line.replace('OPENAI_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
            if (key) {
              process.env.OPENAI_API_KEY = key;
              return key;
            }
          }
        }
      }
    }
  } catch {
    // Ignore read errors
  }
  return undefined;
}

export function normalizeSchemaForOpenAi(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) {
    return schema.map(normalizeSchemaForOpenAi);
  }
  const normalized: any = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type' && typeof value === 'string') {
      normalized[key] = value.toLowerCase();
    } else {
      normalized[key] = normalizeSchemaForOpenAi(value);
    }
  }
  return normalized;
}

export function formatContentsForOpenAI(contents: any, systemInstruction?: any): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [];

  if (systemInstruction) {
    let sysText = '';
    if (typeof systemInstruction === 'string') {
      sysText = systemInstruction;
    } else if (systemInstruction?.parts && Array.isArray(systemInstruction.parts)) {
      sysText = systemInstruction.parts.map((p: any) => p.text || '').join('\n');
    } else if (systemInstruction?.text) {
      sysText = systemInstruction.text;
    }
    if (sysText.trim()) {
      messages.push({ role: 'system', content: sysText.trim() });
    }
  }

  if (typeof contents === 'string') {
    messages.push({ role: 'user', content: contents });
  } else if (Array.isArray(contents)) {
    for (const item of contents) {
      if (typeof item === 'string') {
        messages.push({ role: 'user', content: item });
      } else if (item?.parts && Array.isArray(item.parts)) {
        const text = item.parts.map((p: any) => p.text || '').join('\n');
        const role = item.role === 'model' ? 'assistant' : (item.role || 'user');
        messages.push({ role, content: text });
      } else if (item?.text) {
        messages.push({ role: item.role === 'model' ? 'assistant' : (item.role || 'user'), content: item.text });
      }
    }
  } else if (contents && typeof contents === 'object') {
    if (contents.parts && Array.isArray(contents.parts)) {
      const text = contents.parts.map((p: any) => p.text || '').join('\n');
      messages.push({ role: contents.role === 'model' ? 'assistant' : 'user', content: text });
    } else if (contents.text) {
      messages.push({ role: 'user', content: contents.text });
    }
  }

  if (messages.length === 0) {
    messages.push({ role: 'user', content: String(contents || '') });
  }

  return messages;
}

export interface Gpt56ReasoningResponse {
  text: string;
  usageMetadata: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  candidates: any[];
  model: string;
  fallbackUsed?: boolean;
}

/**
 * Executes a reasoning request using OpenAI's GPT-5.6 Sol with High Reasoning effort.
 * Includes automatic self-healing fallback to Gemini 3.1 Pro / 3.5 Flash if the OpenAI key
 * encounters credit exhaustion, rate limits, or network errors.
 */
export async function callGpt56SolReasoning(params: {
  contents: any;
  config?: any;
  abortSignal?: AbortSignal;
  model?: string;
  fallbackGeminiModel?: string;
}): Promise<Gpt56ReasoningResponse> {
  const apiKey = getOpenAiApiKey();
  const targetModel = params.model || GPT_56_SOL_MODEL;
  const isJsonExpected = params.config?.responseMimeType === 'application/json' || !!params.config?.responseSchema;
  const fallbackModel = params.fallbackGeminiModel || 'gemini-3.1-pro-preview';

  if (!apiKey) {
    console.warn('[GPT-5.6 Sol] No OPENAI_API_KEY found. Falling back to Gemini Pro...');
    return await executeGeminiFallback(params, fallbackModel);
  }

  try {
    const messages = formatContentsForOpenAI(params.contents, params.config?.systemInstruction);

    // If JSON is requested and a schema is provided, append clear schema guidance
    if (isJsonExpected && params.config?.responseSchema) {
      const normalizedSchema = normalizeSchemaForOpenAi(params.config.responseSchema);
      const schemaGuidance = `\n\nCRITICAL REQUIREMENT: You must respond ONLY with a valid JSON object strictly conforming to this schema:\n${JSON.stringify(normalizedSchema, null, 2)}`;
      
      const lastMsg = messages[messages.length - 1];
      if (lastMsg) {
        lastMsg.content += schemaGuidance;
      } else {
        messages.push({ role: 'user', content: schemaGuidance });
      }
    } else if (isJsonExpected) {
      const lastMsg = messages[messages.length - 1];
      const jsonGuidance = `\n\nCRITICAL: Respond with a valid JSON object.`;
      if (lastMsg && !lastMsg.content.includes('JSON')) {
        lastMsg.content += jsonGuidance;
      }
    }

    const payload: any = {
      model: targetModel,
      reasoning_effort: 'high',
      messages
    };

    if (isJsonExpected) {
      payload.response_format = { type: 'json_object' };
    }

    console.log(`[GPT-5.6 Sol (High Reasoning)] Dispatching reasoning request to OpenAI (model: ${targetModel}, reasoning_effort: high)...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: params.abortSignal
    });

    if (!response.ok) {
      const errBody = await response.text();
      let parsedErr: any = {};
      try {
        parsedErr = JSON.parse(errBody);
      } catch {
        // ignore
      }
      const errMsg = parsedErr.error?.message || errBody || `HTTP ${response.status}`;
      console.warn(`[GPT-5.6 Sol (High Reasoning)] OpenAI API returned status ${response.status}: ${errMsg}`);
      
      // Self-healing fallback to Gemini
      console.log(`[GPT-5.6 Sol] Activating self-healing fallback to ${fallbackModel}...`);
      return await executeGeminiFallback(params, fallbackModel);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    return {
      text: rawText,
      usageMetadata: {
        promptTokenCount: data.usage?.prompt_tokens,
        candidatesTokenCount: data.usage?.completion_tokens,
        totalTokenCount: data.usage?.total_tokens
      },
      candidates: [
        {
          content: {
            parts: [{ text: rawText }],
            role: 'model'
          }
        }
      ],
      model: targetModel,
      fallbackUsed: false
    };
  } catch (error: any) {
    if (params.abortSignal?.aborted || error.name === 'AbortError') {
      throw error;
    }
    console.warn(`[GPT-5.6 Sol (High Reasoning)] Exception during reasoning call: ${error.message}. Triggering fallback to ${fallbackModel}...`);
    return await executeGeminiFallback(params, fallbackModel);
  }
}

async function executeGeminiFallback(params: {
  contents: any;
  config?: any;
  abortSignal?: AbortSignal;
}, fallbackModel: string): Promise<Gpt56ReasoningResponse> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('Both OPENAI_API_KEY and GEMINI_API_KEY are unconfigured or unavailable.');
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const response = await ai.models.generateContent({
    model: fallbackModel,
    contents: params.contents,
    config: {
      ...params.config,
      abortSignal: params.abortSignal
    }
  });

  return {
    text: response.text || '',
    usageMetadata: response.usageMetadata || {},
    candidates: response.candidates || [],
    model: `${fallbackModel} (fallback)`,
    fallbackUsed: true
  };
}
