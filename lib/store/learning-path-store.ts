import { create } from 'zustand';
import { LearningPathService } from '@/lib/services/learning-path-service';
import { LearningConcept, LearningPath } from '@/lib/types/learning-path';
import { appConfig } from '@/config/app';

const STORAGE_KEY = 'omni-doc-learning-paths';

interface StoredData {
  paths: Record<string, LearningPath>;
  lastUpdated: Date;
}

function loadFromStorage(): StoredData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    console.log('📚 Loaded learning paths from storage:', Object.keys(data.paths).length);
    return {
      paths: data.paths,
      lastUpdated: new Date(data.lastUpdated)
    };
  } catch (error) {
    console.error('❌ Error loading learning paths from storage:', error);
    return null;
  }
}

function saveToStorage(data: StoredData) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('💾 Saved learning paths to storage');
  } catch (error) {
    console.error('❌ Error saving learning paths to storage:', error);
  }
}

export interface LearningPathStore {
  currentPath: LearningPath | null;
  service: LearningPathService;
  initialize: (documentId: string) => Promise<void>;
  reset: () => void;
  getCurrentConcept: () => LearningConcept | null;
  getConfidenceLevel: (confidence: number) => string;
  updateProgress: (conceptId: string, confidence?: number) => void;
  completeMaterial: (conceptId: string, materialId: string) => void;
  completeQuestion: (conceptId: string, questionId: string) => void;
}

export const useLearningPathStore = create<LearningPathStore>((set, get) => ({
  currentPath: null,
  service: new LearningPathService(),

  initialize: async (documentId: string) => {
    console.log('🔄 Initializing learning path for document:', documentId);
    
    // Try to load from storage first
    const stored = loadFromStorage();
    if (stored && stored.paths[documentId]) {
      console.log('📚 Using existing learning path from storage');
      set({ currentPath: stored.paths[documentId] });
      return;
    }

    try {
      const path = await get().service.createLearningPath(documentId);
      console.log('✨ Created new learning path:', {
        concepts: path.concepts.length,
        materials: path.concepts.reduce((acc, c) => acc + c.materials.length, 0),
        questions: path.concepts.reduce((acc, c) => acc + c.practiceQuestions.length, 0)
      });

      // Save to storage
      const newStored: StoredData = {
        paths: {
          ...stored?.paths || {},
          [documentId]: path
        },
        lastUpdated: new Date()
      };
      saveToStorage(newStored);
      
      set({ currentPath: path });
    } catch (error) {
      console.error('❌ Error initializing learning path:', error);
      throw error;
    }
  },

  reset: () => {
    console.log('🔄 Resetting learning path store');
    set({ currentPath: null });
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

      const progress = state.currentPath.progress[conceptId] || {
        completedMaterials: [],
        completedQuestions: [],
        confidence: 0
      };

      if (confidence !== undefined) {
        progress.confidence = confidence;
      }

      state.currentPath.progress[conceptId] = progress;

      // Update concept status based on progress
      const concept = state.currentPath.concepts.find(c => c.id === conceptId);
      if (concept) {
        if (progress.completedMaterials.length === concept.materials.length &&
            progress.completedQuestions.length === concept.practiceQuestions.length) {
          concept.status = 'completed';
          console.log('🎉 Concept completed:', conceptId);
        } else if (progress.completedMaterials.length > 0 || progress.completedQuestions.length > 0) {
          concept.status = 'in-progress';
          console.log('🔄 Concept in progress:', conceptId);
        }
      }

      // Save updated state to storage
      const stored = loadFromStorage();
      if (stored && state.currentPath) {
        const newStored: StoredData = {
          paths: {
            ...stored.paths,
            [state.currentPath.documentId]: state.currentPath
          },
          lastUpdated: new Date()
        };
        saveToStorage(newStored);
      }

      return {
        currentPath: {
          ...state.currentPath,
          updatedAt: new Date()
        }
      };
    });
  },

  completeMaterial: (conceptId: string, materialId: string) => {
    set(state => {
      if (!state.currentPath) return state;

      console.log('📚 Completing material:', materialId, 'for concept:', conceptId);

      const progress = state.currentPath.progress[conceptId] || {
        completedMaterials: [],
        completedQuestions: [],
        confidence: 0
      };

      if (!progress.completedMaterials.includes(materialId)) {
        progress.completedMaterials.push(materialId);
        state.currentPath.progress[conceptId] = progress;
        
        // Update concept status if all materials are completed
        const concept = state.currentPath.concepts.find(c => c.id === conceptId);
        if (concept && progress.completedMaterials.length === concept.materials.length) {
          concept.status = 'completed';
          console.log('🎉 All materials completed for concept:', conceptId);
        }
        
        // Save updated state to storage
        const stored = loadFromStorage();
        if (stored && state.currentPath) {
          const newStored: StoredData = {
            paths: {
              ...stored.paths,
              [state.currentPath.documentId]: state.currentPath
            },
            lastUpdated: new Date()
          };
          saveToStorage(newStored);
        }
      }

      return {
        currentPath: {
          ...state.currentPath,
          updatedAt: new Date()
        }
      };
    });
  },

  completeQuestion: (conceptId: string, questionId: string) => {
    set(state => {
      if (!state.currentPath) return state;

      console.log('❓ Completing question:', questionId, 'for concept:', conceptId);

      const progress = state.currentPath.progress[conceptId] || {
        completedMaterials: [],
        completedQuestions: [],
        confidence: 0
      };

      if (!progress.completedQuestions.includes(questionId)) {
        progress.completedQuestions.push(questionId);
        state.currentPath.progress[conceptId] = progress;
        
        // Update concept status if all questions are completed
        const concept = state.currentPath.concepts.find(c => c.id === conceptId);
        if (concept && progress.completedQuestions.length === concept.practiceQuestions.length) {
          concept.status = 'completed';
          console.log('🎉 All questions completed for concept:', conceptId);
        }
        
        // Save updated state to storage
        const stored = loadFromStorage();
        if (stored && state.currentPath) {
          const newStored: StoredData = {
            paths: {
              ...stored.paths,
              [state.currentPath.documentId]: state.currentPath
            },
            lastUpdated: new Date()
          };
          saveToStorage(newStored);
        }
      }

      return {
        currentPath: {
          ...state.currentPath,
          updatedAt: new Date()
        }
      };
    });
  }
})); 