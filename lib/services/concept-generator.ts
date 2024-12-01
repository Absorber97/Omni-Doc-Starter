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

  private generatePrompt(content: string, targetConceptCount: number): string {
    // Calculate target counts for each type
    const mustKnowCount = Math.round(targetConceptCount * 0.3);  // 30%
    const goodToKnowCount = Math.round(targetConceptCount * 0.45); // 45%
    const optionalCount = targetConceptCount - mustKnowCount - goodToKnowCount; // Remaining 25%

    return `Analyze the following text and extract exactly ${targetConceptCount} key concepts. Return a JSON object with a "concepts" array.

    Strict Type Distribution Requirements:
    - Exactly ${mustKnowCount} "must-know" concepts (most critical information)
    - Exactly ${goodToKnowCount} "good-to-know" concepts (important but not critical)
    - Exactly ${optionalCount} "optional" concepts (supplementary information)

    Each concept should have:
    {
      "concepts": [
        {
          "title": "Brief Title (max 5 words)",
          "emoji": "Single emoji that best represents the concept",
          "content": "Detailed explanation",
          "type": "must-know" | "good-to-know" | "optional",
          "tags": ["tag1", "tag2"],
          "relevanceScore": number between 0-1
        }
      ]
    }

    Requirements:
    - Title should be clear and concise (max 5 words)
    - Content should be comprehensive but brief
    - Tags should be relevant keywords (3-5 tags)
    - RelevanceScore should reflect importance within its type category (0-1)

    Emoji Guidelines:
    - Each emoji MUST be unique across all concepts
    - Choose emojis that directly relate to the concept's content
    - Examples of good emoji mapping:
      * For policies/rules: 📜 📋 ⚖️
      * For deadlines/timing: ⏰ 📅 ⌛️
      * For locations/places: 🏢 🏠 🏫
      * For communication: 📧 📱 💬
      * For money/costs: 💰 💳 🏦
      * For documents: 📄 📝 📑
      * For people/roles: 👥 👤 🤝
      * For security: 🔒 🔑 🛡️
      * For success/goals: 🎯 ⭐️ 🏆
      * For warnings/important: ⚠️ ❗️ ⚡️

    Text to analyze:
    ${content}`;
  }

  async generateConceptsBatch(
    pageContents: Array<{ pageNum: number; content: string }>,
    options: {
      maxConceptsPerPage: number;
      minRelevanceScore: number;
      includeContext: boolean;
    }
  ): Promise<Concept[]> {
    const logger = {
      info: (message: string, data?: any) => {
        console.log(`[ConceptGenerator] ${message}`, data || '');
      },
      error: (message: string, error?: any) => {
        console.error(`[ConceptGenerator] ${message}`, error || '');
      }
    };

    try {
      const TOTAL_CONCEPTS_NEEDED = 15;
      const BATCH_SIZE = 5;
      const usedEmojis = new Set<string>();
      
      // Calculate concepts needed per page based on content distribution
      const totalPages = pageContents.length;
      const contentWeights = pageContents.map(({ content }) => content.length);
      const totalContentLength = contentWeights.reduce((sum, len) => sum + len, 0);
      
      // Calculate weighted concepts per page
      const conceptsPerPage = pageContents.map((_, index) => {
        const weight = contentWeights[index] / totalContentLength;
        return Math.max(1, Math.round(TOTAL_CONCEPTS_NEEDED * weight));
      });

      logger.info('Concepts distribution:', { 
        totalPages,
        conceptsPerPage,
        totalConceptsPlanned: conceptsPerPage.reduce((sum, n) => sum + n, 0)
      });

      const allConcepts: Concept[] = [];
      
      // Process pages in batches
      for (let i = 0; i < pageContents.length; i += BATCH_SIZE) {
        const batch = pageContents.slice(i, i + BATCH_SIZE);
        logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pageContents.length / BATCH_SIZE)}`);
        
        // Generate concepts for each page in parallel
        const batchResults = await Promise.all(
          batch.map(async ({ pageNum, content }, batchIndex) => {
            try {
              const targetConceptCount = conceptsPerPage[i + batchIndex];
              logger.info(`Generating ${targetConceptCount} concepts for page ${pageNum}`);
              
              const prompt = this.generatePrompt(content, targetConceptCount);
              const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                  { 
                    role: 'system', 
                    content: 'You are a precise concept extraction system. Follow the type distribution and emoji uniqueness requirements exactly.'
                  },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
              });

              const responseContent = response.choices[0].message.content;
              if (!responseContent) {
                throw new Error('Empty response from OpenAI');
              }

              logger.info(`Raw response for page ${pageNum}:`, responseContent);

              const result = JSON.parse(responseContent);
              
              if (!result || !Array.isArray(result.concepts)) {
                logger.error(`Invalid response format for page ${pageNum}:`, result);
                return [];
              }

              // Validate and ensure emoji uniqueness
              const pageConcepts = result.concepts
                .filter((c: any) => {
                  const isValid = 
                    c.title && 
                    c.content && 
                    c.type && 
                    c.emoji &&
                    typeof c.relevanceScore === 'number' &&
                    c.relevanceScore >= options.minRelevanceScore;
                  
                  if (!isValid) {
                    logger.error(`Invalid concept format:`, c);
                    return false;
                  }

                  // Check emoji uniqueness
                  if (usedEmojis.has(c.emoji)) {
                    c.emoji = this.getAlternativeEmoji(c.title, usedEmojis);
                  }
                  usedEmojis.add(c.emoji);
                  return true;
                })
                .slice(0, options.maxConceptsPerPage)
                .map((concept: any) => ({
                  id: uuidv4(),
                  title: concept.title,
                  emoji: concept.emoji,
                  content: concept.content,
                  type: concept.type as ConceptType,
                  tags: Array.isArray(concept.tags) ? concept.tags : [],
                  pageNumber: pageNum,
                  relevanceScore: concept.relevanceScore,
                  location: options.includeContext ? {
                    textSnippet: concept.context || ''
                  } : undefined
                }));

              // Log type distribution for this page
              const pageTypeDistribution = pageConcepts.reduce((acc, c) => {
                acc[c.type] = (acc[c.type] || 0) + 1;
                return acc;
              }, {} as Record<ConceptType, number>);
              
              logger.info(`Page ${pageNum} type distribution:`, pageTypeDistribution);
              return pageConcepts;

            } catch (error) {
              logger.error(`Error processing page ${pageNum}:`, error);
              return [];
            }
          })
        );

        const validResults = batchResults.flat();
        logger.info(`Batch generated ${validResults.length} concepts`);
        allConcepts.push(...validResults);
      }

      // Final processing to ensure we get exactly 15 concepts
      const sortedConcepts = allConcepts
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, TOTAL_CONCEPTS_NEEDED);

      // Verify final distribution
      const finalTypeDistribution = sortedConcepts.reduce((acc, concept) => {
        acc[concept.type] = (acc[concept.type] || 0) + 1;
        return acc;
      }, {} as Record<ConceptType, number>);

      logger.info('Final distribution:', {
        total: sortedConcepts.length,
        types: finalTypeDistribution,
        emojis: sortedConcepts.map(c => c.emoji)
      });

      return sortedConcepts;

    } catch (error) {
      logger.error('Error in batch generation:', error);
      throw error;
    }
  }
}