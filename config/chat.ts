export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    confidence?: number;
    sources?: string[];
  };
}

export interface Suggestion {
  id: string;
  text: string;
  category?: string;
}

export const chatConfig = {
  maxMessages: 50,
  maxSuggestions: 4,
  initialSuggestions: [
    "What are the main topics covered in this document?",
    "Can you summarize the key findings?",
    "What are the most important conclusions?",
    "Are there any notable recommendations?"
  ],
  systemPrompt: `You are a helpful and knowledgeable assistant analyzing a document. 
    - Always provide accurate, well-structured responses
    - Use relevant emojis to make responses engaging
    - Include citations when referencing specific parts
    - Maintain a professional yet friendly tone
    - Generate follow-up suggestions based on context`,
  temperature: 0.7,
  similarityThreshold: 0.75,
  maxTokens: 1000,
} as const; 