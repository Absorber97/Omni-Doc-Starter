'use client';

import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/pdf/upload-zone';
import { ROUTES } from '@/lib/constants';
import { motion } from 'framer-motion';

export default function UploadPage() {
  const router = useRouter();

  const handleFileAccepted = async (file: File) => {
    // TODO: Implement file upload to Supabase
    // For now, we'll just redirect to the editor
    router.push(ROUTES.EDITOR);
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