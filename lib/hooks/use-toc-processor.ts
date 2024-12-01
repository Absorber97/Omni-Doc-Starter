import { useState, useCallback } from 'react';
import { TOCItem } from '@/lib/types/pdf';
import { useTOCStore } from '@/lib/store/toc-store';
import { processTOCWithAI } from '@/lib/services/toc-processor';

export function useTOCProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { 
    setProcessingStatus, 
    setAIProcessedItems,
    isAIProcessed,
    aiProcessedItems
  } = useTOCStore();

  const processItems = useCallback(async (items: TOCItem[]) => {
    if (!items?.length) return null;
    
    // Skip if we already have processed items
    if (isAIProcessed && aiProcessedItems.length > 0) {
      console.log(' Using existing AI items:', aiProcessedItems.length);
      return aiProcessedItems;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus({ isProcessing: true, error: null });

      console.log('🔄 Starting AI processing...');
      const processed = await processTOCWithAI(items);
      
      if (processed?.length) {
        console.log('✅ AI processing complete, storing results');
        setAIProcessedItems(processed);
      }

      return processed;
    } catch (error) {
      console.error('❌ AI processing error:', error);
      setProcessingStatus({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    } finally {
      setIsProcessing(false);
      setProcessingStatus({ isProcessing: false });
    }
  }, [setProcessingStatus, setAIProcessedItems, isAIProcessed, aiProcessedItems]);

  return { processItems, isProcessing };
} 