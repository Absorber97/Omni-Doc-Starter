import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { PDFDocument, PDFTextItem, TOCItem, PDFPageContent, PDFMetadata } from '@/lib/types/pdf';
import { PDFContentExtractor } from './pdf-content-extractor';
import { ConceptGenerator } from './concept-generator';
import { TOCProcessor } from './toc-processor';
import { type DepthLevel } from '@/lib/store/concepts-store';

interface ProcessingOptions {
  extractText?: boolean;
  generateTOC?: boolean;
  generateConcepts?: boolean;
  generateVectors?: boolean;
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
  ): Promise<PDFDocument> {
    // Check cache first
    const cachedDoc = this.documentCache.get(url);
    if (cachedDoc) {
      console.log('[DocumentProcessor] Returning cached document');
      return cachedDoc;
    }

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

    try {
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
        doc.tableOfContents = await this.generateTableOfContents(doc.pages);
      }

      // Generate vectors for semantic search
      if (options.generateVectors) {
        doc.vectorIds = await this.generateVectors(doc.pages);
      }

      // Store the current document
      this.currentDocument = doc;
      
      // Cache the processed document
      this.documentCache.set(url, doc);
      
      console.log('[DocumentProcessor] Document processed successfully');
      return doc;

    } catch (error) {
      console.error('[DocumentProcessor] Error processing document:', error);
      throw error;
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
    const pages: PDFPageContent[] = [];
    
    for (let i = 1; i <= pageCount; i++) {
      const content = await this.contentExtractor.getPageContent(i);
      pages.push({
        pageNumber: i,
        text: content,
        metadata: {
          hasText: content.length > 0
        }
      });
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

  async generateConcepts(pageNumber: number, depthLevel: DepthLevel) {
    try {
      console.log('[DocumentProcessor] Starting concept generation:', { pageNumber, depthLevel });
      
      if (!this.currentDocument) {
        console.error('[DocumentProcessor] No document loaded');
        throw new Error('No document loaded');
      }

      const page = this.currentDocument.pages[pageNumber - 1];
      if (!page) {
        console.error('[DocumentProcessor] Page not found:', pageNumber);
        throw new Error('Page not found');
      }

      const pageContent = page.text;
      if (!pageContent || pageContent.trim().length === 0) {
        console.error('[DocumentProcessor] Page is empty:', pageNumber);
        throw new Error('Page appears to be empty');
      }

      const depthConfig = {
        1: { count: 3, description: 'most essential', priorityRange: [0.7, 1.0] },
        2: { count: 5, description: 'important', priorityRange: [0.4, 0.9] },
        3: { count: 8, description: 'comprehensive', priorityRange: [0.2, 0.8] },
      } as const;

      const response = await this.openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts key concepts from educational content.
              Your task is to identify exactly ${depthConfig[depthLevel].count} ${depthConfig[depthLevel].description} concepts from the provided text.

              For each concept:
              1. Title: Create a short, clear title (max 50 characters) that summarizes the concept
              2. Content: Write a complete, self-contained explanation (2-3 sentences)
              3. Tags: Assign exactly 3 relevant, specific tags
              4. Emoji: Choose a single most relevant emoji
              5. Priority: Assign importance score between ${depthConfig[depthLevel].priorityRange[0]} and ${depthConfig[depthLevel].priorityRange[1]}
                 - Higher scores (${depthConfig[depthLevel].priorityRange[1]}) for fundamental concepts
                 - Lower scores (${depthConfig[depthLevel].priorityRange[0]}) for supplementary information
                 - Distribute scores evenly across the range

              Format your response as JSON:
              {
                "concepts": [
                  {
                    "title": "Concise concept title",
                    "content": "Complete explanation of the concept that stands alone and provides clear context.",
                    "tags": ["specific", "relevant", "tags"],
                    "emoji": "",
                    "importance": 0.85
                  }
                ]
              }

              Guidelines:
              - Each concept must be completely unique
              - Title should be concise, content should be comprehensive
              - Content must be self-contained, not a continuation of the title
              - Use specific, non-overlapping tags
              - Choose distinct emojis for each concept
              - Distribute priority scores evenly within the specified range
              - Return exactly ${depthConfig[depthLevel].count} concepts`
          },
          {
            role: 'user',
            content: `Extract exactly ${depthConfig[depthLevel].count} key concepts from this text:\n\n${pageContent}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('[DocumentProcessor] No content in AI response');
        throw new Error('No concepts generated from AI');
      }

      // Parse and validate the JSON response
      const parsedResponse = JSON.parse(content);
      if (!parsedResponse.concepts || !Array.isArray(parsedResponse.concepts)) {
        throw new Error('Invalid response format from AI');
      }

      // Ensure we have exactly the number of concepts we asked for
      if (parsedResponse.concepts.length !== depthConfig[depthLevel].count) {
        console.warn(`[DocumentProcessor] Expected ${depthConfig[depthLevel].count} concepts, got ${parsedResponse.concepts.length}`);
      }

      // Find accurate page numbers using vector search
      const concepts = await Promise.all(parsedResponse.concepts.map(async concept => {
        // Generate embedding for the concept
        const embedding = await this.openai.embeddings.create({
          model: "text-embedding-3-small",
          input: concept.content
        });

        // Find most similar page
        const mostSimilarPage = await this.findMostSimilarPage(
          new Float32Array(embedding.data[0].embedding)
        );

        return {
          id: crypto.randomUUID(),
          text: concept.title.trim(),
          depthLevel,
          pageNumber: mostSimilarPage?.pageNumber || pageNumber,
          location: {
            pageNumber: mostSimilarPage?.pageNumber || pageNumber,
            textSnippet: concept.content.trim()
          },
          metadata: {
            confidence: 0.9,
            importance: concept.importance,
            sourceContext: concept.content,
            tags: concept.tags.slice(0, 3),
            emoji: concept.emoji
          }
        };
      }));

      console.log('[DocumentProcessor] Generated concepts:', concepts);
      return concepts;

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