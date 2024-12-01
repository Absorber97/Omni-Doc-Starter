'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Info,
  Sparkles,
  ArrowLeftRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlashcardsStore } from '@/lib/store/flashcards-store';
import { Skeleton } from '@/components/ui/skeleton';

interface FlashcardsProps {
  url: string;
  currentPage: number;
  isLoading: boolean;
  onBack: () => void;
}

const cardVariants = {
  initial: (direction: number) => ({
    scale: 0.8,
    opacity: 0,
    x: direction > 0 ? 200 : -200,
    rotateY: 0
  }),
  animate: {
    scale: 1,
    opacity: 1,
    x: 0,
    rotateY: 0,
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

const flipVariants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export function Flashcards({ url, currentPage, isLoading: parentLoading }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const { flashcards, generateFlashcards, markCompleted, isLoading } = useFlashcardsStore();
  const [showFlipHint, setShowFlipHint] = useState(true);

  useEffect(() => {
    generateFlashcards(url);
  }, [url, generateFlashcards]);

  if (isLoading || parentLoading) {
    return <FlashcardsSkeleton />;
  }

  if (!isLoading && !flashcards.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-muted p-3">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">No Flashcards Yet</h3>
          <p className="text-sm text-muted-foreground">
            We're preparing to generate flashcards for your document.
          </p>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const completedCount = flashcards.filter(card => card.completed).length;
  const progress = (completedCount / flashcards.length) * 100;

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
      setShowFlipHint(false);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
      setShowFlipHint(false);
    }
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
    setShowFlipHint(false);
    if (!isFlipped && !currentCard.completed) {
      markCompleted(currentCard.id);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Alert variant="default" className="bg-muted/50 border-none">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          <AlertDescription className="flex-1">
            Click or tap the card to flip between question and answer
          </AlertDescription>
          {showFlipHint && (
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          )}
        </div>
      </Alert>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{completedCount} of {flashcards.length} completed</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="relative min-h-[500px] w-full flex items-center justify-center perspective-1000">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute w-[320px] h-[480px]"
          >
            <motion.div
              className="w-full h-full preserve-3d cursor-pointer"
              animate={isFlipped ? "back" : "front"}
              variants={flipVariants}
              onClick={handleCardClick}
            >
              {/* Front of card (Question) */}
              <Card 
                className={cn(
                  "absolute w-full h-full p-8 flex flex-col items-center justify-center text-center backface-hidden",
                  "transition-colors hover:bg-muted/30",
                  getBorderColorClass(currentCard.color)
                )}
              >
                {currentCard.completed && (
                  <Badge 
                    variant="default" 
                    className="absolute top-4 right-4 bg-green-500/20 text-green-500 dark:bg-green-500/30 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                <div className={cn(
                  "mb-8 p-6 rounded-full",
                  getBackgroundColorClass(currentCard.color)
                )}>
                  <span className="text-6xl">{currentCard.emoji}</span>
                </div>
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Question
                  </div>
                  <p className="text-xl font-medium leading-relaxed">
                    {currentCard.question}
                  </p>
                </div>
                <motion.div
                  className="absolute bottom-6 right-6"
                  animate={{ rotate: isFlipped ? 180 : 0 }}
                >
                  <RotateCw className="h-5 w-5 text-muted-foreground/50" />
                </motion.div>
              </Card>

              {/* Back of card (Answer) */}
              <Card 
                className={cn(
                  "absolute w-full h-full p-8 flex flex-col items-center justify-center text-center backface-hidden rotateY-180",
                  "transition-colors hover:bg-muted/30",
                  getBorderColorClass(currentCard.color)
                )}
              >
                {currentCard.completed && (
                  <Badge 
                    variant="default" 
                    className="absolute top-4 right-4 bg-green-500/20 text-green-500 dark:bg-green-500/30 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                <div className={cn(
                  "mb-8 p-6 rounded-full",
                  getBackgroundColorClass(currentCard.color)
                )}>
                  <span className="text-6xl">{currentCard.emoji}</span>
                </div>
                <div className="space-y-4">
                  <div className="text-sm font-medium text-primary uppercase tracking-wide">
                    Answer
                  </div>
                  <p className="text-lg leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>
                <motion.div
                  className="absolute bottom-6 right-6"
                  animate={{ rotate: isFlipped ? 180 : 0 }}
                >
                  <RotateCw className="h-5 w-5 text-muted-foreground/50" />
                </motion.div>
              </Card>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={previousCard}
          disabled={currentIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </Button>
        <span className="text-sm font-medium">
          {currentIndex + 1} of {flashcards.length}
        </span>
        <Button
          variant="outline"
          size="lg"
          onClick={nextCard}
          disabled={currentIndex === flashcards.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function FlashcardsSkeleton() {
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

      <div className="flex justify-center py-8">
        <div className="relative w-[320px] h-[480px]">
          <Skeleton className="absolute inset-0 rounded-xl animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-6 p-8">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
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