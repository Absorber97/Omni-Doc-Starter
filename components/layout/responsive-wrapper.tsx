'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop2, Smartphone } from 'lucide-react';
import { appConfig } from '@/config/app';
import { Card } from '@/components/ui/card';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
}

export function ResponsiveWrapper({ children }: ResponsiveWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < appConfig.ui.mobileBreakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isMobile ? (
        <motion.div
          key="mobile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: appConfig.ui.modalTransitionDuration }}
          className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background"
        >
          <Card className="p-8 space-y-8 max-w-md mx-auto border-2">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
              <Laptop2 className="w-20 h-20 mx-auto text-primary relative z-10" />
            </motion.div>
            
            <div className="space-y-4">
              <motion.h1 
                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                Desktop Only {appConfig.emoji.edit}
              </motion.h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                OmniDoc is optimized for desktop screens {appConfig.emoji.ai}
                <br />Please access it from a larger screen for the best experience.
              </p>
            </div>

            <motion.div 
              className="flex items-center justify-center gap-3 text-sm text-muted-foreground bg-muted p-3 rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Smartphone className="w-5 h-5" />
              <span>Current device width is too small</span>
            </motion.div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="desktop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: appConfig.ui.modalTransitionDuration }}
          className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 