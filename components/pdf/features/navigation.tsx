'use client';

import { useState, useEffect } from 'react';
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
  const thumbnailConfig = pdfViewerConfig.features.navigation.controls.thumbnails;

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

  const renderThumbnails = () => (
    <div className="flex flex-col gap-3 min-h-full pb-4">
      {Array.from(new Array(numPages), (_, index) => (
        <motion.div
          key={`thumb-${index + 1}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative cursor-pointer rounded-lg p-0.5",
            currentPage === index + 1 && "bg-primary/20"
          )}
          onClick={() => onPageChange(index + 1)}
        >
          <Card 
            className={cn(
              "overflow-hidden",
              currentPage === index + 1 && "ring-1 ring-primary ring-inset"
            )}
          >
            <div className="relative w-full">
              <Document file={url} loading={null}>
                <Page
                  pageNumber={index + 1}
                  width={200}
                  scale={1}
                  className="w-full h-auto"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div 
                      className="w-full h-[282px] animate-pulse bg-muted"
                    />
                  }
                />
              </Document>
              <div 
                className={cn(
                  "absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1.5 text-center text-xs",
                  currentPage === index + 1 && "bg-primary/20 text-primary"
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

  return (
    <div className="flex gap-4 h-[calc(100vh-14rem)]">
      {/* Table of Contents - 75% width */}
      <div className="flex-[3] flex flex-col">
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
      <div className="flex-1 flex flex-col">
        <h3 className="font-medium mb-4">Thumbnails</h3>
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {renderThumbnails()}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
} 