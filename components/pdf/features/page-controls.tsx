'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { truncateText } from '@/lib/utils/text';
import { usePDFStore } from '@/lib/store/pdf-store';

interface PageControlsProps {
  currentPage: number;
  numPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
}

export function PageControls({
  currentPage,
  numPages,
  scale,
  onPageChange,
  onScaleChange,
}: PageControlsProps) {
  const filename = usePDFStore((state) => state.filename);
  const truncatedFileName = truncateText(filename, 40, 'middle');

  const zoomIn = () => {
    if (scale < pdfViewerConfig.features.navigation.controls.zoom.max) {
      onScaleChange(scale + pdfViewerConfig.features.navigation.controls.zoom.step);
    }
  };

  const zoomOut = () => {
    if (scale > pdfViewerConfig.features.navigation.controls.zoom.min) {
      onScaleChange(scale - pdfViewerConfig.features.navigation.controls.zoom.step);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between max-w-full mx-auto">
        <TooltipProvider>
          <div className={`${pdfViewerConfig.ui.layout.controls.group} w-full`}>
            <div className="flex items-center justify-between w-full space-x-4">
              {/* File name section */}
              <div className="flex items-center space-x-2 min-w-0 max-w-[40%]">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate text-sm font-medium">
                      {truncatedFileName}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {filename}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Page controls section */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <span className={pdfViewerConfig.ui.layout.controls.label}>
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage >= numPages}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom controls section */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={zoomOut}
                  disabled={scale <= pdfViewerConfig.features.navigation.controls.zoom.min}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className={pdfViewerConfig.ui.layout.controls.label}>
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={zoomIn}
                  disabled={scale >= pdfViewerConfig.features.navigation.controls.zoom.max}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
} 