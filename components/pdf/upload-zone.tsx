'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { validatePDFFile } from '@/lib/utils/pdf';
import { appConfig } from '@/config/app';
import { MESSAGES } from '@/lib/constants';

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
}

export function UploadZone({ onFileAccepted }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsValidating(true);
    setError(null);

    try {
      const validation = await validatePDFFile(file);
      if (validation.isValid) {
        onFileAccepted(file);
      } else {
        setError(validation.error || 'Invalid file');
      }
    } catch (err) {
      setError(MESSAGES.UPLOAD.ERROR);
    } finally {
      setIsValidating(false);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <motion.div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8
          transition-colors duration-200 ease-in-out
          flex flex-col items-center justify-center
          min-h-[200px] cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${error ? 'border-destructive' : ''}
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {isValidating ? (
            <motion.div
              key="validating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="animate-spin">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Validating PDF...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-destructive"
            >
              <AlertCircle className="w-10 h-10" />
              <p>{error}</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <p className="text-xl font-medium flex items-center gap-2">
                Drop your PDF here {appConfig.emoji.upload}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to select a file
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 