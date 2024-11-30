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
    generationMode,
    generatedPages,
    addConcepts,
    setIsGenerating,
    markPageAsGenerated,
    getConceptsByPage
  } = useConceptsStore();

  // Process document if not already processed
  useEffect(() => {
    if (!url || currentDocument?.url === url) return;

    const process = async () => {
      try {
        await processDocument(url, 'document.pdf');
      } catch (err) {
        console.error('Document processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process document');
      }
    };

    process();
  }, [url, currentDocument, processDocument]);

  // Generate concepts using processed document
  useEffect(() => {
    const generateConcepts = async () => {
      if (!currentDocument || !url) {
        return;
      }

      // Skip if already generated for current page
      if (generationMode === 'current-page' && generatedPages.includes(currentPage)) {
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const pageContent = currentDocument.pages[currentPage - 1]?.text;
        
        if (!pageContent || pageContent.trim().length === 0) {
          throw new Error('Page appears to be empty');
        }

        // Use the document processor's concept generator
        const newConcepts = await processor.conceptGenerator.generateConcepts(
          pageContent,
          currentPage,
          currentDepthLevel
        );

        if (newConcepts.length === 0) {
          throw new Error('No concepts could be generated from this page');
        }

        addConcepts(newConcepts);
        markPageAsGenerated(currentPage);
        
      } catch (error) {
        console.error('Concept generation error:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate concepts');
      } finally {
        setIsGenerating(false);
      }
    };

    if (!isGenerating && !isProcessingDocument) {
      generateConcepts();
    }
  }, [
    url,
    currentPage,
    currentDepthLevel,
    generationMode,
    generatedPages,
    currentDocument,
    isProcessingDocument,
    processor,
    addConcepts,
    markPageAsGenerated,
    setIsGenerating
  ]);

  const currentConcepts = getConceptsByPage(currentPage);
  const isLoading = isProcessingDocument || isGenerating;

  return (
    <div className="h-full flex flex-col gap-4">
      <main className="flex-1 overflow-y-auto p-4">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 mb-4 text-sm text-destructive bg-destructive/10 rounded-md"
          >
            {error}
          </motion.div>
        )}
        
        <AnimatePresence mode="sync">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}