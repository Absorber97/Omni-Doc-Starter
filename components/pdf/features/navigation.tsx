'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '@/lib/utils';
import { TableOfContents } from './table-of-contents';
import { TOCItem, PDFTextItem } from '@/lib/types/pdf';
import { TOCProcessor } from '@/lib/services/toc-processor';

interface NavigationProps {
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  url: string;
  onPathChange: (path: string[]) => void;
}

interface PDFTextContent {
  items: PDFTextItem[];
  styles: Record<string, any>;
}

export function Navigation({ numPages, currentPage, onPageChange, url, onPathChange }: NavigationProps) {
  const [outline, setOutline] = useState<TOCItem[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(true);
  const [visiblePage, setVisiblePage] = useState(currentPage);
  
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // Update visible page when currentPage changes
  useEffect(() => {
    setVisiblePage(currentPage);
  }, [currentPage]);

  // Extract and process outline with enhanced processor
  useEffect(() => {
    async function generateOutline() {
      try {
        const pdf = await pdfjs.getDocument(url).promise;
        let outlineItems: TOCItem[] = [];
        
        // Try to get PDF's built-in outline first
        const pdfOutline = await pdf.getOutline();
        
        if (pdfOutline && pdfOutline.length > 0) {
          // Process built-in outline
          outlineItems = await processBuiltInOutline(pdf, pdfOutline);
        } else {
          // Generate outline from content
          outlineItems = await generateOutlineFromContent(pdf);
        }

        // Process through enhanced TOC processor
        const processedOutline = await TOCProcessor.processTableOfContents(outlineItems);
        console.log('Enhanced outline:', processedOutline);
        setOutline(processedOutline);
      } catch (error) {
        console.error('Error generating outline:', error);
        setOutline([]);
      }
    }

    if (url) {
      generateOutline();
    }
  }, [url]);

  async function processBuiltInOutline(pdf: any, pdfOutline: any[]): Promise<TOCItem[]> {
    const processItem = async (item: any, level: number = 0): Promise<TOCItem> => {
      let pageNumber = 1;
      try {
        if (item.dest) {
          const dest = await pdf.getDestination(item.dest);
          const pageRef = await pdf.getPageIndex(dest[0]);
          pageNumber = pageRef + 1;
        }
      } catch (error) {
        console.warn('Error processing outline destination:', error);
      }

      return {
        title: item.title || 'Untitled Section',
        pageNumber,
        level,
        dest: item.dest,
        children: item.items ? 
          await Promise.all(item.items.map((child: any) => 
            processItem(child, level + 1)
          )) : undefined
      };
    };

    return Promise.all(pdfOutline.map(item => processItem(item)));
  }

  async function generateOutlineFromContent(pdf: any): Promise<TOCItem[]> {
    const items: TOCItem[] = [];
    const fontSizeFrequency = new Map<number, number>();
    
    // First pass: analyze font sizes
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      for (const item of content.items) {
        const textItem = item as PDFTextItem;
        const fontSize = Math.abs(textItem.transform[0]);
        fontSizeFrequency.set(fontSize, (fontSizeFrequency.get(fontSize) || 0) + 1);
      }
    }

    // Determine body text font size
    const bodyFontSize = Array.from(fontSizeFrequency.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Second pass: extract headings
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      let pendingHeading = '';
      let lastY = -1;
      let lastFontSize = -1;
      
      for (const item of content.items) {
        const textItem = item as PDFTextItem;
        const fontSize = Math.abs(textItem.transform[0]);
        const y = textItem.transform[5];
        const text = textItem.str.trim();

        if (!text || /^[\d.]+$/.test(text)) continue;

        if (isHeadingCandidate(textItem, bodyFontSize)) {
          if (pendingHeading) {
            items.push({
              title: pendingHeading.trim(),
              pageNumber: pageNum,
              level: determineHeadingLevel(lastFontSize, bodyFontSize),
              children: []
            });
          }

          pendingHeading = text;
          lastY = y;
          lastFontSize = fontSize;
        } else if (
          pendingHeading && 
          Math.abs(y - lastY) < 5 && 
          fontSize === lastFontSize
        ) {
          pendingHeading += ' ' + text;
        } else if (pendingHeading) {
          items.push({
            title: pendingHeading.trim(),
            pageNumber: pageNum,
            level: determineHeadingLevel(lastFontSize, bodyFontSize),
            children: []
          });
          pendingHeading = '';
        }
      }

      if (pendingHeading) {
        items.push({
          title: pendingHeading.trim(),
          pageNumber: pageNum,
          level: determineHeadingLevel(lastFontSize, bodyFontSize),
          children: []
        });
      }
    }

    return items.filter(item => 
      item.title.length >= 3 && 
      item.title.length <= 200 &&
      !/^(page|figure|table)\s+\d+$/i.test(item.title)
    );
  }

  function isHeadingCandidate(textItem: PDFTextItem, bodyFontSize: number): boolean {
    const fontSize = Math.abs(textItem.transform[0]);
    const text = textItem.str.trim();
    
    if (fontSize <= bodyFontSize) return false;
    if (text.length < 3 || text.length > 200) return false;
    if (/^[\d.]+$/.test(text)) return false;

    const headingPatterns = [
      /^(Chapter|Section|\d+\.|[IVXLCDM]+\.)\s+\w+/i,
      /^(Introduction|Conclusion|Abstract|Summary|References|Appendix)/i,
      /^[\d.]+\s+[A-Z]/,
      /^[A-Z][^.!?]*$/
    ];

    return headingPatterns.some(pattern => pattern.test(text)) ||
           fontSize >= bodyFontSize * 1.2;
  }

  function determineHeadingLevel(fontSize: number, bodyFontSize: number): number {
    const sizeRatio = fontSize / bodyFontSize;
    if (sizeRatio >= 1.5) return 0;
    if (sizeRatio >= 1.3) return 1;
    return 2;
  }

  // Scroll to current page thumbnail
  useEffect(() => {
    if (isAutoScrolling.current) return;
    
    const currentThumbnail = thumbnailRefs.current[currentPage - 1];
    const viewport = viewportRef.current;

    if (currentThumbnail && viewport) {
      isAutoScrolling.current = true;
      const thumbnailTop = currentThumbnail.offsetTop;
      const viewportHeight = viewport.clientHeight;
      
      viewport.scrollTo({
        top: thumbnailTop - (viewportHeight / 2) + 100,
        behavior: 'smooth'
      });

      // Update visible page immediately
      setVisiblePage(currentPage);

      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 300);
    }
  }, [currentPage]);

  // Handle scroll events to update visible page
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      if (isAutoScrolling.current) return;

      const viewportRect = viewport.getBoundingClientRect();
      const viewportCenter = viewportRect.top + viewportRect.height / 2;

      // Find the thumbnail most visible in the viewport
      let closestDistance = Infinity;
      let closestPage = visiblePage;

      thumbnailRefs.current.forEach((thumbnail, index) => {
        if (thumbnail) {
          const thumbRect = thumbnail.getBoundingClientRect();
          const thumbCenter = thumbRect.top + thumbRect.height / 2;
          const distance = Math.abs(viewportCenter - thumbCenter);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = index + 1;
          }
        }
      });

      if (closestPage !== visiblePage) {
        setVisiblePage(closestPage);
        onPageChange(closestPage);
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [visiblePage, onPageChange]);

  const renderOutlineItem = (item: any, level: number = 0) => (
    <motion.div
      key={item.title}
      className="ml-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: level * 0.1 }}
    >
      <button
        className={cn(
          "flex items-center gap-2 py-1 text-sm hover:text-primary transition-colors w-full text-left",
          level === 0 && "font-medium"
        )}
        onClick={() => {
          if (item.dest) {
            onPageChange(item.dest[0]);
          }
        }}
      >
        <span className="flex-1 truncate">{item.title}</span>
      </button>
      {item.items?.length > 0 && (
        <div className="ml-4 border-l">
          {item.items.map((subItem: any) => renderOutlineItem(subItem, level + 1))}
        </div>
      )}
    </motion.div>
  );

  const renderThumbnails = () => (
    <div className="flex flex-col gap-3 pb-4">
      {Array.from(new Array(numPages), (_, index) => (
        <motion.div
          key={`thumb-${index + 1}`}
          ref={(el) => {
            thumbnailRefs.current[index] = el;
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative cursor-pointer rounded-lg p-0.5",
            visiblePage === index + 1 && "bg-primary/20"
          )}
          onClick={() => onPageChange(index + 1)}
        >
          <Card 
            className={cn(
              "overflow-hidden rounded-md",
              visiblePage === index + 1 && "ring-1 ring-primary ring-inset"
            )}
          >
            <div className="relative w-full">
              <Document file={url} loading={null}>
                <Page
                  pageNumber={index + 1}
                  width={200}
                  scale={1}
                  className="w-full h-auto rounded-t-md"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div 
                      className="w-full h-[282px] animate-pulse bg-muted rounded-t-md"
                    />
                  }
                />
              </Document>
              <div 
                className={cn(
                  "absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1.5 text-center text-xs rounded-b-md",
                  visiblePage === index + 1 && "text-primary font-medium"
                )}
              >
                Page {index + 1}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Table of Contents - 75% width */}
      <div className="flex-[3] flex flex-col min-h-0">
        <h3 className="font-medium mb-4">Table of Contents</h3>
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <TableOfContents
                items={outline}
                currentPage={currentPage}
                onPageChange={onPageChange}
              />
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Thumbnails - 25% width */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="font-medium mb-4">Thumbnails</h3>
        <Card className="flex-1 overflow-hidden">
          <ScrollArea>
            <div 
              ref={viewportRef}
              className="h-[calc(100vh-12rem)] overflow-y-auto"
              data-testid="thumbnail-viewport"
            >
              <div className="p-4">
                {renderThumbnails()}
              </div>
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
} 