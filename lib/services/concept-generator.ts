import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { type Concept, type DepthLevel } from '@/lib/store/concepts-store';

export class ConceptGenerator {
  private openai: OpenAI;
  
  constructor() {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async generateConcepts(content: string, pageNumber: number, depthLevel: DepthLevel): Promise<Concept[]> {
    const numConcepts = this.getNumConceptsForDepthLevel(depthLevel);
    
    const prompt = `
      Analyze the following text and identify ${numConcepts} key concepts.
      For each concept:
      1. Extract the most important idea
      2. Provide a clear, concise explanation
      3. Rate its importance (0-1)
      4. Include relevant context
      
      Format each concept as a JSON object with these properties:
      - text: The concept explanation
      - importance: 0-1 score
      - sourceContext: Original text snippet
      
      Text to analyze:
      ${content}
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
        pageNumber,
        location: {
          pageNumber,
          textSnippet: concept.sourceContext
        },
        metadata: {
          confidence: 1,
          importance: concept.importance,
          sourceContext: concept.sourceContext
        }
      }));
    } catch (error) {
      console.error('Error generating concepts:', error);
      throw error;
    }
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