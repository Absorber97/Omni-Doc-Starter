import * as pdfjs from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Ensure PDF.js worker is loaded
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export class PDFContentExtractor {
  private loadingTask: pdfjs.PDFDocumentLoadingTask | null = null;
  private document: pdfjs.PDFDocumentProxy | null = null;

  constructor() {
    console.log('🔄 Initializing PDFContentExtractor');
  }

  async loadDocument(url: string) {
    try {
      console.log('📑 Loading PDF document');
      this.loadingTask = pdfjs.getDocument(url);
      this.document = await this.loadingTask.promise;
      console.log('✅ PDF document loaded successfully');
      return this.document;
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      throw new Error('Failed to load PDF document');
    }
  }

  async getPageCount(): Promise<number> {
    if (!this.document) {
      throw new Error('Document not loaded');
    }
    return this.document.numPages;
  }

  async extractContent(url: string): Promise<string> {
    try {
      const doc = await this.loadDocument(url);
      const pageCount = await this.getPageCount();
      console.log(`📄 Extracting content from ${pageCount} pages`);
      
      let fullContent = '';
      for (let i = 1; i <= pageCount; i++) {
        const pageContent = await this.getPageContent(i);
        fullContent += pageContent + '\n\n';
      }

      console.log('✨ Content extraction complete');
      return fullContent.trim();
    } catch (error) {
      console.error('❌ Error extracting content:', error);
      throw error;
    }
  }

  async getPageContent(pageNumber: number): Promise<string> {
    try {
      if (!this.document) {
        throw new Error('Document not loaded');
      }

      console.log(`📄 Extracting content from page ${pageNumber}`);
      const page = await this.document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      // Process and combine text items
      const content = textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return content;
    } catch (error) {
      console.error(`❌ Error extracting content from page ${pageNumber}:`, error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.document) {
        console.log('🧹 Cleaning up PDF document');
        await this.document.cleanup();
        await this.document.destroy();
        this.document = null;
        this.loadingTask = null;
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}