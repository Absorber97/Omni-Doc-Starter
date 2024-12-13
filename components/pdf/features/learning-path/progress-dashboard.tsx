'use client';

import { useMemo, useState } from 'react';
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
  Star,
  ChevronRight
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept, ConfidenceLevel } from '@/lib/types/learning-path';
import { cn } from '@/lib/utils';

interface ProgressDashboardProps {
  onStartLearning: () => void;
}

export function ProgressDashboard({ onStartLearning }: ProgressDashboardProps) {
  const { currentPath, getConfidenceLevel } = useLearningPathStore();
  const [selectedConcept, setSelectedConcept] = useState<LearningConcept | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-blue-500/10 text-blue-500';
      case 'advanced': return 'bg-purple-500/10 text-purple-500';
      case 'expert': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const stats = useMemo(() => {
    if (!currentPath) return {
      totalMaterials: 0,
      totalQuestions: 0,
      completedMaterials: 0,
      completedQuestions: 0
    };

    const totalMaterials = currentPath.concepts.reduce((acc, concept) => 
      acc + concept.materials.length, 0);
    const totalQuestions = currentPath.concepts.reduce((acc, concept) => 
      acc + concept.practiceQuestions.length, 0);
    const completedMaterials = currentPath.concepts.reduce((acc, concept) => 
      acc + (currentPath.progress[concept.id]?.completedMaterials.length || 0), 0);
    const completedQuestions = currentPath.concepts.reduce((acc, concept) => 
      acc + (currentPath.progress[concept.id]?.completedQuestions.length || 0), 0);

    return {
      totalMaterials,
      totalQuestions,
      completedMaterials,
      completedQuestions
    };
  }, [currentPath]);

  if (selectedConcept) {
    return (
      <ConceptDetail
        concept={selectedConcept}
        onBack={() => setSelectedConcept(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Learning Progress</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Concepts</span>
              </div>
              <Progress 
                value={(stats.completedMaterials / stats.totalMaterials) * 100} 
                className="h-2"
              />
              <div className="text-sm text-muted-foreground">
                {stats.completedMaterials} of {stats.totalMaterials} completed
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Materials</span>
              </div>
              <Progress 
                value={(stats.completedMaterials / stats.totalMaterials) * 100} 
                className="h-2"
              />
              <div className="text-sm text-muted-foreground">
                {stats.completedMaterials} of {stats.totalMaterials} completed
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                <span>Practice</span>
              </div>
              <Progress 
                value={(stats.completedQuestions / stats.totalQuestions) * 100} 
                className="h-2"
              />
              <div className="text-sm text-muted-foreground">
                {stats.completedQuestions} of {stats.totalQuestions} completed
              </div>
            </div>
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
              className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
              onClick={() => setSelectedConcept(concept)}
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

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 