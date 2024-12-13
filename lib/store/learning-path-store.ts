import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  LearningPath, 
  Assessment, 
  LearningConcept,
  ConfidenceLevel 
} from '@/lib/types/learning-path';
import { LearningPathService } from '@/lib/services/learning-path-service';
import { AchievementService } from '@/lib/services/achievement-service';

interface LearningPathState {
  currentPath: LearningPath | null;
  isLoading: boolean;
  error: string | null;
  service: LearningPathService;
  achievements: Achievement[];
  
  // Actions
  initializePath: (pdfUrl: string) => Promise<void>;
  updateProgress: (conceptId: string, confidence: number) => void;
  completeAssessment: (assessment: Assessment) => void;
  getCurrentConcept: () => LearningConcept | null;
  getConfidenceLevel: (confidence: number) => ConfidenceLevel;
  awardAchievement: (title: string, description: string, icon: string) => void;
  reset: () => void;
}

// Helper to safely serialize dates
const serializeState = (state: any): any => {
  return {
    ...state,
    currentPath: state.currentPath ? {
      ...state.currentPath,
      createdAt: state.currentPath.createdAt.toISOString(),
      updatedAt: state.currentPath.updatedAt.toISOString(),
      progress: Object.fromEntries(
        Object.entries(state.currentPath.progress).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            lastAccessed: value.lastAccessed.toISOString()
          }
        ])
      )
    } : null,
    service: undefined // Don't persist service instance
  };
};

// Helper to safely deserialize dates
const deserializeState = (state: any): any => {
  return {
    ...state,
    currentPath: state.currentPath ? {
      ...state.currentPath,
      createdAt: new Date(state.currentPath.createdAt),
      updatedAt: new Date(state.currentPath.updatedAt),
      progress: Object.fromEntries(
        Object.entries(state.currentPath.progress).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            lastAccessed: new Date(value.lastAccessed)
          }
        ])
      )
    } : null,
    service: new LearningPathService() // Recreate service instance
  };
};

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set, get) => ({
      currentPath: null,
      isLoading: false,
      error: null,
      service: new LearningPathService(),
      achievements: [],

      initializePath: async (pdfUrl: string) => {
        set({ isLoading: true, error: null });
        try {
          const service = get().service;
          const assessment = await service.generateInitialAssessment(pdfUrl);
          const content = await service.contentExtractor.extractContent(pdfUrl);
          const path = await service.createLearningPath(assessment, content);
          set({ currentPath: path });
        } catch (error) {
          set({ error: 'Failed to initialize learning path' });
          console.error('Learning path initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateProgress: (conceptId: string, confidence: number) => {
        set(state => {
          if (!state.currentPath) return state;

          const progress = {
            ...state.currentPath.progress,
            [conceptId]: {
              ...state.currentPath.progress[conceptId],
              confidence,
              lastAccessed: new Date()
            }
          };

          return {
            currentPath: {
              ...state.currentPath,
              progress,
              updatedAt: new Date()
            }
          };
        });
      },

      completeAssessment: (assessment: Assessment) => {
        set(state => {
          if (!state.currentPath) return state;
          return {
            currentPath: {
              ...state.currentPath,
              assessments: [...state.currentPath.assessments, assessment],
              updatedAt: new Date()
            }
          };
        });
      },

      getCurrentConcept: () => {
        const state = get();
        if (!state.currentPath?.currentConceptId) return null;
        return state.currentPath.concepts.find(
          c => c.id === state.currentPath?.currentConceptId
        ) || null;
      },

      getConfidenceLevel: (confidence: number): ConfidenceLevel => {
        if (confidence >= 90) return 'mastered';
        if (confidence >= 70) return 'confident';
        if (confidence >= 40) return 'learning';
        return 'beginner';
      },

      awardAchievement: (title, description, icon) => {
        const achievement = AchievementService.awardAchievement(title, description, icon);
        set(state => ({
          achievements: [...state.achievements, achievement]
        }));
      },

      reset: () => {
        set({ currentPath: null, isLoading: false, error: null });
      }
    }),
    {
      name: 'learning-path-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      serialize: serializeState,
      deserialize: deserializeState,
      partialize: (state) => ({
        currentPath: state.currentPath,
        achievements: state.achievements
      })
    }
  )
); 