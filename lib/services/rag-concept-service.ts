import OpenAI from 'openai';
import { type Concept, type DepthLevel } from '@/lib/store/concepts-store';
import { v4 as uuidv4 } from 'uuid';
import { EmbeddingsStore } from '@/lib/embeddings-store';

interface ConceptConfig {
  count: number;
  description: string;
  priorityRange: [number, number];
  label: string;
}

export class RAGConceptService {
  private openai: OpenAI;
  private embeddingsStore: EmbeddingsStore;
  
  private readonly depthConfig: Record<DepthLevel, ConceptConfig> = {
    1: { count: 5, description: 'Basic - Most Essential', priorityRange: [0.8, 1.0], label: 'Must Know' },
    2: { count: 10, description: 'Detailed - Important', priorityRange: [0.6, 0.8], label: 'Good to Know' },
    3: { count: 15, description: 'Complete - Comprehensive', priorityRange: [0.4, 0.6], label: 'Deep Dive' }
  };

  constructor() {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    
    this.embeddingsStore = EmbeddingsStore.getInstance();
  }

  async generateConcepts(pageNumber: number, depthLevel: DepthLevel): Promise<Concept[]> {
    try {
      console.log('[RAGConceptService] Generating concepts:', { pageNumber, depthLevel });
      const config = this.depthConfig[depthLevel];
      
      // 1. Get relevant chunks from vector store
      const chunks = await this.getRelevantChunks(pageNumber);
      if (!chunks.length) {
        throw new Error('No content found for the specified page');
      }

      // 2. Extract initial concepts using RAG
      const rawConcepts = await this.extractConceptsFromChunks(chunks, config);

      // 3. Post-process and enhance concepts
      const enhancedConcepts = await this.enhanceConcepts(rawConcepts, config);

      // 4. Format and return concepts
      return this.formatConcepts(enhancedConcepts, pageNumber, depthLevel);
    } catch (error) {
      console.error('[RAGConceptService] Error generating concepts:', error);
      throw error;
    }
  }

  private async getRelevantChunks(pageNumber: number): Promise<Array<{ content: string; metadata: any }>> {
    try {
      console.log('[RAGConceptService] Getting relevant chunks for page:', pageNumber);
      
      // For document-wide concepts (pageNumber === -1), get content from full document
      const query = pageNumber === -1 
        ? { type: 'full-document' }
        : { type: 'page', pageNumber };
        
      // Get all chunks for the document/page
      const chunks = Array.from(this.embeddingsStore.store.entries())
        .filter(([_, doc]) => 
          Object.entries(query).every(([key, value]) => doc.metadata[key] === value)
        )
        .map(([id, doc]) => ({
          content: doc.content,
          metadata: doc.metadata
        }))
        .sort((a, b) => 
          (a.metadata.chunkIndex || 0) - (b.metadata.chunkIndex || 0)
        );

      console.log('[RAGConceptService] Found chunks:', chunks.length);

      if (!chunks.length) {
        throw new Error('No content found for the specified page');
      }

      // Combine chunks if they belong to the same document
      const combinedChunks = this.combineChunks(chunks);
      console.log('[RAGConceptService] Combined into documents:', combinedChunks.length);

      return combinedChunks;
    } catch (error) {
      console.error('[RAGConceptService] Error getting relevant chunks:', error);
      throw error;
    }
  }

  private combineChunks(chunks: Array<{ content: string; metadata: any }>) {
    const documentMap = new Map<string, {
      content: string[];
      metadata: any;
    }>();

    for (const chunk of chunks) {
      const docId = chunk.metadata.documentId;
      if (!documentMap.has(docId)) {
        documentMap.set(docId, {
          content: [],
          metadata: { ...chunk.metadata }
        });
      }

      const doc = documentMap.get(docId)!;
      doc.content.push(chunk.content);
    }

    return Array.from(documentMap.values()).map(doc => ({
      content: doc.content.join('\n\n'),
      metadata: doc.metadata
    }));
  }

  private async extractConceptsFromChunks(
    chunks: Array<{ content: string; metadata: any }>,
    config: ConceptConfig
  ) {
    console.log('[RAGConceptService] Extracting concepts from chunks');
    
    // Combine all content but ensure we don't exceed token limits
    const maxChars = 6000; // Conservative limit for GPT-4
    let combinedContent = '';
    
    for (const chunk of chunks) {
      if (combinedContent.length + chunk.content.length > maxChars) {
        break;
      }
      combinedContent += chunk.content + '\n\n';
    }
    
    const response = await this.openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at identifying key concepts from educational content.
            Your task is to extract exactly ${config.count} ${config.description} concepts
            and format them as a JSON array.
            
            Focus on the most important and unique ideas across the entire content.
            Ensure concepts are comprehensive and non-overlapping.
            
            Required JSON format:
            {
              "concepts": [
                {
                  "text": "concept explanation",
                  "importance": 0.8 // number between 0 and 1
                }
              ]
            }`
        },
        {
          role: 'user',
          content: `Extract ${config.count} key concepts from this content and return them in JSON format:\n\n${combinedContent}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const concepts = JSON.parse(response.choices[0].message.content || '{"concepts":[]}').concepts;
    console.log('[RAGConceptService] Extracted concepts:', concepts.length);
    return concepts;
  }

  private async enhanceConcepts(rawConcepts: any[], config: ConceptConfig) {
    console.log('[RAGConceptService] Enhancing concepts');
    const response = await this.openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Enhance these concepts and return them in JSON format.
            
            Requirements for each concept:
            1. Title: Clear, unique title (max 50 chars)
            2. Content: Self-contained explanation (2-3 sentences)
            3. Tags: Exactly 3 non-overlapping, specific tags
            4. Emoji: Single most relevant emoji
            5. Importance: Score between ${config.priorityRange[0]} and ${config.priorityRange[1]}
               - Distribute scores evenly within range
               - No duplicate scores
               - Higher = more fundamental
            
            Required JSON format:
            {
              "concepts": [
                {
                  "title": "Unique Concept Title",
                  "content": "Complete explanation",
                  "tags": ["tag1", "tag2", "tag3"],
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
            - Concepts should represent document-wide understanding`
        },
        {
          role: 'user',
          content: `Enhance these concepts and return them in JSON format:\n${JSON.stringify(rawConcepts, null, 2)}`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const concepts = JSON.parse(response.choices[0].message.content || '{"concepts":[]}').concepts;
    console.log('[RAGConceptService] Enhanced concepts:', concepts.length);
    return concepts;
  }

  private formatConcepts(concepts: any[], pageNumber: number, depthLevel: DepthLevel): Concept[] {
    console.log('[RAGConceptService] Formatting concepts');
    return concepts.map(concept => ({
      id: uuidv4(),
      text: concept.content,
      title: concept.title,
      depthLevel,
      pageNumber,
      location: {
        pageNumber,
        textSnippet: concept.content
      },
      metadata: {
        confidence: 1,
        importance: concept.importance,
        sourceContext: concept.content,
        tags: concept.tags,
        emoji: concept.emoji,
        category: this.depthConfig[depthLevel].label
      }
    }));
  }
} 