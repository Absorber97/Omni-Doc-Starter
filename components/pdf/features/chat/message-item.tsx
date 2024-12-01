'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatMessage } from '@/config/chat';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
        <ReactMarkdown
          className="text-sm prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none"
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
} 