import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '@skripsita/shared';

export interface ChatOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** Force a provider; otherwise uses AI_PRIMARY_PROVIDER with fallback. */
  provider?: 'openai' | 'gemini';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai?: OpenAI;
  private gemini?: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey });

    const geminiKey = this.config.get<string>('GEMINI_API_KEY');
    if (geminiKey) this.gemini = new GoogleGenerativeAI(geminiKey);
  }

  private get primary(): 'openai' | 'gemini' {
    return (this.config.get<string>('AI_PRIMARY_PROVIDER') as 'openai' | 'gemini') ?? 'openai';
  }

  /** Unified chat completion with automatic fallback to the secondary provider. */
  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const order: ('openai' | 'gemini')[] = opts.provider
      ? [opts.provider]
      : this.primary === 'openai'
        ? ['openai', 'gemini']
        : ['gemini', 'openai'];

    let lastErr: unknown;
    for (const provider of order) {
      try {
        if (provider === 'openai' && this.openai) {
          return await this.openaiChat(messages, opts);
        }
        if (provider === 'gemini' && this.gemini) {
          return await this.geminiChat(messages, opts);
        }
      } catch (err) {
        lastErr = err;
        this.logger.warn(`Provider ${provider} failed: ${(err as Error).message}. Trying next.`);
      }
    }

    if (lastErr) throw lastErr;
    throw new ServiceUnavailableException(
      'Tidak ada AI provider yang terkonfigurasi. Set OPENAI_API_KEY atau GEMINI_API_KEY di apps/api/.env.',
    );
  }

  private async openaiChat(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
    const model = this.config.get<string>('OPENAI_CHAT_MODEL', 'gpt-5');
    const payload: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (opts.system) payload.push({ role: 'system', content: opts.system });
    for (const m of messages) payload.push({ role: m.role, content: m.content });

    const res = await this.openai!.chat.completions.create({
      model,
      messages: payload,
      temperature: opts.temperature ?? 0.7,
      max_completion_tokens: opts.maxTokens ?? 4096,
    });
    return res.choices[0]?.message?.content?.trim() ?? '';
  }

  private async geminiChat(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
    const modelName = this.config.get<string>('GEMINI_CHAT_MODEL', 'gemini-2.5-pro');
    const model = this.gemini!.getGenerativeModel({
      model: modelName,
      systemInstruction: opts.system,
    });
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const res = await model.generateContent({
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 4096,
      },
    });
    return res.response.text().trim();
  }

  /** Create an embedding vector. Uses OpenAI embeddings; falls back to a
   *  deterministic local hash embedding so the app still runs without keys
   *  (development only — replace with a real provider for production quality). */
  async embed(text: string): Promise<number[]> {
    const dim = Number(this.config.get<string>('EMBEDDING_DIM', '3072'));
    if (this.openai) {
      const model = this.config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-large');
      const res = await this.openai.embeddings.create({ model, input: text, dimensions: dim });
      return res.data[0].embedding;
    }
    this.logger.warn('No embedding provider configured — using local fallback embedding.');
    return this.localEmbedding(text, dim);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const dim = Number(this.config.get<string>('EMBEDDING_DIM', '3072'));
    if (this.openai) {
      const model = this.config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-large');
      const res = await this.openai.embeddings.create({ model, input: texts, dimensions: dim });
      return res.data.map((d) => d.embedding);
    }
    return texts.map((t) => this.localEmbedding(t, dim));
  }

  /** Cheap deterministic embedding for offline/dev use. NOT semantically strong. */
  private localEmbedding(text: string, dim: number): number[] {
    const vec = new Array(dim).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const tok of tokens) {
      let h = 2166136261;
      for (let i = 0; i < tok.length; i++) {
        h ^= tok.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      const idx = Math.abs(h) % dim;
      vec[idx] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  hasProvider(): boolean {
    return Boolean(this.openai || this.gemini);
  }
}
