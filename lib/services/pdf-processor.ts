import { PDFDocument, PDFPageContent, PDFMetadata, TOCItem } from '@/lib/types/pdf';
import { LocalVectorStore } from './vector-store';
import * as pdfjs from 'pdfjs-dist';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';

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

  // ... rest of the existing methods
} 