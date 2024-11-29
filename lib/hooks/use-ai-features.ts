import { useState } from 'react';
import { ConceptType, PDFDocument } from '@/lib/types/pdf';
import { LocalVectorStore } from '@/lib/services/vector-store';

export function useAIFeatures(document: PDFDocument) {
  const [isLoading, setIsLoading] = useState(false);
  const vectorStore = new LocalVectorStore();

  const getPageConcepts = async (pageNumber: number): Promise<ConceptType[]> => {
    const page = document.pages[pageNumber - 1];
    return [
      ...page.metadata.concepts.mustKnow.map(text => ({ text, type: 'must-know' as const })),
      ...page.metadata.concepts.goodToKnow.map(text => ({ text, type: 'good-to-know' as const })),
      ...page.metadata.concepts.optional.map(text => ({ text, type: 'optional' as const })),
    ];
  };

  const generateSummary = async (pageNumber: number): Promise<string> => {
    setIsLoading(true);
    try {
      const page = document.pages[pageNumber - 1];
      // TODO: Use AI to generate summary
      return page.text.slice(0, 200) + '...';
    } finally {
      setIsLoading(false);
    }
  };

  const searchSimilarContent = async (query: string, limit: number = 5) => {
    setIsLoading(true);
    try {
      const queryEmbeddings = await generateEmbeddings(query);
      return await vectorStore.search(queryEmbeddings, limit);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmbeddings = async (text: string): Promise<number[]> => {
    // TODO: Implement actual embeddings generation
    return Array.from({ length: 384 }, () => Math.random());
  };

  return {
    getPageConcepts,
    generateSummary,
    searchSimilarContent,
    isLoading,
  };
} 