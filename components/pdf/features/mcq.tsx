import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  ChevronRight,
  Info,
  Sparkles,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMCQStore } from '@/lib/store/mcq-store';
import { Skeleton } from '@/components/ui/skeleton';

interface MCQProps {
  url: string;
  currentPage: number;
  isLoading: boolean;
  onBack: () => void;
}

const cardVariants = {
  initial: (direction: number) => ({
    scale: 0.8,
    opacity: 0,
    x: direction > 0 ? 200 : -200
  }),
  animate: {
    scale: 1,
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      type: "spring",
      bounce: 0.3
    }
  },
  exit: (direction: number) => ({
    scale: 0.8,
    opacity: 0,
    x: direction < 0 ? 200 : -200,
    transition: {
      duration: 0.4,
      type: "spring",
      bounce: 0.1
    }
  })
};

export function MCQ({ url, currentPage, isLoading: parentLoading }: MCQProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [direction, setDirection] = useState(0);
  const { questions, generateMCQs, markCompleted, isLoading } = useMCQStore();

  useEffect(() => {
    generateMCQs(url);
  }, [url, generateMCQs]);

  if (isLoading || parentLoading) {
    return <MCQSkeleton />;
  }

  if (!isLoading && !questions.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-muted p-3">
          <HelpCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">No Questions Yet</h3>
          <p className="text-sm text-muted-foreground">
            We're preparing to generate multiple choice questions for your document.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const completedCount = questions.filter(q => q.completed).length;
  const progress = (completedCount / questions.length) * 100;

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setShowExplanation(true);
    if (!currentQuestion.completed) {
      markCompleted(currentQuestion.id);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const isCorrectAnswer = (optionId: string) => {
    const option = currentQuestion.options.find(opt => opt.id === optionId);
    return option?.isCorrect;
  };

  return (
    <div className="space-y-6 p-4">
      <Alert variant="default" className="bg-muted/50 border-none">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Select an answer to see the explanation
          </AlertDescription>
        </div>
      </Alert>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{completedCount} of {questions.length} completed</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="relative min-h-[500px] w-full">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute w-full"
          >
            <Card className={cn(
              "p-8 mb-16",
              "transition-colors hover:bg-muted/30",
              getBorderColorClass(currentQuestion.color)
            )}>
              {currentQuestion.completed && (
                <Badge 
                  variant="default" 
                  className="absolute top-4 right-4 bg-green-500/20 text-green-500 dark:bg-green-500/30 dark:text-green-400"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}

              <div className={cn(
                "mb-8 p-6 rounded-full w-fit mx-auto",
                getBackgroundColorClass(currentQuestion.color)
              )}>
                <span className="text-6xl">{currentQuestion.emoji}</span>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-medium leading-relaxed">
                  {currentQuestion.question}
                </h3>

                <RadioGroup
                  value={selectedOption || ""}
                  onValueChange={handleOptionSelect}
                  className="space-y-4"
                >
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrect = option.isCorrect;
                    let optionClassName = "p-4 rounded-lg transition-colors";
                    
                    if (isSelected) {
                      optionClassName += isCorrect 
                        ? " bg-green-500/20 dark:bg-green-500/30" 
                        : " bg-red-500/20 dark:bg-red-500/30";
                    } else if (selectedOption && isCorrect) {
                      optionClassName += " bg-green-500/20 dark:bg-green-500/30";
                    } else {
                      optionClassName += " hover:bg-muted";
                    }

                    return (
                      <div key={option.id} className={optionClassName}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={option.id}
                            id={option.id}
                            disabled={!!selectedOption}
                          />
                          <Label 
                            htmlFor={option.id}
                            className="flex-1 cursor-pointer"
                          >
                            {option.text}
                          </Label>
                          {isSelected && (
                            <CheckCircle2 
                              className={cn(
                                "h-4 w-4 ml-2",
                                isCorrect ? "text-green-500" : "text-red-500"
                              )} 
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>

                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-muted/50 rounded-lg"
                  >
                    <h4 className="font-medium mb-2">Explanation</h4>
                    <p className="text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-4 left-4 right-4 flex items-center justify-between bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
        <Button
          variant="outline"
          size="lg"
          onClick={previousQuestion}
          disabled={currentIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </Button>
        <span className="text-sm font-medium">
          {currentIndex + 1} of {questions.length}
        </span>
        <Button
          variant="outline"
          size="lg"
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function MCQSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-[50px] w-full" />
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-8 w-full" />
        
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  );
}

function getBorderColorClass(color: string) {
  const colors = {
    blue: 'border-2 border-blue-500/20 dark:border-blue-400/20',
    green: 'border-2 border-green-500/20 dark:border-green-400/20',
    orange: 'border-2 border-orange-500/20 dark:border-orange-400/20',
    purple: 'border-2 border-purple-500/20 dark:border-purple-400/20',
    pink: 'border-2 border-pink-500/20 dark:border-pink-400/20',
  };
  return colors[color as keyof typeof colors] || colors.blue;
}

function getBackgroundColorClass(color: string) {
  const colors = {
    blue: 'bg-blue-100/80 dark:bg-blue-900/20',
    green: 'bg-green-100/80 dark:bg-green-900/20',
    orange: 'bg-orange-100/80 dark:bg-orange-900/20',
    purple: 'bg-purple-100/80 dark:bg-purple-900/20',
    pink: 'bg-pink-100/80 dark:bg-pink-900/20',
  };
  return colors[color as keyof typeof colors] || colors.blue;
} 