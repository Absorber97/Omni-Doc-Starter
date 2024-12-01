'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useChatStore } from '@/lib/store/chat-store';
import { ChatInterface } from './chat/chat-interface';

interface ChatProps {
  url: string;
}

export function Chat({ url }: ChatProps) {
  const { initialize, isLoading, isInitialized } = useChatStore();

  // Initialize chat store when component mounts
  useEffect(() => {
    console.log('🎯 Chat feature mounted');
    initialize(url);
  }, [initialize, url]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      <Card className="flex-1 p-4 flex flex-col">
        {!isInitialized && isLoading ? (
          <motion.div 
            className="flex flex-col items-center justify-center h-full gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Preparing chat feature...
            </p>
          </motion.div>
        ) : (
          <ChatInterface />
        )}
      </Card>
    </motion.div>
  );
}