import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAI } from 'openai';
import { openAIConfig, openAIClientConfig } from '@/config/openai';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MCQ {
  id: string;
  question: string;
  options: MCQOption[];
  explanation: string;
  emoji: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
  completed: boolean;
  pageNumber: number;
}

interface MCQState {
  questions: MCQ[];
  isLoading: boolean;
  error: string | null;
  setQuestions: (questions: MCQ[]) => void;
  generateMCQs: (url: string) => Promise<void>;
  markCompleted: (id: string) => void;
  reset: () => void;
}

const initialState = {
  questions: [],
  isLoading: false,
  error: null,
};

const colors: MCQ['color'][] = ['blue', 'green', 'orange', 'purple', 'pink'];

export const useMCQStore = create<MCQState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setQuestions: (questions) => {
        console.log('📝 Setting MCQs:', questions.length);
        set({ questions, isLoading: false, error: null });
      },

      generateMCQs: async (url) => {
        const state = get();
        if (state.questions.length > 0) {
          console.log('📚 Reusing existing MCQs');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Extract content from all pages
          const extractor = new PDFContentExtractor();
          await extractor.loadDocument(url);
          
          // Get total pages
          const pageCount = await extractor.getPageCount();
          console.log(`📄 Processing ${pageCount} pages for MCQs`);

          // Extract content from all pages
          let allContent = '';
          for (let page = 1; page <= pageCount; page++) {
            const pageContent = await extractor.getPageContent(page);
            allContent += pageContent + '\n\n';
          }

          // Generate MCQs using OpenAI
          const openai = new OpenAI(openAIClientConfig);
          const response = await openai.chat.completions.create({
            model: openAIConfig.model,
            messages: [
              {
                role: 'system',
                content: `You are a helpful AI that creates educational multiple choice questions. Create 15 MCQs from the given text.
                For each MCQ:
                1. Create a clear, challenging question
                2. Provide exactly 4 options, with only one correct answer
                3. Include a detailed explanation for the correct answer
                4. Choose a relevant emoji that matches the content
                5. Assign a color from: blue, green, orange, purple, pink
                6. Assign a page number where this concept is most relevant (between 1 and ${pageCount})

                Format as JSON: { "questions": [{ 
                  "question", 
                  "options": [{ "text", "isCorrect" }], 
                  "explanation",
                  "emoji", 
                  "color", 
                  "pageNumber" 
                }] }`
              },
              {
                role: 'user',
                content: allContent
              }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          });

          const generatedMCQs = JSON.parse(response.choices[0].message.content || '{"questions": []}');
          const questions: MCQ[] = generatedMCQs.questions.map((mcq: any, index: number) => ({
            id: `mcq-${index}`,
            question: mcq.question,
            options: mcq.options.map((opt: any, optIndex: number) => ({
              id: `opt-${index}-${optIndex}`,
              text: opt.text,
              isCorrect: opt.isCorrect
            })),
            explanation: mcq.explanation,
            emoji: mcq.emoji,
            color: mcq.color,
            completed: false,
            pageNumber: mcq.pageNumber || Math.floor(Math.random() * pageCount) + 1
          }));

          set({ questions, isLoading: false, error: null });
          await extractor.cleanup();
        } catch (error) {
          console.error('Error generating MCQs:', error);
          set({ error: 'Failed to generate MCQs', isLoading: false });
        }
      },

      markCompleted: (id) => {
        const { questions } = get();
        const updatedQuestions = questions.map(q =>
          q.id === id ? { ...q, completed: true } : q
        );
        set({ questions: updatedQuestions });
      },

      reset: () => {
        console.log('🗑️ Resetting MCQ store');
        set(initialState);
      },
    }),
    {
      name: 'mcq-storage',
      version: 1,
    }
  )
); 