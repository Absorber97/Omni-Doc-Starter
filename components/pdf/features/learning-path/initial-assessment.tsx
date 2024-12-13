'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { QuizQuestion, Assessment } from '@/lib/types/learning-path';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { appConfig } from '@/config/app';

interface InitialAssessmentProps {
  onComplete: (assessment: Assessment) => void;
}

export function InitialAssessment({ onComplete }: InitialAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { currentPath } = useLearningPathStore();

  const questions = currentPath?.assessments[0]?.questions || [];
  const progress = (currentQuestion / questions.length) * 100;

  const handleAnswer = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const assessment: Assessment = {
      id: currentPath?.assessments[0]?.id || '',
      type: 'initial',
      questions,
      responses: Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer,
        isCorrect: questions.find(q => q.id === questionId)?.correctAnswer === answer,
        confidence: 0
      })),
      score: calculateScore(),
      completedAt: new Date()
    };
    onComplete(assessment);
  };

  const calculateScore = () => {
    let correct = 0;
    Object.entries(responses).forEach(([questionId, answer]) => {
      if (questions.find(q => q.id === questionId)?.correctAnswer === answer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };

  const currentQ = questions[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-right">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <Card className="p-6">
        <motion.div
          key={currentQ?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-medium">{currentQ?.question}</h3>

          <RadioGroup
            onValueChange={(value) => handleAnswer(currentQ.id, value)}
            value={responses[currentQ?.id]}
          >
            {currentQ?.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </motion.div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!responses[currentQ?.id]}
        >
          {currentQuestion < questions.length - 1 ? 'Next' : 'Complete'}
        </Button>
      </div>
    </div>
  );
} 