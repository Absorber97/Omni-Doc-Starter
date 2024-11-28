'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import OpenAI from 'openai';
import { EmbeddingsStore } from '@/lib/embeddings-store';

interface ChatProps {
  pageNumber: number;
  url: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function Chat({ pageNumber, url }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Get relevant documents using similarity search
      const embeddingsStore = EmbeddingsStore.getInstance();
      const relevantDocs = await embeddingsStore.similaritySearch(userMessage, 3);
      const context = relevantDocs
        .map(doc => doc.content)
        .join('\n\n');

      // Generate response using OpenAI
      const response = await openai.chat.completions.create({
        model: pdfViewerConfig.features.chat.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant helping with a PDF document.
              Use the following context to answer questions.
              If you cannot answer based on the context, say so.
              Keep responses concise and relevant.`,
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${userMessage}`,
          },
        ],
        temperature: pdfViewerConfig.features.chat.temperature,
        max_tokens: pdfViewerConfig.features.chat.maxTokens,
      });

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.choices[0].message.content || 'No response generated.' },
      ]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <motion.div
                  className="flex space-x-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this page..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}