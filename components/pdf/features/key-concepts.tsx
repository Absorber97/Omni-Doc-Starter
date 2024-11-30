'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { useLogger } from '@/lib/hooks/use-logger';
import { ConceptGenerator } from '@/lib/services/concept-generator';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';
import { ConceptCard } from './concept-card';

interface KeyConceptsProps {
  url: string;
  currentPage: number;
  onBack: () => void;
}

export function KeyConcepts({ url, currentPage, onBack }: KeyConceptsProps) {
  const log = useLogger('KeyConcepts');
  const [error, setError] = useState<string | null>(null);
  const contentExtractor = useRef(new PDFContentExtractor());
  const conceptGenerator = useRef(new ConceptGenerator());
  
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

  // Initialize PDF content extractor
  useEffect(() => {
    const initializeExtractor = async () => {
      if (!url) return;

      log.info('Initializing PDF extractor with URL:', url);
      setIsGenerating(true);
      
      try {
        await contentExtractor.current.loadDocument(url);
        log.info('PDF extractor initialized successfully');
      } catch (err) {
        log.error('Failed to initialize PDF extractor:', err);
        setError('Failed to load document. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    initializeExtractor();
  }, [url]);

  // Generate concepts
  useEffect(() => {
    const generateConcepts = async () => {
      if (!url) {
        log.error('No URL provided');
        return;
      }

      // Skip if already generated for current page
      if (generationMode === 'current-page' && generatedPages.includes(currentPage)) {
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const pageContent = await contentExtractor.current.getPageContent(currentPage);
        
        if (pageContent.trim().length === 0) {
          throw new Error('Page appears to be empty');
        }

        const newConcepts = await conceptGenerator.current.generateConcepts(
          pageContent,
          currentPage,
          currentDepthLevel
        );

        addConcepts(newConcepts);
        markPageAsGenerated(currentPage);
        
      } catch (error) {
        log.error('Error generating concepts:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate concepts');
      } finally {
        setIsGenerating(false);
      }
    };

    if (!isGenerating) {
      generateConcepts();
    }
  }, [url, currentPage, currentDepthLevel, generationMode, generatedPages]);

  const currentConcepts = getConceptsByPage(currentPage);

  return (
    <div className="h-full flex flex-col gap-4">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-sm text-destructive bg-destructive/10 rounded-md"
            >
              {error}
            </motion.div>
          )}
          
          {isGenerating ? (
            <motion.div
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