import { PDFContentExtractor } from './pdf-content-extractor';
import { OpenAIService } from './openai-service';
import { 
  LearningPath,
  LearningConcept,
  Assessment,
  QuizQuestion
} from '@/lib/types/learning-path';
import { v4 as uuidv4 } from 'uuid';

export class LearningPathService {
  private contentExtractor: PDFContentExtractor;
  private openai: OpenAIService;

  constructor() {
    this.contentExtractor = new PDFContentExtractor();
    this.openai = new OpenAIService();
  }

  async createLearningPath(documentUrl: string): Promise<LearningPath> {
    try {
      console.log('🛠️ Starting learning path creation');

      // Extract content from PDF
      console.log('📄 Extracting content from PDF');
      const content = await this.contentExtractor.extractContent(documentUrl);
      if (!content) {
        throw new Error('Failed to extract content from PDF');
      }
      console.log('✅ Content extracted successfully, length:', content.length);

      // Generate initial assessment
      console.log('📝 Generating initial assessment');
      const assessment = await this.generateInitialAssessment(content);
      console.log('📊 Assessment score:', assessment?.score);

      // Generate learning concepts
      console.log('🎯 Generating learning concepts');
      const concepts = await this.generateConcepts(content);
      console.log('✅ Generated concepts:', concepts.length);

      // Create learning path
      const path: LearningPath = {
        id: uuidv4(),
        documentId: documentUrl,
        concepts,
        progress: {},
        currentConceptId: concepts[0]?.id || null,
        assessments: assessment ? [assessment] : [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('✅ Learning path created successfully');
      return path;
    } catch (error) {
      console.error('❌ Error creating learning path:', error);
      throw error;
    }
  }

  private async generateInitialAssessment(content: string): Promise<Assessment | null> {
    try {
      // Generate assessment questions
      const questions = await this.openai.generateAssessmentQuestions(content);
      
      return {
        id: uuidv4(),
        type: 'initial',
        questions,
        responses: [],
        score: 0,
        completedAt: undefined
      };
    } catch (error) {
      console.error('❌ Error generating initial assessment:', error);
      return null;
    }
  }

  private async generateConcepts(content: string): Promise<LearningConcept[]> {
    try {
      // Generate concepts with materials and practice questions
      const concepts = await this.openai.generateLearningConcepts(content);
      
      // Ensure proper structure and defaults
      return concepts.map(concept => ({
        ...concept,
        status: 'available',
        confidence: 0,
        dependencies: [],
        materials: concept.materials.map((m, i) => ({
          ...m,
          id: uuidv4(),
          order: i
        })),
        practiceQuestions: concept.practiceQuestions.map(q => ({
          ...q,
          id: uuidv4()
        }))
      }));
    } catch (error) {
      console.error('❌ Error generating concepts:', error);
      throw error;
    }
  }
} 