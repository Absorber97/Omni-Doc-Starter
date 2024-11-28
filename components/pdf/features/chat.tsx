'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';

interface ChatProps {
  url: string;
  currentPage: number;
  isLoading: boolean;
  onBack: () => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function Chat({ url, currentPage, isLoading }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatConfig = pdfViewerConfig.features.ai.features.chat;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "I'm a simulated AI response. In a real implementation, I would analyze the PDF content and provide relevant answers to your questions."
          }
        ]);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error processing chat:', error);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-4 bg-muted rounded"
              style={{ width: `${85 + Math.random() * 15}%` }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </motion.div>
          ))}
        </motion.div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea ref={scrollRef} className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : getFeatureColorClass(chatConfig.color)
                } rounded-lg p-3`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <MessageSquare className="h-4 w-4 mt-1 shrink-0" />
                  )}
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className={`max-w-[80%] ${getFeatureColorClass(chatConfig.color)} rounded-lg p-3`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <div className="w-1 h-1 rounded-full bg-foreground" />
                    <div className="w-1 h-1 rounded-full bg-foreground" />
                    <div className="w-1 h-1 rounded-full bg-foreground" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the document..."
          className="min-h-[80px]"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function getFeatureColorClass(color: string) {
  switch (color) {
    case 'blue':
      return 'bg-blue-100 dark:bg-blue-900/20';
    case 'green':
      return 'bg-green-100 dark:bg-green-900/20';
    case 'orange':
      return 'bg-orange-100 dark:bg-orange-900/20';
    case 'purple':
      return 'bg-purple-100 dark:bg-purple-900/20';
    default:
      return 'bg-gray-100 dark:bg-gray-900/20';
  }
}