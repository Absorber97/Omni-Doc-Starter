'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { ConceptView } from './concept-view';
import { InitialAssessment } from './initial-assessment';
import { ProgressDashboard } from './progress-dashboard';
import { LearningPathErrorFallback } from './learning-path-error';
import { ErrorBoundary } from '../error-boundary';

interface LearningPathProps {
  url: string;
}

export function LearningPath({ url }: LearningPathProps) {
  const [view, setView] = useState<'concepts' | 'progress'>('concepts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentPath, initialize } = useLearningPathStore();

  useEffect(() => {
    console.log('🔄 Learning path component mounted');
    const initializePath = async () => {
      try {
        console.log('📚 Starting initialization');
        await initialize(url);
        console.log('✅ Initialization complete');
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize learning path'));
      } finally {
        setIsLoading(false);
      }
    };

    initializePath();
  }, [url, initialize]);

  if (error) {
    return (
      <LearningPathErrorFallback
        error={error}
        resetErrorBoundary={() => {
          setError(null);
          setIsLoading(true);
          initialize(url).finally(() => setIsLoading(false));
        }}
      />
    );
  }

  if (isLoading || !currentPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Preparing your learning path...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      <ScrollArea className="flex-1">
        <div className="container max-w-4xl mx-auto p-6">
          <ErrorBoundary
            FallbackComponent={LearningPathErrorFallback}
            onReset={() => {
              setIsLoading(true);
              initialize(url).finally(() => setIsLoading(false));
            }}
          >
            {view === 'concepts' ? (
              <ConceptView onProgressView={() => setView('progress')} />
            ) : (
              <ProgressDashboard onStartLearning={() => setView('concepts')} />
            )}
          </ErrorBoundary>
        </div>
      </ScrollArea>
    </motion.div>
  );
} 