import { create } from 'zustand';
import { TOCItem } from '@/lib/types/pdf';
import { persist } from 'zustand/middleware';

interface TOCState {
  items: TOCItem[];
  expandedItems: string[];
  isGenerated: boolean;
  aiProcessedItems: TOCItem[];
  isAIProcessed: boolean;
  setItems: (items: TOCItem[]) => void;
  setExpandedItems: (items: string[]) => void;
  setIsGenerated: (generated: boolean) => void;
  setAIProcessedItems: (items: TOCItem[]) => void;
  toggleItem: (title: string) => void;
  reset: () => void;
  isItemExpanded: (title: string) => boolean;
}

const initialState = {
  items: [] as TOCItem[],
  expandedItems: [] as string[],
  isGenerated: false,
  aiProcessedItems: [] as TOCItem[],
  isAIProcessed: false,
};

export const useTOCStore = create<TOCState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setItems: (items) => {
        const existingItems = get().items;
        if (existingItems.length > 0) {
          console.log('📚 Reusing existing TOC data:', existingItems.length, 'items');
        } else {
          console.log('Generating new TOC data:', items.length, 'items');
        }
        set({ items, isGenerated: true });
      },
      
      setExpandedItems: (expandedItems) => {
        console.log('Updating expanded items:', expandedItems.length, 'items');
        set({ expandedItems });
      },
      
      setIsGenerated: (isGenerated) => {
        console.log('Setting TOC generation status:', isGenerated);
        set({ isGenerated });
      },
      
      setAIProcessedItems: (items) => {
        const existingAIItems = get().aiProcessedItems;
        if (existingAIItems.length > 0) {
          console.log('🤖 Reusing AI-processed TOC:', existingAIItems.length, 'items');
        } else {
          console.log('Setting new AI-processed TOC:', items.length, 'items');
        }
        set({ aiProcessedItems: items, isAIProcessed: true });
      },
      
      toggleItem: (title) => 
        set((state) => {
          const index = state.expandedItems.indexOf(title);
          const newExpandedItems = [...state.expandedItems];
          
          if (index === -1) {
            console.log('Expanding TOC item:', title);
            newExpandedItems.push(title);
          } else {
            console.log('Collapsing TOC item:', title);
            newExpandedItems.splice(index, 1);
          }
          
          return { expandedItems: newExpandedItems };
        }),
      
      isItemExpanded: (title) => 
        get().expandedItems.includes(title),
      
      reset: () => {
        console.log('🗑️ Resetting TOC store to initial state');
        set(initialState);
      },
    }),
    {
      name: 'toc-storage',
      version: 1,
    }
  )
); 