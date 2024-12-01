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
  documentContent: string;
  
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
  documentContent: '',

  initialize: async (pdfUrl: string) => {
    console.log('🚀 Initializing chat store...');
    try {
      set({ isLoading: true, hasError: false });
      
      // Skip if already initialized
      if (get().isInitialized) {
        console.log('✨ Chat store already initialized, using cached data');
        await get().generateSuggestions();
        return;
      }

      console.log('📑 Starting PDF content extraction...');
      const extractor = new PDFContentExtractor();
      await extractor.loadDocument(pdfUrl);
      const pageCount = await extractor.getPageCount();
      console.log(`📚 Found ${pageCount} pages to process`);

      let fullContent = '';
      // Process pages in batches
      for (let i = 0; i < pageCount; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, pageCount);
        console.log(`🔄 Processing batch: pages ${i + 1} to ${batchEnd}`);
        
        // Extract content for batch
        const batchPromises = Array.from(
          { length: batchEnd - i },
          (_, index) => extractor.getPageContent(i + index + 1)
        );
        const pageContents = await Promise.all(batchPromises);
        
        // Add to full content and generate embeddings
        for (let j = 0; j < pageContents.length; j++) {
          const pageNum = i + j + 1;
          const content = pageContents[j];
          fullContent += content + '\n\n';
          
          console.log(`🧮 Generating embedding for page ${pageNum}`);
          await get().embeddings.addDocument(content, {
            type: 'page',
            pageNumber: pageNum,
            source: pdfUrl
          });
        }
      }

      set({ documentContent: fullContent });
      console.log('✅ Content extraction and embedding complete');
      
      // Generate initial suggestions based on content
      console.log('🎯 Generating initial content-aware suggestions...');
      const completion = await openai.chat.completions.create({
        model: openAIConfig.model,
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `Generate 4 concise questions about this document. Each question should:
              - Be no longer than 100 characters
              - Start with a relevant emoji
              - Focus on key aspects of the document
              - Be specific yet brief
              Example format:
              🎓 What is the main goal of the program?
              💡 How does the system handle user feedback?`
          },
          {
            role: 'user',
            content: `Here's the document content:\n\n${fullContent.slice(0, 2000)}...\n\nGenerate 4 concise questions with emojis.`
          }
        ]
      });

      const suggestionsText = completion.choices[0].message.content || '';
      console.log('📝 Raw suggestions generated:', suggestionsText);
      
      const suggestions: Suggestion[] = suggestionsText
        .split('\n')
        .filter(text => text.trim())
        .slice(0, chatConfig.maxSuggestions)
        .map(text => ({
          id: crypto.randomUUID(),
          text: text.replace(/^\d+\.\s*/, '').trim()
        }));

      set({ suggestions, isInitialized: true });
      console.log(`✨ Generated ${suggestions.length} content-aware suggestions`);
      console.log('✅ Chat store initialization complete');
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

      // Perform RAG search with higher k for better context
      console.log('🔍 Performing similarity search...');
      const searchResults = await get().embeddings.similaritySearch(
        message,
        8, // Increased from 5 to 8 for better context
        chatConfig.similarityThreshold
      );

      console.log('📊 Search results:', searchResults.map(r => ({
        pageNumber: r.metadata.pageNumber,
        similarity: r.similarity.toFixed(3)
      })));

      // Sort and prepare context from search results
      const sortedResults = searchResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5); // Take top 5 most relevant

      // Group content by pages for better context
      const pageGroups = sortedResults.reduce((acc, result) => {
        const pageNum = result.metadata.pageNumber;
        if (!acc[pageNum]) {
          acc[pageNum] = [];
        }
        acc[pageNum].push(result.content.trim());
        return acc;
      }, {} as Record<number, string[]>);

      // Prepare context with grouped page content
      const context = Object.entries(pageGroups)
        .map(([pageNum, contents]) => 
          `[Page ${pageNum}]:\n${contents.join('\n')}`
        )
        .join('\n\n');

      console.log(`📚 Using content from pages: ${Object.keys(pageGroups).join(', ')}`);

      // Generate AI response with improved prompt
      console.log('🤖 Generating AI response...');
      const completion = await openai.chat.completions.create({
        model: openAIConfig.model,
        temperature: chatConfig.temperature,
        max_tokens: chatConfig.maxTokens,
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful and knowledgeable assistant analyzing a document. 
              Your responses should:
              - Start with a relevant emoji and bold title that summarizes the topic
              - Use proper markdown formatting:
                * Use ## for section headings
                * Use **bold** for emphasis
                * Use proper bullet points with -
                * Use > for important quotes
              - Only cite page numbers when explicitly provided in the context
              - If a piece of information doesn't have a page number, present it without citation
              - Be clear, accurate, and well-structured
              - Use sections for complex answers
              - Maintain a professional yet friendly tone
              
              Example format:
              🎓 **Program Effectiveness Analysis**

              ## Key Findings
              Our analysis reveals several important insights:

              ### Measured Improvements
              - Student engagement increased by 25% (Page 15)
              - Participation rates showed positive trends
              - Academic performance metrics demonstrated significant gains (Page 16)

              ### Implementation Details
              The program implementation included:
              - Structured workshop sessions
              - Regular assessment periods
              > "Continuous monitoring showed consistent improvement patterns" (Page 15)

              ### Additional Observations
              Several other factors contributed to success:
              - Strong community involvement
              - Dedicated mentorship programs (Page 17)` 
          },
          { 
            role: 'user', 
            content: `Context from document with page numbers:\n${context}\n\nUser question: ${message}\n\nProvide a well-structured response using proper markdown formatting. Start with an emoji and title. Only include page citations when explicitly provided in the context. For information without page numbers, present it without citation.` 
          }
        ]
      });

      const response = completion.choices[0].message.content || 'I apologize, but I could not generate a response.';
      
      // Ensure response has an emoji, add one if missing
      const hasEmoji = /[\p{Emoji}]/u.test(response.slice(0, 10));
      const finalResponse = hasEmoji ? response : '📚 ' + response;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: finalResponse,
        metadata: {
          confidence: Math.max(...sortedResults.map(r => r.similarity)),
          sources: sortedResults.map(r => ({
            content: r.content,
            pageNumber: r.metadata.pageNumber
          }))
        }
      };

      set(state => ({
        messages: [...state.messages, assistantMessage]
      }));

      // Generate new suggestions based on conversation
      console.log('🎯 Generating follow-up suggestions based on response');
      await get().generateSuggestions();
      
      console.log('✅ Reply and suggestions generated successfully');
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
      const { messages, isInitialized, documentContent } = get();
      
      // If not initialized, use initial suggestions
      if (!isInitialized) {
        console.log('⚠️ Store not initialized, using default suggestions');
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
      console.log('🎯 Generating contextual suggestions based on conversation');
      const completion = await openai.chat.completions.create({
        model: openAIConfig.model,
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `Generate 4 concise follow-up questions based on the conversation context and document content. Each question should:
              - Be no longer than 100 characters
              - Start with a relevant emoji
              - Be specific yet brief
              - Build on previous context
              Example format:
              🔍 What specific metrics are used to measure success?
              💫 How does this impact the overall workflow?`
          },
          { 
            role: 'user', 
            content: `Document content: ${documentContent.slice(0, 500)}...\n\nRecent conversation:\n${recentContext}\n\nGenerate 4 concise questions with emojis.` 
          }
        ]
      });

      const suggestionsText = completion.choices[0].message.content || '';
      console.log('📝 Raw suggestions generated:', suggestionsText);
      
      const suggestions: Suggestion[] = suggestionsText
        .split('\n')
        .filter(text => text.trim())
        .slice(0, chatConfig.maxSuggestions)
        .map(text => ({
          id: crypto.randomUUID(),
          text: text.replace(/^\d+\.\s*/, '').trim()
        }));

      set({ suggestions });
      console.log(`✨ Generated ${suggestions.length} new contextual suggestions`);
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