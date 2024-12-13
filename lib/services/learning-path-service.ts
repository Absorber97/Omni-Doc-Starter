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
            "difficulty": 1-5 number
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

  private parseQuestions(content: string): QuizQuestion[] {
    try {
      console.log('🔍 Starting question parsing');
      
      // Clean the response if it contains markdown backticks
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
          difficulty: q.difficulty || 3
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

  async createLearningPath(assessment: Assessment, content: string): Promise<LearningPath> {
    console.log('🛠️ Starting learning path creation');
    
    try {
      const prompt = `
        Create a structured learning path based on:
        1. Assessment results: ${JSON.stringify(assessment)}
        2. Document content: ${content.substring(0, 2000)}...
        
        Return a JSON object with this structure:
        {
          "concepts": [
            {
              "title": "string",
              "description": "string",
              "content": "string",
              "pageReferences": [number],
              "dependencies": ["string"],
              "metadata": {
                "difficulty": number (1-5),
                "importance": number (1-5)
              }
            }
          ]
        }
      `;

      console.log('🤖 Requesting learning path from OpenAI');
      const response = await this.openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a curriculum design expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const rawResponse = response.choices[0].message.content;
      console.log('✨ Received learning path response, length:', rawResponse?.length);

      const concepts = this.parseConcepts(rawResponse || '');
      console.log(`✅ Created learning path with ${concepts.length} concepts`);

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
      return learningPath;
    } catch (error) {
      console.error('❌ Error creating learning path:', error);
      throw new Error('Failed to create learning path: ' + error.message);
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
          content: c.content,
          pageReferences: c.pageReferences || [],
          confidence: 0,
          status: 'available',
          dependencies: c.dependencies || [],
          estimatedTime: c.estimatedTime || 10,
          metadata: {
            difficulty: c.metadata?.difficulty || 1,
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