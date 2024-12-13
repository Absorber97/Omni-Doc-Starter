'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept, QuizQuestion } from '@/lib/types/learning-path';
import { cn } from '@/lib/utils';

interface ConceptQuizProps {
  concept: LearningConcept;
  onComplete: (confidence: number) => void;
  onBack: () => void;
}

export function ConceptQuiz({ concept, onComplete, onBack }: ConceptQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { service } = useLearningPathStore();

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const quizQuestions = await service.generateConceptQuiz(concept);
        setQuestions(quizQuestions);
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [concept, service]);

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQ?.id];
  const isCorrect = currentAnswer === currentQ?.correctAnswer;

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: answer
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      const score = calculateScore();
      onComplete(score);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (question?.correctAnswer === answer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Preparing questions...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <span className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question */}
      <Card className="p-6">
        <motion.div
          key={currentQ?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <h3 className="text-lg font-medium">{currentQ?.question}</h3>

          <RadioGroup
            onValueChange={handleAnswer}
            value={currentAnswer}
            disabled={showExplanation}
          >
            {currentQ?.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option} 
                  id={`option-${index}`}
                  className={cn(
                    showExplanation && option === currentQ.correctAnswer && "border-green-500",
                    showExplanation && option === currentAnswer && option !== currentQ.correctAnswer && "border-red-500"
                  )}
                />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className={cn(
                  "mt-4",
                  isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertDescription>
                      {currentQ.explanation}
                    </AlertDescription>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!currentAnswer || (!showExplanation && currentQuestion < questions.length)}
        >
          {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete'}
        </Button>
      </div>
    </div>
  );
} 