'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy,
  Target,
  BookOpen,
  Brain,
  CheckCircle2,
  Star
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept, ConfidenceLevel } from '@/lib/types/learning-path';
import { cn } from '@/lib/utils';

interface ProgressDashboardProps {
  onStartLearning: () => void;
}

export function ProgressDashboard({ onStartLearning }: ProgressDashboardProps) {
  const { currentPath, getConfidenceLevel } = useLearningPathStore();

  const stats = useMemo(() => {
    if (!currentPath) return null;

    const totalConcepts = currentPath.concepts.length;
    const completedConcepts = currentPath.concepts.filter(
      c => c.status === 'completed'
    ).length;

    const totalMaterials = currentPath.concepts.reduce(
      (sum, c) => sum + c.materials.length, 0
    );
    const completedMaterials = currentPath.concepts.reduce(
      (sum, c) => sum + (currentPath.progress[c.id]?.completedMaterials.length || 0), 0
    );

    const totalQuestions = currentPath.concepts.reduce(
      (sum, c) => sum + c.practiceQuestions.length, 0
    );
    const completedQuestions = currentPath.concepts.reduce(
      (sum, c) => sum + (currentPath.progress[c.id]?.completedQuestions.length || 0), 0
    );

    const averageConfidence = Object.values(currentPath.progress).reduce(
      (sum, p) => sum + p.confidence, 
      0
    ) / totalConcepts;

    return {
      conceptsProgress: (completedConcepts / totalConcepts) * 100,
      materialsProgress: (completedMaterials / totalMaterials) * 100,
      questionsProgress: (completedQuestions / totalQuestions) * 100,
      confidence: averageConfidence,
      conceptsCompleted: completedConcepts,
      totalConcepts,
      materialsCompleted: completedMaterials,
      totalMaterials,
      questionsCompleted: completedQuestions,
      totalQuestions
    };
  }, [currentPath]);

  if (!stats) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-blue-500/10 text-blue-500';
      case 'advanced': return 'bg-purple-500/10 text-purple-500';
      case 'expert': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Learning Progress</h3>
            <p className="text-sm text-muted-foreground">
              Track your learning journey
            </p>
          </div>
          <Button onClick={onStartLearning}>
            Continue Learning
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Concepts</span>
            </div>
            <Progress value={stats.conceptsProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {stats.conceptsCompleted} of {stats.totalConcepts} completed
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Materials</span>
            </div>
            <Progress value={stats.materialsProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {stats.materialsCompleted} of {stats.totalMaterials} completed
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Practice</span>
            </div>
            <Progress value={stats.questionsProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {stats.questionsCompleted} of {stats.totalQuestions} completed
            </p>
          </div>
        </div>
      </Card>

      {/* Concepts Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Learning Concepts</h3>
        <div className="space-y-4">
          {currentPath?.concepts.map((concept) => (
            <div 
              key={concept.id}
              className="flex items-center gap-4 p-4 rounded-lg border"
            >
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${concept.color}20`, color: concept.color }}
              >
                {concept.emoji}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{concept.title}</h4>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'ml-auto',
                      getDifficultyColor(concept.metadata?.difficulty || 'beginner')
                    )}
                  >
                    {concept.metadata?.difficulty}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {currentPath.progress[concept.id]?.completedMaterials.length || 0}/
                      {concept.materials.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4" />
                    <span>
                      {currentPath.progress[concept.id]?.completedQuestions.length || 0}/
                      {concept.practiceQuestions.length}
                    </span>
                  </div>

                  {concept.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 