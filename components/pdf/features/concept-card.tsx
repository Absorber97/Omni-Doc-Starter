'use client';

import { motion } from 'framer-motion';
import { Brain, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { type Concept } from '@/lib/store/concepts-store';

interface ConceptCardProps {
  concept: Concept;
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const importance = concept.metadata?.importance || 0;
  const depthEmoji = getDepthEmoji(concept.depthLevel);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {depthEmoji}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium leading-none">
                {toSentenceCase(concept.text)}
              </h3>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star
                  className="h-3.5 w-3.5"
                  fill={importance > 0.7 ? "currentColor" : "none"}
                />
                <span className="text-xs">
                  {Math.round(importance * 100)}%
                </span>
              </div>
            </div>

            {concept.location.textSnippet && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {concept.location.textSnippet}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function getDepthEmoji(level: number) {
  switch (level) {
    case 1:
      return "🎯";
    case 2:
      return "💡";
    case 3:
      return "🔍";
    default:
      return "📝";
  }
}

function toSentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
} 