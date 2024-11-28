'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';

interface FlashcardsProps {
  url: string;
  currentPage: number;
  isLoading: boolean;
  onBack: () => void;
}

export function Flashcards({ url, currentPage, isLoading }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcards, setFlashcards] = useState<Array<{
    question: string;
    answer: string;
  }>>([]);

  useEffect(() => {
    async function processFlashcards() {
      try {
        // Here you would process the PDF and generate flashcards
        // For now, we'll use dummy data
        setFlashcards([
          {
            question: "What is the main purpose of this document?",
            answer: "To provide information about key concepts and features."
          },
          {
            question: "What are the key features discussed?",
            answer: "Navigation, AI features, and document processing capabilities."
          },
          {
            question: "How does the system handle PDF processing?",
            answer: "Through advanced AI algorithms and text extraction methods."
          }
        ]);
      } catch (error) {
        console.error('Error processing flashcards:', error);
      }
    }

    processFlashcards();
  }, [url, currentPage]);

  if (isLoading) {
    return (
      <Card className="p-6 h-[200px]">
        <motion.div
          className="h-full flex flex-col justify-center space-y-4"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <motion.div className="h-4 bg-muted rounded w-3/4 mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      </Card>
    );
  }

  if (!flashcards.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No flashcards available
        </div>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const previousCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="space-y-4">
      <motion.div
        className="relative h-[200px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          key={`${currentIndex}-${isFlipped}`}
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <Card 
            className="h-full p-6 flex flex-col justify-center items-center text-center transition-shadow hover:shadow-lg cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="mb-4">
              <div className={`p-2 ${getFeatureColorClass(pdfViewerConfig.features.ai.features.flashcards.color)} rounded-lg inline-block`}>
                <span className="text-2xl">{pdfViewerConfig.features.ai.features.flashcards.emoji}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>
            <motion.div
              className="absolute bottom-2 right-2"
              animate={{ rotate: isFlipped ? 180 : 0 }}
            >
              <RotateCw className="h-4 w-4 text-muted-foreground/50" />
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={previousCard}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {flashcards.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={nextCard}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getFeatureColorClass(color: string) {
  switch (color) {
    case 'blue':
      return 'bg-blue-100 dark:bg-blue-900/20';
    case 'green':
      return 'bg-green-100 dark:bg-green-900/20';
    case 'orange':
      return 'bg-orange-100 dark:bg-orange-900/20';
    case 'purple':
      return 'bg-purple-100 dark:bg-purple-900/20';
    default:
      return 'bg-gray-100 dark:bg-gray-900/20';
  }
} 