'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { useDocumentStore } from '@/lib/store/document-store';
import { ConceptCard } from './concept-card';

interface KeyConceptsProps {
  url: string;
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
}

export function KeyConcepts({ url, currentPage, onPageChange }: KeyConceptsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const {
    currentDocument,
    isProcessing: isProcessingDocument,
    processDocument,
    processor
  } = useDocumentStore();

  const {
    concepts,
    currentDepthLevel,
    isGenerating,
    generatedPages,
    addConcepts,
    setIsGenerating,
    markPageAsGenerated,
    getConceptsByPage
  } = useConceptsStore();

  // Reset states on mount
  useEffect(() => {
    setIsGenerating(false);
    setError(null);
    setIsInitialLoad(true);
    
    return () => {
      setIsGenerating(false);
      setError(null);
    };
  }, []);

  // Process document and generate concepts
  useEffect(() => {
    if (!url) return;

    const processAndGenerate = async () => {
      try {
        // Process document if needed
        if (!currentDocument || currentDocument.url !== url) {
          console.log('Starting document processing...');
          const doc = await processDocument(url, 'document.pdf');
          if (!doc) {
            throw new Error('Document processing failed');
          }
          console.log('Document processing completed with doc:', doc);
        }

        // Generate concepts if not already generated
        if (!isGenerating && processor && currentDocument?.pages) {
          // Check if we already have concepts for this depth level
          const existingConcepts = currentDocument.pages.every(page => 
            getConceptsByPage(page.pageNumber).some(c => c.depthLevel === currentDepthLevel)
          );

          if (existingConcepts) {
            console.log('All pages already have concepts for depth level:', currentDepthLevel);
            setIsInitialLoad(false);
            return;
          }

          console.log('Starting concept generation for all pages with depth:', currentDepthLevel);
          setIsGenerating(true);
          
          try {
            // Generate concepts for all pages at once
            const allConcepts = await processor.generateConcepts(-1, currentDepthLevel);
            console.log('Generated concepts for all pages:', allConcepts);
            
            if (allConcepts && allConcepts.length > 0) {
              // Group concepts by page
              const conceptsByPage = allConcepts.reduce((acc, concept) => {
                const pageNum = concept.pageNumber;
                if (!acc[pageNum]) acc[pageNum] = [];
                acc[pageNum].push(concept);
                return acc;
              }, {} as Record<number, typeof allConcepts>);

              // Add concepts and mark pages as generated
              Object.entries(conceptsByPage).forEach(([pageNum, concepts]) => {
                addConcepts(concepts);
                markPageAsGenerated(Number(pageNum));
              });

              console.log('Successfully added concepts for all pages');
            } else {
              console.warn('No concepts were generated');
              setError('No concepts could be generated for this document');
            }
          } catch (err) {
            console.error('Concept generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate concepts');
          } finally {
            setIsGenerating(false);
            setIsInitialLoad(false);
          }
        }
      } catch (error) {
        console.error('Document processing error:', error);
        setError(error instanceof Error ? error.message : 'Document processing failed');
        setIsInitialLoad(false);
      }
    };

    processAndGenerate();
  }, [url, currentDocument, processor, currentDepthLevel, processDocument, addConcepts, markPageAsGenerated, getConceptsByPage]);

  // Add error display
  if (error) {
    return (
      <div className="p-4 text-destructive">
        <h3 className="font-medium mb-2">Error</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Add loading state
  if (isProcessingDocument || isGenerating || isInitialLoad) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const currentConcepts = getConceptsByPage(currentPage);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="sync">
          {currentConcepts.length > 0 ? (
            <div className="space-y-6">
              {currentConcepts.map((concept) => (
                <ConceptCard 
                  key={concept.id} 
                  concept={concept}
                  onSelect={onPageChange}
                />
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-muted-foreground"
            >
              <Sparkles className="h-12 w-12 mb-4" />
              <p>No concepts generated yet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}