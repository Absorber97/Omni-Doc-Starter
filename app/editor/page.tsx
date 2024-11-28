'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PDFViewer } from '@/components/pdf/viewer';
import { ROUTES, MESSAGES } from '@/lib/constants';
import { usePDFStore } from '@/lib/store/pdf-store';

export default function EditorPage() {
  const router = useRouter();
  const { url } = usePDFStore();

  useEffect(() => {
    if (!url) {
      router.push(ROUTES.UPLOAD);
    }
  }, [url, router]);

  if (!url) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <p className="text-muted-foreground">{MESSAGES.EDITOR.EMPTY}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container py-8"
    >
      <PDFViewer url={url} />
    </motion.div>
  );
} 