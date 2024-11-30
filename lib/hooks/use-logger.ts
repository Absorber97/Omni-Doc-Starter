import { useRef } from 'react';

interface Logger {
  info: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
}

export function useLogger(component: string): Logger {
  return useRef({
    info: (message: string, data?: any) => {
      console.log(`[${component}] ${message}`, data || '');
    },
    error: (message: string, error?: any) => {
      console.error(`[${component}] ${message}`, error || '');
    }
  }).current;
}