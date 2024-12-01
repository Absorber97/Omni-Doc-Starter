import OpenAI from 'openai';
import { openAIConfig, openAIClientConfig } from '@/config/openai';
import { PDFContentExtractor } from './pdf-content-extractor';
import type { DocumentSummary, SummarySection } from '@/lib/store/summary-store';

const openai = new OpenAI(openAIClientConfig);

const SUMMARY_PROMPT = `Analyze the following document content and create a structured summary with the following components:

1. A brief overview of the entire document
2. Key points with emojis for visual emphasis
3. Main findings with their importance levels
4. Conclusions and takeaways

Format the response in JSON with the following structure:
{
  "overview": "Brief overview text",
  "keyPoints": [
    { "title": "Point title", "content": "Detailed explanation", "emoji": "🔑", "importance": "high" }
  ],
  "mainFindings": [
    { "title": "Finding title", "content": "Finding details", "emoji": "📊", "importance": "medium" }
  ],
  "conclusions": [
    { "title": "Conclusion title", "content": "Conclusion details", "emoji": "✅", "importance": "low" }
  ]
}

Use appropriate emojis for each point. Vary the importance levels between "high", "medium", and "low".

Document content:
`;

export class SummaryProcessor {
  private contentExtractor: PDFContentExtractor;
  private processingPromise: Promise<DocumentSummary> | null = null;

  constructor() {
    console.log('🔄 Initializing SummaryProcessor');
    this.contentExtractor = new PDFContentExtractor();
  }

  async generateSummary(url: string): Promise<DocumentSummary> {
    // Return existing promise if already processing
    if (this.processingPromise) {
      console.log('⏳ Reusing existing summary generation process');
      return this.processingPromise;
    }

    try {
      this.processingPromise = this._generateSummary(url);
      return await this.processingPromise;
    } finally {
      this.processingPromise = null;
    }
  }

  private async _generateSummary(url: string): Promise<DocumentSummary> {
    try {
      console.log('📑 Extracting document content for summary');
      const content = await this.contentExtractor.extractContent(url);

      console.log('🤖 Generating summary using AI');
      const response = await openai.chat.completions.create({
        model: openAIConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional document analyzer that creates structured summaries.',
          },
          {
            role: 'user',
            content: SUMMARY_PROMPT + content,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const summaryData = JSON.parse(response.choices[0].message.content || '{}');

      console.log('✨ Summary generated successfully');
      return {
        id: crypto.randomUUID(),
        title: 'Document Summary',
        timestamp: Date.now(),
        ...summaryData,
      };
    } catch (error) {
      console.error('❌ Error generating summary:', error);
      throw error;
    }
  }

  async generatePageSummary(url: string, pageNumber: number): Promise<SummarySection[]> {
    try {
      console.log(`📄 Extracting content for page ${pageNumber}`);
      const content = await this.contentExtractor.extractPageContent(url, pageNumber);

      const response = await openai.chat.completions.create({
        model: openAIConfig.model,
        messages: [
          {
            role: 'system',
            content: 'Create a brief summary of the page content with key points.',
          },
          {
            role: 'user',
            content: `Summarize this page content into 2-3 key points with emojis:\n\n${content}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const points = JSON.parse(response.choices[0].message.content || '[]');
      console.log(`✨ Page ${pageNumber} summary generated`);
      return points;
    } catch (error) {
      console.error(`❌ Error generating page ${pageNumber} summary:`, error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up SummaryProcessor');
      await this.contentExtractor.cleanup();
      this.processingPromise = null;
    } catch (error) {
      console.error('❌ Error during SummaryProcessor cleanup:', error);
    }
  }
} 