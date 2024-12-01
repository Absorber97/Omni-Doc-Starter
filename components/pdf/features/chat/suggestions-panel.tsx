'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { useChatStore } from '@/lib/store/chat-store';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SuggestionsPanelProps {
  className?: string;
}

export function SuggestionsPanel({ className }: SuggestionsPanelProps) {
  const { suggestions, generateReply } = useChatStore();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!suggestions.length) return null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 h-auto hover:bg-secondary/50"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-base font-medium">Suggested Questions</h3>
        </div>
        <ChevronDown 
          className={cn(
            "w-5 h-5 transition-transform duration-200",
            isExpanded ? "transform rotate-180" : ""
          )} 
        />
      </Button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Button
                        variant="secondary"
                        className="w-full justify-start text-left h-auto p-4 whitespace-normal font-normal text-base hover:bg-secondary/80"
                        onClick={() => generateReply(suggestion.text)}
                      >
                        {suggestion.text}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
} 