import { create } from 'zustand';
import { TOCItem } from '@/lib/types/pdf';
import { persist } from 'zustand/middleware';

interface TOCState {
  items: TOCItem[];
  expandedItems: string[];
  isGenerated: boolean;
  setItems: (items: TOCItem[]) => void;
  setExpandedItems: (items: string[]) => void;
  setIsGenerated: (generated: boolean) => void;
  toggleItem: (title: string) => void;
  reset: () => void;
  isItemExpanded: (title: string) => boolean;
}

const initialState = {
  items: [] as TOCItem[],
  expandedItems: [] as string[],
  isGenerated: false,
};

export const useTOCStore = create<TOCState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setItems: (items) => 
        set({ items, isGenerated: true }),
      
      setExpandedItems: (expandedItems) => 
        set({ expandedItems }),
      
      setIsGenerated: (isGenerated) => 
        set({ isGenerated }),
      
      toggleItem: (title) => 
        set((state) => {
          const index = state.expandedItems.indexOf(title);
          const newExpandedItems = [...state.expandedItems];
          
          if (index === -1) {
            newExpandedItems.push(title);
          } else {
            newExpandedItems.splice(index, 1);
          }
          
          return { expandedItems: newExpandedItems };
        }),
      
      isItemExpanded: (title) => 
        get().expandedItems.includes(title),
      
      reset: () => 
        set(initialState),
    }),
    {
      name: 'toc-storage',
      version: 1,
    }
  )
); 