'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, RefreshCw } from 'lucide-react';

interface LearningPathErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function LearningPathErrorFallback({ error, resetErrorBoundary }: LearningPathErrorFallbackProps) {
  const getErrorMessage = (error: Error) => {
    if (error.message.includes('initializePath')) {
      return 'Failed to initialize learning path. This might be due to a temporary issue.';
    }
    return error.message || 'An unexpected error occurred.';
  };

  return (
    <Alert variant="destructive" className="my-4">
      <div className="flex items-start gap-2">
        <XCircle className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="mb-2">Something went wrong</AlertTitle>
          <AlertDescription className="space-y-4">
            <p className="text-sm">{getErrorMessage(error)}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetErrorBoundary}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
} 