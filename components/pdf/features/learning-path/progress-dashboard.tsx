'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept } from '@/lib/types/learning-path';
import { cn } from '@/lib/utils';

interface ProgressDashboardProps {
  onBack: () => void;
}

export function ProgressDashboard({ onBack }: ProgressDashboardProps) {
  const { currentPath, getConfidenceLevel } = useLearningPathStore();

  const stats = useMemo(() => {
    if (!currentPath) return null;

    const totalConcepts = currentPath.concepts.length;
    const completedConcepts = currentPath.concepts.filter(
      c => c.status === 'completed'
    ).length;

    const averageConfidence = Object.values(currentPath.progress).reduce(
      (sum, p) => sum + p.confidence, 
      0
    ) / totalConcepts;

    const totalTimeSpent = Object.values(currentPath.progress).reduce(
      (sum, p) => sum + p.timeSpent,
      0
    );

    return {
      progress: (completedConcepts / totalConcepts) * 100,
      confidence: averageConfidence,
      timeSpent: totalTimeSpent,
      conceptsCompleted: completedConcepts,
      totalConcepts
    };
  }, [currentPath]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Concepts
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Overall Progress</h3>
          </div>
          <Progress value={stats.progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {stats.conceptsCompleted} of {stats.totalConcepts} concepts completed
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <h3 className="font-medium">Average Confidence</h3>
          </div>
          <div className="text-2xl font-bold">
            {Math.round(stats.confidence)}%
          </div>
          <p className="text-sm text-muted-foreground">
            {getConfidenceLevel(stats.confidence)}
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">Time Spent</h3>
          </div>
          <div className="text-2xl font-bold">
            {Math.round(stats.timeSpent / 60)}h {stats.timeSpent % 60}m
          </div>
          <p className="text-sm text-muted-foreground">
            Total learning time
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">Achievements</h3>
          </div>
          <div className="text-2xl font-bold">
            {currentPath?.assessments.length || 0}
          </div>
          <p className="text-sm text-muted-foreground">
            Assessments completed
          </p>
        </Card>
      </div>
    </div>
  );
} 