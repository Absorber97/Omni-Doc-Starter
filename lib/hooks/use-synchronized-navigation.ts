import { useCallback, useEffect, useRef } from 'react';
import { useNavigationStore } from '@/lib/store/navigation-store';

interface UseSynchronizedNavigationProps {
  source?: string;
  scrollBehavior?: ScrollBehavior;
  onPageChange?: (page: number) => void;
}

export function useSynchronizedNavigation({ 
  source = 'default',
  scrollBehavior = 'smooth',
  onPageChange 
}: UseSynchronizedNavigationProps = {}) {
  const { 
    currentPage, 
    source: activeSource, 
    isAutoScrolling,
    setPage,
    setIsAutoScrolling 
  } = useNavigationStore();
  
  const lastInteractionRef = useRef<number>(Date.now());

  // Handle smooth scrolling to pages
  const scrollToPage = useCallback((page: number) => {
    if (!isAutoScrolling && typeof window !== 'undefined') {
      const element = document.getElementById(`page-${page}`);
      if (element) {
        setIsAutoScrolling(true);
        element.scrollIntoView({ behavior: scrollBehavior });
        const timer = setTimeout(() => setIsAutoScrolling(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAutoScrolling, setIsAutoScrolling, scrollBehavior]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    if (typeof page !== 'number') return;
    
    lastInteractionRef.current = Date.now();
    setPage(page, source);
    onPageChange?.(page);
    
    // Only auto-scroll if this component isn't the active source
    if (activeSource !== source) {
      scrollToPage(page);
    }
  }, [source, activeSource, setPage, onPageChange, scrollToPage]);

  return {
    currentPage: currentPage || 1,
    activeSource,
    handlePageChange,
    isAutoScrolling
  };
} 