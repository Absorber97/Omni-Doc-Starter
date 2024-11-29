import { PDFDocument, PDFPageContent, PDFMetadata, TOCItem } from '@/lib/types/pdf';
import { LocalVectorStore } from './vector-store';
import * as pdfjs from 'pdfjs-dist';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import { TOCProcessor } from './toc-processor';

export class PDFProcessor {
  private vectorStore: LocalVectorStore;

  constructor() {
    this.vectorStore = new LocalVectorStore();
  }

  async processPDF(file: File): Promise<PDFDocument> {
    try {
      const id = await this.generateFileId(file);
      const url = URL.createObjectURL(file);
      
      // Load PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      // Extract TOC
      const tableOfContents = await this.extractTableOfContents(pdf);
      
      // Process pages
      const pages = await this.extractPages(pdf);
      
      // Generate embeddings
      const pageVectors = await this.generatePageVectors(pages);
      
      // Store vectors
      const vectorIds = await this.vectorStore.storeVectors({ 
        id, 
        filename: file.name,
        url,
        pages,
        metadata: await this.generateDocumentMetadata(pages),
        createdAt: new Date().toISOString(),
        tableOfContents,
        vectorIds: [],
      }, pageVectors);

      // Create final document
      const document: PDFDocument = {
        id,
        filename: file.name,
        url,
        createdAt: new Date().toISOString(),
        metadata: await this.generateDocumentMetadata(pages),
        pages,
        tableOfContents,
        vectorIds,
      };

      await this.storeDocument(document);
      return document;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  private async extractTableOfContents(pdf: PDFDocumentProxy): Promise<TOCItem[]> {
    try {
      console.log('Extracting TOC...');
      const outline = await pdf.getOutline();
      console.log('Raw outline:', outline);

      if (!outline || outline.length === 0) {
        console.log('No outline found in PDF');
        return [];
      }

      const processOutlineItem = async (item: any, level: number = 0): Promise<TOCItem> => {
        console.log('Processing outline item:', item);
        let pageNumber = 1;
        
        if (item.dest) {
          try {
            const dest = await pdf.getDestination(item.dest);
            console.log('Destination:', dest);
            if (dest) {
              const pageRef = await pdf.getPageIndex(dest[0]);
              pageNumber = pageRef + 1;
              console.log('Resolved page number:', pageNumber);
            }
          } catch (error) {
            console.warn('Error processing TOC destination:', error);
          }
        }

        return {
          title: item.title || 'Untitled Section',
          pageNumber,
          level,
          dest: item.dest,
          children: item.items ? 
            await Promise.all(item.items.map((child: any) => 
              processOutlineItem(child, level + 1)
            )) : undefined
        };
      };

      const items = await Promise.all(outline.map(item => processOutlineItem(item)));
      const cleanedItems = this.cleanupTOCItems(items);
      console.log('Processed TOC items:', cleanedItems);
      return cleanedItems;
    } catch (error) {
      console.error('Error extracting TOC:', error);
      return [];
    }
  }

  private cleanupTOCItems(items: TOCItem[]): TOCItem[] {
    return items
      .filter(item => item.title.trim() !== '')
      .map(item => ({
        ...item,
        title: item.title.trim(),
        children: item.children ? this.cleanupTOCItems(item.children) : undefined
      }))
      .filter(item => {
        // Remove items with no title and no valid children
        if (!item.title) {
          return item.children && item.children.length > 0;
        }
        return true;
      });
  }

  private async extractPages(pdf: PDFDocumentProxy): Promise<PDFPageContent[]> {
    const pages: PDFPageContent[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await this.extractPageContent(page);
      pages.push({
        pageNumber: i,
        text: content,
        metadata: await this.generatePageMetadata(content),
      });
    }

    return pages;
  }

  async extractTOC(pdf: PDFDocumentProxy): Promise<TOCItem[]> {
    try {
      const outline = await pdf.getOutline();
      if (!outline || outline.length === 0) {
        // If no outline exists, generate one from content
        return this.generateTOCFromContent(pdf);
      }

      const processOutlineItem = async (item: any, level: number = 0): Promise<TOCItem> => {
        let pageNumber = 1;
        try {
          if (item.dest) {
            const dest = await pdf.getDestination(item.dest);
            const pageRef = await pdf.getPageIndex(dest[0]);
            pageNumber = pageRef + 1;
          }
        } catch (error) {
          console.warn('Error processing TOC destination:', error);
        }

        return {
          title: item.title || 'Untitled Section',
          pageNumber,
          level,
          dest: item.dest,
          children: item.items ? 
            await Promise.all(item.items.map((child: any) => 
              processOutlineItem(child, level + 1)
            )) : undefined
        };
      };

      const items = await Promise.all(outline.map(item => processOutlineItem(item)));
      
      // Process the TOC items through our enhanced processor
      const processedItems = await TOCProcessor.processTableOfContents(items);
      console.log('Processed TOC items:', processedItems);
      return processedItems;
    } catch (error) {
      console.error('Error extracting TOC:', error);
      return [];
    }
  }

  private async generateTOCFromContent(pdf: PDFDocumentProxy): Promise<TOCItem[]> {
    const items: TOCItem[] = [];
    let currentPage = 1;
    let lastY = -1;
    let lastFontSize = -1;
    
    // Track the most common font size to determine body text
    const fontSizeFrequency = new Map<number, number>();
    
    // First pass: analyze font sizes
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      for (const item of content.items) {
        const textItem = item as any;
        const fontSize = Math.abs(textItem.transform[0]);
        fontSizeFrequency.set(fontSize, (fontSizeFrequency.get(fontSize) || 0) + 1);
      }
    }

    // Determine body text font size (most common)
    const bodyFontSize = Array.from(fontSizeFrequency.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Second pass: extract headings
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      let pendingHeading = '';
      
      for (let i = 0; i < content.items.length; i++) {
        const textItem = content.items[i] as any;
        const fontSize = Math.abs(textItem.transform[0]);
        const y = textItem.transform[5];
        const text = textItem.str.trim();

        // Skip if empty or just numbers
        if (!text || /^[\d.]+$/.test(text)) continue;

        // Check if this is a potential heading
        if (this.isHeadingCandidate(textItem, bodyFontSize)) {
          if (pendingHeading) {
            // Complete previous heading if it exists
            items.push({
              title: pendingHeading.trim(),
              pageNumber: currentPage,
              level: this.determineHeadingLevel(lastFontSize, bodyFontSize),
              children: []
            });
          }

          pendingHeading = text;
          lastY = y;
          lastFontSize = fontSize;
          currentPage = pageNum;
        }
        // Continue current heading if on same line and same style
        else if (
          pendingHeading && 
          Math.abs(y - lastY) < 5 && 
          fontSize === lastFontSize
        ) {
          pendingHeading += ' ' + text;
        }
        // Complete heading if style changes or new line
        else if (pendingHeading) {
          items.push({
            title: pendingHeading.trim(),
            pageNumber: currentPage,
            level: this.determineHeadingLevel(lastFontSize, bodyFontSize),
            children: []
          });
          pendingHeading = '';
        }
      }

      // Handle any remaining heading at page end
      if (pendingHeading) {
        items.push({
          title: pendingHeading.trim(),
          pageNumber: currentPage,
          level: this.determineHeadingLevel(lastFontSize, bodyFontSize),
          children: []
        });
      }
    }

    // Filter out likely false positives and process through TOC processor
    const filteredItems = items.filter(item => 
      item.title.length >= 3 && 
      item.title.length <= 200 &&
      !/^(page|figure|table)\s+\d+$/i.test(item.title)
    );

    // Process through enhanced TOC processor
    return TOCProcessor.processTableOfContents(filteredItems);
  }

  private isHeadingCandidate(textItem: any, bodyFontSize: number): boolean {
    const fontSize = Math.abs(textItem.transform[0]);
    const text = textItem.str.trim();
    
    // Must be larger than body text
    if (fontSize <= bodyFontSize) return false;

    // Basic text requirements
    if (text.length < 3 || text.length > 200) return false;
    if (/^[0-9.]+$/.test(text)) return false;

    // Strong heading indicators
    const headingPatterns = [
      /^(Chapter|Section|\d+\.|[IVXLCDM]+\.)\s+\w+/i,
      /^(Introduction|Conclusion|Abstract|Summary|References|Appendix)/i,
      /^[\d.]+\s+[A-Z]/,  // Numbered sections
      /^[A-Z][^.!?]*$/    // All caps or Title Case
    ];

    if (headingPatterns.some(pattern => pattern.test(text))) {
      return true;
    }

    // Font size based detection
    return fontSize >= bodyFontSize * 1.2;  // At least 20% larger than body text
  }

  private determineHeadingLevel(fontSize: number, bodyFontSize: number): number {
    // Calculate relative size compared to body text
    const sizeRatio = fontSize / bodyFontSize;
    
    if (sizeRatio >= 1.5) return 0;      // 50% larger than body -> main heading
    if (sizeRatio >= 1.3) return 1;      // 30% larger than body -> subheading
    return 2;                            // Otherwise -> lower level heading
  }

  // ... rest of the existing methods
} 