'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Concept } from '@/lib/store/concepts-store';
import { 
  getImportanceLevel, 
  getImportanceColor,
  importanceLevelConfig,
  type ImportanceLevel 
} from '@/lib/utils/concepts';

interface ConceptCardProps {
  concept: Concept;
  onSelect?: (pageNumber: number) => void;
}

export function ConceptCard({ concept, onSelect }: ConceptCardProps) {
  const importance = concept.metadata?.importance || 0;
  const importanceLevel = getImportanceLevel(importance);
  const importanceColor = getImportanceColor(importance);
  const tags = concept.metadata?.tags || [];
  const emoji = concept.metadata?.emoji || '💡';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card 
        className="p-8 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onSelect?.(concept.pageNumber)}
      >
        {/* Title Section */}
        <div className="flex items-start gap-4 mb-6">
          <span className="text-3xl" role="img" aria-label="concept emoji">
            {emoji}
          </span>
          <h3 className="text-2xl font-semibold flex-1 leading-tight">
            {concept.text}
          </h3>
        </div>

        {/* Badges Section */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Priority Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-2 px-3 py-1 border-2",
              `border-[${importanceColor}]/50`
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              `bg-[${importanceColor}]`
            )} />
            {importanceLevelConfig[importanceLevel].label}
          </Badge>

          {/* Page Badge */}
          <Badge 
            variant="secondary" 
            className="flex items-center gap-2 px-3 py-1"
          >
            <ScrollText className="w-3.5 h-3.5" />
            Page {concept.pageNumber}
          </Badge>
        </div>

        {/* Content Section */}
        <p className="text-muted-foreground mb-6 text-base leading-relaxed">
          {concept.location.textSnippet}
        </p>

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md flex items-center gap-1.5"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
} 