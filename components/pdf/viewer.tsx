'use client';

import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/config/app';
import { pdfjs } from 'react-pdf';

// Import worker styles
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Initialize worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(appConfig.editor.defaultZoom);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const nextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const zoomIn = () => {
    if (scale < appConfig.editor.maxZoom) {
      setScale(scale + appConfig.editor.zoomStep);
    }
  };

  const zoomOut = () => {
    if (scale > appConfig.editor.minZoom) {
      setScale(scale - appConfig.editor.zoomStep);
    }
  };

  if (!isClient) {
    return (
      <div className="animate-pulse bg-muted rounded-lg w-[595px] h-[842px]" />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 p-2 bg-card rounded-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={previousPage}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[100px] text-center">
          Page {pageNumber} of {numPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextPage}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          disabled={scale <= appConfig.editor.minZoom}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          disabled={scale >= appConfig.editor.maxZoom}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="animate-pulse bg-muted rounded-lg w-[595px] h-[842px]" />
          }
          error={
            <div className="flex items-center justify-center w-[595px] h-[842px] bg-card text-destructive">
              Failed to load PDF
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading={
              <div className="animate-pulse bg-muted rounded-lg w-[595px] h-[842px]" />
            }
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
} 