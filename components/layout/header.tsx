'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Upload } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/config/app';

export function Header() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Link 
            href={ROUTES.HOME} 
            className="flex items-center space-x-2 transition-colors hover:opacity-80"
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <FileText className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="text-lg font-bold tracking-tight">
              OmniDoc
              <span className="ml-1 text-primary">{appConfig.emoji.ai}</span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          {pathname !== ROUTES.UPLOAD && (
            <Button
              variant="default"
              size="default"
              className="group relative px-6 py-2 font-medium shadow-lg transition-all hover:shadow-primary/25"
              asChild
            >
              <Link href={ROUTES.UPLOAD} className="flex items-center gap-2">
                <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" />
                <span>Upload PDF</span>
                <motion.div
                  className="absolute inset-0 rounded-md bg-primary/10"
                  initial={false}
                  whileHover={{ 
                    scale: 1.05,
                    opacity: 0.8
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 10 
                  }}
                />
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </motion.header>
  );
} 