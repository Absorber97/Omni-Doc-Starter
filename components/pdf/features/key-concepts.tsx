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
  onBack: () => void;
}

export function KeyConcepts({ url, currentPage }: KeyConceptsProps) {
  const [error, setError] = useState<string | null>(null);
  
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

  // Add initial state check
  useEffect(() => {
    // Reset isGenerating on mount
    setIsGenerating(false);
    
    return () => {
      // Cleanup on unmount
      setIsGenerating(false);
    };
  }, []);

  // Process document and generate concepts
  useEffect(() => {
    if (!url || !currentPage) return;

    const processAndGenerate = async () => {
      try {
        // Process document if needed
        if (!currentDocument || currentDocument.url !== url) {
          console.log('Starting document processing...');
          const doc = await processDocument(url, 'document.pdf');
          console.log('Document processing completed with doc:', doc);
        }

        // Check if we need to generate concepts
        if (generatedPages.includes(currentPage)) {
          console.log('Page already has concepts, skipping generation');
          return;
        }

        // Generate concepts
        if (!isGenerating && processor) {
          console.log('Starting concept generation for page:', currentPage, 'with depth:', currentDepthLevel);
          setIsGenerating(true);
          
          try {
            const pageConcepts = await processor.generateConcepts(currentPage, currentDepthLevel);
            console.log('Generated concepts:', pageConcepts);
            
            if (pageConcepts && pageConcepts.length > 0) {
              addConcepts(pageConcepts);
              markPageAsGenerated(currentPage);
            } else {
              console.warn('No concepts were generated');
              setError('No concepts could be generated for this page');
            }
          } catch (err) {
            console.error('Concept generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate concepts');
          } finally {
            setIsGenerating(false);
          }
        } else {
          console.log('Skipping concept generation:', { 
            isGenerating, 
            hasProcessor: !!processor,
            currentPage,
            currentDepthLevel
          });
        }
      } catch (err) {
        console.error('Document processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process document');
        setIsGenerating(false);
      }
    };

    processAndGenerate();
  }, [url, currentPage, currentDocument, processor, currentDepthLevel]);

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
  if (isProcessingDocument || isGenerating) {
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
    <div className="h-full flex flex-col gap-4">
      <main className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="sync">
          {currentConcepts.length > 0 ? (
            currentConcepts.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Sparkles className="h-12 w-12 mb-4" />
              <p>No concepts generated yet</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}