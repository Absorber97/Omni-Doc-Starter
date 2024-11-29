'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { appConfig } from '@/config/app';
import { Sidebar } from './features/sidebar';
import { useInView } from 'react-intersection-observer';

// Initialize worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1); // Start at 100% zoom
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const observerRefs = useRef<{ [key: number]: IntersectionObserver }>({});
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const [pdfDimensions, setPdfDimensions] = useState({ width: 595, height: 842 }); // Default A4 size

  // Handle PDF load success and get actual dimensions
  async function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);

    // Load the first page to get dimensions
    const pdf = await pdfjs.getDocument(url).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    setPdfDimensions({ width: viewport.width, height: viewport.height });
  }

  // Calculate container dimensions and fit scale
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: container.width, height: container.height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate fit-to-width scale whenever container or PDF dimensions change
  useEffect(() => {
    if (containerDimensions.width && pdfDimensions.width) {
      // Calculate the scale that would fit the PDF width to the container
      // Subtract padding and margins (40px total horizontal padding)
      const fitScale = (containerDimensions.width - 40) / pdfDimensions.width;
      setScale(fitScale);
    }
  }, [containerDimensions.width, pdfDimensions.width]);

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  const LoadingPlaceholder = () => (
    <motion.div 
      className="bg-muted rounded-lg relative overflow-hidden"
      style={{
        width: Math.min(containerDimensions.width - 40, pdfDimensions.width),
        height: (pdfDimensions.width * 1.414) * (scale || 1),
      }}
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

  // Handle page visibility changes
  const handlePageVisibilityChange = useCallback((page: number, isVisible: boolean) => {
    setVisiblePages(prev => {
      const newSet = new Set(prev);
      if (isVisible) {
        newSet.add(page);
      } else {
        newSet.delete(page);
      }
      if (newSet.size > 0) {
        const lowestVisiblePage = Math.min(...Array.from(newSet));
        setCurrentPage(lowestVisiblePage);
      }
      return newSet;
    });
  }, []);

  // Create intersection observer for page visibility
  const createPageObserver = useCallback((page: number) => {
    if (typeof IntersectionObserver === 'undefined') return null;
    
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          handlePageVisibilityChange(page, entry.isIntersecting);
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    );
  }, [handlePageVisibilityChange]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar
        numPages={numPages}
        currentPage={currentPage}
        onPageChange={(page) => {
          const element = document.getElementById(`page-${page}`);
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
        scale={scale}
        onScaleChange={handleScaleChange}
        url={url}
      />

      {/* Main viewer container with overflow control */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div 
          ref={containerRef}
          className={`absolute inset-0 ${pdfViewerConfig.ui.layout.viewer.background} ${pdfViewerConfig.ui.layout.viewer.pattern} overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent`}
        >
          <motion.div 
            className="min-h-full w-full flex flex-col items-center py-8 px-5"
            layout
          >
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<LoadingPlaceholder />}
              error={
                <motion.div 
                  className="flex flex-col items-center justify-center w-full h-full bg-card text-destructive gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <RotateCw className="w-8 h-8 animate-spin" />
                  <p>Failed to load PDF</p>
                </motion.div>
              }
              className="w-full flex flex-col items-center"
            >
              {Array.from(new Array(numPages), (_, index) => (
                <motion.div
                  key={`page-${index + 1}`}
                  id={`page-${index + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full flex justify-center"
                  style={{
                    marginTop: index === 0 ? '0' : '2rem',
                  }}
                  ref={(element) => {
                    if (element) {
                      observerRefs.current[index + 1]?.disconnect();
                      const observer = createPageObserver(index + 1);
                      if (observer) {
                        observer.observe(element);
                        observerRefs.current[index + 1] = observer;
                      }
                    }
                  }}
                >
                  <div className="bg-white rounded-lg shadow-lg">
                    <Page
                      pageNumber={index + 1}
                      scale={scale}
                      loading={<LoadingPlaceholder />}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      renderMode="canvas"
                      canvasBackground="white"
                      className="max-w-full"
                    />
                  </div>
                </motion.div>
              ))}
            </Document>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 