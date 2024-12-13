import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { 
  LearningPath, 
  Assessment,
  QuizQuestion,
  LearningConcept,
  QuizType 
} from '@/lib/types/learning-path';
import { PDFContentExtractor } from './pdf-content-extractor';
import { appConfig } from '@/config/app';

export class LearningPathService {
  private openai: OpenAI;
  private contentExtractor: PDFContentExtractor;

  constructor() {
    console.log('🎯 Initializing LearningPathService');
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.contentExtractor = new PDFContentExtractor();
  }

  async generateInitialAssessment(pdfUrl: string): Promise<Assessment> {
    console.log('📝 Generating initial assessment');
    const content = await this.contentExtractor.extractContent(pdfUrl);
    
    const prompt = `
      Analyze this document content and create an initial assessment with:
      - ${appConfig.learningPath.assessment.initialQuestions} multiple-choice questions
      - Varying difficulty levels (1-5)
      - Focus on key concepts and understanding
      - Include brief explanations for correct answers
      
      Format as JSON:
      {
        "questions": [{
          "type": "multiple-choice",
          "question": "string",
          "options": ["string"],
          "correctAnswer": "string",
          "explanation": "string",
          "difficulty": number
        }]
      }
    `;

    const response = await this.openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content }
      ]
    });

    const questions = this.parseQuestions(response.choices[0].message.content || '');

    return {
      id: uuidv4(),
      type: 'initial',
      questions,
      responses: [],
      score: 0
    };
  }

  async createLearningPath(assessment: Assessment, content: string): Promise<LearningPath> {
    console.log('🛠️ Creating learning path based on assessment');
    
    const prompt = `
      Create a structured learning path based on:
      1. Assessment results
      2. Document content
      3. Key concepts and their relationships
      
      Format as JSON:
      {
        "concepts": [{
          "title": "string",
          "description": "string",
          "content": "string",
          "pageReferences": [number],
          "dependencies": ["conceptId"],
          "metadata": {
            "difficulty": number,
            "importance": number
          }
        }]
      }
    `;

    const response = await this.openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: prompt },
        { 
          role: 'user', 
          content: JSON.stringify({ assessment, content })
        }
      ]
    });

    const concepts = this.parseConcepts(response.choices[0].message.content || '');

    return {
      id: uuidv4(),
      documentId: uuidv4(),
      concepts,
      progress: {},
      currentConceptId: concepts[0]?.id || null,
      assessments: [assessment],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async generateConceptQuiz(concept: LearningConcept): Promise<QuizQuestion[]> {
    console.log('❓ Generating quiz for concept:', concept.title);
    
    const prompt = `
      Create ${appConfig.learningPath.assessment.conceptQuestions} questions to test understanding of:
      "${concept.title}"
      
      Content: "${concept.content}"
      
      Include:
      - Multiple choice questions
      - True/False questions
      - Varying difficulty
      - Clear explanations
      
      Format as JSON array of QuizQuestion objects.
    `;

    const response = await this.openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: prompt }
      ]
    });

    return this.parseQuestions(response.choices[0].message.content || '');
  }

  private parseQuestions(content: string): QuizQuestion[] {
    try {
      const parsed = JSON.parse(content);
      const questions = parsed.questions || parsed;
      return questions.map((q: any) => ({
        id: uuidv4(),
        type: q.type || 'multiple-choice',
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        conceptId: q.conceptId || '',
        difficulty: q.difficulty || 1
      }));
    } catch (error) {
      console.error('❌ Failed to parse questions:', error);
      return [];
    }
  }

  private parseConcepts(content: string): LearningConcept[] {
    try {
      const parsed = JSON.parse(content);
      return parsed.concepts.map((c: any) => ({
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
      }));
    } catch (error) {
      console.error('❌ Failed to parse concepts:', error);
      return [];
    }
  }
} 