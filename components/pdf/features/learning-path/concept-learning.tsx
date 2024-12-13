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
  const { currentPath, completeMaterial } = useLearningPathStore();
  const { navigateToPage } = usePDFNavigation();

  // Track scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setReadingProgress(Math.min(progress, 100));
  };

  const handleComplete = () => {
    // Mark all materials as completed
    concept.materials.forEach(material => {
      completeMaterial(concept.id, material.id);
    });
    onComplete();
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
      <ScrollArea className="flex-1" onScroll={handleScroll}>
        <div className="space-y-8 p-4">
          {concept.materials.map((material, index) => (
            <div key={material.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${material.color}20`, color: material.color }}
                >
                  {material.emoji}
                </div>
                <h3 className="text-lg font-medium">{material.title}</h3>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {material.content}
              </div>

              {material.pageReferences?.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToPage(material.pageReferences[0])}
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  View in Document
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted-foreground">
          {readingProgress >= 90 ? 
            "You've read through the material!" : 
            "Keep reading to complete this concept"
          }
        </div>
        <Button
          onClick={handleComplete}
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