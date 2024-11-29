'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '@/lib/utils';
import { TableOfContents } from './table-of-contents';
import { TOCItem } from '@/lib/types/pdf';

interface NavigationProps {
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  url: string;
  onPathChange: (path: string[]) => void;
}

interface PDFTextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
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

  // Extract and process outline
  useEffect(() => {
    async function generateOutline() {
      try {
        const pdf = await pdfjs.getDocument(url).promise;
        const outlineItems: TOCItem[] = [];
        
        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent: PDFTextContent = await page.getTextContent();
          
          // Process text items to find potential headings
          for (const item of textContent.items) {
            const textItem = item as PDFTextItem;
            
            // Check if text item might be a heading based on properties
            if (isHeading(textItem)) {
              outlineItems.push({
                title: textItem.str.trim(),
                pageNumber: pageNum,
                level: determineHeadingLevel(textItem),
                children: []
              });
            }
          }
        }

        // Organize items into hierarchy
        const organizedOutline = organizeOutline(outlineItems);
        console.log('Generated outline:', organizedOutline);
        setOutline(organizedOutline);
      } catch (error) {
        console.error('Error generating outline:', error);
        setOutline([]);
      }
    }

    if (url) {
      generateOutline();
    }
  }, [url]);

  // Helper functions for outline generation
  const isHeading = (item: PDFTextItem): boolean => {
    // Check text properties that might indicate a heading
    // This is a heuristic approach and might need tuning
    const fontSize = Math.abs(item.transform[0]); // Extract font size from transform matrix
    const text = item.str.trim();

    return (
      // Check for typical heading characteristics
      (fontSize > 12 && // Larger than normal text
      text.length < 100 && // Not too long
      !/^[0-9.]+$/.test(text) && // Not just numbers
      text !== '') || // Not empty
      // Check for common heading patterns
      /^(Chapter|Section|\d+\.|[IVXLCDM]+\.)\s+\w+/i.test(text) ||
      /^[A-Z][^.!?]*$/.test(text) // All caps or title case
    );
  };

  const determineHeadingLevel = (item: PDFTextItem): number => {
    const fontSize = Math.abs(item.transform[0]);
    // Determine level based on font size
    if (fontSize >= 20) return 0;
    if (fontSize >= 16) return 1;
    return 2;
  };

  const organizeOutline = (items: TOCItem[]): TOCItem[] => {
    const root: TOCItem[] = [];
    const stack: TOCItem[] = [];

    items.forEach((item) => {
      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= item.level
      ) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(item);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(item);
      }

      stack.push(item);
    });

    return root;
  };

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