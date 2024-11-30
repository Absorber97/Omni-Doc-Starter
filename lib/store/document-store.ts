import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PDFDocument } from '@/lib/types/pdf';
import { DocumentProcessor } from '@/lib/services/document-processor';

interface DocumentState {
  currentDocument: PDFDocument | null;
  isProcessing: boolean;
  error: string | null;
  processor: DocumentProcessor;
  
  // Actions
  processDocument: (url: string, filename: string) => Promise<void>;
  clearDocument: () => void;
  setError: (error: string | null) => void;
}

// Create processor instance outside of store to ensure single instance
const documentProcessor = new DocumentProcessor();

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      isProcessing: false,
      error: null,
      processor: documentProcessor,

      processDocument: async (url: string, filename: string) => {
        set({ isProcessing: true, error: null });
        
        try {
          const doc = await documentProcessor.processDocument(url, filename);
          set({ currentDocument: doc });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isProcessing: false });
        }
      },

      clearDocument: () => {
        documentProcessor.clearCache();
        set({ currentDocument: null, error: null });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'document-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentDocument: state.currentDocument,
        error: state.error
      })
    }
  )
); 