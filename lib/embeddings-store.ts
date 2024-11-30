'use client';

import OpenAI from 'openai';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Text splitter configuration
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 4000, // Conservative chunk size for embeddings
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""] // Try different separators in order
});

export class EmbeddingsStore {
  private static instance: EmbeddingsStore;
  public store: Map<string, {
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
      // Split text into chunks
      const chunks = await textSplitter.createDocuments([content]);
      const ids: string[] = [];

      // Process each chunk
      for (const chunk of chunks) {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk.pageContent,
          encoding_format: 'float',
        });

        const id = crypto.randomUUID();
        this.store.set(id, {
          content: chunk.pageContent,
          embedding: response.data[0].embedding,
          metadata: {
            ...metadata,
            isChunk: chunks.length > 1,
            chunkIndex: chunks.indexOf(chunk),
            totalChunks: chunks.length
          },
          timestamp: Date.now()
        });
        ids.push(id);
      }

      // Cleanup old entries
      this.cleanup();
      return ids;
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
        model: 'text-embedding-3-small',
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

      // If results are chunks, combine them by document
      const combinedResults = this.combineChunks(results);
      return combinedResults.slice(0, k);
    } catch (error) {
      console.error('Error in similarity search:', error);
      throw error;
    }
  }

  private combineChunks(results: Array<{
    id: string;
    content: string;
    metadata: Record<string, any>;
    similarity: number;
  }>) {
    const documentMap = new Map<string, {
      content: string[];
      metadata: Record<string, any>;
      similarity: number;
    }>();

    for (const result of results) {
      const docId = result.metadata.documentId;
      if (!documentMap.has(docId)) {
        documentMap.set(docId, {
          content: [],
          metadata: { ...result.metadata },
          similarity: result.similarity
        });
      }

      const doc = documentMap.get(docId)!;
      doc.content.push(result.content);
      // Average the similarities
      doc.similarity = (doc.similarity + result.similarity) / 2;
    }

    return Array.from(documentMap.values()).map(doc => ({
      content: doc.content.join('\n\n'),
      metadata: doc.metadata,
      similarity: doc.similarity
    }));
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