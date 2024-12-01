import { create } from 'zustand';

interface NavigationState {
  currentPage: number;
  source: string | null;
  isAutoScrolling: boolean;
  setPage: (page: number, source: string) => void;
  setIsAutoScrolling: (isScrolling: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 1,
  source: null,
  isAutoScrolling: false,
  setPage: (page, source) => set({ currentPage: page, source }),
  setIsAutoScrolling: (isScrolling) => set({ isAutoScrolling: isScrolling })
})); 