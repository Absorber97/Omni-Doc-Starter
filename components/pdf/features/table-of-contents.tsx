'use client';

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ChevronRight, BookOpen, Hash, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { appConfig } from '@/config/app';
import { TOCItem } from '@/lib/types/pdf';

interface TableOfContentsProps {
  items: TOCItem[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

// Animation variants
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const childrenVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1 },
};

// Constants for text truncation
const TEXT_CONFIG = {
  maxWidth: 250, // Maximum width in pixels
  minChars: 20, // Minimum characters before truncation
  ellipsis: '…', // Using proper ellipsis character
  breakpoints: {
    title: 40,    // Characters for main titles
    subtitle: 60, // Characters for subtitles
    content: 80   // Characters for content
  }
} as const;

// Smart truncation helper functions
const truncateHelpers = {
  getVisibleWidth: (text: string, fontSize: number = 14): number => {
    // Approximate width calculation (14px average char width for given font size)
    return text.length * (fontSize * 0.6);
  },

  smartEllipsis: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + TEXT_CONFIG.ellipsis;
  },

  // Handle special cases like URLs, paths, and code snippets
  preserveSpecialContent: (text: string): boolean => {
    return /^(https?:\/\/|\/|\[|\{|\(|`|#)/.test(text);
  },

  // Smart truncate based on content type and metadata
  smartTruncate: (item: TOCItem): string => {
    const originalText = item.title.trim();
    
    // Don't truncate special content
    if (truncateHelpers.preserveSpecialContent(originalText)) {
      return originalText;
    }

    // Use metadata if available
    const fontSize = item.metadata?.fontSize;
    const maxLength = item.level === 0 
      ? TEXT_CONFIG.breakpoints.title 
      : item.level === 1 
        ? TEXT_CONFIG.breakpoints.subtitle 
        : TEXT_CONFIG.breakpoints.content;

    // Handle different text patterns
    if (originalText.includes(':')) {
      const [prefix, ...rest] = originalText.split(':');
      const suffix = rest.join(':').trim();
      
      if (prefix.length > maxLength * 0.4) {
        return truncateHelpers.smartEllipsis(prefix, maxLength);
      }
      
      const remainingLength = maxLength - prefix.length - 2;
      return `${prefix}: ${truncateHelpers.smartEllipsis(suffix, remainingLength)}`;
    }
    
    if (originalText.includes(' - ')) {
      const [prefix, ...rest] = originalText.split(' - ');
      const suffix = rest.join(' - ').trim();
      
      if (prefix.length > maxLength * 0.4) {
        return truncateHelpers.smartEllipsis(prefix, maxLength);
      }
      
      const remainingLength = maxLength - prefix.length - 3;
      return `${prefix} - ${truncateHelpers.smartEllipsis(suffix, remainingLength)}`;
    }
    
    if (originalText.includes('/')) {
      const parts = originalText.split('/');
      if (parts.length > 2) {
        const first = parts[0];
        const last = parts[parts.length - 1];
        if (first.length + last.length + 5 > maxLength) {
          return truncateHelpers.smartEllipsis(originalText, maxLength);
        }
        return `${first}/.../${last}`;
      }
    }

    return truncateHelpers.smartEllipsis(originalText, maxLength);
  }
};

export function TableOfContents({ items, currentPage, onPageChange }: TableOfContentsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsLoading(false);
    if (items.length > 0) {
      const allItemTitles = new Set<string>();
      const collectTitles = (items: TOCItem[]) => {
        items.forEach(item => {
          allItemTitles.add(item.title);
          if (item.children) {
            collectTitles(item.children);
          }
        });
      };
      collectTitles(items);
      setExpandedItems(allItemTitles);
    }
  }, [items]);

  const toggleItem = (title: string) => {
    const newExpanded = new Set(expandedItems);
    if (expandedItems.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedItems(newExpanded);
  };

  const renderItem = (item: TOCItem, index: number) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const isCurrentPage = item.pageNumber === currentPage;
    const truncatedTitle = truncateHelpers.smartTruncate(item);

    return (
      <motion.div
        key={`${item.title}-${index}`}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: index * 0.05 }}
        className={cn(
          "relative",
          item.level > 0 && "ml-4 mt-1"
        )}
      >
        <div 
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors group",
            "hover:bg-muted/50 cursor-pointer",
            isCurrentPage && "bg-muted"
          )}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleItem(item.title)}
              className="p-0.5 hover:bg-muted rounded"
            >
              <ChevronRight 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          ) : (
            <span className="w-5" />
          )}
          
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[250px]" onClick={() => onPageChange(item.pageNumber)}>
            {item.level === 0 ? (
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Hash className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
            )}
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "truncate text-sm leading-relaxed",
                    item.level === 0 && "font-medium",
                    isCurrentPage && "text-primary"
                  )}>
                    {truncatedTitle}
                  </span>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className="max-w-[350px] break-words"
                >
                  <div className="flex flex-col gap-1.5 py-1">
                    <p className="text-sm font-medium leading-relaxed">
                      {item.metadata?.originalText || item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Page {item.pageNumber}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className={cn(
              "text-xs text-muted-foreground shrink-0",
              isCurrentPage && "text-primary"
            )}>
              {item.pageNumber}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <motion.div
            variants={childrenVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="border-l border-border/50 ml-2.5 mt-1"
          >
            {item.children!.map((child, idx) => renderItem(child, idx))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-1">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm mt-4">Generating table of contents...</p>
        </div>
      ) : items && items.length > 0 ? (
        items.map((item, index) => renderItem(item, index))
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BookOpen className="h-8 w-8 mb-2 animate-pulse" />
          <p className="text-sm font-medium">No table of contents available</p>
          <p className="text-xs mt-1">This document doesn't contain any headings</p>
          <p className="text-xs mt-4 max-w-[240px] text-center opacity-60">
            Try using the thumbnails or page controls to navigate through the document
          </p>
        </div>
      )}
    </div>
  );
} 