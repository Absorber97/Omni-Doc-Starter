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
        'flex gap-4 mb-6 last:mb-0',
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      <Avatar className="w-10 h-10 mt-1 shrink-0">
        <AvatarFallback className="bg-primary/10">
          {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex-1 px-6 py-4 rounded-lg',
          isAssistant
            ? 'bg-secondary/50'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <ReactMarkdown
          className={cn(
            "text-base prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none",
            "prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0",
            "prose-p:mb-3 prose-p:last:mb-0",
            "prose-ul:my-3 prose-li:my-1",
            "prose-strong:font-semibold",
            "prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-muted",
          )}
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="my-3 list-disc pl-4">{children}</ul>,
            li: ({ children }) => <li className="my-1">{children}</li>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 mt-6 first:mt-0">{children}</h2>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            code: ({ children }) => <code className="px-1 py-0.5 rounded-md bg-muted">{children}</code>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
} 