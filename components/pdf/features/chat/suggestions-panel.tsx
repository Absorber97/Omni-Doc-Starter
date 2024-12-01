'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { useChatStore } from '@/lib/store/chat-store';
import { cn } from '@/lib/utils';

interface SuggestionsPanelProps {
  className?: string;
}

export function SuggestionsPanel({ className }: SuggestionsPanelProps) {
  const { suggestions, generateReply } = useChatStore();

  if (!suggestions.length) return null;

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-medium">Suggested Questions</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto whitespace-normal"
                onClick={() => generateReply(suggestion.text)}
              >
                {suggestion.text}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
} 