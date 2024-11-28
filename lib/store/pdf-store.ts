import { create } from 'zustand';

interface PDFState {
  url: string | null;
  metadata: {
    title: string;
    pageCount: number;
    author: string;
  } | null;
  setURL: (url: string) => void;
  setMetadata: (metadata: PDFState['metadata']) => void;
  reset: () => void;
}

export const usePDFStore = create<PDFState>((set) => ({
  url: null,
  metadata: null,
  setURL: (url) => set({ url }),
  setMetadata: (metadata) => set({ metadata }),
  reset: () => set({ url: null, metadata: null }),
})); 