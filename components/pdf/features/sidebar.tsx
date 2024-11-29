'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Layers, 
  Settings2
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
              <Tabs
                defaultValue="navigation"
                className="flex-1"
                onValueChange={(value) => setActiveSection(value as 'navigation' | 'ai')}
              >
                <div className="px-4">
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