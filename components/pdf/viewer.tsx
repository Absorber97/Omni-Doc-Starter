'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { processPDFContent } from '@/lib/pdf-processing';
import { appConfig } from '@/config/app';
import { Sidebar } from './features/sidebar';

// Initialize worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(pdfViewerConfig.features.navigation.controls.zoom.default);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  async function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  const LoadingPlaceholder = () => (
    <motion.div 
      className="bg-muted rounded-lg w-[595px] h-[842px] relative overflow-hidden"
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
    </motion.div>
  );

  if (!isClient) {
    return <LoadingPlaceholder />;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <Sidebar
        numPages={numPages}
        currentPage={pageNumber}
        onPageChange={setPageNumber}
        scale={scale}
        onScaleChange={setScale}
        url={url}
      />

      <motion.div 
        className={`flex-1 ${pdfViewerConfig.ui.layout.viewer.background} ${pdfViewerConfig.ui.layout.viewer.pattern} ${pdfViewerConfig.ui.layout.viewer.padding}`}
      >
        <motion.div 
          className="h-full flex items-center justify-center overflow-auto"
          layout
        >
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<LoadingPlaceholder />}
            error={
              <motion.div 
                className="flex flex-col items-center justify-center w-[595px] h-[842px] bg-card text-destructive gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <RotateCw className="w-8 h-8 animate-spin" />
                <p>Failed to load PDF</p>
              </motion.div>
            }
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoading ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                loading={<LoadingPlaceholder />}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </motion.div>
          </Document>
        </motion.div>
      </motion.div>
    </div>
  );
} 