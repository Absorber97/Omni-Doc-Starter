import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { openAIClientConfig } from '@/config/openai';
import { PDFContentExtractor } from './pdf-content-extractor';
import { 
  Assessment,
  QuizQuestion,
  LearningPath,
  LearningConcept
} from '@/lib/types/learning-path';
import { appConfig } from '@/config/app';

export class LearningPathService {
  private openai: OpenAI;
  public contentExtractor: PDFContentExtractor;
  private initializationInProgress: boolean = false;
  private lastProcessedUrl: string | null = null;

  constructor() {
    console.log('🔄 Initializing LearningPathService');
    this.openai = new OpenAI(openAIClientConfig);
    this.contentExtractor = new PDFContentExtractor();
  }

  async generateInitialAssessment(pdfUrl: string, content?: string): Promise<Assessment> {
    console.log('📝 Starting initial assessment generation');
    
    if (this.initializationInProgress) {
      console.log('⚠️ Assessment generation already in progress, skipping duplicate request');
      throw new Error('Assessment generation already in progress');
    }

    if (this.lastProcessedUrl === pdfUrl) {
      console.log('⚠️ URL already processed, skipping duplicate request');
      throw new Error('URL already processed');
    }

    try {
      this.initializationInProgress = true;
      this.lastProcessedUrl = pdfUrl;

      // Use provided content or extract if not provided
      let extractedContent = content;
      if (!extractedContent) {
        console.log('📄 Extracting content from PDF');
        extractedContent = await this.contentExtractor.extractContent(pdfUrl);
        console.log('✅ Content extraction complete, content length:', extractedContent.length);
      } else {
        console.log('📄 Using pre-extracted content, length:', extractedContent.length);
      }

      const prompt = `
        Generate ${appConfig.learningPath.assessment.initialQuestions} multiple-choice questions to assess understanding of:
        ${extractedContent.substring(0, 2000)}...
        
        Format response as a JSON array of questions:
        [
          {
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Correct option",
            "explanation": "Why this is correct",
            "difficulty": "beginner" | "intermediate" | "advanced",
            "emoji": "Relevant emoji",
            "color": "Hex color code"
          }
        ]
      `;

      console.log('🤖 Sending prompt to OpenAI for question generation');
      const response = await this.openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a helpful AI tutor.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const rawResponse = response.choices[0].message.content;
      console.log('✨ Received OpenAI response, length:', rawResponse?.length);

      const questions = this.parseQuestions(rawResponse || '');
      console.log(`✅ Successfully created assessment with ${questions.length} questions`);

      const assessment: Assessment = {
        id: uuidv4(),
        type: 'initial',
        questions,
        responses: [],
        score: 0
      };

      return assessment;
    } catch (error) {
      console.error('❌ Error generating assessment:', error);
      throw new Error('Failed to generate assessment: ' + error.message);
    } finally {
      console.log('🔄 Resetting initialization state');
      this.initializationInProgress = false;
    }
  }

  async createLearningPath(assessment: Assessment, content: string): Promise<LearningPath> {
    console.log('🛠️ Starting learning path creation');
    console.log('📊 Assessment score:', assessment.score);
    console.log('📝 Content length:', content.length);
    
    try {
      // Prepare content by taking relevant sections
      const contentSummary = content
        .split('\n')
        .slice(0, 50) // Take first 50 lines for context
        .join('\n');

      const prompt = `
        Create a structured learning path based on:
        1. Assessment results: ${JSON.stringify(assessment)}
        2. Document content summary: ${contentSummary}
        3. Full content length: ${content.length} characters
        
        Create a comprehensive learning path with:
        1. 5-7 key concepts spread across different difficulty levels
        2. Each concept should have:
           - 3-4 learning materials (mix of text, examples, and summaries)
           - 3-5 practice questions
           - Relevant page references from throughout the document
           - A unique emoji and color theme
        3. Difficulty levels should be diverse (beginner, intermediate, advanced, expert)
        4. Use page references from throughout the document (not just the beginning)
        
        Return a JSON object with this structure:
        {
          "concepts": [
            {
              "title": "string",
              "description": "string",
              "materials": [
                {
                  "title": "string",
                  "content": "string",
                  "type": "text" | "example" | "summary",
                  "pageReferences": [number],
                  "emoji": "string",
                  "color": "string (hex)",
                  "order": number
                }
              ],
              "practiceQuestions": [
                {
                  "question": "string",
                  "options": ["string"],
                  "correctAnswer": "string",
                  "explanation": "string",
                  "difficulty": "beginner" | "intermediate" | "advanced",
                  "emoji": "string",
                  "color": "string (hex)"
                }
              ],
              "pageReferences": [number],
              "emoji": "string",
              "color": "string (hex)",
              "dependencies": ["string"],
              "metadata": {
                "difficulty": "beginner" | "intermediate" | "advanced" | "expert",
                "importance": number (1-5)
              }
            }
          ]
        }
      `;

      console.log('🤖 Requesting learning path from OpenAI');
      console.log('⏳ Starting OpenAI request...');
      
      const response = await this.openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { 
            role: 'system', 
            content: `You are a curriculum design expert. Create engaging learning paths with:
              - Diverse difficulty levels (ensure mix of beginner, intermediate, advanced, expert)
              - Multiple learning materials per concept
              - Practice questions for each concept
              - Page references spread throughout the document
              - Unique emojis and colors for visual appeal
              Use appropriate emojis and hex colors to make each element unique and appealing.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      console.log('✅ OpenAI request completed');
      const rawResponse = response.choices[0].message.content;
      
      if (!rawResponse) {
        console.error('❌ Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }
      
      console.log('✨ Received learning path response, length:', rawResponse.length);
      console.log('🔍 Parsing response...');

      try {
        const concepts = this.parseConcepts(rawResponse);
        
        // Validate concept diversity
        const difficulties = concepts.map(c => c.metadata?.difficulty);
        const uniqueDifficulties = new Set(difficulties);
        console.log('📚 Concept difficulties:', difficulties);
        console.log('🎯 Unique difficulty levels:', uniqueDifficulties.size);

        if (uniqueDifficulties.size < 3) {
          console.warn('⚠️ Low difficulty diversity, regenerating...');
          throw new Error('Insufficient difficulty diversity');
        }

        // Validate page references
        const allPageRefs = concepts.flatMap(c => c.pageReferences);
        const uniquePages = new Set(allPageRefs);
        console.log('📄 Page references:', allPageRefs);
        console.log('📚 Unique pages referenced:', uniquePages.size);

        if (uniquePages.size < 5) {
          console.warn('⚠️ Limited page coverage, regenerating...');
          throw new Error('Insufficient page coverage');
        }

        const learningPath: LearningPath = {
          id: uuidv4(),
          documentId: uuidv4(),
          concepts,
          progress: {},
          currentConceptId: concepts[0]?.id || null,
          assessments: [assessment],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log('✅ Learning path created successfully');
        console.log('📊 Path stats:', {
          conceptCount: concepts.length,
          totalMaterials: concepts.reduce((sum, c) => sum + c.materials.length, 0),
          totalQuestions: concepts.reduce((sum, c) => sum + c.practiceQuestions.length, 0),
          uniqueDifficulties: Array.from(uniqueDifficulties),
          uniquePages: Array.from(uniquePages)
        });

        return learningPath;
      } catch (parseError) {
        console.error('❌ Error parsing OpenAI response:', parseError);
        console.error('Raw response:', rawResponse);
        throw new Error('Failed to parse OpenAI response: ' + parseError.message);
      }
    } catch (error) {
      console.error('❌ Error creating learning path:', error);
      if (error.response) {
        console.error('OpenAI API error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error; // Propagate error for retry mechanism
    }
  }

  private parseQuestions(content: string): QuizQuestion[] {
    try {
      console.log('🔍 Starting question parsing');
      
      const cleanContent = content.replace(/```json\n?|\n?```/g, '');
      console.log('🧹 Cleaned content length:', cleanContent.length);

      const parsed = JSON.parse(cleanContent);
      const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions;

      if (!Array.isArray(questionsArray)) {
        console.error('❌ Invalid questions format:', typeof questionsArray);
        throw new Error('Invalid questions format: not an array');
      }

      console.log(`📝 Processing ${questionsArray.length} questions`);
      const questions = questionsArray.map((q: any, index: number) => {
        console.log(`🔄 Processing question ${index + 1}/${questionsArray.length}`);
        return {
          id: uuidv4(),
          type: 'multiple-choice',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          conceptId: uuidv4(),
          difficulty: q.difficulty || 'beginner',
          emoji: q.emoji || '❓',
          color: q.color || '#4F46E5'
        };
      });

      console.log(`✅ Successfully processed ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('❌ Failed to parse questions:', error);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse questions: ${error.message}`);
    }
  }

  private parseConcepts(content: string): LearningConcept[] {
    try {
      console.log('🔍 Starting concept parsing');
      
      const cleanContent = content.replace(/```json\n?|\n?```/g, '');
      console.log('🧹 Cleaned content length:', cleanContent.length);

      const parsed = JSON.parse(cleanContent);
      
      if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
        console.error('❌ Invalid concepts format:', typeof parsed.concepts);
        throw new Error('Invalid concepts format: missing or invalid concepts array');
      }

      console.log(`📝 Processing ${parsed.concepts.length} concepts`);
      const concepts = parsed.concepts.map((c: any, index: number) => {
        console.log(`🔄 Processing concept ${index + 1}/${parsed.concepts.length}`);
        return {
          id: uuidv4(),
          title: c.title,
          description: c.description,
          materials: (c.materials || []).map((m: any) => ({
            id: uuidv4(),
            ...m
          })),
          practiceQuestions: (c.practiceQuestions || []).map((q: any) => ({
            id: uuidv4(),
            ...q
          })),
          pageReferences: c.pageReferences || [],
          confidence: 0,
          status: 'available',
          dependencies: c.dependencies || [],
          emoji: c.emoji || '📚',
          color: c.color || '#4F46E5',
          metadata: {
            difficulty: c.metadata?.difficulty || 'beginner',
            importance: c.metadata?.importance || 1
          }
        };
      });

      console.log(`✅ Successfully processed ${concepts.length} concepts`);
      return concepts;
    } catch (error) {
      console.error('❌ Failed to parse concepts:', error);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse concepts: ${error.message}`);
    }
  }
} 