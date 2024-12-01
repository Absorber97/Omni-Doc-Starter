import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { type Concept, type DepthLevel } from '@/lib/store/concepts-store';

export class ConceptGenerator {
  private openai: OpenAI;
  private readonly BATCH_SIZE = 5;
  
  constructor() {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async generateConceptsForBatch(pages: { content: string; pageNumber: number }[], depthLevel: DepthLevel): Promise<Concept[]> {
    const numConcepts = this.getNumConceptsForDepthLevel(depthLevel);
    
    const batchPrompt = pages.map(page => `
      Page ${page.pageNumber}:
      ${page.content}
    `).join('\n\n---\n\n');

    const prompt = `
      Analyze the following text from multiple pages and identify key concepts for each page.
      For each page, identify ${numConcepts / pages.length} key concepts.
      
      For each concept:
      1. Extract the most important idea
      2. Provide a clear, concise explanation
      3. Rate its importance (0-1)
      4. Include relevant context and page number
      
      Format the response as a JSON array of objects with these properties:
      - text: The concept explanation
      - importance: 0-1 score
      - sourceContext: Original text snippet
      - pageNumber: The page number this concept is from
      
      Text to analyze:
      ${batchPrompt}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at identifying and explaining key concepts from text. Format output as valid JSON array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      const concepts = JSON.parse(response.choices[0].message.content);
      
      return concepts.map((concept: any) => ({
        id: uuidv4(),
        text: concept.text,
        depthLevel,
        pageNumber: concept.pageNumber,
        location: {
          pageNumber: concept.pageNumber,
          textSnippet: concept.sourceContext
        },
        metadata: {
          confidence: 1,
          importance: concept.importance,
          sourceContext: concept.sourceContext,
          tags: concept.tags || [],
          emoji: concept.emoji || '💡',
          category: concept.category || 'General'
        }
      }));
    } catch (error) {
      console.error('Error generating concepts for batch:', error);
      throw error;
    }
  }

  async generateConcepts(content: string, pageNumber: number, depthLevel: DepthLevel): Promise<Concept[]> {
    return this.generateConceptsForBatch([{ content, pageNumber }], depthLevel);
  }

  private getNumConceptsForDepthLevel(level: DepthLevel): number {
    switch (level) {
      case 1:
        return 10;
      case 2:
        return 25;
      case 3:
        return 50;
      default:
        return 10;
    }
  }
}