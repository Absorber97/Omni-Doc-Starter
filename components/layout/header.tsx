'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href={ROUTES.HOME} className="mr-6 flex items-center space-x-2">
            <span className="font-bold">OmniDoc</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {pathname !== ROUTES.UPLOAD && (
            <Button
              variant="ghost"
              className="mr-2"
              asChild
            >
              <Link href={ROUTES.UPLOAD}>Upload PDF</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 