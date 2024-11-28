'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Star, Lightbulb, Bookmark } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';

interface ConceptsProps {
  concepts: Array<{
    text: string;
    type: 'must-know' | 'good-to-know' | 'optional';
  }>;
  isLoading: boolean;
}

export function Concepts({ concepts, isLoading }: ConceptsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'must-know':
        return <Star className="h-4 w-4" />;
      case 'good-to-know':
        return <Lightbulb className="h-4 w-4" />;
      case 'optional':
        return <Bookmark className="h-4 w-4" />;
      default:
        return null;
    }
  };

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
        const config = pdfViewerConfig.features.concepts.types[concept.type];
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