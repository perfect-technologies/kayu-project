'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { dashboardApi, queryKeys } from '@kayu/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Heart,
  Star,
  Clock,
  TrendingUp,
  Search,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  DashboardStats,
  BookingCard,
  NotificationList,
  QuickActions,
  FavoriteList,
} from '@/components/dashboard';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.client,
    queryFn: () => dashboardApi(apiClient).getClientDashboard(),
    enabled: !!user,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-600">
            Erreur lors du chargement des données
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      label: 'Réservations',
      value: data.stats.totalBookings,
      icon: Calendar,
      color: 'bg-blue-100',
    },
    {
      label: 'Terminées',
      value: data.stats.completedBookings,
      icon: TrendingUp,
      color: 'bg-green-100',
    },
    {
      label: 'En attente',
      value: data.stats.pendingBookings,
      icon: Clock,
      color: 'bg-yellow-100',
    },
    {
      label: 'Favoris',
      value: data.stats.favoritesCount,
      icon: Heart,
      color: 'bg-red-100',
    },
  ];

  const quickActions = [
    { label: 'Rechercher un service', icon: Search, href: '/services' },
    { label: 'Nouvelle réservation', icon: Plus, href: '/services' },
    { label: 'Mes réservations', icon: Calendar, href: '/dashboard/client/bookings' },
    { label: 'Mes avis', icon: Star, href: '/dashboard/client/reviews' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {getGreeting()}, {data.user?.firstName} !
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici un aperçu de votre activité sur KAYOU
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/services">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle réservation
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} columns={4} />

      {/* Quick Actions */}
      <QuickActions title="Actions rapides" actions={quickActions} columns={4} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Réservations récentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/client/bookings">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aucune réservation</p>
                <p className="text-sm mt-1">
                  Commencez par rechercher un service pour faire votre première réservation
                </p>
                <Button asChild className="mt-4">
                  <Link href="/services">
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher un service
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentBookings.map((booking: any) => (
                  <BookingCard
                    key={booking.id}
                    id={booking.id}
                    title={booking.title}
                    description={booking.description}
                    status={booking.status}
                    scheduledDate={booking.scheduledDate}
                    address={booking.address}
                    city={booking.city}
                    price={booking.price}
                    duration={booking.duration}
                    otherParty={{
                      id: booking.provider.id,
                      name: booking.provider.name,
                      avatar: booking.provider.avatar,
                      role: 'PROVIDER',
                      profession: booking.provider.profession,
                    }}
                    isProvider={false}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <NotificationList
          compact
          className="h-fit"
        />
      </div>

      {/* Favorites Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Mes prestataires favoris
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/client/favorites">
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <FavoriteList
            providers={(data.favorites || []) as any}
            onViewProfile={(id) => {
              router.push(`/providers/${id}`);
            }}
            onBook={(id) => {
              router.push(`/services?provider=${id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
