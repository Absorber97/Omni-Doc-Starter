'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { useConceptInteraction } from '@/lib/hooks/use-concept-interaction';
import { ConceptCard } from './concept-card';
import { ConceptFilter } from './concept-filter';
import { ConceptGenerator } from '@/lib/services/concept-generator';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';

interface KeyConceptsProps {
  url: string;
  currentPage: number;
  onBack: () => void;
}

export function KeyConcepts({ url, currentPage, onBack }: KeyConceptsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ConceptType>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    concepts, 
    addConcepts,
    getConceptsByPage 
  } = useConceptsStore();

  const {
    highlightedConceptId,
    selectedConceptId,
    handleConceptClick,
    handleConceptHover
  } = useConceptInteraction();

  const contentExtractor = useRef(new PDFContentExtractor());
  const conceptGenerator = useRef(new ConceptGenerator());

  // Debug logging function
  const log = useRef({
    info: (message: string, data?: any) => {
      console.log(`[KeyConcepts] ${message}`, data || '');
    },
    error: (message: string, error?: any) => {
      console.error(`[KeyConcepts] ${message}`, error || '');
    }
  }).current;

  // Add immediate debug log
  console.log('[KeyConcepts] Mounting with:', { url, currentPage });

  useEffect(() => {
    log.info('Component mounted');
    
    // Cleanup function
    return () => {
      log.info('Component unmounting');
    };
  }, []);

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

  // Generate concepts for current page
  useEffect(() => {
    const generateConcepts = async () => {
      if (!url) {
        log.error('No URL provided');
        return;
      }

      log.info(`Checking concept generation for page ${currentPage}`);
      const existingConcepts = getConceptsByPage(currentPage);
      log.info(`Found ${existingConcepts.length} existing concepts for page ${currentPage}`);

      if (existingConcepts.length > 0) {
        log.info('Skipping generation - concepts already exist');
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        log.info('Extracting page content...');
        const pageContent = await contentExtractor.current.getPageContent(currentPage);
        
        if (!pageContent) {
          throw new Error('No content extracted from page');
        }
        log.info(`Extracted ${pageContent.length} characters of content`);

        if (pageContent.trim().length === 0) {
          throw new Error('Page appears to be empty');
        }

        log.info('Generating concepts from content...');
        const newConcepts = await conceptGenerator.current.generateConcepts(
          pageContent, 
          currentPage,
          {
            maxConcepts: 5,
            minConfidence: 0.7,
            includeContext: true
          }
        );

        log.info(`Generated ${newConcepts.length} concepts`);

        if (newConcepts.length > 0) {
          log.info('Adding new concepts to store');
          addConcepts(newConcepts);
        } else {
          log.info('No concepts were generated');
          setError('No key concepts found on this page.');
        }
      } catch (err) {
        log.error('Error during concept generation:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to generate concepts. Please try again.'
        );
      } finally {
        setIsGenerating(false);
      }
    };

    // Only generate if not already generating
    if (!isGenerating) {
      generateConcepts();
    }
  }, [url, currentPage, addConcepts, getConceptsByPage, isGenerating]);

  // Add debug effect for concepts updates
  useEffect(() => {
    log.info('Current concepts count:', concepts.length);
    log.info('Concepts by page:', 
      Array.from(
        concepts.reduce((acc, c) => {
          acc.set(c.pageNumber, (acc.get(c.pageNumber) || 0) + 1);
          return acc;
        }, new Map<number, number>())
      )
    );
  }, [concepts]);

  // Filter concepts based on search and type
  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch = concept.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || concept.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Group concepts by page
  const groupedConcepts = filteredConcepts.reduce((acc, concept) => {
    const pageGroup = acc.get(concept.pageNumber) || [];
    pageGroup.push(concept);
    acc.set(concept.pageNumber, pageGroup.sort((a, b) => 
      (b.metadata?.importance || 0) - (a.metadata?.importance || 0)
    ));
    return acc;
  }, new Map<number, typeof concepts>());

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Key Concepts 🔑</h2>
      </div>

      {/* Filters */}
      <ConceptFilter
        selectedType={selectedType}
        searchQuery={searchQuery}
        onTypeChange={setSelectedType}
        onSearchChange={setSearchQuery}
      />

      {/* Loading state */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating concepts...</span>
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
          {Array.from(groupedConcepts.entries()).map(([pageNumber, pageConcepts]) => (
            <motion.div
              key={pageNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="space-y-2">
                {pageConcepts.map((concept) => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    isHighlighted={concept.id === highlightedConceptId}
                    isSelected={concept.id === selectedConceptId}
                    onClick={() => handleConceptClick(concept.id)}
                    onHover={(hover) => handleConceptHover(hover ? concept.id : null)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {!isGenerating && filteredConcepts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-muted-foreground"
          >
            <p className="text-sm">No concepts found</p>
            <p className="text-xs mt-1">Try adjusting your filters or switching pages</p>
          </motion.div>
        )}
      </ScrollArea>
    </div>
  );
}