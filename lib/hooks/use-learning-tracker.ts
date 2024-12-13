import { useState, useEffect, useCallback } from 'react';
import { useLearningPathStore } from '@/lib/store/learning-path-store';
import { LearningConcept } from '@/lib/types/learning-path';

interface LearningTrackerOptions {
  concept: LearningConcept;
  onProgressUpdate?: (progress: number) => void;
}

export function useLearningTracker({ concept, onProgressUpdate }: LearningTrackerOptions) {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const { updateProgress } = useLearningPathStore();

  // Start tracking
  const startTracking = useCallback(() => {
    setStartTime(new Date());
    setIsActive(true);
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (startTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      setTimeSpent(prev => prev + duration);
      setIsActive(false);
      
      // Update progress in store
      updateProgress(concept.id, undefined, duration);
    }
  }, [startTime, concept.id, updateProgress]);

  // Auto-start on mount
  useEffect(() => {
    startTracking();
    return () => {
      if (isActive) {
        stopTracking();
      }
    };
  }, []);

  // Track active time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        if (startTime) {
          const currentTime = new Date();
          const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
          setTimeSpent(duration);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, startTime]);

  return {
    timeSpent,
    isActive,
    startTracking,
    stopTracking,
    formattedTime: `${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`
  };
} 