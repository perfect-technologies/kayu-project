'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyProviderDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/pro');
  }, [router]);
  return null;
}
