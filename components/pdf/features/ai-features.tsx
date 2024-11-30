'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  FileText, 
  LayoutGrid, 
  MessageSquare,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { KeyConcepts } from './key-concepts';
import { Summary } from './summary';
import { Flashcards } from './flashcards';
import { Chat } from './chat';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from './error-boundary';

interface AIFeaturesProps {
  url: string;
  currentPage: number;
  onPathChange: (path: string[]) => void;
}

type Feature = {
  id: 'concepts' | 'summary' | 'flashcards' | 'chat';
  icon: React.ElementType;
  label: string;
  description: string;
  component: React.ComponentType<{
    url: string;
    currentPage: number;
    isLoading: boolean;
    onBack: () => void;
  }>;
};

export function AIFeatures({ url, currentPage, onPathChange }: AIFeaturesProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature['id'] | null>(null);

  const features: Feature[] = [
    {
      id: 'concepts',
      icon: Lightbulb,
      label: 'Key Concepts',
      description: 'Extract main ideas and concepts',
      component: KeyConcepts,
    },
    {
      id: 'summary',
      icon: FileText,
      label: 'Summary',
      description: 'Get a concise summary',
      component: Summary,
    },
    {
      id: 'flashcards',
      icon: LayoutGrid,
      label: 'Flashcards',
      description: 'Create study flashcards',
      component: Flashcards,
    },
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Chat',
      description: 'Ask questions about the document',
      component: Chat,
    },
  ];

  const renderBreadcrumb = () => {
    if (!selectedFeature) return null;
    
    const feature = features.find(f => f.id === selectedFeature);
    if (!feature) return null;

    return (
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelectedFeature(null);
            onPathChange(['ai']);
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          AI Features
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{feature.label}</span>
      </div>
    );
  };

  const renderFeatureContent = () => {
    if (!selectedFeature) return null;
    
    const feature = features.find(f => f.id === selectedFeature);
    if (!feature) return null;

    const FeatureComponent = feature.component;
    return (
      <ErrorBoundary>
        <FeatureComponent
          url={url}
          currentPage={currentPage}
          isLoading={false}
          onBack={() => {
            setSelectedFeature(null);
            onPathChange(['ai']);
          }}
        />
      </ErrorBoundary>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {!selectedFeature ? (
        <div className="grid grid-cols-2 gap-4 p-1">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className={cn(
                "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                "flex flex-col items-center justify-center text-center gap-2"
              )}
              onClick={() => {
                setSelectedFeature(feature.id);
                onPathChange(['ai', feature.id]);
              }}
            >
              <feature.icon className="h-8 w-8 mb-2 text-muted-foreground" />
              <h3 className="font-medium">{feature.label}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {renderBreadcrumb()}
              {renderFeatureContent()}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
} 