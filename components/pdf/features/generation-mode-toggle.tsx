'use client';

import { motion } from 'framer-motion';
import { FileText, Files } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConceptsStore } from '@/lib/store/concepts-store';
import { cn } from '@/lib/utils';

export function GenerationModeToggle() {
  const { generationMode, setGenerationMode } = useConceptsStore();

  return (
    <motion.div 
      className="flex items-center gap-2 p-1.5 bg-card rounded-lg border shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant={generationMode === 'all-pages' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setGenerationMode('all-pages')}
        className="relative flex items-center gap-2 transition-all duration-200"
      >
        <motion.div
          initial={false}
          animate={{ scale: generationMode === 'all-pages' ? 1 : 0.9 }}
        >
          <Files className="h-4 w-4" />
        </motion.div>
        <span>All Pages</span>
      </Button>

      <Button
        variant={generationMode === 'page-by-page' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setGenerationMode('page-by-page')}
        className="relative flex items-center gap-2 transition-all duration-200"
      >
        <motion.div
          initial={false}
          animate={{ scale: generationMode === 'page-by-page' ? 1 : 0.9 }}
        >
          <FileText className="h-4 w-4" />
        </motion.div>
        <span>Current Page</span>
      </Button>
    </motion.div>
  );
} 