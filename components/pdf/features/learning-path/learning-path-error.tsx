'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

interface LearningPathErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function LearningPathErrorFallback({ error, resetErrorBoundary }: LearningPathErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={resetErrorBoundary}
          className="mt-2"
        >
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
} 