'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  BookOpen,
  Brain,
  CheckCircle2,
  ArrowRight,
  Timer,
  Star
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept, LearningMaterial } from '@/lib/types/learning-path';
import { cn } from '@/lib/utils';
import { usePDFNavigation } from '@/lib/hooks/use-pdf-navigation';

interface ConceptDetailProps {
  concept: LearningConcept;
  onStartPractice: () => void;
}

export function ConceptDetail({ concept, onStartPractice }: ConceptDetailProps) {
  const [activeTab, setActiveTab] = useState<string>('materials');
  const { navigateToPage } = usePDFNavigation();
  const { updateProgress } = useLearningPathStore();

  const handleMaterialComplete = (materialId: string) => {
    updateProgress(concept.id, undefined, materialId);
  };

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <div 
          className="h-12 w-12 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${concept.color}20`, color: concept.color }}
        >
          {concept.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold truncate">
              {concept.title}
            </h2>
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
          <p className="text-sm text-muted-foreground">
            {concept.description}
          </p>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="materials" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Learning Materials
          </TabsTrigger>
          <TabsTrigger value="practice" className="gap-2">
            <Brain className="h-4 w-4" />
            Practice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-4">
          <div className="space-y-4">
            {concept.materials.map((material, index) => (
              <Card key={material.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="h-8 w-8 rounded flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${material.color}20`, color: material.color }}
                  >
                    {material.emoji}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-medium">{material.title}</h3>
                      <Badge variant="outline" className="capitalize">
                        {material.type}
                      </Badge>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      {material.content.split('\n').map((paragraph, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPage(material.pageReferences[0])}
                        className="gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        View in Document
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleMaterialComplete(material.id)}
                        className="gap-2 ml-auto"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark as Complete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="practice" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">Ready to Practice?</h3>
                <p className="text-sm text-muted-foreground">
                  Test your understanding with practice questions
                </p>
              </div>

              <Button onClick={onStartPractice} className="gap-2">
                Start Practice
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 