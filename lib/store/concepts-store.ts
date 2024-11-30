import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type EmbeddingsStore } from '@/lib/embeddings-store';

export type ConceptType = 'must-know' | 'good-to-know' | 'optional';

export interface Concept {
  id: string;
  text: string;
  type: ConceptType;
  pageNumber: number;
  location: {
    pageNumber: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    textSnippet: string;
  };
  metadata?: {
    confidence: number;
    keywords: string[];
    vectorId?: string;
    relatedConcepts?: string[]; // IDs of related concepts
    importance: number; // 0-1 score
    sourceContext: string;
  };
}

interface ConceptsState {
  concepts: Concept[];
  highlightedConceptId: string | null;
  selectedConceptId: string | null;
  isLoading: boolean;
  error: string | null;
  addConcepts: (concepts: Concept[]) => void;
  highlightConcept: (id: string | null) => void;
  selectConcept: (id: string | null) => void;
  findSimilarConcepts: (conceptId: string, embeddingsStore: EmbeddingsStore) => Promise<Concept[]>;
  getConceptsByPage: (pageNumber: number) => Concept[];
  getConceptById: (id: string) => Concept | undefined;
  reset: () => void;
}

const initialState = {
  concepts: [],
  highlightedConceptId: null,
  selectedConceptId: null,
  isLoading: false,
  error: null,
};

export const useConceptsStore = create<ConceptsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addConcepts: (concepts) => 
        set({ concepts: [...get().concepts, ...concepts] }),

      highlightConcept: (id) => 
        set({ highlightedConceptId: id }),
        
      selectConcept: (id) => 
        set({ selectedConceptId: id }),

      findSimilarConcepts: async (conceptId, embeddingsStore) => {
        const concept = get().concepts.find(c => c.id === conceptId);
        if (!concept?.metadata?.vectorId) return [];

        const similarVectors = await embeddingsStore.findSimilar(
          concept.metadata.vectorId,
          5
        );

        return get().concepts.filter(c => 
          c.metadata?.vectorId && 
          similarVectors.includes(c.metadata.vectorId)
        );
      },

      getConceptsByPage: (pageNumber) => 
        get().concepts.filter(c => c.pageNumber === pageNumber),

      getConceptById: (id) => 
        get().concepts.find(c => c.id === id),

      reset: () => set(initialState),
    }),
    {
      name: 'concepts-storage',
      version: 1,
    }
  )
);