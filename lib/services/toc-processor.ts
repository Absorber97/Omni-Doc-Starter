import { TOCItem } from '@/lib/types/pdf';
import OpenAI from 'openai';
import { pdfViewerConfig } from '@/config/pdf-viewer';

export class TOCProcessor {
  private static readonly HEADING_PATTERNS = [
    /^(Chapter|Section|\d+\.|[IVXLCDM]+\.)\s+\w+/i,
    /^[A-Z][^.!?]*$/,
    /^[\d.]+\s+[A-Z]/,
    /^(Introduction|Conclusion|Abstract|Summary|References|Appendix|Overview|Mission|Statement)/i
  ];

  private static readonly EXCLUDED_PATTERNS = [
    /^page\s+\d+$/i,
    /^\d+$/,
    /^(figure|table)\s+\d+$/i,
    /^copyright/i,
    /^[a-z]$/i // Single letters
  ];

  private static readonly MAX_LENGTHS = {
    MAIN_SECTION: 40,    // Level 0
    SUB_SECTION: 50,     // Level 1
    CONTENT: 60,         // Level 2+
    TOOLTIP: 120         // Max length for tooltip/original text
  } as const;

  static async processTableOfContents(items: TOCItem[]): Promise<TOCItem[]> {
    console.log('Starting TOC processing...');
    
    // First pass: Merge fragmented entries and clean
    const mergedItems = this.mergeFragmentedEntries(items);
    console.log('Items merged');

    // Second pass: Infer and fix numbering hierarchy
    const numberedItems = this.inferNumbering(mergedItems);
    console.log('Numbering hierarchy fixed');

    // Third pass: Clean and normalize titles
    const cleanedItems = this.cleanAndNormalizeItems(numberedItems);
    console.log('Items cleaned and normalized');

    // Fourth pass: AI enhancement for better titles
    const enhancedItems = await this.enhanceWithAI(cleanedItems);
    console.log('AI enhancement completed');

    return enhancedItems;
  }

  private static mergeFragmentedEntries(items: TOCItem[]): TOCItem[] {
    const mergedItems: TOCItem[] = [];
    let currentItem: TOCItem | null = null;
    let pendingText = '';

    for (const item of items) {
      // Check if this item is a continuation
      const isContinuation = (
        currentItem && 
        item.level === currentItem.level &&
        item.pageNumber === currentItem.pageNumber &&
        !this.isNewSection(item.title)
      );

      if (isContinuation) {
        // Append text with proper spacing
        pendingText += ' ' + item.title;
      } else {
        // Complete previous item if exists
        if (currentItem) {
          mergedItems.push({
            ...currentItem,
            title: pendingText.trim()
          });
        }
        // Start new item
        currentItem = { ...item };
        pendingText = item.title;
      }
    }

    // Add last item
    if (currentItem) {
      mergedItems.push({
        ...currentItem,
        title: pendingText.trim()
      });
    }

    return mergedItems;
  }

  private static isNewSection(title: string): boolean {
    // Check if title starts with patterns indicating a new section
    const newSectionPatterns = [
      /^\d+\./,                    // Numbered sections
      /^[A-Z][a-z]+:/,            // Title followed by colon
      /^(Overview|Mission|Self-)/i,// Common section headers
      /^[A-Z][a-z]+\s+[A-Z][a-z]+/ // Two capitalized words
    ];

    return newSectionPatterns.some(pattern => pattern.test(title));
  }

  private static inferNumbering(items: TOCItem[]): TOCItem[] {
    let currentMainSection = 0;
    let currentSubSection = 0;
    let inNumberedSection = false;

    return items.map((item, index) => {
      const processedItem = { ...item };
      
      // Reset subsection counter at main sections
      if (item.level === 0) {
        currentSubSection = 0;
        // Check if this starts a numbered section
        inNumberedSection = /^\d+\./.test(item.title) || 
                          this.shouldStartNumbering(item.title);
      }

      if (inNumberedSection) {
        if (item.level === 0) {
          currentMainSection++;
          processedItem.title = this.ensureNumbering(item.title, currentMainSection);
        } else if (item.level === 1) {
          currentSubSection++;
          processedItem.title = this.ensureNumbering(item.title, currentMainSection, currentSubSection);
        }
      }

      // Recursively process children
      if (processedItem.children) {
        processedItem.children = this.inferNumbering(processedItem.children);
      }

      return processedItem;
    });
  }

  private static shouldStartNumbering(title: string): boolean {
    // Detect if this section should start numbered sections
    const numberingTriggers = [
      'policy',
      'guide',
      'rules',
      'procedures',
      'guidelines',
      'requirements'
    ];
    return numberingTriggers.some(trigger => 
      title.toLowerCase().includes(trigger)
    );
  }

  private static ensureNumbering(title: string, main: number, sub?: number): string {
    // Remove existing numbering if any
    const cleanTitle = title.replace(/^\d+(\.\d+)?\.?\s*/, '');
    
    // Add appropriate numbering
    const prefix = sub ? `${main}.${sub}. ` : `${main}. `;
    return prefix + cleanTitle;
  }

  private static cleanAndNormalizeItems(items: TOCItem[]): TOCItem[] {
    return items.map(item => {
      const cleanedItem = { ...item };
      let title = item.title.trim();
      
      // Skip processing if it matches excluded patterns
      if (this.EXCLUDED_PATTERNS.some(pattern => pattern.test(title))) {
        return null;
      }

      // Store original text in metadata
      if (!cleanedItem.metadata) {
        cleanedItem.metadata = {
          fontSize: 0,
          originalText: title
        };
      } else {
        cleanedItem.metadata.originalText = title;
      }

      // Fix "NaN" in section numbers
      title = title.replace(/(\d+)\.NaN\./g, '$1.');

      // Convert to sentence case if all caps
      if (title === title.toUpperCase() && title.length > 3) {
        title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
      }

      // Remove redundant spaces and normalize whitespace
      title = title.replace(/\s+/g, ' ').trim();

      // Fix ellipsis
      title = title.replace(/\.{3,}|…/g, '...');

      cleanedItem.title = title;

      // Recursively process children
      if (cleanedItem.children) {
        cleanedItem.children = this.cleanAndNormalizeItems(cleanedItem.children)
          .filter(Boolean) as TOCItem[];
      }

      return cleanedItem;
    }).filter(Boolean) as TOCItem[];
  }

  private static async enhanceWithAI(items: TOCItem[]): Promise<TOCItem[]> {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, skipping AI enhancement');
      return items;
    }

    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    const enhanceTitle = async (item: TOCItem): Promise<{ title: string; tooltip: string }> => {
      try {
        if (item.metadata?.isProcessed || item.title.length < 10) {
          return { 
            title: item.title, 
            tooltip: item.metadata?.originalText || item.title 
          };
        }

        console.log(`Enhancing title: ${item.title}`);
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: `You are an expert at creating clear, concise table of contents entries.
              Context: University residential life guide.
              
              Rules for main output (title):
              1. Maximum length: ${item.level === 0 ? 
                this.MAX_LENGTHS.MAIN_SECTION : 
                item.level === 1 ? 
                this.MAX_LENGTHS.SUB_SECTION : 
                this.MAX_LENGTHS.CONTENT} characters
              2. Must be extremely concise while preserving key meaning
              3. Use Title Case for headers (level 0-1), Sentence case for content
              4. Preserve any existing numbering
              5. Remove unnecessary words and articles
              6. Focus on key terms and actions
              
              Rules for tooltip (longer description):
              1. Maximum length: ${this.MAX_LENGTHS.TOOLTIP} characters
              2. Provide more context than the title
              3. Use complete, grammatically correct sentences
              4. End with proper punctuation
              5. Summarize the section's purpose clearly
              
              Return format:
              {
                "title": "concise title",
                "tooltip": "longer description for hover"
              }
              
              If already well-formatted, return "KEEP_ORIGINAL"`
            },
            {
              role: 'user',
              content: `Process this TOC entry (Level ${item.level}): "${item.title}"`
            }
          ]
        });

        const result = response.choices[0].message.content;
        if (result === 'KEEP_ORIGINAL') {
          return { 
            title: item.title, 
            tooltip: item.metadata?.originalText || item.title 
          };
        }

        try {
          const parsed = JSON.parse(result);
          return {
            title: parsed.title,
            tooltip: parsed.tooltip
          };
        } catch (e) {
          console.error('Error parsing AI response:', e);
          return { 
            title: item.title, 
            tooltip: item.metadata?.originalText || item.title 
          };
        }
      } catch (error) {
        console.error('Error enhancing title with AI:', error);
        return { 
          title: item.title, 
          tooltip: item.metadata?.originalText || item.title 
        };
      }
    };

    const processItem = async (item: TOCItem): Promise<TOCItem> => {
      const enhancedItem = { ...item };

      if (
        !item.metadata?.isProcessed && (
          item.title.length > (item.level <= 1 ? this.MAX_LENGTHS.SUB_SECTION : this.MAX_LENGTHS.CONTENT) ||
          !/^[A-Z]/.test(item.title) ||
          /[A-Z]{2,}/.test(item.title) ||
          item.title.includes('  ') ||
          item.title.includes('...') ||
          /^\d+\.NaN\./.test(item.title)
        )
      ) {
        const enhanced = await enhanceTitle(item);
        enhancedItem.title = enhanced.title;
        if (!enhancedItem.metadata) {
          enhancedItem.metadata = { fontSize: 0 };
        }
        enhancedItem.metadata.originalText = enhanced.tooltip;
        enhancedItem.metadata.isProcessed = true;
      }

      if (enhancedItem.children) {
        enhancedItem.children = await Promise.all(
          enhancedItem.children.map(child => processItem(child))
        );
      }

      return enhancedItem;
    };

    const enhancedItems = await Promise.all(items.map(item => processItem(item)));
    console.log('AI enhancement completed for all items');
    return enhancedItems;
  }
} 