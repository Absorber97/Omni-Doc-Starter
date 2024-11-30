import { create } from 'zustand';

interface NavigationState {
  currentPage: number;
  scrollPosition: number;
  scale: number;
  activeSource: 'viewer' | 'toc' | 'thumbnails' | 'controls';
  isAutoScrolling: boolean;
  setCurrentPage: (page: number, source: NavigationState['activeSource']) => void;
  setScrollPosition: (position: number) => void;
  setScale: (scale: number) => void;
  setActiveSource: (source: NavigationState['activeSource']) => void;
  setIsAutoScrolling: (isScrolling: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 1,
  scrollPosition: 0,
  scale: 1,
  activeSource: 'viewer',
  isAutoScrolling: false,
  setCurrentPage: (page, source) => 
    set({ currentPage: page, activeSource: source }),
  setScrollPosition: (position) => 
    set({ scrollPosition: position }),
  setScale: (scale) => 
    set({ scale }),
  setActiveSource: (source) => 
    set({ activeSource: source }),
  setIsAutoScrolling: (isScrolling) => 
    set({ isAutoScrolling: isScrolling })
})); 