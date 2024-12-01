import { create } from 'zustand';
import { ChatMessage, Suggestion, chatConfig } from '@/config/chat';
import { EmbeddingsStore } from '@/lib/embeddings-store';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';
import OpenAI from 'openai';
import { openAIClientConfig, openAIConfig } from '@/config/openai';

const openai = new OpenAI(openAIClientConfig);
const BATCH_SIZE = 5; // Number of pages to process at once

interface ChatStore {
  messages: ChatMessage[];
  suggestions: Suggestion[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  embeddings: EmbeddingsStore;
  isInitialized: boolean;
  
  // Actions
  initialize: (pdfUrl: string) => Promise<void>;
  generateReply: (message: string) => Promise<void>;
  generateSuggestions: () => Promise<void>;
  clearMessages: () => void;
  setError: (message: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  suggestions: [],
  isLoading: false,
  hasError: false,
  errorMessage: null,
  embeddings: EmbeddingsStore.getInstance(),
  isInitialized: false,

  initialize: async (pdfUrl: string) => {
    console.log('🚀 Initializing chat store...');
    try {
      set({ isLoading: true, hasError: false });
      
      // Skip if already initialized
      if (get().isInitialized) {
        console.log('✨ Chat store already initialized');
        await get().generateSuggestions();
        return;
      }

      console.log('📑 Extracting PDF content...');
      const extractor = new PDFContentExtractor();
      await extractor.loadDocument(pdfUrl);
      const pageCount = await extractor.getPageCount();
      console.log(`📚 Found ${pageCount} pages`);

      // Process pages in batches
      for (let i = 0; i < pageCount; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, pageCount);
        console.log(`🔄 Processing pages ${i + 1} to ${batchEnd}`);
        
        // Extract content for batch
        const batchPromises = Array.from(
          { length: batchEnd - i },
          (_, index) => extractor.getPageContent(i + index + 1)
        );
        const pageContents = await Promise.all(batchPromises);
        
        // Generate embeddings for batch
        console.log(`🧮 Generating embeddings for pages ${i + 1} to ${batchEnd}`);
        for (let j = 0; j < pageContents.length; j++) {
          const pageNum = i + j + 1;
          await get().embeddings.addDocument(pageContents[j], {
            type: 'page',
            pageNumber: pageNum,
            source: pdfUrl
          });
        }
      }

      console.log('✅ Content extraction and embedding complete');
      
      // Generate initial suggestions
      await get().generateSuggestions();
      
      set({ isInitialized: true });
      console.log('✅ Chat store initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing chat store:', error);
      set({ hasError: true, errorMessage: 'Failed to initialize chat' });
    } finally {
      set({ isLoading: false });
    }
  },

  generateReply: async (message: string) => {
    console.log('💬 Generating reply for:', message);
    try {
      set({ isLoading: true, hasError: false });
      
      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message
      };
      
      set(state => ({
        messages: [...state.messages, userMessage]
      }));

      // Perform RAG search
      console.log('🔍 Performing similarity search...');
      const searchResults = await get().embeddings.similaritySearch(
        message,
        5,
        chatConfig.similarityThreshold
      );

      // Prepare context from search results
      const context = searchResults
        .map(result => `Content from page ${result.metadata.pageNumber}:\n"${result.content}"\nConfidence: ${result.similarity}`)
        .join('\n\n');

      console.log(`📚 Found ${searchResults.length} relevant passages`);

      // Generate AI response
      console.log('🤖 Generating AI response...');
      const completion = await openai.chat.completions.create({
        model: openAIConfig.model,
        temperature: chatConfig.temperature,
        max_tokens: chatConfig.maxTokens,
        messages: [
          { role: 'system', content: chatConfig.systemPrompt },
          { role: 'user', content: `Context from document:\n${context}\n\nUser question: ${message}` }
        ]
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: completion.choices[0].message.content || 'I apologize, but I could not generate a response.',
        metadata: {
          confidence: Math.max(...searchResults.map(r => r.similarity)),
          sources: searchResults.map(r => ({
            content: r.content,
            pageNumber: r.metadata.pageNumber
          }))
        }
      };

      set(state => ({
        messages: [...state.messages, assistantMessage]
      }));

      // Generate new suggestions based on conversation
      await get().generateSuggestions();
      
      console.log('✅ Reply generated successfully');
    } catch (error) {
      console.error('❌ Error generating reply:', error);
      set({ hasError: true, errorMessage: 'Failed to generate reply' });
    } finally {
      set({ isLoading: false });
    }
  },

  generateSuggestions: async () => {
    console.log('💡 Generating suggestions...');
    try {
      const { messages, embeddings, isInitialized } = get();
      
      // If not initialized or no messages, use initial suggestions
      if (!isInitialized || messages.length === 0) {
        console.log('📝 Using initial suggestions');
        set({
          suggestions: chatConfig.initialSuggestions.map(text => ({
            id: crypto.randomUUID(),
            text
          }))
        });
        return;
      }

      // Get recent context
      const recentContext = messages.slice(-2).map(m => m.content).join('\n');
      
      // Generate contextual suggestions
      console.log('🎯 Generating contextual suggestions');
      const completion = await openai.chat.completions.create({
        model: openAIConfig.model,
        temperature: 0.8,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'Generate 4 relevant follow-up questions based on the conversation context. Make them specific and insightful.'
          },
          { role: 'user', content: recentContext }
        ]
      });

      const suggestionsText = completion.choices[0].message.content || '';
      const suggestions: Suggestion[] = suggestionsText
        .split('\n')
        .filter(text => text.trim())
        .slice(0, chatConfig.maxSuggestions)
        .map(text => ({
          id: crypto.randomUUID(),
          text: text.replace(/^\d+\.\s*/, '').trim()
        }));

      set({ suggestions });
      console.log(`✨ Generated ${suggestions.length} new suggestions`);
    } catch (error) {
      console.error('❌ Error generating suggestions:', error);
      // Don't set error state as this is not critical
    }
  },

  clearMessages: () => {
    console.log('🧹 Clearing chat messages');
    set({ messages: [] });
  },

  setError: (message: string | null) => {
    set({ hasError: !!message, errorMessage: message });
  }
}));