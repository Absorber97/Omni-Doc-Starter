import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAI } from 'openai';
import { openAIConfig, openAIClientConfig } from '@/config/openai';
import { PDFContentExtractor } from '@/lib/services/pdf-content-extractor';
import { getDifficultyColor } from '@/lib/utils/difficulty-utils';

export interface Material {
  id: string;
  title: string;
  content: string;
  pageNumber: number;
  completed: boolean;
}

export interface Concept {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  emoji: string;
  materials: Material[];
  completed: boolean;
}

interface LearningPathState {
  concepts: Concept[];
  isLoading: boolean;
  error: string | null;
  setConcepts: (concepts: Concept[]) => void;
  generateLearningPath: (url: string) => Promise<void>;
  markConceptCompleted: (conceptId: string) => void;
  markMaterialCompleted: (conceptId: string, materialId: string) => void;
  reset: () => void;
}

const initialState = {
  concepts: [],
  isLoading: false,
  error: null,
};

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConcepts: (concepts) => {
        console.log('📝 Setting concepts:', concepts.length);
        set({ concepts, isLoading: false, error: null });
      },

      generateLearningPath: async (url) => {
        const state = get();
        if (state.concepts.length > 0) {
          console.log('📚 Reusing existing learning path');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Extract content from all pages
          const extractor = new PDFContentExtractor();
          await extractor.loadDocument(url);
          
          const pageCount = await extractor.getPageCount();
          console.log(`📄 Processing ${pageCount} pages for learning path`);

          let allContent = '';
          for (let page = 1; page <= pageCount; page++) {
            const pageContent = await extractor.getPageContent(page);
            allContent += pageContent + '\n\n';
          }

          // Generate learning path using OpenAI
          const openai = new OpenAI(openAIClientConfig);
          const response = await openai.chat.completions.create({
            model: openAIConfig.model,
            messages: [
              {
                role: 'system',
                content: `Create a learning path with 9 key concepts from the document. Distribute them evenly:
                - 3 beginner concepts
                - 3 intermediate concepts
                - 3 advanced concepts
                
                For each concept:
                1. Create a clear title and description
                2. Choose a relevant emoji
                3. Create 3 learning materials with specific page numbers
                4. Ensure materials build upon each other
                
                Format as JSON: {
                  "concepts": [{
                    "title": string,
                    "description": string,
                    "difficulty": "beginner" | "intermediate" | "advanced",
                    "emoji": string,
                    "materials": [{
                      "title": string,
                      "content": string,
                      "pageNumber": number
                    }]
                  }]
                }`
              },
              {
                role: 'user',
                content: allContent
              }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          });

          const generatedPath = JSON.parse(response.choices[0].message.content || '{"concepts": []}');
          const concepts: Concept[] = generatedPath.concepts.map((concept: any, conceptIndex: number) => ({
            id: `concept-${conceptIndex}`,
            title: concept.title,
            description: concept.description,
            difficulty: concept.difficulty,
            emoji: concept.emoji,
            completed: false,
            materials: concept.materials.map((material: any, materialIndex: number) => ({
              id: `material-${conceptIndex}-${materialIndex}`,
              title: material.title,
              content: material.content,
              pageNumber: material.pageNumber || Math.floor(Math.random() * pageCount) + 1,
              completed: false
            }))
          }));

          set({ concepts, isLoading: false, error: null });
          await extractor.cleanup();
        } catch (error) {
          console.error('Error generating learning path:', error);
          set({ error: 'Failed to generate learning path', isLoading: false });
        }
      },

      markConceptCompleted: (conceptId) => {
        const { concepts } = get();
        const updatedConcepts = concepts.map(concept =>
          concept.id === conceptId ? { ...concept, completed: true } : concept
        );
        set({ concepts: updatedConcepts });
      },

      markMaterialCompleted: (conceptId, materialId) => {
        const { concepts } = get();
        const updatedConcepts = concepts.map(concept => {
          if (concept.id !== conceptId) return concept;
          
          const allMaterialsCompleted = concept.materials.every(m => 
            m.id === materialId ? true : m.completed
          );

          return {
            ...concept,
            completed: allMaterialsCompleted,
            materials: concept.materials.map(material =>
              material.id === materialId ? { ...material, completed: true } : material
            )
          };
        });
        set({ concepts: updatedConcepts });
      },

      reset: () => {
        console.log('🗑️ Resetting learning path store');
        set(initialState);
      },
    }),
    {
      name: 'learning-path-storage',
      version: 1,
    }
  )
); 