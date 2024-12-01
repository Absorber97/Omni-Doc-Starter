'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatMessage } from '@/config/chat';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'flex gap-3 mb-4',
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      <Avatar className="w-8 h-8">
        <AvatarFallback>
          {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex-1 px-4 py-2 rounded-lg',
          isAssistant
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {isAssistant && message.metadata?.confidence && (
          <div className="mt-1 text-xs opacity-50">
            Confidence: {Math.round(message.metadata.confidence * 100)}%
          </div>
        )}
      </div>
    </motion.div>
  );
} 