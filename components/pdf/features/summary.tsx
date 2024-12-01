'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ChevronRight, Star, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';
import { useSummaryStore } from '@/lib/store/summary-store';
import { SummaryProcessor } from '@/lib/services/summary-processor';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryProps {
  url: string;
  currentPage: number;
  isLoading: boolean;
  onBack: () => void;
}

const summaryProcessor = new SummaryProcessor();

const sectionIcons = {
  keyPoints: Star,
  mainFindings: Lightbulb,
  conclusions: CheckCircle,
};

const importanceColors = {
  high: 'text-red-500 dark:text-red-400',
  medium: 'text-yellow-500 dark:text-yellow-400',
  low: 'text-blue-500 dark:text-blue-400',
};

export function Summary({ url, currentPage, isLoading: parentLoading }: SummaryProps) {
  const summaryConfig = pdfViewerConfig.features.ai.features.summary;
  const { 
    summary, 
    setSummary, 
    getSummary,
    isLoading,
    error,
    setLoading,
    setError 
  } = useSummaryStore();

  useEffect(() => {
    let mounted = true;
    const processor = new SummaryProcessor();

    async function processSummary() {
      try {
        const storedSummary = getSummary();
        if (storedSummary) {
          console.log('📚 Using stored summary');
          return;
        }

        setLoading(true);
        console.log('🔄 Generating new summary');
        const newSummary = await processor.generateSummary(url);
        if (mounted) {
          setSummary(newSummary);
        }
      } catch (error) {
        console.error('❌ Error processing summary:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to generate summary');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (url) {
      processSummary();
    }

    return () => {
      mounted = false;
      processor.cleanup().catch(console.error);
    };
  }, [url, setSummary, getSummary, setLoading, setError]);

  if (parentLoading || isLoading) {
    return <SummaryLoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">Error: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Overview Section */}
        <Card className="p-6 transition-all hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <div className={`p-2 ${getFeatureColorClass(summaryConfig.color)} rounded-lg`}>
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                Document Overview {summaryConfig.emoji}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summary?.overview || "No overview available"}
              </p>
            </div>
          </div>
        </Card>

        {/* Sections */}
        {summary && (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4 pr-4">
              {Object.entries(sectionIcons).map(([section, Icon]) => (
                <SummarySection
                  key={section}
                  title={section.replace(/([A-Z])/g, ' $1').trim()}
                  items={summary[section as keyof typeof sectionIcons] || []}
                  Icon={Icon}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function SummarySection({ title, items, Icon }: { 
  title: string; 
  items: SummarySection[];
  Icon: typeof Star;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4">
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4" />
          {title}
        </h4>
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 group"
            >
              <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.emoji} {item.title}</span>
                  <Badge variant="outline" className={importanceColors[item.importance]}>
                    {item.importance}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function SummaryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Card>
      
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <div className="space-y-4">
            {[1, 2].map((j) => (
              <div key={j} className="flex gap-2">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function getFeatureColorClass(color: string) {
  switch (color) {
    case 'blue':
      return 'bg-blue-100 dark:bg-blue-900/20';
    case 'green':
      return 'bg-green-100 dark:bg-green-900/20';
    case 'orange':
      return 'bg-orange-100 dark:bg-orange-900/20';
    case 'purple':
      return 'bg-purple-100 dark:bg-purple-900/20';
    default:
      return 'bg-gray-100 dark:bg-gray-900/20';
  }
} 