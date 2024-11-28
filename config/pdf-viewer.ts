export const pdfViewerConfig = {
  features: {
    concepts: {
      enabled: true,
      types: {
        'must-know': {
          label: 'Must Know',
          variant: 'destructive' as const,
          emoji: '🎯',
          color: 'bg-red-500/10',
          icon: 'Star'
        },
        'good-to-know': {
          label: 'Good to Know',
          variant: 'default' as const,
          emoji: '💡',
          color: 'bg-blue-500/10',
          icon: 'Lightbulb'
        },
        'optional': {
          label: 'Optional',
          variant: 'secondary' as const,
          emoji: '📌',
          color: 'bg-gray-500/10',
          icon: 'Bookmark'
        }
      }
    },
    summary: {
      enabled: true,
      maxLength: 500,
      emoji: '📝',
      icon: 'FileText'
    },
    flashcards: {
      enabled: true,
      maxCards: 10,
      emoji: '🎴',
      icon: 'Cards'
    },
    chat: {
      enabled: true,
      emoji: '💭',
      icon: 'MessageSquare',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 500
    },
    defaultZoom: 1,
    minZoom: 0.5,
    maxZoom: 2,
    zoomStep: 0.1
  },
  ui: {
    toolbar: {
      height: 48,
      padding: 'px-4',
      spacing: 'space-x-2',
      background: 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      border: 'border-b',
      shadow: 'shadow-sm'
    },
    sidebar: {
      width: 320,
      maxHeight: 'calc(100vh - 4rem)',
      padding: 'p-4',
      background: 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      border: 'border-l',
      shadow: 'shadow-lg'
    },
    canvas: {
      padding: 'p-6',
      background: 'bg-background',
      pattern: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'
    },
    animations: {
      duration: 0.3,
      stiffness: 300,
      damping: 30,
      variants: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
      },
      transition: {
        type: 'spring',
        bounce: 0.15
      }
    },
    toast: {
      duration: 5000,
      className: 'group toast-group',
      success: { icon: 'Check', className: 'bg-green-500' },
      error: { icon: 'XCircle', className: 'bg-red-500' },
      loading: { icon: 'Loader2', className: 'bg-blue-500' }
    }
  },
  processing: {
    chunkSize: 1000,
    overlap: 200,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf']
  }
} as const;

export type PDFViewerConfig = typeof pdfViewerConfig;