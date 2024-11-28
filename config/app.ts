export const appConfig = {
  features: {
    aiEnabled: true,
    flashcardsEnabled: true,
    summaryEnabled: true,
    conceptHighlightingEnabled: true,
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
    mobileBreakpoint: 768,
  },
  emoji: {
    upload: "📄",
    edit: "✏️",
    ai: "🤖",
    flashcard: "🎴",
    summary: "📝",
    concept: "💡",
    chat: "💭",
  },
} as const;

export type AppConfig = typeof appConfig;