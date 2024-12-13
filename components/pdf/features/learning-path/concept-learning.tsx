'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft,
  Timer,
  BookOpen,
  Brain,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept } from '@/lib/types/learning-path';
import { useLearningTracker } from '@/lib/hooks/use-learning-tracker';
import { cn } from '@/lib/utils';
import { usePDFNavigation } from '@/lib/hooks/use-pdf-navigation';

interface ConceptLearningProps {
  concept: LearningConcept;
  onBack: () => void;
  onComplete: () => void;
}

export function ConceptLearning({ concept, onBack, onComplete }: ConceptLearningProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const { timeSpent, formattedTime } = useLearningTracker({ concept });
  const { currentPath } = useLearningPathStore();
  const { navigateToPage } = usePDFNavigation();

  // Track scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setReadingProgress(Math.min(progress, 100));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Badge variant="outline" className="gap-1">
            <Timer className="h-3 w-3" />
            {formattedTime}
          </Badge>
        </div>
        <Progress 
          value={readingProgress} 
          className="w-32 h-2"
        />
      </div>

      {/* Content */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea 
          className="h-full"
          onScroll={handleScroll}
        >
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{concept.title}</h2>
              <p className="text-muted-foreground">{concept.description}</p>
            </div>

            <div className="prose prose-sm dark:prose-invert">
              {concept.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {concept.pageReferences.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Referenced Pages</h4>
                <div className="flex flex-wrap gap-2">
                  {concept.pageReferences.map((page) => (
                    <Button
                      key={page}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigateToPage(page)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Page {page}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted-foreground">
          {readingProgress >= 90 ? 
            "You've read through the material!" : 
            "Keep reading to complete this concept"
          }
        </div>
        <Button
          onClick={onComplete}
          disabled={readingProgress < 90}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark as Complete
        </Button>
      </div>
    </div>
  );
} 