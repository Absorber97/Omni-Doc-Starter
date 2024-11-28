'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { Document, Page, pdfjs } from 'react-pdf';

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
    <div className="grid grid-cols-2 gap-2">
      {Array.from(new Array(numPages), (_, index) => (
        <motion.div
          key={`thumb-${index + 1}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative cursor-pointer"
          onClick={() => onPageChange(index + 1)}
        >
          <Card className={`overflow-hidden ${currentPage === index + 1 ? 'ring-2 ring-primary' : ''}`}>
            <Document file={url} loading={null}>
              <Page
                pageNumber={index + 1}
                width={thumbnailConfig.size.width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div 
                    className="animate-pulse bg-muted" 
                    style={{
                      width: thumbnailConfig.size.width,
                      height: thumbnailConfig.size.height
                    }}
                  />
                }
              />
            </Document>
            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1 text-center text-xs">
              Page {index + 1}
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
        className={`flex items-center gap-2 py-1 text-sm hover:text-primary transition-colors ${
          level === 0 ? 'font-medium' : ''
        }`}
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
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Table of Contents</h3>
        <ScrollArea className="h-[200px]">
          {outline.length > 0 ? (
            <div className="space-y-2">
              {outline.map((item) => renderOutlineItem(item))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No table of contents available
            </div>
          )}
        </ScrollArea>
      </div>

      <div>
        <h3 className="font-medium mb-4">Thumbnails</h3>
        <ScrollArea className="h-[400px]">
          {renderThumbnails()}
        </ScrollArea>
      </div>
    </div>
  );
} 