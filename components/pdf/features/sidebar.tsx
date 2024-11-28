'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Layers, 
  Settings2,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { Navigation } from './navigation';
import { AIFeatures } from './ai-features';

interface SidebarProps {
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  url: string;
}

export function Sidebar({ 
  numPages, 
  currentPage, 
  onPageChange, 
  scale,
  onScaleChange,
  url 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<'navigation' | 'ai'>('navigation');
  const [activePath, setActivePath] = useState<string[]>([]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handlePathChange = (newPath: string[]) => {
    setActivePath(newPath);
  };

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
    <motion.div
      className={`relative h-full ${pdfViewerConfig.ui.layout.sidebar.background} ${pdfViewerConfig.ui.layout.sidebar.border} ${pdfViewerConfig.ui.layout.sidebar.shadow}`}
      initial={false}
      animate={{
        width: isCollapsed ? '0' : pdfViewerConfig.features.navigation.sidebar.defaultWidth,
        opacity: isCollapsed ? 0 : 1
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-10 top-4"
        onClick={toggleSidebar}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex h-full flex-col">
              <div className={pdfViewerConfig.ui.layout.controls.group + ' m-4'}>
                <TooltipProvider>
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

                    <div className={pdfViewerConfig.ui.layout.controls.divider} />

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

                    <div className={pdfViewerConfig.ui.layout.controls.divider} />

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TooltipProvider>
              </div>

              <div className="border-b p-4">
                <Breadcrumb>
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={() => handlePathChange([])}>
                      {activeSection === 'navigation' ? 'Navigation' : 'AI Features'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {activePath.map((path, index) => (
                    <BreadcrumbItem key={path}>
                      <BreadcrumbLink 
                        onClick={() => handlePathChange(activePath.slice(0, index + 1))}
                      >
                        {path}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  ))}
                </Breadcrumb>
              </div>

              <Tabs
                defaultValue="navigation"
                className="flex-1"
                onValueChange={(value) => setActiveSection(value as 'navigation' | 'ai')}
              >
                <div className="border-b px-4">
                  <TabsList className={pdfViewerConfig.ui.components.tabs.base}>
                    <TabsTrigger value="navigation" className="flex items-center gap-2 flex-1">
                      <Layers className="h-4 w-4" />
                      <span>Navigation</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2 flex-1">
                      <Settings2 className="h-4 w-4" />
                      <span>AI Features</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <TabsContent value="navigation" className="mt-0">
                    <Navigation
                      numPages={numPages}
                      currentPage={currentPage}
                      onPageChange={onPageChange}
                      url={url}
                      onPathChange={handlePathChange}
                    />
                  </TabsContent>
                  <TabsContent value="ai" className="mt-0">
                    <AIFeatures
                      url={url}
                      currentPage={currentPage}
                      onPathChange={handlePathChange}
                    />
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 