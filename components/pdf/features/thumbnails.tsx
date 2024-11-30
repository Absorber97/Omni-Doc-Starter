'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSynchronizedNavigation } from '@/lib/hooks/use-synchronized-navigation';
import { cn } from '@/lib/utils';

interface ThumbnailsProps {
  pages: Array<{
    pageNumber: number;
    thumbnail: string;
  }>;
}

interface ThumbnailItemProps {
  page: ThumbnailsProps['pages'][0];
  isActive: boolean;
  onClick: () => void;
}

function ThumbnailItem({ page, isActive, onClick }: ThumbnailItemProps) {
  return (
    <motion.div
      layout
      data-page={page.pageNumber}
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer transition-all",
        "hover:ring-2 hover:ring-primary/50",
        isActive && "ring-2 ring-primary"
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <img
        src={page.thumbnail}
        alt={`Page ${page.pageNumber}`}
        className="w-full h-auto object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-1">
        <span className="text-xs font-medium">Page {page.pageNumber}</span>
      </div>
    </motion.div>
  );
}

export function Thumbnails({ pages }: ThumbnailsProps) {
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const { 
    currentPage, 
    handlePageChange,
    isAutoScrolling 
  } = useSynchronizedNavigation({
    source: 'thumbnails'
  });

  // Auto-scroll thumbnails when page changes
  useEffect(() => {
    if (thumbnailsRef.current && !isAutoScrolling) {
      const activeThumb = thumbnailsRef.current.querySelector(`[data-page="${currentPage}"]`);
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [currentPage, isAutoScrolling]);

  return (
    <div 
      ref={thumbnailsRef} 
      className="grid gap-2 p-2 auto-rows-max grid-cols-1"
    >
      {pages.map((page) => (
        <ThumbnailItem
          key={page.pageNumber}
          page={page}
          isActive={currentPage === page.pageNumber}
          onClick={() => handlePageChange(page.pageNumber)}
        />
      ))}
    </div>
  );
} 