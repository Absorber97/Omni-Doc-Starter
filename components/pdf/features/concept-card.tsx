'use client';

import { motion } from 'framer-motion';
import { Star, Lightbulb, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Concept, ConceptType } from '@/lib/store/concepts-store';
import { pdfViewerConfig } from '@/config/pdf-viewer';

interface ConceptCardProps {
  concept: Concept;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hover: boolean) => void;
}

const conceptConfig = pdfViewerConfig.features.ai.features.concepts.types;

const conceptIcons: Record<ConceptType, typeof Star> = {
  'must-know': Star,
  'good-to-know': Lightbulb,
  'optional': Bookmark,
};

export function ConceptCard({ 
  concept, 
  isHighlighted,
  isSelected,
  onClick, 
  onHover 
}: ConceptCardProps) {
  const typeConfig = conceptConfig[concept.type];
  const Icon = conceptIcons[concept.type];

  return (
    <motion.div
      layoutId={concept.id}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
      onClick={onClick}
    >
      <Card 
        className={cn(
          "p-3 cursor-pointer transition-all",
          "hover:shadow-md hover:-translate-y-0.5",
          isHighlighted && "ring-2 ring-primary",
          isSelected && "bg-primary/5",
          typeConfig.color
        )}
      >
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed">{concept.text}</p>
            
            {/* Metadata section */}
            <div className="mt-2 space-y-2">
              {/* Keywords */}
              {concept.metadata?.keywords && (
                <div className="flex flex-wrap gap-1">
                  {concept.metadata.keywords.map((keyword) => (
                    <Badge 
                      key={keyword}
                      variant="secondary" 
                      className="text-xs"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Context preview */}
              {concept.location?.textSnippet && (
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{concept.location.textSnippet}"
                </p>
              )}

              {/* Page indicator */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  Page {concept.pageNumber}
                </Badge>
                {concept.metadata?.importance && (
                  <span className="text-xs">
                    Importance: {Math.round(concept.metadata.importance * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 