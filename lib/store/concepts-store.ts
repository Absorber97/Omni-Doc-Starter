import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type EmbeddingsStore } from '@/lib/embeddings-store';

export type DepthLevel = 1 | 2 | 3;

export interface Concept {
  id: string;
  text: string;
  depthLevel: DepthLevel;
  pageNumber: number;
  location: {
    pageNumber: number;
    textSnippet: string;
  };
  metadata: {
    confidence: number;
    importance: number;
    sourceContext: string;
    tags: string[];
    emoji: string;
  };
}

interface ConceptsState {
  concepts: Concept[];
  highlightedConceptId: string | null;
  selectedConceptId: string | null;
  currentDepthLevel: DepthLevel;
  isGenerating: boolean;
  error: string | null;
  generationMode: 'all-pages' | 'current-page';
  generatedPages: number[];
  
  // Actions
  setDepthLevel: (level: DepthLevel) => void;
  setGenerationMode: (mode: 'all-pages' | 'current-page') => void;
  addConcepts: (concepts: Concept[]) => void;
  highlightConcept: (id: string | null) => void;
  selectConcept: (id: string | null) => void;
  getConceptsByPage: (pageNumber: number) => Concept[];
  getConceptById: (id: string) => Concept | undefined;
  markPageAsGenerated: (pageNumber: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

const initialState = {
  concepts: [],
  highlightedConceptId: null,
  selectedConceptId: null,
  currentDepthLevel: 1 as DepthLevel,
  isGenerating: false,
  error: null,
  generationMode: 'all-pages' as const,
  generatedPages: [],
};

export const useConceptsStore = create<ConceptsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDepthLevel: (level) => 
        set({ currentDepthLevel: level }),

      setGenerationMode: (mode) => 
        set({ generationMode: mode }),

      addConcepts: (concepts) => 
        set({ concepts: [...get().concepts, ...concepts] }),

      highlightConcept: (id) => 
        set({ highlightedConceptId: id }),
        
      selectConcept: (id) => 
        set({ selectedConceptId: id }),

      getConceptsByPage: (pageNumber) => 
        get().concepts.filter(c => c.pageNumber === pageNumber),

      getConceptById: (id) => 
        get().concepts.find(c => c.id === id),

      markPageAsGenerated: (pageNumber) =>
        set(state => ({
          generatedPages: [...state.generatedPages, pageNumber]
        })),

      setIsGenerating: (isGenerating) =>
        set({ isGenerating }),

      reset: () => set(initialState),
    }),
    {
      name: 'concepts-storage',
      version: 2,
    }
  )
);