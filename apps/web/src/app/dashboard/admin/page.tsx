'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { dashboardApi, adminApi, queryKeys } from '@kayu/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Briefcase,
  DollarSign,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Shield,
  Search,
  Download,
  RefreshCw,
  Calendar,
  Star,
  Crown,
  FileText,
  Settings,
  LayoutDashboard,
  MessageSquare,
  Ban,
  Check,
  Edit,
  Trash2,
  Plus,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabValue = 'overview' | 'users' | 'providers' | 'categories' | 'reviews' | 'settings';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Users filters
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('all');
  const [usersStatusFilter, setUsersStatusFilter] = useState('all');
  const [usersPage, setUsersPage] = useState(1);

  // Providers filters
  const [providersSearch, setProvidersSearch] = useState('');
  const [providersStatusFilter, setProvidersStatusFilter] = useState('all');
  const [providersPage, setProvidersPage] = useState(1);

  // Reviews filters
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsPublicFilter, setReviewsPublicFilter] = useState('all');
  const [reviewsPage, setReviewsPage] = useState(1);

  // Category dialog
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    category: any | null;
  }>({ open: false, mode: 'create', category: null });

  // ---- Queries ----

  const {
    data,
    isLoading,
    error,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: () => dashboardApi(apiClient).getAdminDashboard(),
    enabled: !!user,
  });

  const { data: usersData } = useQuery({
    queryKey: queryKeys.admin.users({
      page: usersPage,
      limit: 10,
      search: usersSearch || undefined,
      role: usersRoleFilter !== 'all' ? (usersRoleFilter as any) : undefined,
      status: usersStatusFilter !== 'all' ? (usersStatusFilter as any) : undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getUsers({
        page: usersPage,
        limit: 10,
        search: usersSearch || undefined,
        role: usersRoleFilter !== 'all' ? (usersRoleFilter as any) : undefined,
        status: usersStatusFilter !== 'all' ? (usersStatusFilter as any) : undefined,
      }),
    enabled: activeTab === 'users' && !!user,
  });

  const { data: providersData } = useQuery({
    queryKey: queryKeys.admin.providers({
      page: providersPage,
      limit: 10,
      search: providersSearch || undefined,
      status: providersStatusFilter !== 'all' ? (providersStatusFilter as any) : undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getProviders({
        page: providersPage,
        limit: 10,
        search: providersSearch || undefined,
        status: providersStatusFilter !== 'all' ? (providersStatusFilter as any) : undefined,
      }),
    enabled: activeTab === 'providers' && !!user,
  });

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => adminApi(apiClient).getCategories({ includeInactive: true } as any),
    enabled: activeTab === 'categories' && !!user,
  });

  const { data: reviewsData } = useQuery({
    queryKey: queryKeys.admin.reviews({
      page: reviewsPage,
      limit: 10,
      search: reviewsSearch || undefined,
      isPublic:
        reviewsPublicFilter !== 'all' ? (reviewsPublicFilter === 'true') : undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getReviews({
        page: reviewsPage,
        limit: 10,
        search: reviewsSearch || undefined,
        isPublic:
          reviewsPublicFilter !== 'all' ? (reviewsPublicFilter === 'true') : undefined,
      }),
    enabled: activeTab === 'reviews' && !!user,
  });

  // ---- Mutations ----

  const updateUserMutation = useMutation({
    mutationFn: (payload: { userId: string; isActive: boolean }) =>
      adminApi(apiClient).updateUser(payload as any),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const updateProviderMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      adminApi(apiClient).updateProvider(payload as any),
    onSuccess: () => {
      toast.success('Prestataire mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      adminApi(apiClient).createCategory(payload as any),
    onSuccess: () => {
      toast.success('Catégorie créée');
      setCategoryDialog({ open: false, mode: 'create', category: null });
      refetchCategories();
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      adminApi(apiClient).updateCategory(payload as any),
    onSuccess: () => {
      toast.success('Catégorie mise à jour');
      setCategoryDialog({ open: false, mode: 'create', category: null });
      refetchCategories();
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => adminApi(apiClient).deleteCategory(id),
    onSuccess: () => {
      toast.success('Catégorie supprimée');
      refetchCategories();
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const moderateReviewMutation = useMutation({
    mutationFn: (payload: { reviewId: string; isPublic: boolean }) =>
      adminApi(apiClient).moderateReview(payload as any),
    onSuccess: () => {
      toast.success('Avis mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id: string) => adminApi(apiClient).deleteReview(id),
    onSuccess: () => {
      toast.success('Avis supprimé');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // ---- Action handlers ----

  const handleToggleUserStatus = (userId: string, isActive: boolean) => {
    updateUserMutation.mutate({ userId, isActive: !isActive });
  };

  const handleVerifyProvider = (providerId: string, status: 'VERIFIED' | 'REJECTED') => {
    updateProviderMutation.mutate({ providerId, verificationStatus: status });
  };

  const handleTogglePremium = (providerId: string, isPremium: boolean) => {
    updateProviderMutation.mutate({ providerId, isPremium: !isPremium });
  };

  const handleSaveCategory = (categoryData: Record<string, unknown>) => {
    if (categoryDialog.mode === 'create') {
      createCategoryMutation.mutate(categoryData);
    } else {
      updateCategoryMutation.mutate({ ...categoryData, id: categoryDialog.category?.id });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    deleteCategoryMutation.mutate(categoryId);
  };

  const handleToggleReviewVisibility = (reviewId: string, isPublic: boolean) => {
    moderateReviewMutation.mutate({ reviewId, isPublic: !isPublic });
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;
    deleteReviewMutation.mutate(reviewId);
  };

  // ---- Render ----

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-600">
            Erreur lors du chargement des données
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetchDashboard()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Chart data
  const bookingsByStatusData = [
    { name: 'En attente', value: data.stats.pendingBookings, color: '#F59E0B' },
    { name: 'Confirmées', value: data.stats.confirmedBookings, color: '#3B82F6' },
    { name: 'En cours', value: data.stats.inProgressBookings, color: '#8B5CF6' },
    { name: 'Terminées', value: data.stats.completedBookings, color: '#10B981' },
    { name: 'Annulées', value: data.stats.cancelledBookings, color: '#EF4444' },
  ];

  const registrationTrendData = (data.stats.bookingsByDay ?? []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
    }),
    bookings: item.count,
  }));

  const users: any[] = (usersData as any)?.users ?? [];
  const usersPagination: any = (usersData as any)?.pagination ?? {
    page: 1,
    total: 0,
    totalPages: 0,
  };

  const providers: any[] = (providersData as any)?.providers ?? [];
  const providersPagination: any = (providersData as any)?.pagination ?? {
    page: 1,
    total: 0,
    totalPages: 0,
  };

  const categories: any[] = (categoriesData as any)?.categories ?? [];

  const reviews: any[] = (reviewsData as any)?.reviews ?? [];
  const reviewsPagination: any = (reviewsData as any)?.pagination ?? {
    page: 1,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <Card className="sticky top-4">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {[
                { value: 'overview', icon: LayoutDashboard, label: 'Tableau de bord' },
                { value: 'users', icon: Users, label: 'Utilisateurs' },
                { value: 'providers', icon: Briefcase, label: 'Prestataires' },
                { value: 'categories', icon: FileText, label: 'Catégories' },
                { value: 'reviews', icon: MessageSquare, label: 'Avis' },
                { value: 'settings', icon: Settings, label: 'Paramètres' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value as TabValue)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === item.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Administration
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestion et supervision de la plateforme KAYOU
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetchDashboard()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {/* Alert for pending verifications */}
            {(data.stats.pendingCertifications ?? 0) > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">
                      {data.stats.pendingCertifications ?? 0} prestataire
                      {(data.stats.pendingCertifications ?? 0) > 1 ? 's' : ''} en attente de
                      vérification
                    </p>
                    <p className="text-sm text-amber-700">
                      Ces prestataires ont soumis leurs documents pour certification
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => setActiveTab('providers')}
                  >
                    Voir les demandes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Utilisateurs',
                  value: data.stats.totalUsers,
                  subtitle: `+${data.stats.newUsersThisWeek} cette semaine`,
                  icon: Users,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-100',
                },
                {
                  title: 'Prestataires',
                  value: data.stats.totalProviders,
                  subtitle: `${data.stats.verifiedProviders} vérifiés`,
                  icon: Briefcase,
                  color: 'text-emerald-600',
                  bgColor: 'bg-emerald-100',
                },
                {
                  title: 'Réservations',
                  value: data.stats.totalBookings,
                  subtitle: `${data.stats.pendingBookings} en attente`,
                  icon: Calendar,
                  color: 'text-violet-600',
                  bgColor: 'bg-violet-100',
                },
                {
                  title: 'Revenus',
                  value: `${((data.stats.totalRevenue ?? 0) / 1000).toFixed(0)}K CDF`,
                  subtitle: `${((data.stats.monthlyRevenue ?? 0) / 1000).toFixed(0)}K ce mois`,
                  icon: DollarSign,
                  color: 'text-amber-600',
                  bgColor: 'bg-amber-100',
                },
              ].map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bookings by Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Réservations par statut</CardTitle>
                  <CardDescription>Répartition des réservations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={bookingsByStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {bookingsByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bookings Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendance des réservations</CardTitle>
                  <CardDescription>7 derniers jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={registrationTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Réservations récentes</CardTitle>
                <CardDescription>Les dernières réservations sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Prestataire</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentBookings.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Aucune réservation
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.recentBookings.map((booking: any) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{booking.title}</TableCell>
                            <TableCell>{booking.clientName}</TableCell>
                            <TableCell>{booking.providerName}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  booking.status === 'COMPLETED' &&
                                    'bg-green-100 text-green-700',
                                  booking.status === 'PENDING' &&
                                    'bg-amber-100 text-amber-700',
                                  booking.status === 'CANCELLED' &&
                                    'bg-red-100 text-red-700',
                                  booking.status === 'CONFIRMED' &&
                                    'bg-blue-100 text-blue-700',
                                  booking.status === 'IN_PROGRESS' &&
                                    'bg-purple-100 text-purple-700'
                                )}
                              >
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {booking.price.toLocaleString()} CDF
                            </TableCell>
                            <TableCell>
                              {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
                <p className="text-muted-foreground">
                  Gérez les comptes utilisateurs de la plateforme
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, email..."
                      value={usersSearch}
                      onChange={(e) => {
                        setUsersSearch(e.target.value);
                        setUsersPage(1);
                      }}
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={usersRoleFilter}
                    onValueChange={(v) => {
                      setUsersRoleFilter(v);
                      setUsersPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="CLIENT">Clients</SelectItem>
                      <SelectItem value="PROVIDER">Prestataires</SelectItem>
                      <SelectItem value="ADMIN">Administrateurs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={usersStatusFilter}
                    onValueChange={(v) => {
                      setUsersStatusFilter(v);
                      setUsersPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                      <SelectItem value="verified">Vérifiés</SelectItem>
                      <SelectItem value="unverified">Non vérifiés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Inscription</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u: any) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                  {u.firstName.charAt(0)}
                                  {u.lastName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  u.role === 'ADMIN'
                                    ? 'default'
                                    : u.role === 'PROVIDER'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{u.city || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {u.isVerified && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Vérifié
                                  </Badge>
                                )}
                                {!u.isActive && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-700"
                                  >
                                    <Ban className="h-3 w-3 mr-1" />
                                    Inactif
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleUserStatus(u.id, u.isActive)
                                    }
                                  >
                                    {u.isActive ? (
                                      <>
                                        <Ban className="h-4 w-4 mr-2" />
                                        Désactiver
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Activer
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pagination */}
            {usersPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={usersPage === 1}
                  onClick={() => setUsersPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {usersPage} sur {usersPagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={usersPage === usersPagination.totalPages}
                  onClick={() => setUsersPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Gestion des prestataires</h2>
                <p className="text-muted-foreground">
                  Vérification et gestion des prestataires
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, profession..."
                      value={providersSearch}
                      onChange={(e) => {
                        setProvidersSearch(e.target.value);
                        setProvidersPage(1);
                      }}
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={providersStatusFilter}
                    onValueChange={(v) => {
                      setProvidersStatusFilter(v);
                      setProvidersPage(1);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="available">Disponibles</SelectItem>
                      <SelectItem value="unavailable">Indisponibles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Providers Table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prestataire</TableHead>
                        <TableHead>Profession</TableHead>
                        <TableHead>Catégories</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Vérification</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Aucun prestataire trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        providers.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                  {p.user.firstName.charAt(0)}
                                  {p.user.lastName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {p.user.firstName} {p.user.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {p.user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{p.profession}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {p.categories.slice(0, 2).map((c: any) => (
                                  <Badge key={c.id} variant="outline" className="text-xs">
                                    {c.name}
                                  </Badge>
                                ))}
                                {p.categories.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{p.categories.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {p.isPremium && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-100 text-amber-700"
                                  >
                                    <Crown className="h-3 w-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                                {p.isAvailable ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700"
                                  >
                                    Disponible
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="bg-gray-100 text-gray-700"
                                  >
                                    Indisponible
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  p.verificationStatus === 'VERIFIED' &&
                                    'bg-green-100 text-green-700',
                                  p.verificationStatus === 'PENDING' &&
                                    'bg-amber-100 text-amber-700',
                                  p.verificationStatus === 'UNDER_REVIEW' &&
                                    'bg-blue-100 text-blue-700',
                                  p.verificationStatus === 'REJECTED' &&
                                    'bg-red-100 text-red-700'
                                )}
                              >
                                {p.verificationStatus === 'VERIFIED' && 'Vérifié'}
                                {p.verificationStatus === 'PENDING' && 'En attente'}
                                {p.verificationStatus === 'UNDER_REVIEW' && 'En cours'}
                                {p.verificationStatus === 'REJECTED' && 'Rejeté'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/providers/${p.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir le profil
                                    </Link>
                                  </DropdownMenuItem>
                                  {p.verificationStatus === 'PENDING' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleVerifyProvider(p.id, 'VERIFIED')
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Approuver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleVerifyProvider(p.id, 'REJECTED')
                                        }
                                      >
                                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                        Rejeter
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleTogglePremium(p.id, p.isPremium)}
                                  >
                                    <Crown className="h-4 w-4 mr-2" />
                                    {p.isPremium ? 'Retirer Premium' : 'Activer Premium'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pagination */}
            {providersPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={providersPage === 1}
                  onClick={() => setProvidersPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {providersPage} sur {providersPagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={providersPage === providersPagination.totalPages}
                  onClick={() => setProvidersPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Gestion des catégories</h2>
                <p className="text-muted-foreground">
                  Gérez les catégories et sous-catégories de services
                </p>
              </div>
              <Button
                onClick={() =>
                  setCategoryDialog({ open: true, mode: 'create', category: null })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </div>

            {/* Categories Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat: any) => (
                <Card key={cat.id} className={cn(!cat.isActive && 'opacity-60')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {cat.icon && <span className="text-2xl">{cat.icon}</span>}
                        <div>
                          <CardTitle className="text-base">{cat.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{cat.slug}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setCategoryDialog({ open: true, mode: 'edit', category: cat })
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>{cat.stats?.providerCount ?? 0} prestataires</span>
                      <span>{cat.stats?.subcategoryCount ?? 0} sous-catégories</span>
                    </div>
                    {cat.subcategories?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cat.subcategories.slice(0, 4).map((sub: any) => (
                          <Badge key={sub.id} variant="outline" className="text-xs">
                            {sub.name}
                          </Badge>
                        ))}
                        {cat.subcategories.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{cat.subcategories.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Category Dialog */}
            <Dialog
              open={categoryDialog.open}
              onOpenChange={(open) => setCategoryDialog({ ...categoryDialog, open })}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {categoryDialog.mode === 'create'
                      ? 'Nouvelle catégorie'
                      : 'Modifier la catégorie'}
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de la catégorie
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleSaveCategory({
                      name: formData.get('name'),
                      slug: formData.get('slug'),
                      description: formData.get('description'),
                      icon: formData.get('icon'),
                      color: formData.get('color'),
                      isActive: formData.get('isActive') === 'on',
                    });
                  }}
                >
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={categoryDialog.category?.name}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          name="slug"
                          defaultValue={categoryDialog.category?.slug}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={categoryDialog.category?.description || ''}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="icon">Icône (emoji)</Label>
                        <Input
                          id="icon"
                          name="icon"
                          defaultValue={categoryDialog.category?.icon || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Couleur</Label>
                        <Input
                          id="color"
                          name="color"
                          defaultValue={categoryDialog.category?.color || ''}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isActive"
                        name="isActive"
                        defaultChecked={categoryDialog.category?.isActive ?? true}
                      />
                      <Label htmlFor="isActive">Catégorie active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCategoryDialog({ ...categoryDialog, open: false })}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">
                      {categoryDialog.mode === 'create' ? 'Créer' : 'Enregistrer'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Modération des avis</h2>
                <p className="text-muted-foreground">Gérez et modérez les avis clients</p>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans les avis..."
                      value={reviewsSearch}
                      onChange={(e) => {
                        setReviewsSearch(e.target.value);
                        setReviewsPage(1);
                      }}
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={reviewsPublicFilter}
                    onValueChange={(v) => {
                      setReviewsPublicFilter(v);
                      setReviewsPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Visibilité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="true">Publics</SelectItem>
                      <SelectItem value="false">Masqués</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Aucun avis trouvé
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review: any) => (
                  <Card
                    key={review.id}
                    className={cn(!review.isPublic && 'opacity-60')}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                          {review.client.firstName.charAt(0)}
                          {review.client.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">
                                {review.client.firstName} {review.client.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                pour {review.provider.firstName} {review.provider.lastName}{' '}
                                ({review.provider.profession})
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold">
                                  {review.overallScore.toFixed(1)}
                                </span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleReviewVisibility(
                                        review.id,
                                        review.isPublic
                                      )
                                    }
                                  >
                                    {review.isPublic ? (
                                      <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Masquer l&apos;avis
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Publier l&apos;avis
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Rating details */}
                          <div className="grid grid-cols-5 gap-2 my-3">
                            {[
                              { label: 'Ponct.', value: review.punctuality },
                              { label: 'Qualité', value: review.quality },
                              { label: 'Comm.', value: review.communication },
                              { label: 'Valeur', value: review.value },
                              { label: 'Pro.', value: review.professionalism },
                            ].map((item) => (
                              <div key={item.label} className="text-center">
                                <p className="text-xs text-muted-foreground">
                                  {item.label}
                                </p>
                                <p className="font-bold text-sm">
                                  {item.value?.toFixed(1) || '-'}
                                </p>
                              </div>
                            ))}
                          </div>

                          {review.comment && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {review.comment}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                            {!review.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Masqué
                              </Badge>
                            )}
                            {review.reply && (
                              <Badge variant="secondary" className="text-xs">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Répondu
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {reviewsPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={reviewsPage === 1}
                  onClick={() => setReviewsPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {reviewsPage} sur {reviewsPagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={reviewsPage === reviewsPagination.totalPages}
                  onClick={() => setReviewsPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-0">
            <div>
              <h2 className="text-2xl font-bold">Paramètres</h2>
              <p className="text-muted-foreground">Configuration de la plateforme</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mode maintenance</p>
                    <p className="text-sm text-muted-foreground">
                      Désactiver l&apos;accès au site pour les utilisateurs
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Inscriptions ouvertes</p>
                    <p className="text-sm text-muted-foreground">
                      Permettre aux nouveaux utilisateurs de s&apos;inscrire
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Vérification obligatoire</p>
                    <p className="text-sm text-muted-foreground">
                      Les prestataires doivent être vérifiés pour accepter des réservations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Commission standard (%)</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission Premium (%)</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                </div>
                <Button>Sauvegarder</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="w-full justify-around h-16 bg-transparent">
            <TabsTrigger value="overview" className="flex flex-col gap-1 px-2 py-1">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-xs">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col gap-1 px-2 py-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex flex-col gap-1 px-2 py-1">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs">Providers</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex flex-col gap-1 px-2 py-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Reviews</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
