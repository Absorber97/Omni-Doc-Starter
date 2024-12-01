'use client';

import { motion } from 'framer-motion';
import { Star, Lightbulb, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Concept, ConceptType } from '@/lib/store/concepts-store';

interface ConceptCardProps {
  concept: Concept;
}

const typeConfig: Record<ConceptType, { 
  icon: typeof Star; 
  label: string;
  color: string;
  badgeVariant: "default" | "destructive" | "secondary" | "outline" 
}> = {
  'must-know': { 
    icon: Star, 
    label: 'Must Know',
    color: 'bg-card hover:bg-card/80 border-2 border-red-500/20', 
    badgeVariant: "destructive"
  },
  'good-to-know': { 
    icon: Lightbulb, 
    label: 'Good to Know',
    color: 'bg-card hover:bg-card/80 border-2 border-yellow-500/20',
    badgeVariant: "default"
  },
  'optional': { 
    icon: Bookmark, 
    label: 'Optional',
    color: 'bg-card hover:bg-card/80 border-2 border-blue-500/20',
    badgeVariant: "secondary"
  }
};

export function ConceptCard({ concept }: ConceptCardProps) {
  const { icon: Icon, label, color, badgeVariant } = typeConfig[concept.type];

  return (
    <Card className={cn("p-6 transition-colors", color)}>
      <div className="flex flex-col gap-4">
        {/* Title with emoji */}
        <div className="flex items-start gap-3">
          <h3 className="text-xl font-medium">
            {concept.emoji} {concept.title}
          </h3>
        </div>
        
        {/* Content */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {concept.content}
        </p>
        
        {/* Footer: Tags, Type and Page */}
        <div className="flex flex-col gap-3">
          {/* Tags */}
          {concept.tags && concept.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {concept.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Type and Page badges */}
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant} className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              <span>{label}</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className="text-xs font-normal text-muted-foreground"
            >
              Page {concept.pageNumber}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
} 