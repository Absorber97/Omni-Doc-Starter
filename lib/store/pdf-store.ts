import { create } from 'zustand';

interface PDFStore {
  url: string | null;
  filename: string;
  metadata: {
    title: string;
    author: string;
    pageCount: number;
  } | null;
  setURL: (url: string) => void;
  setFilename: (filename: string) => void;
  setMetadata: (metadata: { title: string; author: string; pageCount: number }) => void;
}

export const usePDFStore = create<PDFStore>((set) => ({
  url: null,
  filename: 'PDF Document',
  metadata: null,
  setURL: (url) => set({ url }),
  setFilename: (filename) => set({ filename }),
  setMetadata: (metadata) => set({ metadata }),
})); 