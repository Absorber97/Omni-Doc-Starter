'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  BookOpen, 
  BarChart, 
  Lock,
  CheckCircle 
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept, ConceptStatus } from '@/lib/types/learning-path';
import { cn } from '@/lib/utils';
import { appConfig } from '@/config/app';
import { ConceptDetail } from './concept-detail';
import { ConceptQuiz } from './concept-quiz';

interface ConceptViewProps {
  onProgressView: () => void;
}

export function ConceptView({ onProgressView }: ConceptViewProps) {
  const { currentPath, getCurrentConcept, getConfidenceLevel, updateProgress } = useLearningPathStore();
  const [selectedConcept, setSelectedConcept] = useState<LearningConcept | null>(
    getCurrentConcept()
  );
  const [showQuiz, setShowQuiz] = useState(false);

  const statusConfig: Record<ConceptStatus, { 
    icon: React.ElementType; 
    label: string;
    color: string;
  }> = {
    'locked': { 
      icon: Lock, 
      label: 'Locked',
      color: 'text-muted-foreground'
    },
    'available': { 
      icon: BookOpen, 
      label: 'Ready to Learn',
      color: 'text-blue-500'
    },
    'in-progress': { 
      icon: BarChart, 
      label: 'In Progress',
      color: 'text-yellow-500'
    },
    'completed': { 
      icon: CheckCircle, 
      label: 'Completed',
      color: 'text-green-500'
    }
  };

  if (showQuiz && selectedConcept) {
    return (
      <ConceptQuiz
        concept={selectedConcept}
        onComplete={(confidence) => {
          updateProgress(selectedConcept.id, confidence);
          setShowQuiz(false);
        }}
        onBack={() => setShowQuiz(false)}
      />
    );
  }

  if (selectedConcept) {
    return (
      <ConceptDetail
        concept={selectedConcept}
        onBack={() => setSelectedConcept(null)}
        onQuiz={() => setShowQuiz(true)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress Overview */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Learning Concepts</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onProgressView}
        >
          View Progress
        </Button>
      </div>

      {/* Concept List */}
      <div className="grid gap-4">
        {currentPath?.concepts.map((concept) => {
          const status = statusConfig[concept.status];
          const StatusIcon = status.icon;
          const confidence = currentPath.progress[concept.id]?.confidence || 0;
          const confidenceLevel = getConfidenceLevel(confidence);

          return (
            <Card
              key={concept.id}
              className={cn(
                "p-4 transition-colors",
                concept.status !== 'locked' && "hover:bg-muted/50 cursor-pointer",
                concept.status === 'locked' && "opacity-50"
              )}
              onClick={() => {
                if (concept.status !== 'locked') {
                  setSelectedConcept(concept);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <StatusIcon className={cn("h-5 w-5", status.color)} />
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{concept.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {concept.description}
                  </p>

                  {concept.status !== 'locked' && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Confidence:
                      </span>
                      <Badge variant="outline">
                        {confidenceLevel}
                      </Badge>
                      <span className="text-muted-foreground">
                        ({Math.round(confidence)}%)
                      </span>
                    </div>
                  )}
                </div>

                {concept.status !== 'locked' && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 