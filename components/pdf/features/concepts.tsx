'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Star, Lightbulb, Bookmark } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { useState, useEffect } from 'react';

interface ConceptsProps {
  url: string;
  currentPage: number;
  isLoading: boolean;
}

export function Concepts({ url, currentPage, isLoading }: ConceptsProps) {
  const conceptsConfig = pdfViewerConfig.features.ai.features.concepts;
  const [concepts, setConcepts] = useState<Array<{
    text: string;
    type: 'must-know' | 'good-to-know' | 'optional';
  }>>([]);

  useEffect(() => {
    async function processConcepts() {
      try {
        // Here you would process the PDF and extract concepts
        // For now, we'll use dummy data
        setConcepts([
          {
            text: "This is a must-know concept",
            type: "must-know"
          },
          {
            text: "This is good to know",
            type: "good-to-know"
          },
          {
            text: "This is optional information",
            type: "optional"
          }
        ]);
      } catch (error) {
        console.error('Error processing concepts:', error);
      }
    }

    processConcepts();
  }, [url, currentPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <motion.div
              className="h-6 bg-muted rounded"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </motion.div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {concepts.map((concept, index) => {
        const config = conceptsConfig.types[concept.type];
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 transition-all hover:shadow-md">
              <div className="flex items-start gap-3">
                <Badge variant={config.variant} className="mt-1">
                  <span className="mr-1">{config.emoji}</span>
                  {config.label}
                </Badge>
                <p className="flex-1 text-sm text-muted-foreground">{concept.text}</p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
} 