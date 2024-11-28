import { PDFDocument } from 'pdf-lib';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, MESSAGES } from '@/lib/constants';

export type FileValidationResult = {
  isValid: boolean;
  error?: string;
};

export const validatePDFFile = async (file: File): Promise<FileValidationResult> => {
  // Check file type
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return { isValid: false, error: MESSAGES.UPLOAD.TYPE_ERROR };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: MESSAGES.UPLOAD.SIZE_ERROR };
  }

  // Validate PDF structure
  try {
    const arrayBuffer = await file.arrayBuffer();
    await PDFDocument.load(arrayBuffer);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid PDF structure' };
  }
};

export const extractPDFMetadata = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle() || file.name,
    author: pdfDoc.getAuthor() || 'Unknown',
    creationDate: pdfDoc.getCreationDate() || new Date(),
    modificationDate: pdfDoc.getModificationDate() || new Date(),
  };
}; 