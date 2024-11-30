export class PDFContentExtractor {
  private pdfDocument: PDFDocumentProxy | null = null;
  private loadingPromise: Promise<void> | null = null;

  async loadDocument(url: string) {
    if (this.loadingPromise) {
      console.log('[PDFExtractor] Waiting for existing load to complete');
      await this.loadingPromise;
      return;
    }

    console.log('[PDFExtractor] Loading document:', url);
    this.loadingPromise = new Promise<void>(async (resolve, reject) => {
      try {
        this.pdfDocument = await pdfjsLib.getDocument(url).promise;
        console.log('[PDFExtractor] Document loaded successfully');
        resolve();
      } catch (error) {
        console.error('[PDFExtractor] Error loading PDF:', error);
        reject(error);
      } finally {
        this.loadingPromise = null;
      }
    });

    await this.loadingPromise;
  }

  async getPageContent(pageNumber: number): Promise<string> {
    if (this.loadingPromise) {
      console.log('[PDFExtractor] Waiting for document to load');
      await this.loadingPromise;
    }

    if (!this.pdfDocument) {
      console.error('[PDFExtractor] PDF document not loaded');
      throw new Error('PDF document not loaded');
    }

    try {
      console.log(`[PDFExtractor] Extracting content from page ${pageNumber}`);
      const page = await this.pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const content = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      console.log(`[PDFExtractor] Extracted ${content.length} characters`);
      return content;
    } catch (error) {
      console.error(`[PDFExtractor] Error extracting content from page ${pageNumber}:`, error);
      throw error;
    }
  }
}