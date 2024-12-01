import { create } from 'zustand';
import { TOCItem } from '@/lib/types/pdf';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TOCProcessingStatus {
  isProcessing: boolean;
  lastProcessed: number | null;
  error: string | null;
}

interface TOCState {
  items: TOCItem[];
  expandedItems: string[];
  isGenerated: boolean;
  aiProcessedItems: TOCItem[];
  isAIProcessed: boolean;
  processingStatus: TOCProcessingStatus;
  isLoading: boolean;
  setItems: (items: TOCItem[]) => void;
  setExpandedItems: (items: string[]) => void;
  setIsGenerated: (generated: boolean) => void;
  setAIProcessedItems: (items: TOCItem[]) => void;
  toggleItem: (title: string) => void;
  reset: () => void;
  isItemExpanded: (title: string) => boolean;
  setProcessingStatus: (status: Partial<TOCProcessingStatus>) => void;
  setIsLoading: (loading: boolean) => void;
}

const initialState = {
  items: [] as TOCItem[],
  expandedItems: [] as string[],
  isGenerated: false,
  aiProcessedItems: [] as TOCItem[],
  isAIProcessed: false,
  processingStatus: {
    isProcessing: false,
    lastProcessed: null,
    error: null
  },
  isLoading: true,
} as const;

// Debug middleware to log state changes
const log = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('🔄 TOC state updating:', ...args);
      set(...args);
      console.log('✅ New TOC state:', get());
    },
    get,
    api
  );

export const useTOCStore = create<TOCState>()(
  log(
    persist(
      (set, get) => ({
        ...initialState,

        setItems: (items) => {
          const state = get();
          // If we have AI processed items, use those
          if (state.isAIProcessed && state.aiProcessedItems.length > 0) {
            console.log('📦 Using stored AI items:', state.aiProcessedItems.length);
            set({ 
              items: state.aiProcessedItems,
              isGenerated: true,
              isLoading: false 
            });
            return;
          }

          // Otherwise set new items
          if (items?.length > 0) {
            console.log('🔄 Setting new items:', items.length);
            set({ 
              items,
              isGenerated: true,
              isLoading: false,
              processingStatus: {
                ...state.processingStatus,
                error: null
              }
            });
          }
        },

        setExpandedItems: (expandedItems) => set({ expandedItems }),
        
        setIsGenerated: (isGenerated) => set({ isGenerated }),

        setAIProcessedItems: (items) => {
          if (!items?.length) return;
          
          const state = get();
          if (state.isAIProcessed && state.aiProcessedItems.length > 0) {
            console.log('🔄 Already have AI processed items, skipping');
            return;
          }

          console.log('💫 Setting new AI-processed TOC:', items.length);
          set({ 
            aiProcessedItems: items,
            items: items,
            isAIProcessed: true,
            isGenerated: true,
            isLoading: false,
            processingStatus: {
              isProcessing: false,
              lastProcessed: Date.now(),
              error: null
            }
          });
        },

        toggleItem: (title) => 
          set((state) => ({
            expandedItems: state.expandedItems.includes(title)
              ? state.expandedItems.filter(t => t !== title)
              : [...state.expandedItems, title]
          })),

        isItemExpanded: (title) => get().expandedItems.includes(title),

        setProcessingStatus: (status) => 
          set((state) => ({
            processingStatus: { ...state.processingStatus, ...status }
          })),
        
        setIsLoading: (isLoading) => set({ isLoading }),
        
        reset: () => set(initialState)
      }),
      {
        name: 'toc-storage',
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ 
          aiProcessedItems: state.aiProcessedItems,
          isAIProcessed: state.isAIProcessed,
          expandedItems: state.expandedItems,
          processingStatus: state.processingStatus,
          isGenerated: state.isGenerated
        }),
        onRehydrateStorage: () => (state) => {
          console.log('🔄 Rehydrating TOC store with state:', state);
          if (state?.aiProcessedItems?.length) {
            console.log('📦 Found stored TOC items:', state.aiProcessedItems.length);
          }
        }
      }
    )
  )
);

// Export store ready state
export const getStoreReadyState = () => {
  const state = useTOCStore.getState();
  return state.isAIProcessed && state.aiProcessedItems.length > 0;
}; 