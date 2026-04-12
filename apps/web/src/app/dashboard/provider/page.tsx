'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { dashboardApi, bookingsApi, queryKeys } from '@kayu/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Star,
  Clock,
  TrendingUp,
  Eye,
  DollarSign,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Briefcase,
  Settings,
  Crown,
} from 'lucide-react';
import {
  DashboardStats,
  BookingCard,
  NotificationList,
  QuickActions,
  ProfileCompletion,
  getProviderCompletionItems,
  PremiumUpsell,
  ReviewList,
  EarningsChart,
} from '@/components/dashboard';
import Link from 'next/link';

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
    enabled: !!user,
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingsApi(apiClient).update(id, { status } as Parameters<ReturnType<typeof bookingsApi>['update']>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
    },
  });

  const handleConfirmBooking = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: 'CONFIRMED' });
  };

  const handleCompleteBooking = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: 'COMPLETED' });
  };

  const handleCancelBooking = (bookingId: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: 'CANCELLED' });
  };

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

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      label: 'Missions',
      value: data.stats.totalJobs ?? 0,
      icon: Briefcase,
      color: 'bg-blue-100',
    },
    {
      label: 'Note',
      value: (data.stats.rating ?? 0) > 0 ? `${(data.stats.rating ?? 0).toFixed(1)} ★` : '-',
      icon: Star,
      color: 'bg-yellow-100',
    },
    {
      label: 'Revenus',
      value: `${formatPrice(data.stats.totalEarnings ?? 0)} CDF`,
      icon: DollarSign,
      color: 'bg-green-100',
    },
    {
      label: 'En attente',
      value: data.stats.pendingBookings ?? 0,
      icon: Clock,
      color: 'bg-orange-100',
    },
  ];

  const quickActions = [
    { label: 'Mon profil', icon: Eye, href: '/dashboard/provider/profile' },
    { label: 'Disponibilité', icon: Clock, href: '/dashboard/provider/availability' },
    { label: 'Mes services', icon: Settings, href: '/dashboard/provider/services' },
    {
      label: 'Promouvoir',
      icon: TrendingUp,
      href: '/dashboard/provider/premium',
      variant: 'default' as const,
      className: 'bg-primary hover:bg-primary/90',
    },
  ];

  const completionItems = getProviderCompletionItems(data.provider.completionItems as any);

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
            {getGreeting()}, {data.user.firstName} !
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {data.provider.profession}
            {data.provider.isCertified && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Certifié
              </Badge>
            )}
            {data.provider.isPremium && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 border-amber-200"
              >
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/providers/${data.provider.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir mon profil public
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Completion (if not 100%) */}
      {(data.provider.completionPercentage ?? 0) < 100 && (
        <ProfileCompletion
          percentage={data.provider.completionPercentage ?? 0}
          items={completionItems}
          onComplete={(key) => {
            const routes: Record<string, string> = {
              photo: '/dashboard/provider/profile',
              description: '/dashboard/provider/profile',
              skills: '/dashboard/provider/profile',
              zones: '/dashboard/provider/profile',
              portfolio: '/dashboard/provider/portfolio',
            };
            router.push(routes[key] || '/dashboard/provider/profile');
          }}
        />
      )}

      {/* Stats */}
      <DashboardStats stats={stats} columns={4} />

      {/* Quick Actions */}
      <QuickActions title="Actions rapides" actions={quickActions} columns={4} />

      {/* Premium Upsell */}
      {!data.provider.isPremium && (
        <PremiumUpsell
          onUpgrade={() => {
            router.push('/dashboard/provider/premium');
          }}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bookings - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Demandes récentes
                {(data.stats.pendingBookings ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {data.stats.pendingBookings ?? 0} en attente
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/provider/bookings">
                  Voir tout
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Aucune demande</p>
                  <p className="text-sm mt-1">
                    Les demandes de réservation apparaîtront ici
                  </p>
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
                        id: booking.client.id,
                        name: booking.client.name,
                        avatar: booking.client.avatar,
                        role: 'CLIENT',
                      }}
                      isProvider={true}
                      onConfirm={() => handleConfirmBooking(booking.id)}
                      onComplete={() => handleCompleteBooking(booking.id)}
                      onCancel={() => handleCancelBooking(booking.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Scheduled Jobs */}
          {data.upcomingBookings.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Prochaines missions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.upcomingBookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{booking.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.scheduledDate
                            ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Date à confirmer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{booking.client.name}</p>
                        {booking.city && (
                          <p className="text-xs text-muted-foreground">{booking.city}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Analytics Chart */}
          <EarningsChart
            data={(data.viewsData ?? []) as any}
            title="Vues du profil"
            dataKey="views"
            type="area"
            compact
          />

          {/* Notifications */}
          <NotificationList
            compact
            className="h-fit"
          />
        </div>
      </div>

      {/* Recent Reviews */}
      {data.recentReviews.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avis récents
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/provider/reviews">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ReviewList
              reviews={data.recentReviews as any}
              isProvider={true}
              onReply={(reviewId) => {
                console.log('Reply to review:', reviewId);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
