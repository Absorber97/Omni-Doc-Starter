'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  BookOpen,
  Brain,
  Timer,
  CheckCircle2
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept } from '@/lib/types/learning-path';
import { cn } from '@/lib/utils';
import { ConceptLearning } from './concept-learning';

interface ConceptDetailProps {
  concept: LearningConcept;
  onBack: () => void;
}

export function ConceptDetail({ concept, onBack }: ConceptDetailProps) {
  const [mode, setMode] = useState<'overview' | 'learning' | 'quiz'>('overview');
  const { currentPath, getConfidenceLevel, updateProgress } = useLearningPathStore();
  const progress = currentPath?.progress[concept.id];

  if (mode === 'learning') {
    return (
      <ConceptLearning
        concept={concept}
        onBack={() => setMode('overview')}
        onComplete={() => setMode('quiz')}
      />
    );
  }

  if (mode === 'quiz') {
    return (
      <ConceptQuiz
        concept={concept}
        onComplete={(confidence) => {
          updateProgress(concept.id, confidence);
          onBack();
        }}
        onBack={() => setMode('overview')}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <Badge variant="outline">
            {concept.metadata?.difficulty}/5 Difficulty
          </Badge>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setMode('learning')}
        >
          Test Understanding
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{concept.title}</h2>
            <p className="text-muted-foreground">{concept.description}</p>
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span>{Math.round(progress.confidence)}%</span>
              </div>
              <Progress value={progress.confidence} className="h-2" />
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span>{concept.estimatedTime} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span>{getConfidenceLevel(progress?.confidence || 0)}</span>
            </div>
          </div>
        </Card>

        {/* Learning Content */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Learning Material</h3>
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
                  <Badge key={page} variant="secondary">
                    Page {page}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setMode('learning')}
          >
            Practice Questions
          </Button>
          <Button onClick={() => {/* Mark as completed */}}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 