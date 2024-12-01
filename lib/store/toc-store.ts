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

export const useTOCStore = create<TOCState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setItems: (items) => {
        const state = get();
        
        // If we already have processed items and are initialized, do nothing
        if (state.isAIProcessed && state.aiProcessedItems.length > 0 && state.isGenerated) {
          console.log('📦 Already initialized with AI items, skipping');
          return;
        }

        // If we have stored AI items but aren't initialized
        if (state.isAIProcessed && state.aiProcessedItems.length > 0) {
          console.log('📦 Using stored AI items:', state.aiProcessedItems.length);
          set({ 
            items: state.aiProcessedItems,
            isGenerated: true,
            isLoading: false,
            isAIProcessed: true // Ensure this is set
          });
          return;
        }

        // Only set new items if we don't have AI processed items
        if (!state.isAIProcessed || !state.aiProcessedItems.length) {
          console.log('🔄 Setting new items:', items.length);
          set({ 
            items,
            isGenerated: true,
            isLoading: false,
            isAIProcessed: false,
            aiProcessedItems: []
          });
        }
      },

      setExpandedItems: (expandedItems) => set({ expandedItems }),
      setIsGenerated: (isGenerated) => set({ isGenerated }),
      
      setAIProcessedItems: (items) => {
        if (!items?.length) return;
        
        const state = get();
        // Skip if we already have processed items
        if (state.isAIProcessed && state.aiProcessedItems.length > 0) {
          console.log('🔄 Already have AI processed items, skipping');
          return;
        }

        console.log('💫 Setting new AI-processed TOC:', items.length);
        set({ 
          aiProcessedItems: items,
          items,
          isAIProcessed: true,
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
      
      reset: () => set(initialState),
      
      setProcessingStatus: (status) => 
        set((state) => ({
          processingStatus: { ...state.processingStatus, ...status }
        })),
      
      setIsLoading: (isLoading) => set({ isLoading })
    }),
    {
      name: 'toc-storage',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        aiProcessedItems: state.aiProcessedItems,
        isAIProcessed: state.isAIProcessed,
        processingStatus: state.processingStatus,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.aiProcessedItems?.length) return;
        
        console.log('📥 Found stored AI items:', state.aiProcessedItems.length);
        
        // Use requestAnimationFrame to avoid state updates during render
        requestAnimationFrame(() => {
          useTOCStore.setState({ 
            items: state.aiProcessedItems,
            aiProcessedItems: state.aiProcessedItems,
            isAIProcessed: true,
            isGenerated: true,
            isLoading: false,
            processingStatus: {
              isProcessing: false,
              lastProcessed: Date.now(),
              error: null
            }
          });
          console.log('✅ Rehydration complete');
        });
      }
    }
  )
);

// Export store ready state
export const getStoreReadyState = () => {
  const state = useTOCStore.getState();
  return state.isAIProcessed && state.aiProcessedItems.length > 0;
}; 