import OpenAI from 'openai';
import { openAIClientConfig } from '@/config/openai';
import { QuizQuestion, LearningConcept } from '@/lib/types/learning-path';
import { appConfig } from '@/config/app';
import { v4 as uuidv4 } from 'uuid';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI(openAIClientConfig);
  }

  async generateAssessmentQuestions(content: string): Promise<QuizQuestion[]> {
    try {
      console.log('🤖 Generating assessment questions');
      
      const prompt = `
        Generate ${appConfig.learningPath.assessment.initialQuestions} multiple-choice questions to assess understanding of:
        ${content.substring(0, 2000)}...
        
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
      if (!rawResponse) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(rawResponse);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;

      return questions.map(q => ({
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
      }));
    } catch (error) {
      console.error('❌ Error generating assessment questions:', error);
      throw error;
    }
  }

  async generateLearningConcepts(content: string): Promise<LearningConcept[]> {
    try {
      console.log('🤖 Generating learning concepts');
      
      const CHUNK_SIZE = 1500;
      const chunks = content.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [];
      const difficulties = ['beginner', 'intermediate', 'advanced'];
      
      const messages = chunks.map((chunk, index) => {
        const startPage = Math.floor(index * (content.length / chunks.length) / 500) + 1;
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
              Be concise but thorough.`
          },
          {
            role: 'user',
            content: `
              Create 1 learning concept for this section.
              Focus on pages ${startPage} to ${startPage + 1}.
              Content section: ${chunk}
              
              Return as JSON with this structure:
              {
                "title": "string",
                "description": "string",
                "materials": [{
                  "title": "string",
                  "content": "string",
                  "type": "text" | "example" | "summary",
                  "pageReferences": [number],
                  "emoji": "string",
                  "color": "string (hex)"
                }],
                "practiceQuestions": [{
                  "question": "string",
                  "options": ["string"],
                  "correctAnswer": "string",
                  "explanation": "string",
                  "difficulty": "${assignedDifficulty}",
                  "emoji": "string",
                  "color": "string (hex)"
                }],
                "pageReferences": [number],
                "emoji": "string",
                "color": "string (hex)",
                "metadata": {
                  "difficulty": "${assignedDifficulty}",
                  "importance": number (1-5)
                }
              }`
          }
        ];
      });

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
            const parsed = JSON.parse(rawResponse);
            if (parsed.metadata?.difficulty) {
              allConcepts.push(parsed);
            }
          } catch (error) {
            console.error('Failed to parse concept:', error);
          }
        }

        // Early success check
        const currentDifficulties = new Set(allConcepts.map(c => c.metadata?.difficulty));
        if (currentDifficulties.size >= 3 && allConcepts.length >= 9) {
          console.log('✅ Found sufficient diverse concepts early, stopping generation');
          break;
        }

        if (i + BATCH_SIZE < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Select diverse concepts
      const conceptsByDifficulty = allConcepts.reduce((acc, concept) => {
        const difficulty = concept.metadata?.difficulty || 'beginner';
        if (!acc[difficulty]) acc[difficulty] = [];
        acc[difficulty].push(concept);
        return acc;
      }, {} as Record<string, LearningConcept[]>);

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

      return selectedConcepts.slice(0, 3);
    } catch (error) {
      console.error('❌ Error generating learning concepts:', error);
      throw error;
    }
  }
} 