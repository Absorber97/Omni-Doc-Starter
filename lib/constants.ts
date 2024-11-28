export const ACCEPTED_FILE_TYPES = ['application/pdf'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ROUTES = {
  HOME: '/',
  EDITOR: '/editor',
  UPLOAD: '/upload',
} as const;

export const MESSAGES = {
  UPLOAD: {
    SUCCESS: 'PDF uploaded successfully! 🎉',
    ERROR: 'Error uploading PDF 😕',
    SIZE_ERROR: 'File too large! Maximum size is 10MB 😅',
    TYPE_ERROR: 'Only PDF files are supported 📄',
  },
  EDITOR: {
    LOADING: 'Loading your document... 📚',
    ERROR: 'Error loading document 😕',
    EMPTY: 'No document loaded 📄',
  },
  AI: {
    PROCESSING: 'AI is thinking... 🤔',
    ERROR: 'AI encountered an error 😕',
    SUCCESS: 'AI processing complete! 🎉',
  },
} as const;
