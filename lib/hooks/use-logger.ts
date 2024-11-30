import { useRef } from 'react';

export function useLogger(component: string) {
  return useRef({
    info: (message: string, data?: any) => {
      console.log(`[${component}] ${message}`, data || '');
    },
    error: (message: string, error?: any) => {
      console.error(`[${component}] ${message}`, error || '');
    }
  }).current;
} 