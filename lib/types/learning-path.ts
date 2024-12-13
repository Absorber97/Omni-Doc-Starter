export type ConfidenceLevel = 'beginner' | 'learning' | 'confident' | 'mastered';
export type ConceptStatus = 'locked' | 'available' | 'in-progress' | 'completed';
export type QuizType = 'initial' | 'concept' | 'review';

export interface LearningConcept {
  id: string;
  title: string;
  description: string;
  content: string;
  pageReferences: number[];
  confidence: number; // 0-100
  status: ConceptStatus;
  dependencies: string[];
  estimatedTime: number; // minutes
  metadata?: {
    difficulty: number; // 1-5
    importance: number; // 1-5
    vectorId?: string;
  };
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  conceptId: string;
  difficulty: number; // 1-5
}

export interface Assessment {
  id: string;
  type: QuizType;
  questions: QuizQuestion[];
  responses: {
    questionId: string;
    answer: string;
    isCorrect: boolean;
    confidence: number; // 0-100
  }[];
  score: number; // 0-100
  completedAt?: Date;
}

export interface LearningProgress {
  conceptId: string;
  confidence: number;
  timeSpent: number;
  lastAccessed: Date;
  assessments: Assessment[];
}

export interface LearningPath {
  id: string;
  userId?: string;
  documentId: string;
  concepts: LearningConcept[];
  progress: {
    [conceptId: string]: LearningProgress;
  };
  currentConceptId: string | null;
  assessments: Assessment[];
  createdAt: Date;
  updatedAt: Date;
} 