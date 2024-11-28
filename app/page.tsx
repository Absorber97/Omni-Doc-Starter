'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push(ROUTES.UPLOAD);
  }, [router]);

  return null;
}
