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

export interface MCQAttempt {
  timestamp: number;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface MCQAchievement {
  id: string;
  name: string;
  emoji: string;
  isUnlocked: boolean;
  unlockedAt?: number;
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
  attempts: MCQAttempt[];
  lastAttemptCorrect?: boolean;
  achievement: MCQAchievement;
}

interface MCQState {
  questions: MCQ[];
  isLoading: boolean;
  error: string | null;
  setQuestions: (questions: MCQ[]) => void;
  generateMCQs: (url: string) => Promise<void>;
  markCompleted: (id: string, optionId: string, isCorrect: boolean) => void;
  retryQuestion: (id: string) => void;
  reset: () => void;
}

const initialState = {
  questions: [],
  isLoading: false,
  error: null,
};

const colors: MCQ['color'][] = ['blue', 'green', 'orange', 'purple', 'pink'];

// Add shuffle utility function
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

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
                7. Create a creative achievement name (max 3 words) and unique achievement emoji for completing this question correctly

                Format as JSON: { "questions": [{ 
                  "question", 
                  "options": [{ "text", "isCorrect" }], 
                  "explanation",
                  "emoji", 
                  "color", 
                  "pageNumber",
                  "achievement": {
                    "name": "short creative name",
                    "emoji": "unique emoji"
                  }
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
          const questions: MCQ[] = generatedMCQs.questions.map((mcq: any, index: number) => {
            // Shuffle the options array
            const shuffledOptions = shuffleArray(mcq.options.map((opt: any, optIndex: number) => ({
              id: `opt-${index}-${optIndex}`,
              text: opt.text,
              isCorrect: opt.isCorrect
            })));

            return {
              id: `mcq-${index}`,
              question: mcq.question,
              options: shuffledOptions,
              explanation: mcq.explanation,
              emoji: mcq.emoji,
              color: mcq.color,
              completed: false,
              pageNumber: mcq.pageNumber || Math.floor(Math.random() * pageCount) + 1,
              attempts: [],
              lastAttemptCorrect: undefined,
              achievement: {
                id: `achievement-${index}`,
                name: mcq.achievement.name,
                emoji: mcq.achievement.emoji,
                isUnlocked: false
              }
            };
          });

          set({ questions, isLoading: false, error: null });
          await extractor.cleanup();
        } catch (error) {
          console.error('Error generating MCQs:', error);
          set({ error: 'Failed to generate MCQs', isLoading: false });
        }
      },

      markCompleted: (id, optionId, isCorrect) => {
        const { questions } = get();
        const updatedQuestions = questions.map(q =>
          q.id === id ? {
            ...q,
            completed: true,
            attempts: [
              ...q.attempts,
              {
                timestamp: Date.now(),
                selectedOptionId: optionId,
                isCorrect
              }
            ],
            lastAttemptCorrect: isCorrect,
            achievement: isCorrect ? {
              ...q.achievement,
              isUnlocked: true,
              unlockedAt: Date.now()
            } : q.achievement
          } : q
        );
        set({ questions: updatedQuestions });
      },

      retryQuestion: (id) => {
        const { questions } = get();
        const updatedQuestions = questions.map(q =>
          q.id === id ? {
            ...q,
            completed: false,
            lastAttemptCorrect: undefined
          } : q
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