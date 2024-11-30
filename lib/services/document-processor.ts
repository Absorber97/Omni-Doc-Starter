import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { PDFDocument, PDFTextItem, TOCItem, PDFPageContent, PDFMetadata } from '@/lib/types/pdf';
import { PDFContentExtractor } from './pdf-content-extractor';
import { ConceptGenerator } from './concept-generator';
import { TOCProcessor } from './toc-processor';
import { type DepthLevel } from '@/lib/store/concepts-store';
import { type Concept } from '@/lib/store/concepts-store';
import { RAGConceptService } from './rag-concept-service';
import { EmbeddingsStore } from '@/lib/embeddings-store';

interface ProcessingOptions {
  extractText?: boolean;
  generateTOC?: boolean;
  generateConcepts?: boolean;
  generateVectors?: boolean;
  depthLevel?: DepthLevel;
}

export class DocumentProcessor {
  private openai: OpenAI;
  private contentExtractor: PDFContentExtractor;
  private tocProcessor: TOCProcessor;
  private vectorStore: Map<string, Float32Array>;
  private documentCache: Map<string, PDFDocument>;
  private currentDocument: PDFDocument | null = null;
  
  public conceptGenerator: ConceptGenerator;
  private ragConceptService: RAGConceptService;

  constructor() {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    this.contentExtractor = new PDFContentExtractor();
    this.conceptGenerator = new ConceptGenerator();
    this.tocProcessor = new TOCProcessor();
    this.vectorStore = new Map();
    this.documentCache = new Map();
    this.ragConceptService = new RAGConceptService();
  }

  async processDocument(
    url: string,
    filename: string,
    options: ProcessingOptions = {
      extractText: true,
      generateTOC: true,
      generateConcepts: true,
      generateVectors: true
    }
  ): Promise<PDFDocument | null> {
    try {
      console.log('[DocumentProcessor] Processing document:', filename);
      
      // Initialize document
      const doc: PDFDocument = {
        id: uuidv4(),
        filename,
        url,
        createdAt: new Date().toISOString(),
        metadata: { pageCount: 0 },
        pages: [],
        vectorIds: [],
        tableOfContents: []
      };

      // Load document
      await this.contentExtractor.loadDocument(url);
      
      // Extract metadata
      doc.metadata = await this.extractMetadata();

      // Process pages
      if (options.extractText) {
        doc.pages = await this.processPages(doc.metadata.pageCount);
        
        // Store content in vector store
        const embeddingsStore = EmbeddingsStore.getInstance();
        
        // Store whole document content for global concepts
        await embeddingsStore.addDocument(
          doc.pages.map(p => p.text).join('\n\n'),
          { 
            documentId: doc.id,
            type: 'full-document',
            pageCount: doc.metadata.pageCount
          }
        );

        // Store individual pages
        for (const page of doc.pages) {
          await embeddingsStore.addDocument(
            page.text,
            {
              documentId: doc.id,
              type: 'page',
              pageNumber: page.pageNumber
            }
          );
        }
      }

      // Generate table of contents
      if (options.generateTOC) {
        doc.tableOfContents = await TOCProcessor.processTableOfContents(
          await this.generateTableOfContents(doc.pages)
        );
      }

      // Generate vectors for semantic search
      if (options.generateVectors) {
        doc.vectorIds = await this.generateVectors(doc.pages);
      }

      // Store the current document
      this.currentDocument = doc;
      this.documentCache.set(url, doc);
      
      console.log('[DocumentProcessor] Document processed successfully');
      return doc;

    } catch (error) {
      console.error('[DocumentProcessor] Error processing document:', error);
      return null;
    }
  }

  private async extractMetadata(): Promise<PDFMetadata> {
    // Extract metadata using PDFContentExtractor
    return {
      pageCount: await this.contentExtractor.getPageCount(),
      // Add more metadata extraction as needed
    };
  }

  private async processPages(pageCount: number): Promise<PDFPageContent[]> {
    console.log('[DocumentProcessor] Processing all pages...');
    const pages: PDFPageContent[] = [];
    const batchSize = 5; // Process 5 pages at a time
    
    for (let i = 0; i < pageCount; i += batchSize) {
      const batch = Array.from(
        { length: Math.min(batchSize, pageCount - i) },
        (_, index) => i + index + 1
      );
      
      const batchResults = await Promise.all(
        batch.map(async pageNum => {
          const content = await this.contentExtractor.getPageContent(pageNum);
          return {
            pageNumber: pageNum,
            text: content,
            metadata: {
              hasText: content.length > 0,
              processedAt: new Date().toISOString()
            }
          };
        })
      );
      
      pages.push(...batchResults);
      console.log(`[DocumentProcessor] Processed pages ${i + 1} to ${i + batchResults.length}`);
    }

    return pages;
  }

  private async generateTableOfContents(pages: PDFPageContent[]): Promise<TOCItem[]> {
    // First try to extract built-in TOC
    const builtInTOC = await this.contentExtractor.getOutline();
    
    if (builtInTOC && builtInTOC.length > 0) {
      return this.tocProcessor.processTableOfContents(builtInTOC);
    }

    // If no built-in TOC, generate one from content
    return this.tocProcessor.generateFromContent(pages);
  }

  private async generateVectors(pages: PDFPageContent[]): Promise<string[]> {
    const vectorIds: string[] = [];

    for (const page of pages) {
      try {
        const embedding = await this.openai.embeddings.create({
          model: "text-embedding-3-small",
          input: page.text.slice(0, 8000) // OpenAI token limit
        });

        const vectorId = uuidv4();
        this.vectorStore.set(vectorId, new Float32Array(embedding.data[0].embedding));
        vectorIds.push(vectorId);

      } catch (error) {
        console.error(`Error generating vector for page ${page.pageNumber}:`, error);
      }
    }

    return vectorIds;
  }

  async findSimilarContent(text: string, threshold = 0.8): Promise<PDFPageContent[]> {
    try {
      // Generate vector for query text
      const queryEmbedding = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });

      const queryVector = new Float32Array(queryEmbedding.data[0].embedding);
      const results: { pageNumber: number; similarity: number }[] = [];

      // Compare with stored vectors
      this.vectorStore.forEach((vector, vectorId) => {
        const similarity = this.cosineSimilarity(queryVector, vector);
        if (similarity >= threshold) {
          const pageNumber = parseInt(vectorId.split('-')[1]);
          results.push({ pageNumber, similarity });
        }
      });

      // Sort by similarity
      results.sort((a, b) => b.similarity - a.similarity);

      // Return corresponding pages
      return results.map(result => {
        const doc = Array.from(this.documentCache.values())[0]; // Get the first document for now
        return doc.pages[result.pageNumber - 1];
      });

    } catch (error) {
      console.error('Error finding similar content:', error);
      return [];
    }
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  clearCache() {
    this.documentCache.clear();
    this.vectorStore.clear();
  }

  private readonly depthConfig = {
    1: { count: 5, description: 'Basic - Most Essential', priorityRange: [0.8, 1.0], label: 'Must Know' },
    2: { count: 10, description: 'Detailed - Important', priorityRange: [0.6, 0.8], label: 'Good to Know' },
    3: { count: 15, description: 'Complete - Comprehensive', priorityRange: [0.4, 0.6], label: 'Deep Dive' }
  } as const;

  async generateConcepts(pageNumber: number, depthLevel: DepthLevel): Promise<Concept[]> {
    try {
      console.log('[DocumentProcessor] Starting RAG-based concept generation:', { pageNumber, depthLevel });
      
      if (!this.currentDocument) {
        throw new Error('No document loaded');
      }

      // Use RAG-based concept generation
      return await this.ragConceptService.generateConcepts(pageNumber, depthLevel);
    } catch (error) {
      console.error('[DocumentProcessor] Error generating concepts:', error);
      throw error;
    }
  }

  // Helper method to find the most similar page
  private async findMostSimilarPage(queryVector: Float32Array): Promise<{ pageNumber: number; similarity: number } | null> {
    let bestMatch: { pageNumber: number; similarity: number } | null = null;

    this.vectorStore.forEach((vector, vectorId) => {
      const similarity = this.cosineSimilarity(queryVector, vector);
      const pageNumber = parseInt(vectorId.split('-')[1]);

      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { pageNumber, similarity };
      }
    });

    return bestMatch;
  }
} 