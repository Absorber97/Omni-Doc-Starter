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
  const [view, setView] = useState<'assessment' | 'concepts' | 'progress'>('progress');

  useEffect(() => {
    console.log('🔄 Learning path component mounted');
    const initialize = async () => {
      try {
        await initializePath(url);
      } catch (error) {
        console.error('❌ Initialization error:', error);
      }
    };
    
    if (!currentPath) {
      console.log('📚 Starting initialization');
      initialize();
      setView('assessment');
    } else {
      console.log('📚 Using existing learning path');
      setView('progress');
    }
  }, [url, currentPath, initializePath]);

  const handleAssessmentComplete = (assessment: Assessment) => {
    console.log('✅ Assessment completed, switching to progress view');
    setView('progress');
  };

  if (error) {
    console.error('❌ Rendering error state:', error);
    return (
      <div className="p-4 text-destructive text-center">
        <p>{error}</p>
        <Button 
          variant="outline" 
          onClick={() => {
            console.log('🔄 Retrying initialization');
            initializePath(url);
          }}
        >
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
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <AnimatePresence mode="wait" initial={false}>
                {view === 'assessment' && !currentPath?.assessments?.length && (
                  <motion.div
                    key="assessment"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ErrorBoundary>
                      <InitialAssessment onComplete={handleAssessmentComplete} />
                    </ErrorBoundary>
                  </motion.div>
                )}

                {view === 'concepts' && currentPath && (
                  <motion.div
                    key="concepts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
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
                    key="progress"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ErrorBoundary>
                      <ProgressDashboard 
                        onStartLearning={() => setView('concepts')} 
                      />
                    </ErrorBoundary>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 