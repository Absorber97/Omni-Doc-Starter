import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { PDFDocument, PDFTextItem, TOCItem, PDFPageContent, PDFMetadata } from '@/lib/types/pdf';
import { PDFContentExtractor } from './pdf-content-extractor';
import { ConceptGenerator } from './concept-generator';
import { TOCProcessor } from './toc-processor';
import { type DepthLevel } from '@/lib/store/concepts-store';
import { type Concept } from '@/lib/store/concepts-store';
import { type ChatCompletionCreateParams } from 'openai/resources';

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
      console.log('[DocumentProcessor] Starting concept generation:', { pageNumber, depthLevel });
      
      if (!this.currentDocument) {
        throw new Error('No document loaded');
      }

      const config = this.depthConfig[depthLevel];
      const allConcepts: Concept[] = [];
      const pages = pageNumber === -1 
        ? this.currentDocument.pages 
        : [this.currentDocument.pages[pageNumber - 1]];

      if (!pages?.length) {
        throw new Error('No pages found in document');
      }

      console.log(`[DocumentProcessor] Processing ${pages.length} pages for concepts`);

      // Process pages in smaller batches to avoid rate limits
      const batchSize = 2; // Process 2 pages at a time
      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        console.log(`[DocumentProcessor] Processing batch ${Math.floor(i / batchSize) + 1}, pages ${i + 1}-${i + batch.length}`);

        try {
          // Create a single batch request for all pages
          const messages = batch.map(page => ({
            role: 'user' as const,
            content: `Extract key concepts from this text:\n\n${page.text}`
          }));

          // Calculate concepts per page
          const totalConcepts = config.count;
          const conceptsPerPage = Math.max(1, Math.floor(totalConcepts / pages.length));
          
          // Create system message
          const systemMessage = {
            role: 'system' as const,
            content: `You are an expert concept extractor for educational content.
              For each text provided, extract exactly ${conceptsPerPage} ${config.description} concepts.
              
              Requirements for each concept:
              1. Title: Clear, unique title (max 50 chars)
              2. Content: Self-contained explanation (2-3 sentences)
              3. Tags: Exactly 3 non-overlapping, specific tags
              4. Emoji: Single most relevant emoji
              5. Importance: Score between ${config.priorityRange[0]} and ${config.priorityRange[1]}
                 - Distribute scores evenly within range
                 - No duplicate scores
                 - Higher = more fundamental
              
              Format as JSON:
              {
                "concepts": [
                  {
                    "title": "Unique Concept Title",
                    "content": "Complete, standalone explanation.",
                    "tags": ["specific", "unique", "tags"],
                    "emoji": "🔍",
                    "importance": 0.85
                  }
                ]
              }

              Critical Rules:
              - Each concept must be completely unique
              - No overlapping or duplicate content
              - Explanations must be self-contained
              - Tags must be specific and distinct
              - Importance scores must be evenly distributed
              - Return exactly ${conceptsPerPage} concepts per text`
          };

          // Make a single API call for the batch
          const response = await this.openai.chat.completions.create({
            model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: [systemMessage, ...messages],
            temperature: 0.2,
            max_tokens: 4000,
            response_format: { type: "json_object" }
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            console.warn(`[DocumentProcessor] No content in AI response for batch ${i / batchSize + 1}`);
            continue;
          }

          const parsedResponse = JSON.parse(content);
          if (!parsedResponse.concepts?.length) {
            console.warn(`[DocumentProcessor] Invalid response format for batch ${i / batchSize + 1}`);
            continue;
          }

          // Process concepts for each page in the batch
          batch.forEach((page, batchIndex) => {
            const pageStart = batchIndex * conceptsPerPage;
            const pageConcepts = parsedResponse.concepts.slice(pageStart, pageStart + conceptsPerPage);

            const processedConcepts = pageConcepts.map((concept: any, index: number) => {
              const scoreRange = config.priorityRange[1] - config.priorityRange[0];
              const stepSize = scoreRange / (conceptsPerPage - 1 || 1);
              const adjustedImportance = config.priorityRange[0] + (stepSize * index);

              return {
                id: crypto.randomUUID(),
                text: concept.title.trim(),
                depthLevel,
                pageNumber: page.pageNumber,
                location: {
                  pageNumber: page.pageNumber,
                  textSnippet: concept.content.trim()
                },
                metadata: {
                  confidence: 0.9,
                  importance: adjustedImportance,
                  sourceContext: concept.content,
                  tags: concept.tags.slice(0, 3),
                  emoji: concept.emoji,
                  category: config.label
                }
              };
            });

            allConcepts.push(...processedConcepts);
          });

        } catch (error) {
          console.error(`[DocumentProcessor] Error processing batch ${i / batchSize + 1}:`, error);
          // Continue with next batch even if this one fails
        }

        // Add a longer delay between batches to avoid rate limits
        if (i + batchSize < pages.length) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log('[DocumentProcessor] Generated concepts:', allConcepts);
      return allConcepts;

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