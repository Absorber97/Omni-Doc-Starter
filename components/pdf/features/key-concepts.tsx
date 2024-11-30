'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { ConceptGenerator } from '@/lib/services/concept-generator';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';
import { ConceptCard } from './concept-card';
import { GenerationModeToggle } from './generation-mode-toggle';
import { useLogger } from '@/lib/hooks/use-logger';

interface KeyConceptsProps {
  url: string;
  currentPage: number;
  onBack: () => void;
}

export function KeyConcepts({ url, currentPage, onBack }: KeyConceptsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { concepts, generationMode, addConcepts, getConceptsByPage } = useConceptsStore();
  const contentExtractor = useRef(new PDFContentExtractor());
  const conceptGenerator = useRef(new ConceptGenerator());
  const log = useLogger('KeyConcepts');

  // Initialize PDF content extractor
  useEffect(() => {
    const initializeExtractor = async () => {
      if (!url) return;
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
  const generateConcepts = async () => {
    if (!url || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      if (generationMode === 'all-pages') {
        // Generate for all pages
        const allContent = await contentExtractor.current.getAllContent();
        const newConcepts = await conceptGenerator.current.generateConcepts(allContent, 1, {
          maxConcepts: 10,
          minConfidence: 0.7,
          includeContext: true
        });
        addConcepts(newConcepts);
      } else {
        // Generate for current page
        const pageContent = await contentExtractor.current.getPageContent(currentPage);
        if (!pageContent.trim()) {
          throw new Error('No content found on this page');
        }
        const newConcepts = await conceptGenerator.current.generateConcepts(pageContent, currentPage, {
          maxConcepts: 5,
          minConfidence: 0.7,
          includeContext: true
        });
        addConcepts(newConcepts);
      }
    } catch (err) {
      log.error('Failed to generate concepts:', err);
      setError('Failed to generate concepts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayedConcepts = generationMode === 'all-pages' 
    ? concepts 
    : getConceptsByPage(currentPage);

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 flex justify-between items-center">
        <GenerationModeToggle />
          <Button 
            onClick={generateConcepts} 
            disabled={isGenerating}
            size="sm"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>

        {error && (
          <div className="px-4 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <AnimatePresence mode="popLayout">
            <motion.div 
              className="space-y-4"
              layout
            >
              {displayedConcepts.map((concept) => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                />
              ))}
              
              {!isGenerating && displayedConcepts.length === 0 && (
                <motion.p 
                  className="text-center text-muted-foreground py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  No concepts generated yet. Click Generate to start.
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </div>
    </div>
  );
}