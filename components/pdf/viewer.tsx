'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  Lightbulb,
  FileText,
  MessageSquare,
  ScrollText,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Concepts } from './features/concepts';
import { Summary } from './features/summary';
import { Flashcards } from './features/flashcards';
import { Chat } from './features/chat';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { processPDFContent } from '@/lib/pdf-processing';
import { appConfig } from '@/config/app';

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
  const [scale, setScale] = useState<number>(pdfViewerConfig.features.defaultZoom);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [features, setFeatures] = useState<{
    concepts: Array<{ text: string; type: 'must-know' | 'good-to-know' | 'optional'; }>;
    summary: string;
    flashcards: Array<{ question: string; answer: string; }>;
  }>({
    concepts: [],
    summary: '',
    flashcards: []
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  async function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    
    try {
      setIsProcessing(true);
      
      // Extract text content from PDF
      const pdf = await fetch(url).then(res => res.arrayBuffer());
      const pdfDoc = await pdfjs.getDocument({ data: pdf }).promise;
      const page = await pdfDoc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(' ');

      // Process content with AI
      const result = await processPDFContent(text, {
        url,
        page: pageNumber,
        totalPages: numPages
      });

      setFeatures({
        concepts: result.concepts,
        summary: result.summary,
        flashcards: result.flashcards
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  const nextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(prev => prev - 1);
    }
  };

  const zoomIn = () => {
    if (scale < pdfViewerConfig.features.maxZoom) {
      setScale(prev => prev + pdfViewerConfig.features.zoomStep);
    }
  };

  const zoomOut = () => {
    if (scale > pdfViewerConfig.features.minZoom) {
      setScale(prev => prev - pdfViewerConfig.features.zoomStep);
    }
  };

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
    <div className="flex">
      <motion.div 
        className="flex-1 flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="flex items-center gap-2 p-2 bg-card rounded-lg border shadow-sm"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous Page</TooltipContent>
            </Tooltip>

            <div className="min-w-[120px] text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${pageNumber}-${numPages}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="font-medium"
                >
                  Page {pageNumber} of {numPages}
                </motion.span>
              </AnimatePresence>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextPage}
                  disabled={pageNumber >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next Page</TooltipContent>
            </Tooltip>

            <div className="mx-2 h-6 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomOut}
                  disabled={scale <= pdfViewerConfig.features.minZoom}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <div className="min-w-[60px] text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={scale}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium"
                >
                  {Math.round(scale * 100)}%
                </motion.span>
              </AnimatePresence>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomIn}
                  disabled={scale >= pdfViewerConfig.features.maxZoom}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>

            <div className="mx-2 h-6 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download PDF</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        <motion.div 
          className="border rounded-lg p-4 bg-card shadow-lg"
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

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg"
          >
            <Settings2 className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>AI Features {appConfig.emoji.ai}</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="concepts" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="concepts" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Concepts</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="flex items-center gap-2">
                <ScrollText className="h-4 w-4" />
                <span className="hidden sm:inline">Flashcards</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="concepts">
                <Concepts concepts={features.concepts} isLoading={isProcessing} />
              </TabsContent>
              <TabsContent value="summary">
                <Summary summary={features.summary} isLoading={isProcessing} />
              </TabsContent>
              <TabsContent value="flashcards">
                <Flashcards flashcards={features.flashcards} isLoading={isProcessing} />
              </TabsContent>
              <TabsContent value="chat">
                <Chat pageNumber={pageNumber} url={url} />
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
} 