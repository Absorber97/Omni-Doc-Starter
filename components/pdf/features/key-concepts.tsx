'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { useDocumentStore } from '@/lib/store/document-store';
import { ConceptCard } from './concept-card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KeyConceptsProps {
  url: string;
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
}

export function KeyConcepts({ url, currentPage, onPageChange }: KeyConceptsProps) {
  const {
    concepts,
    currentDepthLevel,
    isGenerating,
    error,
    setIsGenerating,
    addConcepts,
    setDepthLevel,
  } = useConceptsStore();

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Reset error state when depth level changes
    setLocalError(null);
  }, [currentDepthLevel]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Generating concepts...</p>
      </div>
    );
  }

  if (localError || error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-destructive">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{localError || error}</p>
        </div>
      </div>
    );
  }

  if (!concepts.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">No concepts generated yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 space-y-6">
        {concepts
          .filter(concept => concept.depthLevel === currentDepthLevel)
          .sort((a, b) => b.metadata.importance - a.metadata.importance)
          .map(concept => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
      </div>
    </ScrollArea>
  );
}