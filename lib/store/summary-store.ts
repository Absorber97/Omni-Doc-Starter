import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SummarySection {
  title: string;
  content: string;
  emoji: string;
  importance: 'high' | 'medium' | 'low';
}

export interface DocumentSummary {
  id: string;
  title: string;
  overview: string;
  keyPoints: SummarySection[];
  mainFindings: SummarySection[];
  conclusions: SummarySection[];
  timestamp: number;
}

interface SummaryState {
  summary: DocumentSummary | null;
  isLoading: boolean;
  error: string | null;
  setSummary: (summary: DocumentSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getSummary: () => DocumentSummary | null;
  reset: () => void;
}

const initialState = {
  summary: null,
  isLoading: false,
  error: null,
};

export const useSummaryStore = create<SummaryState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSummary: (summary) => {
        const existingSummary = get().summary;
        if (existingSummary?.id === summary.id) {
          console.log('📝 Reusing existing summary');
          return;
        }
        console.log('✨ Setting new document summary');
        set({ summary, isLoading: false, error: null });
      },

      setLoading: (isLoading) => {
        console.log(isLoading ? '⏳ Loading summary...' : '✅ Loading complete');
        set({ isLoading });
      },

      setError: (error) => {
        if (error) {
          console.error('❌ Summary error:', error);
        }
        set({ error, isLoading: false });
      },

      getSummary: () => {
        const summary = get().summary;
        if (summary) {
          console.log('📚 Retrieved stored summary from:', new Date(summary.timestamp).toLocaleString());
        }
        return summary;
      },

      reset: () => {
        console.log('🗑️ Resetting summary store');
        set(initialState);
      },
    }),
    {
      name: 'summary-storage',
      version: 1,
    }
  )
); 