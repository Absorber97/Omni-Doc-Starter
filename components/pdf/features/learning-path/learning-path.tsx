'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { Assessment } from '@/lib/types/learning-path';
import { InitialAssessment } from './initial-assessment';
import { ConceptView } from './concept-view';
import { ProgressDashboard } from './progress-dashboard';
import { ErrorBoundary } from '@/components/pdf/features/error-boundary';

interface LearningPathProps {
  url: string;
  currentPage: number;
  onBack: () => void;
}

export function LearningPath({ url, currentPage, onBack }: LearningPathProps) {
  const { currentPath, isLoading, error, initializePath } = useLearningPathStore();
  const [view, setView] = useState<'assessment' | 'concepts' | 'progress'>('assessment');

  useEffect(() => {
    if (!currentPath) {
      initializePath(url);
    }
  }, [url, currentPath, initializePath]);

  const handleAssessmentComplete = (assessment: Assessment) => {
    setView('concepts');
  };

  if (error) {
    return (
      <div className="p-4 text-destructive text-center">
        <p>{error}</p>
        <Button variant="outline" onClick={() => initializePath(url)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Preparing your learning journey...
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <AnimatePresence mode="wait">
                {view === 'assessment' && !currentPath && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ErrorBoundary>
                      <InitialAssessment onComplete={handleAssessmentComplete} />
                    </ErrorBoundary>
                  </motion.div>
                )}

                {view === 'concepts' && currentPath && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ErrorBoundary>
                      <ConceptView 
                        onProgressView={() => setView('progress')} 
                      />
                    </ErrorBoundary>
                  </motion.div>
                )}

                {view === 'progress' && currentPath && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ErrorBoundary>
                      <ProgressDashboard 
                        onBack={() => setView('concepts')} 
                      />
                    </ErrorBoundary>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
} 