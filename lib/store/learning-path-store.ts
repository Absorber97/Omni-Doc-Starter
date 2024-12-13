import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LearningPathService } from '@/lib/services/learning-path-service';
import { LearningConcept, LearningPath, Assessment } from '@/lib/types/learning-path';
import { appConfig } from '@/config/app';

interface LearningPathState {
  paths: Record<string, LearningPath>;
  currentPath: LearningPath | null;
  service: LearningPathService;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: (documentId: string) => Promise<void>;
  reset: () => void;
  getCurrentConcept: () => LearningConcept | null;
  getConfidenceLevel: (confidence: number) => string;
  updateProgress: (conceptId: string, confidence?: number) => void;
  completeMaterial: (conceptId: string, materialId: string) => void;
  completeQuestion: (conceptId: string, questionId: string) => void;
}

// Helper to safely serialize dates
const serializeState = (state: any): any => {
  if (!state) return state;

  const serializePath = (path: any) => {
    if (!path) return null;
    return {
      ...path,
      createdAt: path.createdAt?.toISOString(),
      updatedAt: path.updatedAt?.toISOString(),
      assessments: path.assessments?.map((a: any) => ({
        ...a,
        completedAt: a.completedAt ? a.completedAt.toISOString() : undefined
      })) || []
    };
  };

  return {
    ...state,
    paths: state.paths ? Object.fromEntries(
      Object.entries(state.paths || {}).map(([key, path]: [string, any]) => [
        key,
        serializePath(path)
      ])
    ) : {},
    currentPath: serializePath(state.currentPath),
    service: undefined // Don't persist service instance
  };
};

// Helper to safely deserialize dates
const deserializeState = (state: any): any => {
  if (!state) return state;

  const deserializePath = (path: any) => {
    if (!path) return null;
    return {
      ...path,
      createdAt: path.createdAt ? new Date(path.createdAt) : new Date(),
      updatedAt: path.updatedAt ? new Date(path.updatedAt) : new Date(),
      assessments: path.assessments?.map((a: any) => ({
        ...a,
        completedAt: a.completedAt ? new Date(a.completedAt) : undefined
      })) || []
    };
  };

  return {
    ...state,
    paths: state.paths ? Object.fromEntries(
      Object.entries(state.paths || {}).map(([key, path]: [string, any]) => [
        key,
        deserializePath(path)
      ])
    ) : {},
    currentPath: deserializePath(state.currentPath),
    service: new LearningPathService()
  };
};

const initialState = {
  paths: {},
  currentPath: null,
  service: new LearningPathService(),
  isLoading: false,
  error: null
};

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: async (documentId: string) => {
        console.log('🔄 Initializing learning path for document:', documentId);
        set({ isLoading: true, error: null });

        try {
          // Check if we already have this path
          const existingPath = get().paths[documentId];
          if (existingPath) {
            console.log('📚 Using existing learning path from storage');
            set({ currentPath: existingPath, isLoading: false });
            return;
          }

          // Create new path if not found
          console.log('🛠️ Creating new learning path');
          const newPath = await get().service.createLearningPath(documentId);
          
          // Update storage
          set(state => ({
            paths: {
              ...(state.paths || {}),
              [documentId]: newPath
            },
            currentPath: newPath,
            isLoading: false
          }));

          console.log('✅ Learning path initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing learning path:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize learning path',
            isLoading: false 
          });
          throw error;
        }
      },

      reset: () => {
        console.log('🔄 Resetting learning path store');
        set(initialState);
      },

      getCurrentConcept: () => {
        const { currentPath } = get();
        if (!currentPath) return null;
        return currentPath.concepts.find(c => c.id === currentPath.currentConceptId) || null;
      },

      getConfidenceLevel: (confidence: number) => {
        if (confidence >= appConfig.learningPath.confidence.mastered) return 'Mastered';
        if (confidence >= appConfig.learningPath.confidence.confident) return 'Confident';
        if (confidence >= appConfig.learningPath.confidence.learning) return 'Learning';
        return 'Beginner';
      },

      updateProgress: (conceptId: string, confidence?: number) => {
        set(state => {
          if (!state.currentPath) return state;

          console.log('📈 Updating progress for concept:', conceptId, confidence);

          const updatedPath = {
            ...state.currentPath,
            progress: {
              ...(state.currentPath.progress || {}),
              [conceptId]: {
                ...(state.currentPath.progress[conceptId] || {}),
                confidence: confidence ?? state.currentPath.progress[conceptId]?.confidence ?? 0
              }
            },
            updatedAt: new Date()
          };

          return {
            currentPath: updatedPath,
            paths: {
              ...(state.paths || {}),
              [updatedPath.documentId]: updatedPath
            }
          };
        });
      },

      completeMaterial: (conceptId: string, materialId: string) => {
        set(state => {
          if (!state.currentPath) return state;

          console.log('📚 Completing material:', materialId, 'for concept:', conceptId);

          const progress = {
            ...(state.currentPath.progress[conceptId] || {
              completedMaterials: [],
              completedQuestions: [],
              confidence: 0
            })
          };

          if (!progress.completedMaterials?.includes(materialId)) {
            progress.completedMaterials = [...(progress.completedMaterials || []), materialId];
            
            const updatedPath = {
              ...state.currentPath,
              progress: {
                ...(state.currentPath.progress || {}),
                [conceptId]: progress
              },
              updatedAt: new Date()
            };

            return {
              currentPath: updatedPath,
              paths: {
                ...(state.paths || {}),
                [updatedPath.documentId]: updatedPath
              }
            };
          }

          return state;
        });
      },

      completeQuestion: (conceptId: string, questionId: string) => {
        set(state => {
          if (!state.currentPath) return state;

          console.log('❓ Completing question:', questionId, 'for concept:', conceptId);

          const progress = {
            ...(state.currentPath.progress[conceptId] || {
              completedMaterials: [],
              completedQuestions: [],
              confidence: 0
            })
          };

          if (!progress.completedQuestions?.includes(questionId)) {
            progress.completedQuestions = [...(progress.completedQuestions || []), questionId];
            
            const updatedPath = {
              ...state.currentPath,
              progress: {
                ...(state.currentPath.progress || {}),
                [conceptId]: progress
              },
              updatedAt: new Date()
            };

            return {
              currentPath: updatedPath,
              paths: {
                ...(state.paths || {}),
                [updatedPath.documentId]: updatedPath
              }
            };
          }

          return state;
        });
      }
    }),
    {
      name: 'learning-path-storage',
      version: 1,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      serialize: serializeState,
      deserialize: deserializeState,
      partialize: (state) => ({
        paths: state.paths || {},
        currentPath: state.currentPath
      })
    }
  )
); 