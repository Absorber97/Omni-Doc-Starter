import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { EmbeddingsStore } from './embeddings-store';

if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_OPENAI_API_KEY');
}

interface ProcessedPDFContent {
  concepts: Array<{
    text: string;
    type: 'must-know' | 'good-to-know' | 'optional';
  }>;
  summary: string;
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
  chunks: number;
}

interface PDFMetadata {
  url: string;
  page: number;
  totalPages: number;
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: pdfViewerConfig.processing.chunkSize,
  chunkOverlap: pdfViewerConfig.processing.overlap,
});

export async function processPDFContent(
  content: string,
  metadata: PDFMetadata
): Promise<ProcessedPDFContent> {
  try {
    // Split content into chunks
    const chunks = await textSplitter.createDocuments([content], [metadata]);
    const embeddingsStore = EmbeddingsStore.getInstance();

    // Store chunks with embeddings
    await Promise.all(
      chunks.map(async (chunk) => {
        await embeddingsStore.addDocument(chunk.pageContent, chunk.metadata);
      })
    );

    // Generate key concepts
    const conceptsResponse = await openai.chat.completions.create({
      model: pdfViewerConfig.features.chat.model,
      temperature: pdfViewerConfig.features.chat.temperature,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that identifies key concepts from text.',
        },
        {
          role: 'user',
          content: `
            Analyze the following text and identify key concepts in three categories:
            1. Must-know (essential concepts)
            2. Good-to-know (important but not critical)
            3. Optional (supplementary information)
            
            Text: ${content.slice(0, 2000)}...
            
            Format the response as JSON with the structure:
            {
              "concepts": [
                { "text": "concept text", "type": "must-know" },
                { "text": "concept text", "type": "good-to-know" },
                { "text": "concept text", "type": "optional" }
              ]
            }
          `,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const concepts = JSON.parse(conceptsResponse.choices[0].message.content || '{"concepts":[]}').concepts;

    // Generate summary
    const summaryResponse = await openai.chat.completions.create({
      model: pdfViewerConfig.features.chat.model,
      temperature: pdfViewerConfig.features.chat.temperature,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise summaries.',
        },
        {
          role: 'user',
          content: `
            Provide a concise summary of the following text in ${pdfViewerConfig.features.summary.maxLength} words or less:
            
            ${content.slice(0, 2000)}...
          `,
        },
      ],
    });

    const summary = summaryResponse.choices[0].message.content || 'No summary available';

    // Generate flashcards
    const flashcardsResponse = await openai.chat.completions.create({
      model: pdfViewerConfig.features.chat.model,
      temperature: pdfViewerConfig.features.chat.temperature,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates educational flashcards.',
        },
        {
          role: 'user',
          content: `
            Create ${pdfViewerConfig.features.flashcards.maxCards} flashcards from the following text.
            Each flashcard should have a question and answer.
            
            Text: ${content.slice(0, 2000)}...
            
            Format the response as JSON with the structure:
            {
              "flashcards": [
                { "question": "...", "answer": "..." }
              ]
            }
          `,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const flashcards = JSON.parse(flashcardsResponse.choices[0].message.content || '{"flashcards":[]}').flashcards;

    return {
      concepts,
      summary,
      flashcards,
      chunks: chunks.length,
    };
  } catch (error) {
    console.error('Error processing PDF content:', error);
    return {
      concepts: [],
      summary: 'Failed to generate summary',
      flashcards: [],
      chunks: 0,
    };
  }
} 