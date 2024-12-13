export type ConfidenceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ConceptStatus = 'locked' | 'available' | 'in-progress' | 'completed';
export type QuizType = 'initial' | 'concept' | 'review';

export interface LearningMaterial {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'example' | 'summary';
  pageReferences: number[];
  emoji: string;
  color: string;
  order: number;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  type: 'multiple-choice';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  emoji: string;
  color: string;
}

export interface LearningConcept {
  id: string;
  title: string;
  description: string;
  materials: LearningMaterial[];
  practiceQuestions: PracticeQuestion[];
  pageReferences: number[];
  confidence: number; // 0-100
  status: ConceptStatus;
  dependencies: string[];
  emoji: string;
  color: string;
  metadata?: {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    importance: number; // 1-5
  };
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  emoji: string;
  color: string;
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
  completedMaterials: string[]; // material IDs
  completedQuestions: string[]; // question IDs
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