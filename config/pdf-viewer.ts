export const pdfViewerConfig = {
  features: {
    navigation: {
      enabled: true,
      sidebar: {
        defaultWidth: '50%',
        minWidth: 480,
        maxWidth: '50%',
        collapsible: true,
        position: 'left'
      },
      controls: {
        zoom: {
          default: 1,
          min: 0.5,
          max: 2,
          step: 0.1
        },
        thumbnails: {
          enabled: true,
          size: {
            width: 120,
            height: 170 // A4 ratio
          },
          gap: 8,
          columns: 2
        },
        toc: {
          enabled: true,
          maxDepth: 3,
          highlightActive: true
        }
      }
    },
    ai: {
      enabled: true,
      grid: {
        columns: {
          sm: 1,
          md: 2
        },
        gap: 16
      },
      features: {
        concepts: {
          enabled: true,
          icon: 'Lightbulb',
          emoji: '💡',
          label: 'Key Concepts',
          description: 'Extract main ideas and concepts',
          color: 'blue',
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
          icon: 'FileText',
          emoji: '📝',
          label: 'Summary',
          description: 'Get a concise summary',
          color: 'green',
          maxLength: 500
        },
        flashcards: {
          enabled: true,
          icon: 'Cards',
          emoji: '🎴',
          label: 'Flashcards',
          description: 'Create study flashcards',
          color: 'orange',
          maxCards: 10
        },
        chat: {
          enabled: true,
          icon: 'MessageSquare',
          emoji: '💭',
          label: 'Chat',
          description: 'Ask questions about the document',
          color: 'purple',
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 500
        }
      }
    }
  },
  ui: {
    layout: {
      viewer: {
        background: 'bg-background',
        padding: 'p-4',
        pattern: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'
      },
      sidebar: {
        background: 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        border: 'border-r',
        shadow: 'shadow-lg',
        transition: 'transition-all duration-300 ease-in-out'
      },
      controls: {
        group: 'flex items-center gap-2 p-2 bg-card rounded-lg border shadow-sm',
        divider: 'h-6 w-px bg-border',
        label: 'text-sm font-medium text-muted-foreground'
      }
    },
    components: {
      card: {
        base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
        interactive: 'hover:shadow-md transition-all duration-200',
        header: 'space-y-1.5 p-4',
        content: 'p-4 pt-0',
        footer: 'flex items-center p-4 pt-0'
      },
      button: {
        base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90',
          outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline'
        }
      },
      tabs: {
        base: 'w-full',
        list: 'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        trigger: 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
      }
    },
    animations: {
      duration: 0.3,
      stiffness: 300,
      damping: 30,
      variants: {
        slideIn: {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 }
        },
        fadeIn: {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        },
        scaleIn: {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.1 }
        }
      },
      transition: {
        type: 'spring',
        bounce: 0.15
      }
    }
  }
} as const;

export type PDFViewerConfig = typeof pdfViewerConfig;