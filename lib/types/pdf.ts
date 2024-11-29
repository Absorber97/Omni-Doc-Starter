export interface TOCItem {
  title: string;
  pageNumber: number;
  level: number;
  children?: TOCItem[];
  dest?: any; // PDF destination object
}

export interface PDFDocument {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
  metadata: PDFMetadata;
  pages: PDFPageContent[];
  vectorIds: string[];
  tableOfContents: TOCItem[];
} 