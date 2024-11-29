export interface PDFTextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

export interface TOCItem {
  title: string;
  pageNumber: number;
  level: number;
  children?: TOCItem[];
  dest?: any; // PDF destination object
  metadata?: {
    fontSize: number;
    isProcessed?: boolean;
    originalText?: string;
  };
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

export interface PDFPageContent {
  pageNumber: number;
  text: string;
  metadata?: PDFPageMetadata;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  creator?: string;
  producer?: string;
  version?: string;
  pageCount: number;
  isAcroFormPresent?: boolean;
  isXFAPresent?: boolean;
  isPDFTagged?: boolean;
}

export interface PDFPageMetadata {
  hasImages?: boolean;
  hasText?: boolean;
  hasForms?: boolean;
  pageSize?: {
    width: number;
    height: number;
  };
} 