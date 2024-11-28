'use client';

import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/pdf/upload-zone';
import { ROUTES } from '@/lib/constants';
import { motion } from 'framer-motion';
import { usePDFStore } from '@/lib/store/pdf-store';
import { extractPDFMetadata } from '@/lib/utils/pdf';

export default function UploadPage() {
  const router = useRouter();
  const { setURL, setMetadata } = usePDFStore();

  const handleFileAccepted = async (file: File) => {
    try {
      // Create object URL for the PDF
      const url = URL.createObjectURL(file);
      setURL(url);

      // Extract and store metadata
      const metadata = await extractPDFMetadata(file);
      setMetadata({
        title: metadata.title,
        author: metadata.author,
        pageCount: metadata.pageCount,
      });

      // Navigate to editor
      router.push(ROUTES.EDITOR);
    } catch (error) {
      console.error('Error processing PDF:', error);
      // TODO: Show error toast
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Upload Your PDF</h1>
        <p className="text-muted-foreground">
          Start by uploading a PDF document to begin exploring with AI
        </p>
      </div>

      <UploadZone onFileAccepted={handleFileAccepted} />
    </motion.div>
  );
} 