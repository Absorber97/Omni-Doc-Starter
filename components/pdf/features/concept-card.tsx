'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Concept } from '@/types/pdf';

const conceptTypeEmojis = {
  'must-know': '🎯',
  'good-to-know': '💡',
  'optional': '📌'
} as const;

interface ConceptCardProps {
  concept: Concept;
  isHighlighted?: boolean;
}

export function ConceptCard({ concept, isHighlighted }: ConceptCardProps) {
  const { text, type, pageNumber } = concept;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "p-4 space-y-2 bg-card hover:shadow-md transition-all",
        "border-l-4",
        {
          'border-l-primary': type === 'must-know',
          'border-l-blue-400': type === 'good-to-know',
          'border-l-gray-400': type === 'optional',
          'ring-2 ring-primary ring-offset-2': isHighlighted
        }
      )}>
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="text-xs">
            {conceptTypeEmojis[type]} Page {pageNumber}
          </Badge>
        </div>
        
        <p className="text-sm leading-relaxed">
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </p>
      </Card>
    </motion.div>
  );
} 