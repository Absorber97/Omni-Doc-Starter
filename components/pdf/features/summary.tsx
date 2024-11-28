'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';

interface SummaryProps {
  url: string;
  currentPage: number;
  isLoading: boolean;
  onBack: () => void;
}

export function Summary({ url, currentPage, isLoading }: SummaryProps) {
  const summaryConfig = pdfViewerConfig.features.ai.features.summary;
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    async function processSummary() {
      try {
        // Here you would process the PDF and generate summary
        // For now, we'll use dummy data
        setSummary(
          "This is a sample summary of the document. It provides a brief overview of the main points and key takeaways. The summary helps readers quickly understand the content without reading the entire document."
        );
      } catch (error) {
        console.error('Error processing summary:', error);
      }
    }

    processSummary();
  }, [url, currentPage]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-4 bg-muted rounded"
              style={{ width: `${85 + Math.random() * 15}%` }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </motion.div>
          ))}
        </motion.div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 transition-all hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <div className={`p-2 ${getFeatureColorClass(summaryConfig.color)} rounded-lg`}>
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-medium">
              Summary {summaryConfig.emoji}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
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