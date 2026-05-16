'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  ChevronRight,
  Eye,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import {
  identityApi,
  onboardingApi,
  providersApi,
  categoriesApi,
  dashboardApi,
  queryKeys,
} from '@kayu/api';
import { useToast } from '@/hooks/use-toast';
import { VisibilitySettings } from '@/components/settings/VisibilitySettings';
import {
  CITIES,
  YEARS_OPTIONS,
  LANGUAGES,
  SKILL_SUGGESTIONS,
} from '@/app/pro/onboarding/types';
import type { CategorySlug } from '@kayu/ui';

type Role = 'CLIENT' | 'PROVIDER' | 'ADMIN';

type SectionId =
  | 'profile'
  | 'language'
  | 'payment'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'support'
  | 'danger'
  | 'services'
  | 'availability'
  | 'zones';

type SectionDef = {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: string;
  warn?: boolean;
};

const CLIENT_SECTIONS: SectionDef[] = [
  { id: 'profile', label: 'Profil', icon: User, group: 'perso' },
  { id: 'language', label: 'Langue & région', icon: Globe, group: 'perso' },
  { id: 'payment', label: 'Paiement', icon: Wallet, group: 'perso' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'préférences' },
  { id: 'privacy', label: 'Confidentialité', icon: Eye, group: 'préférences' },
  { id: 'security', label: 'Sécurité', icon: Lock, group: 'compte' },
  { id: 'support', label: 'Aide & contact', icon: HelpCircle, group: 'compte' },
  { id: 'danger', label: 'Zone dangereuse', icon: AlertTriangle, group: 'compte', warn: true },
];

const PROVIDER_SECTIONS: SectionDef[] = [
  { id: 'profile', label: 'Profil pro', icon: User, group: 'pro' },
  { id: 'services', label: 'Services & tarifs', icon: Wrench, group: 'pro' },
  { id: 'availability', label: 'Disponibilités', icon: Calendar, group: 'pro' },
  { id: 'zones', label: "Zones d'intervention", icon: MapPin, group: 'pro' },
  { id: 'language', label: 'Langue & région', icon: Globe, group: 'perso' },
  { id: 'payment', label: 'Paiement', icon: Wallet, group: 'perso' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'préférences' },
  { id: 'privacy', label: 'Visibilité du profil', icon: Eye, group: 'préférences' },
  { id: 'security', label: 'Sécurité', icon: Lock, group: 'compte' },
  { id: 'support', label: 'Aide & contact', icon: HelpCircle, group: 'compte' },
  { id: 'danger', label: 'Zone dangereuse', icon: AlertTriangle, group: 'compte', warn: true },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const role: Role = (user?.role as Role) ?? 'CLIENT';
  const isProvider = role === 'PROVIDER';
  const sections = useMemo<SectionDef[]>(
    () => (isProvider ? PROVIDER_SECTIONS : CLIENT_SECTIONS),
    [isProvider],
  );
  const grouped = useMemo(() => {
    const out = new Map<string, SectionDef[]>();
    sections.forEach((s) => {
      if (!out.has(s.group)) out.set(s.group, []);
      out.get(s.group)!.push(s);
    });
    return out;
  }, [sections]);

  const [active, setActive] = useState<SectionId>('profile');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Mon compte';

  return (
    <div
      className="-m-4 sm:-m-6"
      style={{ background: 'var(--k-bg)', minHeight: 'calc(100vh - 64px)' }}
    >
      {/* Mobile detail header */}
      {mobileOpen && (
        <div
          className="lg:hidden flex items-center gap-2 px-4 py-3 sticky top-16 z-20"
          style={{
            background: 'var(--k-surface)',
            borderBottom: '1px solid var(--k-border)',
          }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'transparent',
              border: 0,
              padding: 6,
              cursor: 'pointer',
              color: 'var(--k-text-primary)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--k-text-primary)' }}>
            {sections.find((s) => s.id === active)?.label ?? 'Réglages'}
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar — always visible on lg+; on mobile, hidden when a detail section is open */}
        <aside
          className={`${mobileOpen ? 'hidden' : 'block'} lg:block lg:w-[270px] lg:border-r flex-shrink-0`}
          style={{
            background: 'var(--k-surface)',
            borderColor: 'var(--k-border)',
          }}
        >
            <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--k-border)' }}>
              <h1
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: '-0.02em',
                  color: 'var(--k-text-primary)',
                  margin: 0,
                }}
              >
                Réglages
              </h1>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--k-text-muted)',
                  marginTop: 4,
                }}
              >
                {isProvider ? 'Compte prestataire' : role === 'ADMIN' ? 'Compte administrateur' : 'Compte client'}
              </div>
            </div>

            <nav className="px-2 py-3">
              {Array.from(grouped.entries()).map(([groupName, items]) => (
                <div key={groupName} className="mb-3.5">
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--k-text-subtle)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '6px 12px',
                    }}
                  >
                    {groupName}
                  </div>
                  {items.map((s) => {
                    const Icon = s.icon;
                    const isActive = active === s.id;
                    const fg = s.warn
                      ? '#B91C1C'
                      : isActive
                        ? 'var(--k-text-primary)'
                        : 'var(--k-text-body)';
                    const bg = isActive ? (s.warn ? 'var(--k-danger-subtle)' : 'var(--k-surface-muted)') : 'transparent';
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setActive(s.id);
                          setMobileOpen(true);
                        }}
                        className="w-full text-left flex items-center gap-2.5"
                        style={{
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: 0,
                          background: bg,
                          color: fg,
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={15} />
                        <span className="flex-1">{s.label}</span>
                        <ChevronRight size={14} className="lg:hidden" style={{ color: 'var(--k-border-strong)' }} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div
              className="px-3 py-3 mt-auto"
              style={{ borderTop: '1px solid var(--k-border)' }}
            >
              <div className="flex items-center gap-3 px-1">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isProvider ? '#0EA5E9' : '#DC2626',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {(user.firstName ?? '').charAt(0).toUpperCase()}
                  {(user.lastName ?? '').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--k-text-primary)',
                    }}
                  >
                    {fullName}
                  </div>
                  <div
                    className="truncate"
                    style={{ fontSize: 11, color: 'var(--k-text-subtle)' }}
                  >
                    {user.email || user.phone || ''}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 6,
                    cursor: 'pointer',
                    color: 'var(--k-text-muted)',
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
        </aside>

        {/* Content — always visible on lg+; on mobile, only after picking a section */}
        <main
          className={`${mobileOpen ? 'block' : 'hidden lg:block'} flex-1 overflow-y-auto`}
        >
          <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-[760px] mx-auto lg:mx-0">
            {active === 'profile' && <ProfileSection role={role} />}
            {active === 'language' && <LanguageSection />}
            {active === 'payment' && <PaymentSection isProvider={isProvider} />}
            {active === 'notifications' && <NotificationsSection isProvider={isProvider} />}
            {active === 'privacy' && <PrivacySection role={role} />}
            {active === 'security' && <SecuritySection user={user} />}
            {active === 'support' && <SupportSection />}
            {active === 'danger' && <DangerSection isProvider={isProvider} onLogout={handleLogout} />}
            {active === 'services' && <ServicesSection />}
            {active === 'availability' && <AvailabilitySection />}
            {active === 'zones' && <ZonesSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ───── Section primitives ───────────────────────────────────────────────

function SettingsHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6">
      <h1
        style={{
          fontFamily: 'var(--k-font-display)',
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: '-0.02em',
          color: 'var(--k-text-primary)',
          margin: '0 0 6px',
        }}
      >
        {title}
      </h1>
      <div style={{ fontSize: 13.5, color: 'var(--k-text-muted)', lineHeight: 1.5 }}>
        {subtitle}
      </div>
    </header>
  );
}

function CardSection({
  children,
  warn,
}: {
  children: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <section
      style={{
        background: 'var(--k-surface)',
        border: '1px solid',
        borderColor: warn ? '#FCA5A5' : 'var(--k-border)',
        borderRadius: 12,
        padding: 18,
        marginBottom: 14,
        boxShadow: 'var(--k-e1)',
      }}
    >
      {children}
    </section>
  );
}

function CardTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-3 mb-3">
      <div>
        <h3
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--k-text-primary)',
            margin: '0 0 3px',
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)' }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 sm:gap-4 py-3"
      style={{ borderBottom: '1px solid var(--k-border-subtle)', alignItems: 'flex-start' }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--k-text-body)' }}>
          {label}
        </div>
        {hint && (
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--k-text-subtle)',
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextField({
  defaultValue,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = 'text',
  disabled,
}: {
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        border: '1px solid var(--k-border)',
        borderRadius: 8,
        background: disabled ? 'var(--k-surface-muted)' : 'var(--k-surface)',
        padding: '0 10px',
        overflow: 'hidden',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {prefix && (
        <span style={{ fontSize: 13, color: 'var(--k-text-subtle)', paddingRight: 6 }}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          border: 0,
          outline: 0,
          padding: '9px 0',
          fontSize: 13.5,
          color: 'var(--k-text-primary)',
          background: 'transparent',
          fontFamily: 'inherit',
        }}
      />
      {suffix && (
        <span style={{ fontSize: 12, color: 'var(--k-text-subtle)' }}>{suffix}</span>
      )}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
  hint,
  disabled,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className="flex items-start gap-3 py-2.5"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      <button
        type="button"
        onClick={() => !disabled && onChange?.(!on)}
        aria-pressed={on}
        disabled={disabled}
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          border: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: on ? 'var(--k-primary)' : 'var(--k-border-strong)',
          padding: 2,
          position: 'relative',
          flexShrink: 0,
          marginTop: 1,
          transition: 'background 150ms',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'white',
            transform: `translateX(${on ? 16 : 0}px)`,
            transition: 'transform 150ms',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--k-text-primary)' }}>
          {label}
        </div>
        {hint && (
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--k-text-subtle)',
              marginTop: 1,
              lineHeight: 1.4,
            }}
          >
            {hint}
          </div>
        )}
      </div>
    </label>
  );
}

function ComingLaterChip({ children = 'Bientôt disponible' }: { children?: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        color: '#B45309',
        background: 'var(--k-warning-subtle)',
        padding: '2px 8px',
        borderRadius: 999,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

// ───── Provider-data editor helpers ─────────────────────────────────────

const YEARS_TO_NUMBER: Record<string, number> = {
  '< 1 an': 0,
  '1–3 ans': 2,
  '4–7 ans': 5,
  '8+ ans': 10,
};

function numberToYearsBucket(value: number | null | undefined): string {
  if (value === undefined || value === null) return '';
  if (value <= 0) return '< 1 an';
  if (value <= 3) return '1–3 ans';
  if (value <= 7) return '4–7 ans';
  return '8+ ans';
}

function ChipButton({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 12px',
        borderRadius: 999,
        border: `1px solid ${selected ? 'var(--k-primary)' : 'var(--k-border)'}`,
        background: selected ? 'var(--k-surface-primary)' : 'var(--k-surface)',
        color: selected ? 'var(--k-primary-hover)' : 'var(--k-text-body)',
        fontSize: 12.5,
        fontWeight: selected ? 700 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SaveBar({
  onSave,
  pending,
  disabled,
  hint,
}: {
  onSave: () => void;
  pending: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex justify-end items-center gap-3">
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--k-text-subtle)' }}>{hint}</span>
      )}
      <button
        onClick={onSave}
        disabled={pending || disabled}
        style={{
          padding: '9px 16px',
          background: 'var(--k-text-primary)',
          color: 'white',
          border: 0,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: pending || disabled ? 'not-allowed' : 'pointer',
          opacity: pending || disabled ? 0.6 : 1,
        }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}

function useProviderDraft() {
  return useQuery({
    queryKey: queryKeys.onboarding.draft,
    queryFn: () => onboardingApi(apiClient).getDraft(),
  });
}

function useProviderDataInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.onboarding.draft });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
    qc.invalidateQueries({ queryKey: queryKeys.providers.strength });
  };
}

// ───── Profile ──────────────────────────────────────────────────────────

function ProfileSection({ role }: { role: Role }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const isClient = role !== 'PROVIDER';

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');

  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setPhone(user?.phone ?? '');
    setCity(user?.city ?? '');
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      identityApi(apiClient).completeProfile({
        firstName,
        lastName,
        role: (user?.role as 'CLIENT' | 'PROVIDER') ?? 'CLIENT',
        country: user?.country ?? 'RDC',
        city: city || undefined,
        phone: phone || undefined,
      }),
    onSuccess: async () => {
      await refreshUser();
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' });
    },
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil',
      }),
  });

  return (
    <div>
      <SettingsHeader
        title={isClient ? 'Mon profil' : 'Profil pro'}
        subtitle={
          isClient
            ? 'Vos informations personnelles et de contact.'
            : 'Ce que voient les clients sur votre fiche pro.'
        }
      />
      <CardSection>
        <CardTitle title="Informations personnelles" />
        <FieldRow label="Prénom">
          <TextField value={firstName} onChange={setFirstName} />
        </FieldRow>
        <FieldRow label="Nom">
          <TextField value={lastName} onChange={setLastName} />
        </FieldRow>
        <FieldRow label="Téléphone" hint="Utilisé pour la connexion par SMS.">
          <TextField value={phone} onChange={setPhone} placeholder="+243 8XX XXX XXX" />
        </FieldRow>
        <FieldRow label="E-mail" hint="L'e-mail est lié à votre compte et ne peut être modifié ici.">
          <TextField value={user?.email ?? ''} disabled />
        </FieldRow>
        <FieldRow label="Ville">
          <TextField value={city} onChange={setCity} placeholder="Kinshasa" />
        </FieldRow>
      </CardSection>

      {!isClient && <PresentationPubliqueCard />}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{
            padding: '9px 16px',
            background: 'var(--k-text-primary)',
            color: 'white',
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: mutation.isPending ? 'wait' : 'pointer',
          }}
        >
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function PresentationPubliqueCard() {
  const { toast } = useToast();
  const invalidate = useProviderDataInvalidation();
  const draftQ = useProviderDraft();

  const [description, setDescription] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !draftQ.data) return;
    const d = draftQ.data.draft;
    setDescription(d.description ?? '');
    setLanguages(d.languages ?? []);
    setLoaded(true);
  }, [draftQ.data, loaded]);

  const toggleLang = (l: string) =>
    setLanguages((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );

  const mutation = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({
        description: description.trim() === '' ? null : description.trim().slice(0, 1000),
        languages,
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Présentation mise à jour', description: 'Votre bio et vos langues ont été enregistrées.' });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour la présentation.' }),
  });

  return (
    <>
      <CardSection>
        <CardTitle title="Présentation publique" subtitle="Bio et langues visibles sur votre fiche." />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--k-text-body)', marginBottom: 6 }}>
            À propos de moi
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            placeholder="Plombier indépendant depuis 2018, spécialisé en chauffe-eau et fuites."
            style={{
              width: '100%',
              minHeight: 110,
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--k-border)',
              background: 'var(--k-surface)',
              fontSize: 13.5,
              lineHeight: 1.5,
              color: 'var(--k-text-primary)',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--k-text-subtle)', textAlign: 'right', marginTop: 4 }}>
            {description.length} / 1000
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--k-text-body)', marginBottom: 6 }}>
            Langues parlées
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <ChipButton key={l} selected={languages.includes(l)} onClick={() => toggleLang(l)}>
                {l}
              </ChipButton>
            ))}
          </div>
        </div>
      </CardSection>
      <SaveBar onSave={() => mutation.mutate()} pending={mutation.isPending} />
    </>
  );
}

// ───── Language ─────────────────────────────────────────────────────────

function LanguageSection() {
  const langs = [
    { id: 'fr', label: 'Français', sub: 'Langue par défaut', flag: '🇫🇷', selected: true },
    { id: 'ln', label: 'Lingala', sub: 'Bientôt disponible', flag: '🇨🇩', soon: true },
    { id: 'sw', label: 'Kiswahili', sub: 'Bientôt disponible', flag: '🇨🇩', soon: true },
    { id: 'en', label: 'English', sub: 'Bientôt disponible', flag: '🇬🇧', soon: true },
  ];
  return (
    <div>
      <SettingsHeader
        title="Langue & région"
        subtitle="Pour le lancement, l'app et les notifications sont en français."
      />
      <CardSection>
        <CardTitle title="Langue de l'app" />
        <div className="flex flex-col gap-2">
          {langs.map((l) => (
            <label
              key={l.id}
              className="flex items-center gap-3"
              style={{
                padding: 12,
                border: '1px solid',
                borderColor: l.selected ? 'var(--k-primary)' : 'var(--k-border)',
                borderRadius: 10,
                cursor: l.soon ? 'not-allowed' : 'default',
                background: l.selected ? 'var(--k-surface-primary)' : 'var(--k-surface)',
                opacity: l.soon ? 0.55 : 1,
              }}
            >
              <input
                type="radio"
                name="lang"
                disabled={l.soon}
                defaultChecked={l.selected}
              />
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <div className="flex-1">
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--k-text-primary)',
                  }}
                >
                  {l.label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--k-text-subtle)' }}>{l.sub}</div>
              </div>
              {l.soon && <ComingLaterChip>Bientôt</ComingLaterChip>}
            </label>
          ))}
        </div>
      </CardSection>
      <CardSection>
        <CardTitle title="Région & devise" />
        <FieldRow label="Pays">
          <TextField value="République Démocratique du Congo" disabled />
        </FieldRow>
        <FieldRow label="Devise d'affichage" hint="Les paiements se font en cash en monnaie locale.">
          <TextField value="Franc congolais (FC)" disabled />
        </FieldRow>
      </CardSection>
    </div>
  );
}

// ───── Payment (cash MVP) ───────────────────────────────────────────────

function PaymentSection({ isProvider }: { isProvider: boolean }) {
  return (
    <div>
      <SettingsHeader
        title="Paiement"
        subtitle={
          isProvider
            ? 'Vous recevez le paiement directement de la main du client à la fin de la mission.'
            : 'Vous payez le prestataire en espèces à la fin de la mission, au prix convenu dans le chat.'
        }
      />
      <CardSection>
        <CardTitle title="Mode de paiement actuel" />
        <div
          className="flex items-start gap-3"
          style={{
            padding: 14,
            background: 'var(--k-success-subtle)',
            border: '1px solid #A7F3D0',
            borderRadius: 10,
          }}
        >
          <Wallet size={18} style={{ color: '#047857', marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#065F46' }}>
              Espèces à la fin de la mission
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: '#047857',
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              Le prix convenu dans le chat est réglé en cash, directement entre client et
              prestataire. KAYOU ne gère pas le paiement cash réalisé en personne et ne
              stocke pas de carte bancaire.
            </div>
          </div>
        </div>
      </CardSection>
      <CardSection>
        <CardTitle
          title="Mobile Money & paiement en ligne"
          subtitle="Pas activé pour le lancement Kinshasa."
          action={<ComingLaterChip />}
        />
        <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)', lineHeight: 1.5 }}>
          {isProvider
            ? "Le règlement par M-Pesa ou Airtel Money pour vos missions sera disponible plus tard. D'ici là, encaissez le client à la fin de la mission."
            : "Le paiement par M-Pesa ou Airtel Money sera disponible plus tard. D'ici là, prévoyez le montant en espèces le jour de l'intervention."}
        </div>
      </CardSection>
    </div>
  );
}

// ───── Notifications (display rows; persistence not wired) ──────────────

function NotificationsSection({ isProvider }: { isProvider: boolean }) {
  const rows = isProvider
    ? [
        { id: 'requests', label: 'Nouvelles demandes', desc: "SMS quand un client cherche votre service.", channel: 'SMS', on: true, locked: true },
        { id: 'messages', label: 'Messages clients', desc: 'Notification dans la conversation.', channel: 'In-app', on: true, locked: true },
        { id: 'reviews', label: 'Nouveaux avis', desc: "Quand un client laisse un avis sur vos missions.", channel: 'In-app', on: true },
        { id: 'tips', label: 'Conseils & nouveautés', desc: 'Bonnes pratiques pour gagner plus de missions.', channel: 'E-mail', on: false },
      ]
    : [
        { id: 'booking', label: 'Confirmations de réservation', desc: 'Quand un pro accepte ou répond à votre demande.', channel: 'SMS', on: true, locked: true },
        { id: 'messages', label: 'Nouveaux messages', desc: 'Conversations avec les pros.', channel: 'In-app', on: true, locked: true },
        { id: 'reminders', label: 'Rappels de rendez-vous', desc: '1h avant chaque prestation.', channel: 'SMS', on: true },
        { id: 'reviews', label: "Demandes d'avis", desc: 'Après chaque prestation terminée.', channel: 'In-app', on: true },
        { id: 'promos', label: 'Offres et nouveautés', desc: 'Codes promo, nouvelles catégories.', channel: 'E-mail', on: false },
      ];

  return (
    <div>
      <SettingsHeader
        title="Notifications"
        subtitle="Pour le lancement, KAYOU envoie l'essentiel par SMS et dans l'app. Les préférences détaillées et l'e-mail arrivent plus tard."
      />
      <CardSection>
        <CardTitle
          title="Préférences"
          subtitle="Aperçu des canaux utilisés actuellement"
          action={<ComingLaterChip>Personnalisation à venir</ComingLaterChip>}
        />
        <div className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 py-3"
              style={{ borderBottom: '1px solid var(--k-border-subtle)' }}
            >
              <Toggle
                on={r.on}
                disabled
                onChange={() => {}}
                label={r.label}
                hint={`${r.desc}${r.locked ? ' Toujours activé pour la sécurité.' : ''}`}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--k-text-muted)',
                  background: 'var(--k-surface-muted)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  marginTop: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {r.channel}
              </span>
            </div>
          ))}
        </div>
      </CardSection>
    </div>
  );
}

// ───── Privacy ──────────────────────────────────────────────────────────

function PrivacySection({ role }: { role: Role }) {
  if (role === 'PROVIDER') {
    return (
      <div>
        <SettingsHeader
          title="Visibilité du profil"
          subtitle="Gérez ce que les clients voient sur votre fiche pro."
        />
        <VisibilitySettings userRole="PROVIDER" />
      </div>
    );
  }
  return (
    <div>
      <SettingsHeader
        title="Confidentialité"
        subtitle="Ce que les pros peuvent voir de vous quand vous les contactez."
      />
      <CardSection>
        <CardTitle title="Coordonnées partagées" />
        <Toggle
          on={false}
          disabled
          onChange={() => {}}
          label="Afficher mon numéro avant la confirmation"
          hint="Désactivé par défaut. Le contact passe par le chat KAYOU."
        />
        <Toggle
          on
          disabled
          onChange={() => {}}
          label="Partager ma ville sur ma demande"
          hint="Aide les pros à estimer le déplacement."
        />
      </CardSection>
      <CardSection>
        <CardTitle title="Mes données" action={<ComingLaterChip />} />
        <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)', lineHeight: 1.5 }}>
          Téléchargement RGPD et historique d'accès au compte arrivent dans une prochaine
          itération. En attendant, contactez le support pour toute demande.
        </div>
      </CardSection>
    </div>
  );
}

// ───── Security ─────────────────────────────────────────────────────────

function SecuritySection({ user }: { user: { phone?: string | null; email: string | null } }) {
  return (
    <div>
      <SettingsHeader
        title="Sécurité"
        subtitle="Connexion et accès au compte."
      />
      <CardSection>
        <CardTitle title="Authentification" />
        <FieldRow label="Connexion par SMS" hint="Code à 6 chiffres reçu sur votre numéro vérifié.">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#047857',
                background: 'var(--k-success-subtle)',
                padding: '4px 9px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ShieldCheck size={12} /> Activé
            </span>
            <span style={{ fontSize: 12, color: 'var(--k-text-subtle)' }}>
              {user.phone || 'aucun numéro'}
            </span>
          </div>
        </FieldRow>
        <FieldRow label="E-mail de récupération" hint="Utilisé pour les notifications administratives.">
          <TextField value={user.email ?? ''} disabled />
        </FieldRow>
        <FieldRow label="Mot de passe" hint="Le compte utilise la connexion SMS — pas de mot de passe à gérer.">
          <ComingLaterChip>Sans objet</ComingLaterChip>
        </FieldRow>
      </CardSection>

      <CardSection>
        <CardTitle title="Sessions actives" action={<ComingLaterChip />} />
        <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)', lineHeight: 1.5 }}>
          La gestion fine des appareils connectés sera disponible plus tard. Pour
          déconnecter cet appareil immédiatement, utilisez le bouton de déconnexion
          dans la barre latérale.
        </div>
      </CardSection>
    </div>
  );
}

// ───── Support ──────────────────────────────────────────────────────────

function SupportSection() {
  return (
    <div>
      <SettingsHeader
        title="Aide & contact"
        subtitle="Une question ? L'équipe KAYOU répond en français, à Kinshasa."
      />
      <CardSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SupportCard
            icon={MessageCircle}
            label="Chat avec l'équipe"
            desc="Réponse en moyenne sous 1h en journée."
            tint="#0EA5E9"
          />
          <SupportCard
            icon={Phone}
            label="Appel direct"
            desc="Joignable du lundi au samedi, 8h–19h."
            tint="#059669"
          />
          <SupportCard
            icon={HelpCircle}
            label="Centre d'aide"
            desc="Guides pratiques pour clients et pros."
            tint="#7C3AED"
          />
          <SupportCard
            icon={AlertTriangle}
            label="Signaler un problème"
            desc="Bug, comportement inapproprié, doute sur un pro."
            tint="#DC2626"
          />
        </div>
      </CardSection>
      <CardSection>
        <CardTitle title="Légal" />
        {[
          "Conditions générales d'utilisation",
          'Politique de confidentialité',
          'Charte du pro KAYOU',
          'Mentions légales',
        ].map((l) => (
          <div
            key={l}
            className="flex justify-between items-center py-2.5"
            style={{
              borderBottom: '1px solid var(--k-border-subtle)',
              fontSize: 13,
              color: 'var(--k-text-body)',
            }}
          >
            <span>{l}</span>
            <ChevronRight size={14} style={{ color: 'var(--k-border-strong)' }} />
          </div>
        ))}
        <div
          style={{
            padding: '12px 0 0',
            fontSize: 11,
            color: 'var(--k-text-subtle)',
            textAlign: 'center',
          }}
        >
          KAYOU MVP Kinshasa · build interne
        </div>
      </CardSection>
    </div>
  );
}

function SupportCard({
  icon: Icon,
  label,
  desc,
  tint,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  desc: string;
  tint: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--k-surface)',
        border: '1px solid var(--k-border)',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: `${tint}15`,
          color: tint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={17} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-text-primary)' }}>
          {label}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--k-text-subtle)', marginTop: 2, lineHeight: 1.45 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

// ───── Danger ───────────────────────────────────────────────────────────

function DangerSection({
  isProvider,
  onLogout,
}: {
  isProvider: boolean;
  onLogout: () => Promise<void>;
}) {
  return (
    <div>
      <SettingsHeader
        title="Zone dangereuse"
        subtitle="Actions sensibles. Lisez bien avant de cliquer."
      />
      <CardSection>
        <CardTitle title="Se déconnecter de cet appareil" />
        <DangerRow
          title="Déconnexion"
          desc="Ferme votre session sur ce navigateur. Vous pourrez vous reconnecter à tout moment avec votre numéro."
          cta="Se déconnecter"
          onClick={onLogout}
          variant="neutral"
        />
      </CardSection>
      <CardSection warn>
        <CardTitle title="Actions définitives" action={<ComingLaterChip>À demander au support</ComingLaterChip>} />
        <DangerRow
          title="Mettre mon compte en pause"
          desc={
            isProvider
              ? "Vous n'apparaîtrez plus dans les résultats et ne recevrez plus de demandes. Aucune perte d'historique."
              : 'Vous ne recevrez plus de notifications. Vous pouvez réactiver à tout moment.'
          }
          cta="Demander une pause"
          variant="warn"
          disabled
        />
        <DangerRow
          title="Supprimer mon compte définitivement"
          desc={
            isProvider
              ? 'Toutes vos données — profil, avis, historique — seront effacées. Les missions en cours doivent être terminées avant suppression. Cette action est IRRÉVERSIBLE.'
              : 'Toutes vos données — profil, historique, messages — seront effacées. Les réservations en cours doivent être terminées ou annulées avant. Cette action est IRRÉVERSIBLE.'
          }
          cta="Demander la suppression"
          variant="destructive"
          icon={Trash2}
          disabled
        />
      </CardSection>
    </div>
  );
}

function DangerRow({
  title,
  desc,
  cta,
  variant,
  onClick,
  disabled,
  icon: Icon,
}: {
  title: string;
  desc: string;
  cta: string;
  variant: 'neutral' | 'warn' | 'destructive';
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
}) {
  const styles =
    variant === 'destructive'
      ? { btnBg: '#DC2626', btnFg: 'white', border: 'none' }
      : variant === 'warn'
        ? { btnBg: 'var(--k-surface)', btnFg: '#B45309', border: '1px solid #FDE68A' }
        : { btnBg: 'var(--k-surface)', btnFg: 'var(--k-text-body)', border: '1px solid var(--k-border)' };
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4 py-4"
      style={{ borderBottom: '1px solid var(--k-border-subtle)', alignItems: 'center' }}
    >
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--k-text-muted)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 justify-center"
        style={{
          padding: '9px 14px',
          borderRadius: 8,
          border: styles.border,
          background: styles.btnBg,
          color: styles.btnFg,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {Icon && <Icon size={13} />} {cta}
      </button>
    </div>
  );
}

// ───── Provider-only sections (display-only stubs) ─────────────────────

function ServicesSection() {
  const { toast } = useToast();
  const invalidate = useProviderDataInvalidation();
  const draftQ = useProviderDraft();
  const catsQ = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi(apiClient).getAll({ withSubcategories: true }),
  });

  const [profession, setProfession] = useState('');
  const [hourly, setHourly] = useState('');
  const [years, setYears] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !draftQ.data) return;
    const d = draftQ.data.draft;
    setProfession(d.profession ?? '');
    setHourly(d.hourlyRate != null ? String(d.hourlyRate) : '');
    setYears(numberToYearsBucket(d.yearsOfExperience));
    setCategoryIds((d.categoryIds ?? []).slice(0, 3));
    setSubcategoryIds((d.subcategoryIds ?? []).slice(0, 3));
    setSkills((d.skills ?? []).map((s) => s.name));
    setLoaded(true);
  }, [draftQ.data, loaded]);

  const categories = catsQ.data?.categories ?? [];
  const selectedCats = categories.filter((c) => categoryIds.includes(c.id));
  const availableSubcats = selectedCats.flatMap((c) => c.subcategories ?? []);
  const skillSuggestions = Array.from(
    new Set(
      selectedCats.flatMap((c) =>
        SKILL_SUGGESTIONS[c.slug as CategorySlug] ?? [],
      ),
    ),
  ).filter((s) => !skills.includes(s));

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        const stillValid = new Set(
          categories
            .filter((c) => next.includes(c.id))
            .flatMap((c) => (c.subcategories ?? []).map((s) => s.id)),
        );
        setSubcategoryIds((subs) => subs.filter((s) => stillValid.has(s)));
        return next;
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };
  const toggleSub = (id: string) =>
    setSubcategoryIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id],
    );
  const toggleSkill = (name: string) =>
    setSkills((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills((p) => [...p, v]);
    setSkillInput('');
  };

  const mutation = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({
        profession: profession.trim(),
        hourlyRate: hourly === '' ? null : Math.max(0, Math.round(Number(hourly))),
        experience: years ? YEARS_TO_NUMBER[years] : null,
        categoryIds,
        subcategoryIds,
        skills: skills.map((name) => ({ name, level: 3 })),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Services mis à jour', description: 'Vos services et tarifs ont été enregistrés.' });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour vos services.' }),
  });

  const canSave = profession.trim().length >= 2 && categoryIds.length >= 1;

  return (
    <div>
      <SettingsHeader
        title="Services & tarifs"
        subtitle="Ce que vous proposez et combien vous facturez."
      />
      <CardSection>
        <CardTitle title="Activité" />
        <FieldRow label="Intitulé d'activité" hint="Ex : Plombier certifié.">
          <TextField value={profession} onChange={setProfession} placeholder="Plombier certifié" />
        </FieldRow>
        <FieldRow label="Prix de départ" hint="Affiché « à partir de … FC ».">
          <TextField value={hourly} onChange={setHourly} type="number" suffix="FC" placeholder="8000" />
        </FieldRow>
        <FieldRow label="Expérience">
          <div className="flex flex-wrap gap-2">
            {YEARS_OPTIONS.map((y) => (
              <ChipButton key={y} selected={years === y} onClick={() => setYears(y)}>
                {y}
              </ChipButton>
            ))}
          </div>
        </FieldRow>
      </CardSection>

      <CardSection>
        <CardTitle title="Catégories" subtitle={`${categoryIds.length}/3 — jusqu'à trois.`} />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const sel = categoryIds.includes(c.id);
            return (
              <ChipButton
                key={c.id}
                selected={sel}
                disabled={!sel && categoryIds.length >= 3}
                onClick={() => toggleCategory(c.id)}
              >
                {c.name}
              </ChipButton>
            );
          })}
        </div>
        {availableSubcats.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--k-text-body)', marginBottom: 8 }}>
              Sous-catégories <span style={{ color: 'var(--k-text-subtle)' }}>({subcategoryIds.length}/3)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSubcats.map((s) => {
                const sel = subcategoryIds.includes(s.id);
                return (
                  <ChipButton
                    key={s.id}
                    selected={sel}
                    disabled={!sel && subcategoryIds.length >= 3}
                    onClick={() => toggleSub(s.id)}
                  >
                    {s.name}
                  </ChipButton>
                );
              })}
            </div>
          </div>
        )}
      </CardSection>

      <CardSection>
        <CardTitle title="Compétences" subtitle="Les clients filtrent par compétence." />
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
          {skills.map((s) => (
            <ChipButton key={s} selected onClick={() => toggleSkill(s)}>
              {s} ✕
            </ChipButton>
          ))}
          {skills.length === 0 && (
            <span style={{ fontSize: 12.5, color: 'var(--k-text-subtle)' }}>
              Aucune compétence ajoutée.
            </span>
          )}
        </div>
        {skillSuggestions.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, color: 'var(--k-text-subtle)', marginBottom: 6 }}>
              Suggestions
            </div>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions.map((s) => (
                <ChipButton key={s} selected={false} onClick={() => toggleSkill(s)}>
                  + {s}
                </ChipButton>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div style={{ flex: 1 }}>
            <TextField
              value={skillInput}
              onChange={setSkillInput}
              placeholder="Ajouter une compétence"
            />
          </div>
          <button
            type="button"
            onClick={addSkill}
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid var(--k-border)',
              background: 'var(--k-surface)',
              color: 'var(--k-text-body)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ajouter
          </button>
        </div>
      </CardSection>

      <SaveBar
        onSave={() => mutation.mutate()}
        pending={mutation.isPending}
        disabled={!canSave}
        hint={!canSave ? 'Intitulé (2+ caractères) et au moins une catégorie requis.' : undefined}
      />
    </div>
  );
}

function AvailabilitySection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const dashQ = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
  });
  const current = dashQ.data?.availability?.isAvailable ?? true;

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      providersApi(apiClient).updateAvailability({ isAvailable: next }),
    onSuccess: (_res, next) => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      qc.invalidateQueries({ queryKey: queryKeys.providers.strength });
      toast({
        title: next ? 'Disponible' : 'Indisponible',
        description: next
          ? 'Vous recevez de nouvelles demandes.'
          : "Vous n'apparaissez plus dans les nouvelles recherches.",
      });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour la disponibilité.' }),
  });

  return (
    <div>
      <SettingsHeader
        title="Disponibilités"
        subtitle="Indiquez si vous acceptez de nouvelles demandes."
      />
      <CardSection>
        <CardTitle title="Statut actuel" />
        <Toggle
          on={current}
          disabled={dashQ.isLoading || mutation.isPending}
          onChange={(v) => mutation.mutate(v)}
          label="Disponible aux nouvelles demandes"
          hint={
            current
              ? 'Les clients peuvent vous trouver et vous solliciter.'
              : "Vous restez invisible aux nouvelles demandes jusqu’à réactivation."
          }
        />
      </CardSection>
      <CardSection>
        <CardTitle title="Horaires hebdomadaires" action={<ComingLaterChip />} />
        <div style={{ fontSize: 12.5, color: 'var(--k-text-muted)', lineHeight: 1.5 }}>
          Le calendrier hebdomadaire détaillé sera disponible plus tard. En attendant,
          activez ou désactivez votre disponibilité ci-dessus.
        </div>
      </CardSection>
    </div>
  );
}

function ZonesSection() {
  const { toast } = useToast();
  const invalidate = useProviderDataInvalidation();
  const draftQ = useProviderDraft();

  const [zones, setZones] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !draftQ.data) return;
    const z = draftQ.data.draft.serviceZones ?? [];
    setZones(z.map((s) => `${s.city}|${s.commune ?? ''}`));
    setLoaded(true);
  }, [draftQ.data, loaded]);

  const toggleCommune = (city: string, commune: string) => {
    const key = `${city}|${commune}`;
    setZones((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  };
  const toggleAll = (city: string, communes: string[]) => {
    const keys = communes.map((c) => `${city}|${c}`);
    const allSel = keys.every((k) => zones.includes(k));
    setZones((prev) =>
      allSel
        ? prev.filter((z) => !keys.includes(z))
        : [...prev, ...keys.filter((k) => !prev.includes(k))],
    );
  };

  const mutation = useMutation({
    mutationFn: () =>
      providersApi(apiClient).updateMe({
        serviceZones: zones
          .map((k) => {
            const [city, commune] = k.split('|');
            if (!city) return null;
            return { city, commune: commune || null };
          })
          .filter((x): x is { city: string; commune: string | null } => x !== null),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Zones mises à jour', description: 'Vos communes desservies ont été enregistrées.' });
    },
    onError: () =>
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour vos zones.' }),
  });

  return (
    <div>
      <SettingsHeader
        title="Zones d'intervention"
        subtitle="Où acceptez-vous de vous déplacer ?"
      />
      <CardSection>
        {CITIES.map((city) => {
          const allSel = city.communes.every((c) => zones.includes(`${city.name}|${c}`));
          return (
            <div key={city.name} style={{ marginBottom: 8 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <CardTitle title={`Communes — ${city.name}`} />
                <button
                  type="button"
                  onClick={() => toggleAll(city.name, city.communes)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: '4px 4px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--k-primary-hover)',
                    cursor: 'pointer',
                  }}
                >
                  {allSel ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {city.communes.map((c) => (
                  <ChipButton
                    key={c}
                    selected={zones.includes(`${city.name}|${c}`)}
                    onClick={() => toggleCommune(city.name, c)}
                  >
                    {c}
                  </ChipButton>
                ))}
              </div>
            </div>
          );
        })}
      </CardSection>
      <SaveBar
        onSave={() => mutation.mutate()}
        pending={mutation.isPending}
        disabled={zones.length === 0}
        hint={zones.length === 0 ? 'Sélectionnez au moins une commune.' : undefined}
      />
    </div>
  );
}
