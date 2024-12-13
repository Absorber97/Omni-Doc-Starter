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
      const CHUNK_SIZE = 1500;
      const chunks = content.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [];
      console.log(`📄 Split content into ${chunks.length} chunks`);

      // Prepare batch messages for OpenAI with assigned difficulties
      const difficulties = ['beginner', 'intermediate', 'advanced'];
      const messages = chunks.map((chunk, index) => {
        const startPage = Math.floor(index * (content.length / chunks.length) / 500) + 1;
        // Cycle through difficulties to ensure even distribution
        const assignedDifficulty = difficulties[index % difficulties.length];
        
        return [
          { 
            role: 'system', 
            content: `You are a curriculum design expert. Create one focused learning concept with:
              - Difficulty level: ${assignedDifficulty} (MUST use this exact difficulty)
              - 1-2 essential learning materials
              - 1 practice question
              - Page reference
              - Unique emoji and color
              Be concise but thorough.
              
              For ${assignedDifficulty} difficulty:
              - beginner: Basic concepts and definitions
              - intermediate: Applied concepts and relationships
              - advanced: Complex analysis and implications`
          },
          {
            role: 'user',
            content: `
              Create 1 learning concept for this section.
              Focus on pages ${startPage} to ${startPage + 1}.
              
              Requirements:
              1. MUST use ${assignedDifficulty} difficulty level
              2. Include:
                 - 1-2 learning materials
                 - 1 practice question
                 - Page reference
                 - Unique emoji and color
              
              Content section:
              ${chunk}
              
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
                        "difficulty": "${assignedDifficulty}",
                        "emoji": "string",
                        "color": "string (hex)"
                      }
                    ],
                    "pageReferences": [number],
                    "emoji": "string",
                    "color": "string (hex)",
                    "dependencies": ["string"],
                    "metadata": {
                      "difficulty": "${assignedDifficulty}",
                      "importance": number (1-5)
                    }
                  }
                ]
              }`
          }
        ];
      });

      // Process in larger batches
      const BATCH_SIZE = 8;
      const allConcepts: LearningConcept[] = [];

      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(messages.length / BATCH_SIZE)}`);

        const responses = await Promise.all(
          batch.map(messageSet => 
            this.openai.chat.completions.create({
              model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
              messages: messageSet,
              temperature: 0.7,
              response_format: { type: "json_object" }
            })
          )
        );

        for (const response of responses) {
          const rawResponse = response.choices[0].message.content;
          if (!rawResponse) continue;

          try {
            const concepts = this.parseConcepts(rawResponse);
            // Verify the concept has the correct assigned difficulty
            const validConcepts = concepts.filter(concept => 
              difficulties.includes(concept.metadata?.difficulty || '')
            );
            allConcepts.push(...validConcepts);
          } catch (error) {
            console.error('Failed to parse concepts from response:', error);
          }
        }

        if (i + BATCH_SIZE < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Early success check - if we have enough diverse concepts, we can stop
        const currentDifficulties = new Set(allConcepts.map(c => c.metadata?.difficulty));
        if (currentDifficulties.size >= 3 && allConcepts.length >= 9) {
          console.log('✅ Found sufficient diverse concepts early, stopping generation');
          break;
        }
      }

      console.log(`✅ Generated ${allConcepts.length} total concepts`);
      
      // Group concepts by difficulty for balanced selection
      const conceptsByDifficulty = allConcepts.reduce((acc, concept) => {
        const difficulty = concept.metadata?.difficulty || 'beginner';
        if (!acc[difficulty]) acc[difficulty] = [];
        acc[difficulty].push(concept);
        return acc;
      }, {} as Record<string, LearningConcept[]>);

      // Select one concept from each difficulty level
      const selectedConcepts = difficulties
        .map(difficulty => {
          const concepts = conceptsByDifficulty[difficulty] || [];
          return concepts.sort((a, b) => 
            (b.metadata?.importance || 0) - (a.metadata?.importance || 0)
          )[0];
        })
        .filter(Boolean);

      if (selectedConcepts.length < 3) {
        throw new Error('Could not find enough concepts with diverse difficulties');
      }

      const learningPath: LearningPath = {
        id: uuidv4(),
        documentId: uuidv4(),
        concepts: selectedConcepts.slice(0, 3),
        progress: {},
        currentConceptId: selectedConcepts[0]?.id || null,
        assessments: [assessment],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('✅ Learning path created successfully');
      console.log('📊 Path stats:', {
        conceptCount: selectedConcepts.length,
        totalMaterials: selectedConcepts.reduce((sum, c) => sum + c.materials.length, 0),
        totalQuestions: selectedConcepts.reduce((sum, c) => sum + c.practiceQuestions.length, 0),
        difficulties: selectedConcepts.map(c => c.metadata?.difficulty)
      });

      return learningPath;
    } catch (error) {
      console.error('❌ Error creating learning path:', error);
      if (error.response) {
        console.error('OpenAI API error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
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

  private selectDiverseConcepts(concepts: LearningConcept[]): LearningConcept[] {
    // Sort by importance first
    const sortedConcepts = [...concepts].sort((a, b) => 
      (b.metadata?.importance || 0) - (a.metadata?.importance || 0)
    );

    const selected: LearningConcept[] = [];
    const usedDifficulties = new Set<string>();
    const usedPages = new Set<number>();
    const usedEmojis = new Set<string>();

    // Select exactly 3 concepts with diverse difficulties
    for (const concept of sortedConcepts) {
      if (selected.length >= 3) break;

      const difficulty = concept.metadata?.difficulty || 'beginner';
      const pages = concept.pageReferences;
      
      // Check if this concept adds diversity
      const addsDifficultyDiversity = !usedDifficulties.has(difficulty);
      const addsPageDiversity = pages.some(p => !usedPages.has(p));
      const hasUniqueEmoji = !usedEmojis.has(concept.emoji);

      if ((addsDifficultyDiversity || addsPageDiversity) && hasUniqueEmoji) {
        selected.push(concept);
        usedDifficulties.add(difficulty);
        pages.forEach(p => usedPages.add(p));
        usedEmojis.add(concept.emoji);
      }
    }

    // If we still need more concepts, add highest importance ones
    while (selected.length < 3) {
      const nextConcept = sortedConcepts.find(c => 
        !selected.includes(c) && !usedEmojis.has(c.emoji)
      );
      if (!nextConcept) break;
      
      selected.push(nextConcept);
      usedEmojis.add(nextConcept.emoji);
    }

    return selected;
  }
} 