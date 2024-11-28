'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { pdfViewerConfig } from '@/config/pdf-viewer';

interface SummaryProps {
  summary: string;
  isLoading: boolean;
}

export function Summary({ summary, isLoading }: SummaryProps) {
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
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-medium">
              Summary {pdfViewerConfig.features.summary.emoji}
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