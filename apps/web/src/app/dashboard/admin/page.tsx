'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Coins,
  FileCheck,
  Flag,
  Home as HomeIcon,
  Layers,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { adminApi, dashboardApi, queryKeys } from '@kayu/api';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SectionId =
  | 'overview'
  | 'verification'
  | 'disputes'
  | 'moderation'
  | 'categories'
  | 'payouts';

const SECTION_PARAM: Record<string, SectionId> = {
  overview: 'overview',
  verification: 'verification',
  disputes: 'disputes',
  moderation: 'moderation',
  categories: 'categories',
  payouts: 'payouts',
};

function parseSection(value: string | null): SectionId {
  if (!value) return 'overview';
  return SECTION_PARAM[value] ?? 'overview';
}

const fcFmt = new Intl.NumberFormat('fr-FR');
const formatFc = (n: number | null | undefined) =>
  n == null ? '—' : `${fcFmt.format(Math.round(n))} FC`;
const formatCompactFc = (n: number | null | undefined) => {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FC`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k FC`;
  return `${fcFmt.format(Math.round(n))} FC`;
};

export default function AdminOpsPage() {
  // Admin auth gate, role check, and the dark ops top bar live in the
  // sibling `layout.tsx`. This page only renders the active section body.
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === 'ADMIN';
  const section = parseSection(searchParams.get('tab'));

  if (!isAdmin) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1440px] mx-auto">
      {section === 'overview' && <OverviewSection isAdmin={isAdmin} />}
      {section === 'verification' && <VerificationSection isAdmin={isAdmin} />}
      {section === 'disputes' && <DisputesSection isAdmin={isAdmin} />}
      {section === 'moderation' && <ModerationSection isAdmin={isAdmin} />}
      {section === 'categories' && <CategoriesSection isAdmin={isAdmin} />}
      {section === 'payouts' && <PayoutsSection />}
    </div>
  );
}

// ───── Shared primitives ─────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: '-0.02em',
            color: 'var(--k-text-primary)',
            margin: 0,
            marginBottom: 4,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize: 13, color: 'var(--k-text-muted)' }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

function OpsCard({
  title,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={className}
      style={{
        background: 'var(--k-surface)',
        border: '1px solid var(--k-border)',
        borderRadius: 12,
        padding: 18,
        boxShadow: 'var(--k-e1)',
      }}
    >
      {(title || action) && (
        <div className="flex justify-between items-baseline mb-3">
          {title && (
            <h3
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--k-text-primary)',
                margin: 0,
              }}
            >
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

function PriorityBadge({ priority }: { priority: 'urgent' | 'high' | 'normal' }) {
  const map = {
    urgent: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Urgent' },
    high: { bg: '#FEF3C7', fg: '#B45309', label: 'Priorité' },
    normal: { bg: '#F1F5F9', fg: '#475569', label: 'Normal' },
  } as const;
  const s = map[priority];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 6,
      }}
    >
      {s.label}
    </span>
  );
}

function StatusChip({
  tone,
  children,
}: {
  tone: 'neutral' | 'primary' | 'warning' | 'danger' | 'success';
  children: React.ReactNode;
}) {
  const map = {
    neutral: { bg: '#F1F5F9', fg: '#475569' },
    primary: { bg: '#DBEAFE', fg: '#1D4ED8' },
    warning: { bg: '#FEF3C7', fg: '#B45309' },
    danger: { bg: '#FEE2E2', fg: '#B91C1C' },
    success: { bg: '#D1FAE5', fg: '#065F46' },
  } as const;
  const c = map[tone];
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

function disputeStatusTone(status: string) {
  switch (status) {
    case 'NEW':
      return { tone: 'danger' as const, label: 'Nouveau' };
    case 'PENDING_PRO':
      return { tone: 'warning' as const, label: 'Pro à relancer' };
    case 'PENDING_CLIENT':
      return { tone: 'warning' as const, label: 'Client à relancer' };
    case 'INVESTIGATING':
      return { tone: 'primary' as const, label: 'Enquête' };
    case 'ESCALATED':
      return { tone: 'warning' as const, label: 'Escaladé' };
    case 'RESOLVED':
      return { tone: 'success' as const, label: 'Résolu' };
    default:
      return { tone: 'neutral' as const, label: status };
  }
}

function verificationStatusTone(status: string) {
  switch (status) {
    case 'VERIFIED':
      return { tone: 'success' as const, label: 'Vérifié' };
    case 'REJECTED':
      return { tone: 'danger' as const, label: 'Rejeté' };
    case 'UNDER_REVIEW':
      return { tone: 'primary' as const, label: 'En revue' };
    default:
      return { tone: 'warning' as const, label: 'En attente' };
  }
}

function Avatar({
  name,
  size = 36,
  bg = '#0EA5E9',
}: {
  name: string;
  size?: number;
  bg?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
}

function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  destructive,
  disabled,
  onConfirm,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => {
        if (!disabled) setOpen(true);
      })}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              style={
                destructive
                  ? { background: '#DC2626', color: 'white' }
                  : undefined
              }
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyOpsState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof HomeIcon;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: 36,
        textAlign: 'center',
        color: 'var(--k-text-muted)',
        background: 'var(--k-surface)',
        border: '1px solid var(--k-border)',
        borderRadius: 12,
      }}
    >
      <Icon size={26} color="var(--k-border-strong)" style={{ margin: '0 auto 10px' }} />
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--k-text-primary)',
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 12.5 }}>{description}</div>
    </div>
  );
}

// ───── Overview ─────────────────────────────────────────────────────────

function OverviewSection({ isAdmin }: { isAdmin: boolean }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: () => dashboardApi(apiClient).getAdminDashboard(),
    enabled: isAdmin,
  });

  const stats = data?.stats;
  const recent = data?.recentBookings ?? [];
  const topCities = data?.topCities ?? [];

  const kpis = useMemo(
    () => [
      {
        label: "Réservations aujourd'hui",
        value: stats?.newBookingsToday ?? 0,
        icon: Calendar,
        sub: `${stats?.totalBookings ?? 0} au total`,
        tone: 'neutral' as const,
      },
      {
        label: 'Recette mensuelle',
        value: formatCompactFc(stats?.monthlyRevenue ?? 0),
        icon: TrendingUp,
        sub: `${formatCompactFc(stats?.revenueToday ?? 0)} aujourd'hui`,
        tone: 'success' as const,
      },
      {
        label: 'Pros vérifiés',
        value: stats?.verifiedProviders ?? 0,
        icon: BadgeCheck,
        sub: `${stats?.totalProviders ?? 0} pros au total`,
        tone: 'primary' as const,
      },
      {
        label: 'Réservations confirmées',
        value: stats?.confirmedBookings ?? 0,
        icon: FileCheck,
        sub: `${stats?.completedBookings ?? 0} terminées`,
        tone: 'neutral' as const,
      },
    ],
    [stats],
  );

  return (
    <div>
      <SectionHeader
        title="Vue d'ensemble"
        subtitle="État opérationnel KAYOU · données en direct depuis l'API"
        action={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5"
            style={{
              padding: '7px 12px',
              background: 'var(--k-surface)',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 12.5,
              color: 'var(--k-text-body)',
              fontWeight: 500,
              cursor: isFetching ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            Actualiser
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              style={{
                background: 'var(--k-surface)',
                border: '1px solid var(--k-border)',
                borderRadius: 12,
                padding: 16,
                boxShadow: 'var(--k-e1)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#F1F5F9',
                    color: '#475569',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--k-text-muted)',
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                {k.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: '-0.02em',
                  color: 'var(--k-text-primary)',
                }}
              >
                {isLoading ? '—' : k.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--k-text-subtle)', marginTop: 4 }}>
                {k.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="flex flex-col gap-4">
          <OpsCard title="Files d'attente">
            <QueueRow
              icon={BadgeCheck}
              label="Pros à vérifier"
              value={stats?.pendingCertifications ?? 0}
              subValue="Documents soumis en attente de revue"
              tint="#0EA5E9"
              tintBg="#E0F2FE"
            />
            <QueueRow
              icon={Calendar}
              label="Réservations en attente"
              value={stats?.pendingBookings ?? 0}
              subValue="Demandes côté client à activer"
              tint="#D97706"
              tintBg="#FEF3C7"
            />
            <QueueRow
              icon={FileCheck}
              label="Réservations en cours"
              value={stats?.inProgressBookings ?? 0}
              subValue="Missions actuellement en exécution"
              tint="#059669"
              tintBg="#D1FAE5"
            />
            <QueueRow
              icon={Users}
              label="Comptes actifs"
              value={stats?.activeUsers ?? 0}
              subValue={`${stats?.totalUsers ?? 0} comptes au total`}
              tint="#7C3AED"
              tintBg="#EDE9FE"
              isLast
            />
          </OpsCard>

          <OpsCard title="Top villes" action={<span style={{ fontSize: 11, color: 'var(--k-text-subtle)' }}>par nombre de pros</span>}>
            {topCities.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)', padding: '8px 0' }}>
                Pas encore de données suffisantes pour afficher la répartition.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topCities.slice(0, 6).map((c) => (
                  <CityRow key={c.name} name={c.name} count={c.count} max={topCities[0]?.count ?? 1} />
                ))}
              </div>
            )}
          </OpsCard>
        </div>

        <OpsCard
          title="Activité récente"
          action={<span style={{ fontSize: 11, color: 'var(--k-text-subtle)' }}>{recent.length} dernières</span>}
          className="self-start"
        >
          {recent.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)', padding: '8px 0' }}>
              Aucune activité récente. Les nouvelles réservations apparaîtront ici.
            </div>
          ) : (
            <div className="flex flex-col">
              {recent.slice(0, 8).map((b) => (
                <ActivityRow key={b.id} booking={b as any} />
              ))}
            </div>
          )}
        </OpsCard>
      </div>
    </div>
  );
}

function QueueRow({
  icon: Icon,
  label,
  value,
  subValue,
  tint,
  tintBg,
  isLast,
}: {
  icon: typeof HomeIcon;
  label: string;
  value: number;
  subValue: string;
  tint: string;
  tintBg: string;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--k-border-subtle)' }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: tintBg,
          color: tint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--k-text-primary)' }}>
          {label}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--k-text-subtle)', marginTop: 1 }}>
          {subValue}
        </div>
      </div>
      <span
        style={{
          fontFamily: 'var(--k-font-display)',
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '-0.02em',
          color: 'var(--k-text-primary)',
          minWidth: 30,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function CityRow({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: 12.5, color: 'var(--k-text-body)' }}>{name}</span>
        <span
          style={{
            fontFamily: 'var(--k-font-mono)',
            fontSize: 11.5,
            color: 'var(--k-text-muted)',
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: 'var(--k-border-subtle)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: '#0EA5E9',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

function ActivityRow({
  booking,
}: {
  booking: { id: string; status?: string; clientName?: string; providerName?: string; price?: number; createdAt?: string; title?: string };
}) {
  const status = booking.status ?? 'PENDING';
  const tone = bookingStatusTone(status);
  return (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: '1px solid var(--k-border-subtle)' }}
    >
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: tone.color,
          background: `${tone.color}15`,
          padding: '2px 6px',
          borderRadius: 4,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {tone.label}
      </span>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--k-text-body)',
            lineHeight: 1.45,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {booking.title || 'Réservation'} · {booking.clientName || 'Client'} →{' '}
          {booking.providerName || 'Pro'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--k-text-subtle)', marginTop: 1 }}>
          {booking.price != null ? formatFc(booking.price) : '—'} · {fmtRelative(booking.createdAt)}
        </div>
      </div>
    </div>
  );
}

function bookingStatusTone(status: string) {
  switch (status) {
    case 'COMPLETED':
      return { color: '#059669', label: 'TERMINÉE' };
    case 'CONFIRMED':
      return { color: '#0EA5E9', label: 'CONFIRMÉE' };
    case 'IN_PROGRESS':
      return { color: '#7C3AED', label: 'EN COURS' };
    case 'CANCELLED':
      return { color: '#DC2626', label: 'ANNULÉE' };
    default:
      return { color: '#D97706', label: 'EN ATTENTE' };
  }
}

function fmtRelative(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const m = Math.round(diffMs / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const days = Math.round(h / 24);
  if (days < 30) return `il y a ${days}j`;
  return d.toLocaleDateString('fr-FR');
}

// ───── Verification ─────────────────────────────────────────────────────

function VerificationSection({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'>('UNDER_REVIEW');

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.admin.verification({
      page: 1,
      limit: 50,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getVerificationSubmissions({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      }),
    enabled: isAdmin,
  });

  const reviewDocMutation = useMutation({
    mutationFn: (payload: any) => adminApi(apiClient).reviewVerificationDoc(payload),
    onSuccess: () => {
      toast.success('Document vérifié');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const submissions = (data?.submissions ?? []) as any[];
  const stats = data?.stats;

  return (
    <div>
      <SectionHeader
        title="File de vérifications"
        subtitle={`${submissions.length} prestataires en file · objectif de traitement < 2h`}
        action={
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5"
            style={{
              padding: '7px 12px',
              background: 'var(--k-surface)',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 12.5,
              color: 'var(--k-text-body)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Actualiser
          </button>
        }
      />

      {/* Filter bar */}
      <div
        className="flex flex-wrap items-center gap-3 p-3 mb-3"
        style={{
          background: 'var(--k-surface)',
          border: '1px solid var(--k-border)',
          borderRadius: 10,
        }}
      >
        <div className="flex gap-1">
          {(
            [
              { id: 'all', label: 'Tous' },
              { id: 'UNDER_REVIEW', label: 'En revue' },
              { id: 'VERIFIED', label: 'Vérifiés' },
              { id: 'REJECTED', label: 'Rejetés' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 0,
                background: statusFilter === t.id ? '#0F172A' : 'transparent',
                color: statusFilter === t.id ? 'white' : 'var(--k-text-body)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--k-border)' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: 10,
              color: 'var(--k-text-subtle)',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un pro…"
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 13,
              outline: 0,
            }}
          />
        </div>
        {stats && (
          <span style={{ fontSize: 11.5, color: 'var(--k-text-subtle)' }}>
            <strong style={{ color: 'var(--k-text-primary)' }}>{stats.verified}</strong> vérifiés ·{' '}
            <strong style={{ color: 'var(--k-text-primary)' }}>{stats.underReview}</strong> en revue ·{' '}
            <strong style={{ color: 'var(--k-text-primary)' }}>{stats.rejected}</strong> rejetés
          </span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <OpsCard>
          <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>
            Chargement de la file…
          </div>
        </OpsCard>
      ) : submissions.length === 0 ? (
        <EmptyOpsState
          icon={BadgeCheck}
          title="File vide"
          description="Aucune soumission ne correspond à ce filtre. Tout est à jour."
        />
      ) : (
        <div
          style={{
            background: 'var(--k-surface)',
            border: '1px solid var(--k-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            className="hidden lg:grid"
            style={{
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 160px 160px 140px 220px',
              gap: 12,
              padding: '12px 18px',
              borderBottom: '1px solid var(--k-border)',
              background: '#FAFAF9',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--k-text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <span>Pro</span>
            <span>Profession / e-mail</span>
            <span>Soumis</span>
            <span>Documents</span>
            <span>État</span>
            <span>Actions</span>
          </div>

          {submissions.map((v: any) => (
            <VerifyRow key={v.providerId} v={v} onReviewDoc={(p) => reviewDocMutation.mutate(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function VerifyRow({
  v,
  onReviewDoc,
}: {
  v: any;
  onReviewDoc: (payload: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const status = verificationStatusTone(v.verificationStatus);
  const docs = v.docs ?? [];
  const counts = v.counts ?? { total: 0, pending: 0, approved: 0, rejected: 0 };

  return (
    <>
      <div
        className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_160px_140px_220px] gap-3 px-4 lg:px-[18px] py-3.5 items-center"
        style={{
          borderBottom: '1px solid var(--k-border-subtle)',
          background: 'var(--k-surface)',
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar name={v.providerName || '—'} bg="#0EA5E9" />
          <div className="min-w-0">
            <div
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: 'var(--k-text-primary)',
              }}
              className="truncate"
            >
              {v.providerName || 'Pro sans nom'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--k-text-subtle)',
                fontFamily: 'var(--k-font-mono)',
              }}
              className="truncate"
            >
              {v.providerId.slice(0, 8)}
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <div style={{ fontSize: 13, color: 'var(--k-text-body)' }} className="truncate">
            {v.profession || '—'}
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--k-text-subtle)' }}
            className="truncate"
          >
            {v.providerEmail || ''}
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--k-text-body)' }}>
          {fmtRelative(v.submittedAt) || '—'}
        </div>
        <DocsProgress counts={counts} />
        <div>
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
        </div>
        <div className="flex justify-end gap-2 flex-wrap">
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              padding: '6px 11px',
              background: 'var(--k-surface)',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--k-text-body)',
            }}
          >
            {open ? 'Replier' : 'Examiner'}
          </button>
        </div>
      </div>
      {open && (
        <div
          style={{
            background: '#FAFAF9',
            borderBottom: '1px solid var(--k-border-subtle)',
            padding: '14px 18px',
          }}
        >
          {docs.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>
              Aucun document soumis pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docs.map((d: any) => (
                <DocRow
                  key={d.id}
                  doc={d}
                  providerId={v.providerId}
                  onApprove={() =>
                    onReviewDoc({
                      providerId: v.providerId,
                      docId: d.id,
                      decision: 'APPROVED',
                    })
                  }
                  onReject={(reason) =>
                    onReviewDoc({
                      providerId: v.providerId,
                      docId: d.id,
                      decision: 'REJECTED',
                      rejectionReason: reason,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function DocsProgress({
  counts,
}: {
  counts: { total: number; pending: number; approved: number; rejected: number };
}) {
  const items: Array<{ label: string; count: number; tint: string }> = [
    { label: 'OK', count: counts.approved, tint: '#059669' },
    { label: '?', count: counts.pending, tint: '#D97706' },
    { label: 'KO', count: counts.rejected, tint: '#DC2626' },
  ];
  return (
    <div className="flex gap-2 items-center">
      {items.map((it) => (
        <span
          key={it.label}
          title={`${it.label}: ${it.count}`}
          style={{
            fontSize: 11,
            fontFamily: 'var(--k-font-mono)',
            fontWeight: 600,
            color: it.count > 0 ? it.tint : 'var(--k-text-subtle)',
            background: it.count > 0 ? `${it.tint}14` : 'transparent',
            border: `1px solid ${it.count > 0 ? `${it.tint}33` : 'var(--k-border)'}`,
            padding: '3px 7px',
            borderRadius: 6,
          }}
        >
          {it.label} {it.count}
        </span>
      ))}
    </div>
  );
}

function DocRow({
  doc,
  providerId: _providerId,
  onApprove,
  onReject,
}: {
  doc: any;
  providerId: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const decided = doc.decision === 'APPROVED' || doc.decision === 'REJECTED';
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--k-surface)',
        border: '1px solid var(--k-border)',
        borderRadius: 10,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--k-text-primary)' }}>
            {prettyDocKind(doc.kind)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--k-text-subtle)', marginTop: 1 }}>
            Soumis le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
          </div>
        </div>
        {doc.decision === 'APPROVED' && <StatusChip tone="success">Approuvé</StatusChip>}
        {doc.decision === 'REJECTED' && <StatusChip tone="danger">Rejeté</StatusChip>}
        {!decided && <StatusChip tone="warning">En attente</StatusChip>}
      </div>
      {!decided && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input
            type="text"
            placeholder="Motif (si rejet)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              flex: 1,
              minWidth: 160,
              padding: '6px 10px',
              fontSize: 12.5,
              border: '1px solid var(--k-border)',
              borderRadius: 7,
              outline: 0,
            }}
          />
          <ConfirmAction
            title="Approuver ce document ?"
            description={
              <>
                Le document <strong>{prettyDocKind(doc.kind)}</strong> sera marqué
                comme valide. L'opération apparaîtra dans le journal de vérification.
              </>
            }
            confirmLabel="Approuver"
            onConfirm={onApprove}
            trigger={(open) => (
              <button
                onClick={open}
                className="inline-flex items-center gap-1"
                style={{
                  padding: '6px 11px',
                  background: '#059669',
                  color: 'white',
                  border: 0,
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={13} /> Approuver
              </button>
            )}
          />
          <ConfirmAction
            title="Rejeter ce document ?"
            description={
              <>
                Le document <strong>{prettyDocKind(doc.kind)}</strong> sera marqué
                comme rejeté avec le motif suivant :
                <br />
                <em>{reason || 'Document non conforme'}</em>
                <br />
                Le pro devra renvoyer un document corrigé.
              </>
            }
            confirmLabel="Rejeter"
            destructive
            onConfirm={() => onReject(reason || 'Document non conforme')}
            trigger={(open) => (
              <button
                onClick={open}
                className="inline-flex items-center gap-1"
                style={{
                  padding: '6px 11px',
                  background: 'white',
                  color: '#B91C1C',
                  border: '1px solid #FECACA',
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <XCircle size={13} /> Rejeter
              </button>
            )}
          />
        </div>
      )}
      {doc.rejectionReason && (
        <div
          style={{
            fontSize: 11.5,
            color: '#B91C1C',
            marginTop: 6,
            padding: 8,
            background: 'var(--k-danger-subtle)',
            borderRadius: 7,
          }}
        >
          Motif : {doc.rejectionReason}
        </div>
      )}
    </div>
  );
}

function prettyDocKind(kind: string) {
  switch (kind) {
    case 'ID_FRONT':
      return "Pièce d'identité (recto)";
    case 'ID_BACK':
      return "Pièce d'identité (verso)";
    case 'SELFIE':
      return 'Selfie de vérification';
    case 'ADDRESS':
      return "Justificatif d'adresse";
    case 'CERT_OPTIONAL':
      return 'Certificat professionnel (optionnel)';
    default:
      return kind;
  }
}

// ───── Disputes ─────────────────────────────────────────────────────────

function DisputesSection({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.disputes({
      page: 1,
      limit: 30,
      status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getDisputes({
        page: 1,
        limit: 30,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      }),
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => adminApi(apiClient).updateDispute(payload),
    onSuccess: () => {
      toast.success('Litige mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const disputes = (data?.disputes ?? []) as any[];
  const stats = data?.stats;

  return (
    <div>
      <SectionHeader
        title="Litiges actifs"
        subtitle={
          stats
            ? `${stats.open} ouverts · ${stats.escalated} escaladés · ${stats.resolved} résolus`
            : 'Suivi opérationnel des conflits client/pro'
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(
          [
            { id: 'all', label: 'Tous' },
            { id: 'NEW', label: 'Nouveaux' },
            { id: 'INVESTIGATING', label: 'Enquête' },
            { id: 'PENDING_PRO', label: 'Pro à relancer' },
            { id: 'PENDING_CLIENT', label: 'Client à relancer' },
            { id: 'ESCALATED', label: 'Escaladés' },
            { id: 'RESOLVED', label: 'Résolus' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: statusFilter === t.id ? '#0F172A' : 'var(--k-border)',
              background: statusFilter === t.id ? '#0F172A' : 'var(--k-surface)',
              color: statusFilter === t.id ? 'white' : 'var(--k-text-body)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <OpsCard>
              <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>Chargement…</div>
            </OpsCard>
          ) : disputes.length === 0 ? (
            <EmptyOpsState
              icon={Flag}
              title="Aucun litige"
              description="Aucun conflit ouvert pour ce filtre. Continue d'observer la file de support."
            />
          ) : (
            disputes.map((d) => (
              <DisputeCard
                key={d.id}
                d={d}
                active={selected?.id === d.id}
                onSelect={() => setSelected(d)}
              />
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-44 self-start">
          {selected ? (
            <DisputeDetail
              d={selected}
              onResolve={(payload) =>
                updateMutation.mutate({ disputeId: selected.id, ...payload })
              }
              isPending={updateMutation.isPending}
            />
          ) : (
            <div
              style={{
                padding: 28,
                background: 'var(--k-surface)',
                border: '1px solid var(--k-border)',
                borderRadius: 12,
                textAlign: 'center',
                color: 'var(--k-text-muted)',
              }}
            >
              <Flag size={24} color="var(--k-border-strong)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--k-text-body)', marginBottom: 4 }}>
                Sélectionnez un litige
              </div>
              <div style={{ fontSize: 12 }}>
                Cliquez sur une carte pour voir les détails et prendre une décision.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DisputeCard({
  d,
  active,
  onSelect,
}: {
  d: any;
  active: boolean;
  onSelect: () => void;
}) {
  const status = disputeStatusTone(d.status);
  const sev = d.severity === 'HIGH' ? '#DC2626' : d.severity === 'MEDIUM' ? '#D97706' : '#475569';
  const booking = d.booking;
  return (
    <button
      onClick={onSelect}
      className="text-left"
      style={{
        padding: 16,
        background: 'var(--k-surface)',
        borderRadius: 10,
        border: `1px solid ${active ? '#0EA5E9' : 'var(--k-border)'}`,
        boxShadow: active ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
        cursor: 'pointer',
        transition: 'border-color 120ms',
        borderLeft: `3px solid ${sev}`,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          style={{
            fontFamily: 'var(--k-font-mono)',
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--k-text-muted)',
          }}
        >
          #{d.id.slice(0, 8)}
        </span>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        <span
          style={{
            fontSize: 11,
            color: 'var(--k-text-subtle)',
            marginLeft: 'auto',
          }}
        >
          {fmtRelative(d.createdAt)}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: 4 }}>
        {d.reason}
      </div>
      {booking && (
        <div style={{ fontSize: 12, color: 'var(--k-text-muted)', marginBottom: 8 }}>
          {booking.client?.name} <span style={{ color: 'var(--k-border-strong)' }}>·</span>{' '}
          {booking.provider?.name} <span style={{ color: 'var(--k-border-strong)' }}>·</span>{' '}
          {booking.title}
        </div>
      )}
      <div className="flex items-center justify-between text-[11.5px]">
        <span style={{ color: 'var(--k-text-muted)' }}>Montant en jeu</span>
        <span style={{ fontFamily: 'var(--k-font-mono)', fontWeight: 700, color: 'var(--k-text-primary)' }}>
          {booking?.price != null ? formatFc(booking.price) : '—'}
        </span>
      </div>
    </button>
  );
}

function DisputeDetail({
  d,
  onResolve,
  isPending,
}: {
  d: any;
  onResolve: (payload: { status?: string; severity?: string; resolution?: string; resolutionPct?: number | null }) => void;
  isPending: boolean;
}) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionPct, setResolutionPct] = useState<string>('');

  const status = disputeStatusTone(d.status);
  const booking = d.booking;

  return (
    <div
      style={{
        background: 'var(--k-surface)',
        border: '1px solid var(--k-border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 14, borderBottom: '1px solid var(--k-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontFamily: 'var(--k-font-mono)',
              fontSize: 12,
              color: 'var(--k-text-muted)',
              fontWeight: 600,
            }}
          >
            #{d.id.slice(0, 8)}
          </span>
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--k-text-primary)' }}>
          {d.reason}
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {booking && (
          <div className="mb-3">
            <h4
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--k-text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}
            >
              Réservation
            </h4>
            <div style={{ fontSize: 12.5, color: 'var(--k-text-body)' }}>{booking.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-text-subtle)', marginTop: 2 }}>
              {booking.client?.name} → {booking.provider?.name}
            </div>
            {booking.price != null && (
              <div
                style={{
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 12,
                  color: 'var(--k-text-primary)',
                  marginTop: 4,
                }}
              >
                {formatFc(booking.price)}
              </div>
            )}
          </div>
        )}

        {(d.clientStatement || d.proStatement) && (
          <div className="mb-3 flex flex-col gap-2">
            {d.clientStatement && (
              <div
                style={{
                  fontSize: 12,
                  background: 'var(--k-surface-coral)',
                  padding: 10,
                  borderRadius: 8,
                  color: '#9F1239',
                }}
              >
                <strong>Client : </strong>
                {d.clientStatement}
              </div>
            )}
            {d.proStatement && (
              <div
                style={{
                  fontSize: 12,
                  background: 'var(--k-surface-primary)',
                  padding: 10,
                  borderRadius: 8,
                  color: '#075985',
                }}
              >
                <strong>Pro : </strong>
                {d.proStatement}
              </div>
            )}
          </div>
        )}

        <h4
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--k-text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            margin: '0 0 8px',
          }}
        >
          Décision
        </h4>
        <div className="flex flex-col gap-2 mb-3">
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Note de résolution (obligatoire pour clôturer)…"
            style={{
              minHeight: 60,
              padding: 10,
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 12.5,
              outline: 0,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <input
            value={resolutionPct}
            onChange={(e) => setResolutionPct(e.target.value)}
            placeholder="% de remboursement (0–100, optionnel)"
            type="number"
            style={{
              padding: '7px 10px',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 12.5,
              outline: 0,
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            disabled={isPending}
            onClick={() =>
              onResolve({
                status: 'INVESTIGATING',
              })
            }
            style={{
              padding: '8px 12px',
              background: 'var(--k-surface)',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            → Marquer en enquête
          </button>
          <button
            disabled={isPending}
            onClick={() =>
              onResolve({
                status: 'ESCALATED',
                severity: 'HIGH',
              })
            }
            style={{
              padding: '8px 12px',
              background: 'var(--k-surface)',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              color: '#B45309',
            }}
          >
            ↑ Escalader au manager
          </button>
          <button
            disabled={isPending || !resolutionNote.trim()}
            onClick={() => {
              const pct = resolutionPct.trim() ? Number(resolutionPct) : null;
              onResolve({
                status: 'RESOLVED',
                resolution: resolutionNote.trim(),
                resolutionPct: pct,
              });
            }}
            style={{
              padding: '8px 12px',
              background: '#059669',
              color: 'white',
              border: 0,
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: !resolutionNote.trim() ? 'not-allowed' : 'pointer',
              opacity: !resolutionNote.trim() ? 0.6 : 1,
              textAlign: 'left',
            }}
          >
            ✓ Clôturer le litige
          </button>
        </div>
      </div>
    </div>
  );
}

// ───── Moderation (users + providers + reviews) ─────────────────────────

function ModerationSection({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<'users' | 'providers' | 'reviews'>('users');
  return (
    <div>
      <SectionHeader
        title="Modération"
        subtitle="Comptes, prestataires et avis. Actions enregistrées dans les journaux opérationnels."
      />
      <div className="flex gap-1 mb-4">
        {(
          [
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'providers', label: 'Pros', icon: BadgeCheck },
            { id: 'reviews', label: 'Avis', icon: Star },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="inline-flex items-center gap-1.5"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: 0,
                background: active ? '#0F172A' : 'transparent',
                color: active ? 'white' : 'var(--k-text-body)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'users' && <UsersModeration isAdmin={isAdmin} />}
      {tab === 'providers' && <ProvidersModeration isAdmin={isAdmin} />}
      {tab === 'reviews' && <ReviewsModeration isAdmin={isAdmin} />}
    </div>
  );
}

function UsersModeration({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'CLIENT' | 'PROVIDER' | 'ADMIN'>('all');
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.users({
      page: 1,
      limit: 30,
      search: search || undefined,
      role: role !== 'all' ? role : undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getUsers({
        page: 1,
        limit: 30,
        search: search || undefined,
        role: role !== 'all' ? (role as any) : undefined,
      }),
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { userId: string; isActive: boolean }) =>
      adminApi(apiClient).updateUser(payload as any),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const users = (data?.users ?? []) as any[];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: 10,
              color: 'var(--k-text-subtle)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher email, nom…"
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 13,
              outline: 0,
              background: 'var(--k-surface)',
            }}
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'CLIENT', 'PROVIDER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: '6px 10px',
                borderRadius: 7,
                border: 0,
                background: role === r ? '#0F172A' : 'var(--k-surface)',
                color: role === r ? 'white' : 'var(--k-text-body)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {r === 'all' ? 'Tous' : r === 'CLIENT' ? 'Clients' : r === 'PROVIDER' ? 'Pros' : 'Admins'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <OpsCard>
          <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>Chargement…</div>
        </OpsCard>
      ) : users.length === 0 ? (
        <EmptyOpsState
          icon={Users}
          title="Aucun utilisateur"
          description="Aucun compte ne correspond à ces filtres."
        />
      ) : (
        <div
          style={{
            background: 'var(--k-surface)',
            border: '1px solid var(--k-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {users.map((u: any) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--k-border-subtle)' }}
            >
              <Avatar name={`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email} bg="#7C3AED" />
              <div className="flex-1 min-w-0">
                <div
                  className="truncate"
                  style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-text-primary)' }}
                >
                  {`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}
                </div>
                <div className="truncate" style={{ fontSize: 11.5, color: 'var(--k-text-subtle)' }}>
                  {u.email} · {u.role} · {u.city ?? '—'}
                </div>
              </div>
              <StatusChip tone={u.isActive ? 'success' : 'danger'}>
                {u.isActive ? 'Actif' : 'Désactivé'}
              </StatusChip>
              <ConfirmAction
                title={u.isActive ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
                description={
                  u.isActive ? (
                    <>
                      <strong>{`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}</strong>{' '}
                      ne pourra plus se connecter ni utiliser KAYOU. Les conversations et
                      réservations en cours restent visibles côté contrepartie. Vous
                      pouvez réactiver ce compte à tout moment.
                    </>
                  ) : (
                    <>
                      <strong>{`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}</strong>{' '}
                      pourra à nouveau se connecter et utiliser l'app.
                    </>
                  )
                }
                confirmLabel={u.isActive ? 'Désactiver' : 'Réactiver'}
                destructive={u.isActive}
                disabled={updateMutation.isPending}
                onConfirm={() =>
                  updateMutation.mutate({ userId: u.id, isActive: !u.isActive })
                }
                trigger={(open) => (
                  <button
                    disabled={updateMutation.isPending}
                    onClick={open}
                    style={{
                      padding: '6px 11px',
                      background: 'var(--k-surface)',
                      border: '1px solid var(--k-border)',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: updateMutation.isPending ? 'wait' : 'pointer',
                      color: u.isActive ? '#B91C1C' : '#059669',
                      opacity: updateMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {u.isActive ? 'Désactiver' : 'Réactiver'}
                  </button>
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProvidersModeration({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.providers({
      page: 1,
      limit: 30,
      search: search || undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getProviders({
        page: 1,
        limit: 30,
        search: search || undefined,
      }),
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => adminApi(apiClient).updateProvider(payload as any),
    onSuccess: () => {
      toast.success('Pro mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
    },
    onError: () => toast.error('Erreur'),
  });

  const providers = (data?.providers ?? []) as any[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search
            size={14}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: 10,
              color: 'var(--k-text-subtle)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un pro…"
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 13,
              outline: 0,
              background: 'var(--k-surface)',
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <OpsCard>
          <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>Chargement…</div>
        </OpsCard>
      ) : providers.length === 0 ? (
        <EmptyOpsState icon={BadgeCheck} title="Aucun pro" description="Aucun pro pour ce filtre." />
      ) : (
        <div
          style={{
            background: 'var(--k-surface)',
            border: '1px solid var(--k-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {providers.map((p: any) => {
            const status = verificationStatusTone(p.verificationStatus ?? 'PENDING');
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--k-border-subtle)' }}
              >
                <Avatar name={`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Pro'} bg="#0EA5E9" />
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate"
                    style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-text-primary)' }}
                  >
                    {`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Pro'}
                  </div>
                  <div className="truncate" style={{ fontSize: 11.5, color: 'var(--k-text-subtle)' }}>
                    {p.profession ?? '—'} · {p.city ?? '—'} · {p.totalBookings ?? 0} missions
                  </div>
                </div>
                <StatusChip tone={status.tone}>{status.label}</StatusChip>
                <ConfirmAction
                  title={p.isAvailable ? 'Suspendre ce pro ?' : 'Réactiver ce pro ?'}
                  description={
                    p.isAvailable ? (
                      <>
                        <strong>{`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Ce pro'}</strong>{' '}
                        n'apparaîtra plus dans les résultats de recherche et ne pourra
                        plus recevoir de nouvelles demandes. Les missions en cours
                        restent visibles. Vous pouvez réactiver à tout moment.
                      </>
                    ) : (
                      <>
                        <strong>{`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Ce pro'}</strong>{' '}
                        sera à nouveau visible dans la recherche et pourra recevoir des
                        demandes.
                      </>
                    )
                  }
                  confirmLabel={p.isAvailable ? 'Suspendre' : 'Réactiver'}
                  destructive={p.isAvailable}
                  disabled={updateMutation.isPending}
                  onConfirm={() =>
                    updateMutation.mutate({
                      providerId: p.id,
                      isAvailable: !p.isAvailable,
                    })
                  }
                  trigger={(open) => (
                    <button
                      disabled={updateMutation.isPending}
                      onClick={open}
                      style={{
                        padding: '6px 11px',
                        background: 'var(--k-surface)',
                        border: '1px solid var(--k-border)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: updateMutation.isPending ? 'wait' : 'pointer',
                        color: p.isAvailable ? '#B91C1C' : '#059669',
                        opacity: updateMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      {p.isAvailable ? 'Suspendre' : 'Réactiver'}
                    </button>
                  )}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewsModeration({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.reviews({
      page: 1,
      limit: 30,
      search: search || undefined,
    }),
    queryFn: () =>
      adminApi(apiClient).getReviews({
        page: 1,
        limit: 30,
        search: search || undefined,
      }),
    enabled: isAdmin,
  });
  const moderate = useMutation({
    mutationFn: (payload: any) => adminApi(apiClient).moderateReview(payload),
    onSuccess: () => {
      toast.success('Avis mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: () => toast.error('Erreur'),
  });

  const reviews = (data?.reviews ?? []) as any[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search
            size={14}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: 10,
              color: 'var(--k-text-subtle)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans les commentaires…"
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              border: '1px solid var(--k-border)',
              borderRadius: 8,
              fontSize: 13,
              outline: 0,
              background: 'var(--k-surface)',
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <OpsCard>
          <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>Chargement…</div>
        </OpsCard>
      ) : reviews.length === 0 ? (
        <EmptyOpsState icon={Star} title="Aucun avis" description="Aucun avis publié pour ce filtre." />
      ) : (
        <div className="flex flex-col gap-2">
          {reviews.map((r: any) => (
            <div
              key={r.id}
              style={{
                background: 'var(--k-surface)',
                border: '1px solid var(--k-border)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--k-text-primary)' }}>
                  {r.clientName || r.clientId?.slice(0, 8) || 'Client'} → {r.providerName || r.providerId?.slice(0, 8) || 'Pro'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#D97706',
                    fontFamily: 'var(--k-font-mono)',
                    fontWeight: 700,
                  }}
                >
                  {'★'.repeat(r.rating ?? 0)}
                  <span style={{ color: 'var(--k-text-subtle)' }}>{'★'.repeat(5 - (r.rating ?? 0))}</span>
                </span>
                <StatusChip tone={r.isPublic !== false ? 'success' : 'warning'}>
                  {r.isPublic !== false ? 'Public' : 'Masqué'}
                </StatusChip>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--k-text-subtle)',
                    marginLeft: 'auto',
                  }}
                >
                  {fmtRelative(r.createdAt)}
                </span>
              </div>
              {r.comment && (
                <div style={{ fontSize: 12.5, color: 'var(--k-text-body)', lineHeight: 1.5 }}>
                  {r.comment}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <ConfirmAction
                  title={
                    r.isPublic === false ? 'Republier cet avis ?' : 'Masquer cet avis ?'
                  }
                  description={
                    r.isPublic === false ? (
                      <>L'avis redeviendra visible sur la fiche publique du pro.</>
                    ) : (
                      <>
                        L'avis sera masqué du profil public du pro mais restera dans la
                        base. Vous pouvez le republier à tout moment.
                      </>
                    )
                  }
                  confirmLabel={r.isPublic === false ? 'Republier' : 'Masquer'}
                  destructive={r.isPublic !== false}
                  disabled={moderate.isPending}
                  onConfirm={() =>
                    moderate.mutate({ reviewId: r.id, isPublic: r.isPublic === false })
                  }
                  trigger={(open) => (
                    <button
                      disabled={moderate.isPending}
                      onClick={open}
                      style={{
                        padding: '6px 11px',
                        background: 'var(--k-surface)',
                        border: '1px solid var(--k-border)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: moderate.isPending ? 'wait' : 'pointer',
                        color: r.isPublic === false ? '#059669' : '#B45309',
                        opacity: moderate.isPending ? 0.6 : 1,
                      }}
                    >
                      {r.isPublic === false ? 'Republier' : 'Masquer'}
                    </button>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───── Categories ───────────────────────────────────────────────────────

function CategoriesSection({ isAdmin }: { isAdmin: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => adminApi(apiClient).getCategories({ includeInactive: true } as any),
    enabled: isAdmin,
  });
  const cats = (data?.categories ?? []) as any[];

  return (
    <div>
      <SectionHeader
        title="Catégories de service"
        subtitle="Référentiel des catégories et services exposés à la recherche client."
      />
      {isLoading ? (
        <OpsCard>
          <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>Chargement…</div>
        </OpsCard>
      ) : cats.length === 0 ? (
        <EmptyOpsState icon={Layers} title="Aucune catégorie" description="Le référentiel est vide." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((c: any) => (
            <div
              key={c.id}
              style={{
                background: 'var(--k-surface)',
                border: '1px solid var(--k-border)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--k-text-primary)',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--k-text-subtle)',
                      fontFamily: 'var(--k-font-mono)',
                      marginTop: 2,
                    }}
                  >
                    /{c.slug}
                  </div>
                </div>
                <StatusChip tone={c.isActive === false ? 'warning' : 'success'}>
                  {c.isActive === false ? 'Inactive' : 'Active'}
                </StatusChip>
              </div>
              <div style={{ fontSize: 12, color: 'var(--k-text-muted)' }}>
                {c.providerCount ?? 0} pros
                {c.subcategoryCount != null ? ` · ${c.subcategoryCount} sous-catégories` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        className="mt-4 inline-flex items-center gap-2"
        style={{
          background: 'var(--k-warning-subtle)',
          border: '1px solid #FDE68A',
          color: '#78350F',
          padding: '10px 14px',
          borderRadius: 10,
          fontSize: 12.5,
        }}
      >
        <AlertTriangle size={14} /> Création et édition de catégories à brancher dans une prochaine itération admin.
      </div>
    </div>
  );
}

// ───── Payouts (honest placeholder) ─────────────────────────────────────

function PayoutsSection() {
  return (
    <div>
      <SectionHeader
        title="Payouts opérateurs"
        subtitle="Suivi des règlements pros — surface admin uniquement."
      />
      <div
        style={{
          background: 'var(--k-surface)',
          border: '1px solid var(--k-border)',
          borderRadius: 12,
          padding: 28,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#F1F5F9',
            color: '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Coins size={26} />
        </div>
        <div
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 700,
            fontSize: 18,
            color: 'var(--k-text-primary)',
            marginBottom: 6,
          }}
        >
          Pas de payouts à traiter
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--k-text-muted)',
            maxWidth: 480,
            margin: '0 auto 14px',
            lineHeight: 1.5,
          }}
        >
          Le MVP Kinshasa fonctionne en paiement cash direct entre client et prestataire.
          Aucun batch Mobile Money n'est traité par KAYOU pour le lancement. Cette
          surface admin restera vide jusqu'à activation du règlement opérateur.
        </div>
        <div
          className="inline-flex items-center gap-2"
          style={{
            padding: '6px 12px',
            background: 'var(--k-warning-subtle)',
            color: '#78350F',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <AlertTriangle size={12} /> Bientôt disponible
        </div>
      </div>
    </div>
  );
}
