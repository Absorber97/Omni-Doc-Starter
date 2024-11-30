import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConceptType } from '@/types/pdf';

export type GenerationMode = 'all-pages' | 'page-by-page';

interface ConceptsState {
  concepts: Concept[];
  generationMode: GenerationMode;
  setGenerationMode: (mode: GenerationMode) => void;
  addConcepts: (newConcepts: Concept[]) => void;
  getConceptsByPage: (pageNumber: number) => Concept[];
  clearConcepts: () => void;
}

export const useConceptsStore = create<ConceptsState>()(
  persist(
    (set, get) => ({
      concepts: [],
      generationMode: 'all-pages',
      setGenerationMode: (mode) => set({ generationMode: mode }),
      addConcepts: (newConcepts) => {
        set((state) => {
          if (get().generationMode === 'page-by-page') {
            const otherPageConcepts = state.concepts.filter(
              c => !newConcepts.some(nc => nc.pageNumber === c.pageNumber)
            );
            return { concepts: [...otherPageConcepts, ...newConcepts] };
          }
          return { concepts: [...state.concepts, ...newConcepts] };
        });
      },
      getConceptsByPage: (pageNumber) => {
        return get().concepts.filter(c => c.pageNumber === pageNumber);
      },
      clearConcepts: () => set({ concepts: [] })
    }),
    {
      name: 'omni-doc-concepts',
      partialize: (state) => ({
        concepts: state.generationMode === 'all-pages' ? state.concepts : [],
        generationMode: state.generationMode
      })
    }
  )
);