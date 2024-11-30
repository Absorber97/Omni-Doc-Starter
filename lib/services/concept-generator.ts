import OpenAI from 'openai';
import { Concept, ConceptType } from '@/lib/store/concepts-store';
import { v4 as uuidv4 } from 'uuid';
import { PDFContentExtractor } from './pdf-content-extractor';

interface ConceptGenerationOptions {
  maxConcepts?: number;
  minConfidence?: number;
  includeContext?: boolean;
}

export class ConceptGenerator {
  private openai: OpenAI;
  private contentExtractor: PDFContentExtractor;

  constructor() {
    console.log('[ConceptGenerator] Initializing');
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error('[ConceptGenerator] OpenAI API key not found');
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.contentExtractor = new PDFContentExtractor();
    console.log('[ConceptGenerator] Initialized successfully');
  }

  async generateConcepts(
    pageContent: string, 
    pageNumber: number,
    options: ConceptGenerationOptions = {}
  ): Promise<Concept[]> {
    console.log(`[ConceptGenerator] Generating concepts for page ${pageNumber}`);
    console.log(`[ConceptGenerator] Content length: ${pageContent.length} characters`);

    const { 
      maxConcepts = 10, 
      minConfidence = 0.7,
      includeContext = true 
    } = options;

    const prompt = `
      Analyze the following text and identify key concepts. For each concept:
      1. Provide a clear, concise description
      2. Classify as must-know (essential), good-to-know (important), or optional
      3. Extract relevant keywords
      4. Include the surrounding context (1-2 sentences)
      5. Identify the concept's location in the text (start and end indices)
      6. Rate importance (0-1)

      Text to analyze:
      ${pageContent}

      Respond in JSON format:
      {
        "concepts": [
          {
            "text": "concept description",
            "type": "must-know|good-to-know|optional",
            "keywords": ["keyword1", "keyword2"],
            "confidence": 0.95,
            "importance": 0.9,
            "context": "surrounding text...",
            "location": {
              "startIndex": 123,
              "endIndex": 145
            }
          }
        ]
      }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { 
            role: 'system', 
            content: 'You are a precise concept extraction system that responds only in valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      const concepts = result.concepts
        .filter(c => c.confidence >= minConfidence)
        .slice(0, maxConcepts)
        .map(concept => ({
          id: uuidv4(),
          text: concept.text,
          type: concept.type as ConceptType,
          pageNumber,
          location: {
            pageNumber,
            textSnippet: concept.context,
            // boundingBox will be added by PDF extractor
          },
          metadata: {
            confidence: concept.confidence,
            keywords: concept.keywords,
            importance: concept.importance,
            sourceContext: concept.context
          }
        }));

      console.log(`[ConceptGenerator] Generated ${concepts.length} concepts`);
      return concepts;

    } catch (error) {
      console.error('Error generating concepts:', error);
      return [];
    }
  }
}