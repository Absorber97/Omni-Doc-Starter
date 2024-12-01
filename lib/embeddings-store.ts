'use client';

import OpenAI from 'openai';
import { openAIConfig, openAIClientConfig } from '@/config/openai';

// Initialize OpenAI client
const openai = new OpenAI(openAIClientConfig);

export class EmbeddingsStore {
  private static instance: EmbeddingsStore;
  private store: Map<string, {
    content: string;
    embedding: number[];
    timestamp: number;
    metadata: Record<string, any>;
  }>;
  private ttl: number = 1000 * 60 * 60; // 1 hour

  private constructor() {
    this.store = new Map();
    // Clean up periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 1000 * 60 * 5); // Clean every 5 minutes
    }
  }

  static getInstance(): EmbeddingsStore {
    if (!EmbeddingsStore.instance) {
      EmbeddingsStore.instance = new EmbeddingsStore();
    }
    return EmbeddingsStore.instance;
  }

  async addDocument(
    content: string,
    metadata: Record<string, any>
  ) {
    try {
      const response = await openai.embeddings.create({
        model: openAIConfig.embeddingModel,
        input: content,
        encoding_format: 'float',
      });

      const id = crypto.randomUUID();
      this.store.set(id, {
        content,
        embedding: response.data[0].embedding,
        metadata,
        timestamp: Date.now()
      });

      // Cleanup old entries
      this.cleanup();
      return id;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  async similaritySearch(
    query: string,
    k: number = 5,
    threshold: number = 0.8
  ) {
    try {
      const queryEmbedding = await openai.embeddings.create({
        model: openAIConfig.embeddingModel,
        input: query,
        encoding_format: 'float',
      });

      // Calculate similarities and sort
      const results = Array.from(this.store.entries())
        .map(([id, doc]) => ({
          id,
          content: doc.content,
          metadata: doc.metadata,
          similarity: this.cosineSimilarity(
            queryEmbedding.data[0].embedding,
            doc.embedding
          )
        }))
        .filter(doc => doc.similarity > threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);

      return results;
    } catch (error) {
      console.error('Error in similarity search:', error);
      throw error;
    }
  }

  getStats() {
    return {
      totalDocuments: this.store.size,
      oldestDocument: Math.min(...Array.from(this.store.values()).map(doc => doc.timestamp)),
      newestDocument: Math.max(...Array.from(this.store.values()).map(doc => doc.timestamp)),
    };
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, doc] of this.store.entries()) {
      if (now - doc.timestamp > this.ttl) {
        this.store.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old embeddings`);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
} 