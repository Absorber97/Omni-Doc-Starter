'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { ConceptCard } from './concept-card';
import { ConceptGenerator } from '@/lib/services/concept-generator';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';
import { ErrorBoundary } from '@/components/pdf/features/error-boundary';

interface KeyConceptsProps {
  url: string;
  currentPage: number;
  onBack: () => void;
}

export function KeyConcepts({ url, onBack }: KeyConceptsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { concepts, addConcepts } = useConceptsStore();
  
  const contentExtractor = useRef(new PDFContentExtractor());
  const conceptGenerator = useRef(new ConceptGenerator());

  const logger = useRef({
    info: (event: string, details?: any) => {
      console.log(`[KeyConcepts] ${event}`, details || '');
    },
    error: (event: string, error?: any) => {
      console.error(`[KeyConcepts] ${event}`, error || '');
    },
    timing: (event: string) => {
      const start = performance.now();
      return {
        end: () => {
          const duration = performance.now() - start;
          console.log(`[KeyConcepts] ${event} took ${duration.toFixed(2)}ms`);
        }
      };
    }
  }).current;

  // Generate concepts for all pages
  useEffect(() => {
    const generateConcepts = async () => {
      if (!url || concepts.length > 0) return;

      const timer = logger.timing('Concept generation');
      setIsGenerating(true);
      setError(null);

      try {
        logger.info('Starting document processing', { url });
        await contentExtractor.current.loadDocument(url);
        
        const pageCount = await contentExtractor.current.getPageCount();
        logger.info('Document loaded', { pageCount });

        // Extract content from all pages
        const pageContents = await Promise.all(
          Array.from({ length: pageCount }, (_, i) => i + 1).map(async (pageNum) => {
            const content = await contentExtractor.current.getPageContent(pageNum);
            return { pageNum, content };
          })
        );

        logger.info('Content extracted from all pages', { 
          totalChars: pageContents.reduce((sum, p) => sum + p.content.length, 0) 
        });

        // Batch generate concepts
        const newConcepts = await conceptGenerator.current.generateConceptsBatch(
          pageContents,
          {
            maxConceptsPerPage: 3,
            minRelevanceScore: 0.7,
            includeContext: true
          }
        );

        logger.info('Concepts generated', { count: newConcepts.length });

        // Sort by relevance and limit to top 10
        const topConcepts = newConcepts
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 10);

        addConcepts(topConcepts);
        timer.end();

      } catch (err) {
        logger.error('Failed to generate concepts', err);
        setError('Failed to analyze document. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateConcepts();
  }, [url, concepts.length, addConcepts]);

  return (
    <div className="flex flex-col h-full">

      {/* Loading state */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Analyzing document...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-destructive text-center py-4">
          {error}
        </div>
      )}

      {/* Concepts list */}
      <ScrollArea className="flex-1 mt-4">
        <AnimatePresence mode="popLayout">
          {concepts.map((concept) => (
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <ErrorBoundary>
                <ConceptCard concept={concept} />
              </ErrorBoundary>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}