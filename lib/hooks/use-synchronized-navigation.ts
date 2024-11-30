import { useCallback, useEffect, useRef } from 'react';
import { useNavigationStore } from '@/lib/store/pdf-navigation-store';

interface SyncNavOptions {
  onPageChange?: (page: number) => void;
  scrollBehavior?: ScrollBehavior;
  source: 'viewer' | 'toc' | 'thumbnails' | 'controls';
}

export function useSynchronizedNavigation({ 
  onPageChange, 
  scrollBehavior = 'smooth',
  source 
}: SyncNavOptions) {
  const { 
    currentPage, 
    activeSource, 
    isAutoScrolling,
    setCurrentPage, 
    setIsAutoScrolling 
  } = useNavigationStore();
  
  const lastInteractionRef = useRef<number>(Date.now());

  const scrollToPage = useCallback((page: number) => {
    if (!isAutoScrolling) {
      setIsAutoScrolling(true);
      const element = document.getElementById(`page-${page}`);
      if (element) {
        element.scrollIntoView({ behavior: scrollBehavior });
        setTimeout(() => setIsAutoScrolling(false), 1000);
      }
    }
  }, [isAutoScrolling, setIsAutoScrolling, scrollBehavior]);

  const handlePageChange = useCallback((page: number) => {
    lastInteractionRef.current = Date.now();
    setCurrentPage(page, source);
    onPageChange?.(page);
    
    // Only auto-scroll if this component isn't the active source
    if (activeSource !== source) {
      scrollToPage(page);
    }
  }, [source, activeSource, setCurrentPage, onPageChange, scrollToPage]);

  // Sync with current page changes from other sources
  useEffect(() => {
    const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
    
    // Only respond to external changes after a cooldown period
    if (activeSource !== source && timeSinceLastInteraction > 500) {
      scrollToPage(currentPage);
    }
  }, [currentPage, activeSource, source, scrollToPage]);

  return {
    currentPage,
    activeSource,
    handlePageChange,
    isAutoScrolling
  };
} 