import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type EmbeddingsStore } from '@/lib/embeddings-store';

export type ConceptType = 'must-know' | 'good-to-know' | 'optional';

export interface Concept {
  id: string;
  title: string;
  emoji: string;
  content: string;
  type: ConceptType;
  tags: string[];
  pageNumber: number;
  relevanceScore: number;
  location?: {
    textSnippet: string;
  };
  metadata?: {
    vectorId?: string;
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

      addConcepts: (concepts) => {
        const existingConcepts = get().concepts;
        if (existingConcepts.length > 0) {
          console.log('🧠 Reusing existing concepts:', existingConcepts.length, 'concepts');
          return;
        }
        console.log('Adding new concepts:', concepts.length, 'concepts');
        set({ concepts: [...existingConcepts, ...concepts] });
      },

      highlightConcept: (id) => {
        console.log('Highlighting concept:', id);
        set({ highlightedConceptId: id });
      },
        
      selectConcept: (id) => {
        console.log('Selecting concept:', id);
        set({ selectedConceptId: id });
      },

      findSimilarConcepts: async (conceptId, embeddingsStore) => {
        console.log('🔍 Finding similar concepts for:', conceptId);
        const concept = get().concepts.find(c => c.id === conceptId);
        if (!concept?.metadata?.vectorId) {
          console.log('No vector ID found for concept');
          return [];
        }

        try {
          const similarVectors = await embeddingsStore.similaritySearch(
            concept.content,
            5,
            0.7
          );
          console.log('Found similar concepts:', similarVectors.length);
          return get().concepts.filter(c => 
            similarVectors.some(v => v.id === c.metadata?.vectorId)
          );
        } catch (error) {
          console.error('Error finding similar concepts:', error);
          return [];
        }
      },

      getConceptsByPage: (pageNumber) => 
        get().concepts.filter(c => c.pageNumber === pageNumber),

      getConceptById: (id) => 
        get().concepts.find(c => c.id === id),

      reset: () => {
        console.log('🗑️ Resetting concepts store to initial state');
        set(initialState);
      },
    }),
    {
      name: 'concepts-storage',
      version: 1,
    }
  )
);