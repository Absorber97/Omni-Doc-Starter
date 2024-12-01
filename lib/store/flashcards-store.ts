import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAI } from 'openai';
import { openAIConfig, openAIClientConfig } from '@/config/openai';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  emoji: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
  completed: boolean;
  pageNumber: number;
}

interface FlashcardsState {
  flashcards: Flashcard[];
  isLoading: boolean;
  error: string | null;
  setFlashcards: (flashcards: Flashcard[]) => void;
  generateFlashcards: (url: string) => Promise<void>;
  markCompleted: (id: string) => void;
  reset: () => void;
}

const initialState = {
  flashcards: [],
  isLoading: false,
  error: null,
};

const colors: Flashcard['color'][] = ['blue', 'green', 'orange', 'purple', 'pink'];

export const useFlashcardsStore = create<FlashcardsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFlashcards: (flashcards) => {
        console.log('📝 Setting flashcards:', flashcards.length);
        set({ flashcards, isLoading: false, error: null });
      },

      generateFlashcards: async (url) => {
        const state = get();
        if (state.flashcards.length > 0) {
          console.log('📚 Reusing existing flashcards');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Extract content from all pages
          const extractor = new PDFContentExtractor();
          await extractor.loadDocument(url);
          
          // Get total pages
          const pageCount = await extractor.getPageCount();
          console.log(`📄 Processing ${pageCount} pages for flashcards`);

          // Extract content from all pages
          let allContent = '';
          for (let page = 1; page <= pageCount; page++) {
            const pageContent = await extractor.getPageContent(page);
            allContent += pageContent + '\n\n';
          }

          // Generate flashcards using OpenAI
          const openai = new OpenAI(openAIClientConfig);
          const response = await openai.chat.completions.create({
            model: openAIConfig.model,
            messages: [
              {
                role: 'system',
                content: `You are a helpful AI that creates educational flashcards. Create 15 flashcards from the given text.
                For each flashcard:
                1. Create a clear, concise question that tests understanding
                2. Provide a comprehensive but focused answer
                3. Choose a relevant emoji that matches the content
                4. Assign a color from: blue, green, orange, purple, pink
                5. Assign a page number where this concept is most relevant (between 1 and ${pageCount})

                Format as JSON: { "flashcards": [{ "question", "answer", "emoji", "color", "pageNumber" }] }`
              },
              {
                role: 'user',
                content: allContent
              }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          });

          const generatedCards = JSON.parse(response.choices[0].message.content || '{"flashcards": []}');
          const flashcards: Flashcard[] = generatedCards.flashcards.map((card: any, index: number) => ({
            id: `card-${index}`,
            question: card.question,
            answer: card.answer,
            emoji: card.emoji,
            color: card.color,
            completed: false,
            pageNumber: card.pageNumber || Math.floor(Math.random() * pageCount) + 1 // Fallback random page if not provided
          }));

          set({ flashcards, isLoading: false, error: null });
          await extractor.cleanup();
        } catch (error) {
          console.error('Error generating flashcards:', error);
          set({ error: 'Failed to generate flashcards', isLoading: false });
        }
      },

      markCompleted: (id) => {
        const { flashcards } = get();
        const updatedFlashcards = flashcards.map(card =>
          card.id === id ? { ...card, completed: true } : card
        );
        set({ flashcards: updatedFlashcards });
      },

      reset: () => {
        console.log('🗑️ Resetting flashcards store');
        set(initialState);
      },
    }),
    {
      name: 'flashcards-storage',
      version: 1,
    }
  )
);