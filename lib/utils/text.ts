/**
 * Truncates text based on maximum length and position of ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length of the truncated text
 * @param position Position to place the ellipsis
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, position: 'start' | 'middle' | 'end' = 'end'): string {
  if (!text || text.length <= maxLength) return text;
  
  switch (position) {
    case 'start':
      return '...' + text.slice(text.length - maxLength + 3);
    case 'middle': {
      const sideLength = Math.floor((maxLength - 3) / 2);
      return text.slice(0, sideLength) + '...' + text.slice(text.length - sideLength);
    }
    default:
      return text.slice(0, maxLength - 3) + '...';
  }
}

/**
 * Extracts and formats filename from URL, blob URL, or File object
 * @param source URL, blob URL, or File object
 * @returns Original filename or fallback text
 */
export function getFileNameFromUrl(source: string | File): string {
  // Get filename from store
  const filename = usePDFStore.getState().filename;
  return filename || 'PDF Document';
}

/**
 * Stores the original filename for blob URLs
 * Key: blob URL, Value: original filename
 */
export const blobFileNames = new Map<string, string>();

/**
 * Registers a blob URL with its original filename
 * @param blobUrl Blob URL
 * @param fileName Original filename
 */
export function registerBlobFileName(blobUrl: string, fileName: string): void {
  blobFileNames.set(blobUrl, fileName);
} 