'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { Concepts } from './concepts';
import { Summary } from './summary';
import { Flashcards } from './flashcards';
import { Chat } from './chat';

interface AIFeaturesProps {
  url: string;
  currentPage: number;
  onPathChange: (path: string[]) => void;
}

export function AIFeatures({ url, currentPage, onPathChange }: AIFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const features = Object.entries(pdfViewerConfig.features.ai.features);

  const getFeatureColorClass = (color: string) => {
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
  };

  const handleFeatureClick = (featureKey: string) => {
    setActiveFeature(featureKey);
    setIsLoading(true);
    onPathChange(['AI Features', pdfViewerConfig.features.ai.features[featureKey].label]);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleBack = () => {
    setActiveFeature(null);
    onPathChange([]);
  };

  const renderFeatureContent = () => {
    if (!activeFeature) return null;

    const commonProps = {
      url,
      currentPage,
      isLoading,
      onBack: handleBack
    };

    switch (activeFeature) {
      case 'concepts':
        return <Concepts {...commonProps} />;
      case 'summary':
        return <Summary {...commonProps} />;
      case 'flashcards':
        return <Flashcards {...commonProps} />;
      case 'chat':
        return <Chat {...commonProps} />;
      default:
        return null;
    }
  };

  if (activeFeature) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pdfViewerConfig.ui.animations.variants.slideIn}
      >
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleBack}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Features
          </Button>
          {renderFeatureContent()}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pdfViewerConfig.ui.animations.variants.fadeIn}
      className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4"
    >
      {features.map(([key, feature]) => (
        <motion.div
          key={key}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={`${pdfViewerConfig.ui.components.card.interactive} cursor-pointer`}
            onClick={() => handleFeatureClick(key)}
          >
            <div className={pdfViewerConfig.ui.components.card.header}>
              <div className={`p-2 ${getFeatureColorClass(feature.color)} rounded-lg w-fit`}>
                <span className="text-2xl">{feature.emoji}</span>
              </div>
              <h3 className="font-medium">{feature.label}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
} 