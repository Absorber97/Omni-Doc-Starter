'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '@/lib/utils';

interface NavigationProps {
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  url: string;
  onPathChange: (path: string[]) => void;
}

export function Navigation({ numPages, currentPage, onPageChange, url, onPathChange }: NavigationProps) {
  const [outline, setOutline] = useState<any[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(true);
  const [visiblePage, setVisiblePage] = useState(currentPage);
  
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // Update visible page when currentPage changes
  useEffect(() => {
    setVisiblePage(currentPage);
  }, [currentPage]);

  // Load outline
  useEffect(() => {
    async function getOutline() {
      try {
        const pdf = await pdfjs.getDocument(url).promise;
        const outline = await pdf.getOutline();
        setOutline(outline || []);
      } catch (error) {
        console.error('Error loading outline:', error);
      }
    }
    getOutline();
  }, [url]);

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
              {outline.length > 0 ? (
                <div className="space-y-2">
                  {outline.map((item) => renderOutlineItem(item))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No table of contents available
                </div>
              )}
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