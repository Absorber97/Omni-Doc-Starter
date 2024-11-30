import { useCallback, useEffect } from 'react';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { useSynchronizedNavigation } from './use-synchronized-navigation';

export function useConceptInteraction() {
  const { 
    highlightedConceptId, 
    selectedConceptId,
    highlightConcept, 
    selectConcept,
    getConceptById 
  } = useConceptsStore();

  const { handlePageChange } = useSynchronizedNavigation({
    source: 'concepts'
  });

  const handleConceptClick = useCallback((conceptId: string) => {
    const concept = getConceptById(conceptId);
    if (!concept) return;

    // Update selection state
    selectConcept(conceptId);
    
    // Navigate to the concept's page
    handlePageChange(concept.pageNumber);

    // Scroll to concept location if available
    if (concept.location?.boundingBox) {
      // TODO: Implement smooth scroll to specific location
      const element = document.getElementById(`page-${concept.pageNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [getConceptById, selectConcept, handlePageChange]);

  const handleConceptHover = useCallback((conceptId: string | null) => {
    highlightConcept(conceptId);
  }, [highlightConcept]);

  return {
    highlightedConceptId,
    selectedConceptId,
    handleConceptClick,
    handleConceptHover
  };
}