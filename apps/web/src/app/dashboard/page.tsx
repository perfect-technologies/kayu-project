'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRedirectPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
        return;
      }

      // Redirect based on user role
      if (user?.role === 'PROVIDER') {
        router.replace('/dashboard/provider');
      } else if (user?.role === 'CLIENT') {
        router.replace('/dashboard/client');
      } else if (user?.role === 'ADMIN') {
        router.replace('/dashboard/admin');
      }
    }
  }, [user, isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>
  );
}
