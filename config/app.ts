export const appConfig = {
  features: {
    aiEnabled: true,
    flashcardsEnabled: true,
    summaryEnabled: true,
    conceptHighlightingEnabled: true,
    learningPathEnabled: true,
  },
  editor: {
    defaultZoom: 1,
    minZoom: 0.5,
    maxZoom: 2,
    zoomStep: 0.1,
  },
  ui: {
    modalTransitionDuration: 0.2,
    sidebarWidth: 300,
    headerHeight: 64,
    mobileBreakpoint: 1100,
  },
  emoji: {
    upload: "📄",
    edit: "✏️",
    ai: "🤖",
    magic: "🔮",
    flashcard: "🎴",
    summary: "📝",
    concept: "💡",
    chat: "💭",
    learn: "🎯",
    quiz: "❓",
    progress: "📈",
    achievement: "🏆",
  },
  learningPath: {
    assessment: {
      initialQuestions: 5,
      conceptQuestions: 3,
      reviewQuestions: 4,
      timePerQuestion: 60, // seconds
    },
    confidence: {
      beginner: 25,
      learning: 50,
      confident: 75,
      mastered: 90,
    },
    session: {
      minDuration: 5,  // minutes
      maxDuration: 30, // minutes
      breakInterval: 15, // minutes
    },
  },
} as const;

export type AppConfig = typeof appConfig;