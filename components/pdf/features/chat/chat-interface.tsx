'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useChatStore } from '@/lib/store/chat-store';
import { MessageItem } from './message-item';
import { ChatInput } from './chat-input';
import { SuggestionsPanel } from './suggestions-panel';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Suggestions Skeleton */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full" />
          ))}
        </div>
      </Card>

      {/* Chat Messages Skeleton */}
      <div className="flex-1 overflow-hidden rounded-lg bg-card">
        <div className="h-[500px] px-6 py-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 mb-6">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-24 w-full mb-2" />
                <Skeleton className="h-24 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-[60px]" />
        <Skeleton className="h-[60px] w-[60px]" />
      </div>
    </div>
  );
}

export function ChatInterface() {
  const {
    messages,
    isLoading,
    hasError,
    errorMessage,
    generateReply,
    isInitialized,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  if (!isInitialized) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full gap-6 p-6"
      >
        <LoadingSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full gap-6 p-6"
    >
      {/* Suggestions Panel */}
      <SuggestionsPanel className="flex-none" />

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden rounded-lg bg-card">
        <ScrollArea ref={scrollRef} className="h-[500px] px-6">
          <div className="py-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-4"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {hasError && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <div className="flex-none">
        <ChatInput
          onSubmit={generateReply}
          isLoading={isLoading}
        />
      </div>
    </motion.div>
  );
} 