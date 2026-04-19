import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar, Chip, I, StatCard } from '@kayu/ui/mobile';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import type { ProviderStackParamList } from '@/navigation/AppNavigator';

type ProviderDashboardNav = NativeStackNavigationProp<
  ProviderStackParamList,
  'ProviderDashboardMain'
>;

type JobStatus = 'confirmed' | 'en_route' | 'completed';

type ClientSummary = { name: string; initials: string; bg: string };

type DashboardJob = {
  id: string;
  time: string;
  duration: string;
  client: ClientSummary;
  kind: string;
  address: string;
  status: JobStatus;
  fee: number;
  distance: number;
};

type DashboardRequest = {
  id: string;
  client: ClientSummary;
  kind: string;
  when: string;
  address: string;
  msg: string;
  matchScore: number;
  receivedAt: string;
  distance: number;
  urgent?: boolean;
};

const TODAY_JOBS: DashboardJob[] = [
  {
    id: 'j1',
    time: '09:00',
    duration: '~2h',
    client: { name: 'Marie K.', initials: 'MK', bg: '#FB7185' },
    kind: 'Fuite évier cuisine',
    address: 'Av. Kasa-Vubu, Gombe',
    status: 'confirmed',
    fee: 15000,
    distance: 2.3,
  },
  {
    id: 'j2',
    time: '14:30',
    duration: '~1h30',
    client: { name: 'Papa Léon', initials: 'PL', bg: '#10B981' },
    kind: 'Chauffe-eau panne',
    address: 'Blvd du 30 Juin, Kinshasa',
    status: 'en_route',
    fee: 22000,
    distance: 4.1,
  },
  {
    id: 'j3',
    time: '17:00',
    duration: '~1h',
    client: { name: 'Esther B.', initials: 'EB', bg: '#F59E0B' },
    kind: 'Débouchage WC',
    address: 'Rue de la Victoire, Lemba',
    status: 'confirmed',
    fee: 12000,
    distance: 6.2,
  },
];

const NEW_REQUESTS: DashboardRequest[] = [
  {
    id: 'r1',
    client: { name: 'Christelle M.', initials: 'CM', bg: '#BE185D' },
    kind: 'Installation robinet cuisine',
    when: 'Demain matin',
    address: 'Gombe',
    msg: "J'ai acheté un nouveau robinet mais je n'arrive pas à l'installer.",
    matchScore: 96,
    receivedAt: 'il y a 8 min',
    distance: 1.8,
  },
  {
    id: 'r2',
    client: { name: 'Ingrid L.', initials: 'IL', bg: '#7C3AED' },
    kind: 'Fuite sous la douche',
    when: 'Dès que possible',
    address: 'Limete',
    msg: "L'eau coule à travers le plafond du voisin. URGENT.",
    matchScore: 92,
    receivedAt: 'il y a 22 min',
    distance: 3.7,
    urgent: true,
  },
  {
    id: 'r3',
    client: { name: 'Patrick N.', initials: 'PN', bg: '#475569' },
    kind: 'Devis rénovation salle de bain',
    when: 'Semaine prochaine',
    address: 'Gombe',
    msg: 'Je veux refaire toute la plomberie de ma salle de bain.',
    matchScore: 88,
    receivedAt: 'il y a 1h',
    distance: 2.1,
  },
];

const STATS = {
  earningsThisMonth: 485000,
  jobsThisMonth: 23,
  responseRate: 98,
};

export function ProviderDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<ProviderDashboardNav>();
  const [available, setAvailable] = useState(true);

  const firstName = user?.firstName ?? 'Pro';
  const lastName = user?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const rating = 4.9;

  const todayTotal = useMemo(
    () => TODAY_JOBS.reduce((a, b) => a + b.fee, 0),
    [],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting header with tinted background */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.greetingRow}>
          <Avatar name={fullName || firstName} bg="#0EA5E9" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingCaption}>Bonjour</Text>
            <Text style={styles.greetingName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Boîte de réception"
            style={styles.inboxButton}
            activeOpacity={0.7}
          >
            <I.inbox size={18} color={theme.colors.textBody} />
            <View style={styles.inboxDot} />
          </TouchableOpacity>
        </View>

        {/* Availability pill */}
        <View style={styles.availabilityPill}>
          <View
            style={[
              styles.availabilityDot,
              { backgroundColor: available ? theme.colors.success : theme.colors.borderStrong },
            ]}
          />
          <Text style={styles.availabilityLabel}>
            {available ? "Disponible aujourd'hui" : 'Indisponible'}
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            accessibilityRole="switch"
            accessibilityState={{ checked: available }}
            accessibilityLabel="Disponibilité"
            onPress={() => setAvailable((v) => !v)}
            style={[
              styles.toggleTrack,
              { backgroundColor: available ? theme.colors.success : theme.colors.borderStrong },
            ]}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.toggleThumb,
                { left: available ? 18 : 2 },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Verification prompt */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProVerification')}
          style={styles.verifyPrompt}
          activeOpacity={0.9}
        >
          <View style={styles.verifyIcon}>
            <I.shieldCheck size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifyPromptTitle}>Complétez votre vérification</Text>
            <Text style={styles.verifyPromptSub}>
              Obtenez le badge « De confiance » et +40% de vues.
            </Text>
          </View>
          <I.chevronRight size={16} color="#92400E" />
        </TouchableOpacity>
      </View>

      {/* Today summary */}
      <View style={styles.section}>
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStatCard}>
            <Text style={styles.overline}>Aujourd'hui</Text>
            <Text style={styles.miniStatValue}>{TODAY_JOBS.length} missions</Text>
            <Text style={styles.miniStatSub}>Prochaine à 09h00</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={styles.overline}>Recette prévue</Text>
            <Text style={[styles.miniStatValue, { fontFamily: theme.fonts.mono }]}>
              {todayTotal.toLocaleString('fr-FR')} FC
            </Text>
            <Text style={styles.miniStatSub}>3 missions confirmées</Text>
          </View>
        </View>
      </View>

      {/* Today's schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>Planning du jour</Text>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.linkLabel}>Calendrier</Text>
          </TouchableOpacity>
        </View>
        {TODAY_JOBS.length === 0 ? (
          <EmptyLine iconName="calendar" copy="Aucune mission aujourd'hui" />
        ) : (
          <View style={{ gap: 10 }}>
            {TODAY_JOBS.map((j) => (
              // BookingDetail navigation for pros lands with DS07 (the pro
              // tab set has no Bookings stack today).
              <JobCard key={j.id} job={j} />
            ))}
          </View>
        )}
      </View>

      {/* New requests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>
            Nouvelles demandes{' '}
            <Text style={{ color: theme.colors.accent, fontSize: 14 }}>
              ({NEW_REQUESTS.length})
            </Text>
          </Text>
        </View>
        {NEW_REQUESTS.length === 0 ? (
          <EmptyLine iconName="inbox" copy="Pas de demande en attente" />
        ) : (
          <View style={{ gap: 12 }}>
            {NEW_REQUESTS.map((r) => (
              <RequestCard key={r.id} req={r} />
            ))}
          </View>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.section}>
        <Text style={[styles.heading, { marginBottom: 12 }]}>Ce mois</Text>
        <View style={styles.statGrid}>
          <View style={styles.statGridItem}>
            <StatCard
              label="Revenus"
              value={`${(STATS.earningsThisMonth / 1000).toFixed(0)}k FC`}
              sub="+15%"
              trend={1}
              compact
            />
          </View>
          <View style={styles.statGridItem}>
            <StatCard
              label="Missions"
              value={STATS.jobsThisMonth}
              sub="+21%"
              trend={1}
              compact
            />
          </View>
          <View style={styles.statGridItem}>
            <StatCard
              label="Taux réponse"
              value={`${STATS.responseRate}%`}
              sub="Excellent"
              trend={1}
              compact
            />
          </View>
          <View style={styles.statGridItem}>
            <StatCard
              label="Note moyenne"
              value={rating.toFixed(1)}
              sub="+0.1"
              trend={1}
              compact
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function StatusPill({ status }: { status: JobStatus }) {
  if (status === 'en_route') {
    return (
      <Chip
        variant="warning"
        size="sm"
        leadingIcon={<I.clock size={11} color="#B45309" />}
      >
        En route
      </Chip>
    );
  }
  if (status === 'confirmed') {
    return (
      <Chip variant="success" size="sm">
        Confirmé
      </Chip>
    );
  }
  return (
    <Chip variant="neutral" size="sm">
      Terminé
    </Chip>
  );
}

function JobCard({
  job,
  onPress,
}: {
  job: DashboardJob;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.jobCard}
    >
      <View style={styles.jobTime}>
        <Text style={styles.jobTimeValue}>{job.time}</Text>
        <Text style={styles.jobTimeSub}>{job.duration}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.jobTitleRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job.kind}
          </Text>
          <StatusPill status={job.status} />
        </View>
        <View style={styles.jobMetaRow}>
          <Avatar
            name={job.client.name}
            bg={job.client.bg}
            size={22}
            initials={job.client.initials}
          />
          <Text style={styles.jobClientName} numberOfLines={1}>
            {job.client.name}
          </Text>
          <Text style={styles.jobMetaDivider}>·</Text>
          <I.mapPin size={11} color={theme.colors.textMuted} />
          <Text style={styles.jobMeta} numberOfLines={1}>
            {job.address} · {job.distance} km
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RequestCard({ req }: { req: DashboardRequest }) {
  return (
    <View
      style={[
        styles.requestCard,
        req.urgent ? { borderColor: '#FCA5A5' } : null,
      ]}
    >
      {req.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeText}>Urgent</Text>
        </View>
      )}
      <View style={styles.requestHeader}>
        <Avatar
          name={req.client.name}
          bg={req.client.bg}
          size={36}
          initials={req.client.initials}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.requestClientName} numberOfLines={1}>
            {req.client.name}
          </Text>
          <Text style={styles.requestMeta}>
            {req.receivedAt} · {req.distance} km
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.matchLabel}>Match</Text>
          <Text style={styles.matchValue}>{req.matchScore}%</Text>
        </View>
      </View>
      <Text style={styles.requestKind}>{req.kind}</Text>
      <Text style={styles.requestMsg} numberOfLines={2}>
        « {req.msg} »
      </Text>
      <View style={styles.requestChips}>
        <Chip size="sm" leadingIcon={<I.calendar size={11} color={theme.colors.textBody} />}>
          {req.when}
        </Chip>
        <Chip size="sm" leadingIcon={<I.mapPin size={11} color={theme.colors.textBody} />}>
          {req.address}
        </Chip>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
        >
          <Text style={styles.btnSecondaryText}>Décliner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, styles.btnPrimary, { flex: 2 }]}
        >
          <Text style={styles.btnPrimaryText}>Envoyer un devis</Text>
          <I.arrowRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyLine({
  iconName,
  copy,
}: {
  iconName: 'calendar' | 'inbox';
  copy: string;
}) {
  const Icon = I[iconName];
  return (
    <View style={styles.emptyLine}>
      <Icon size={20} color={theme.colors.textMuted} />
      <Text style={styles.emptyLineText}>{copy}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const card: StyleProp<ViewStyle> = {
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
  ...theme.shadow.e1,
};

const overline: StyleProp<TextStyle> = {
  fontFamily: theme.fonts.bodySemi,
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 0.88,
  textTransform: 'uppercase',
  color: theme.colors.textMuted,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    backgroundColor: theme.colors.surfacePrimary,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  greetingCaption: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  greetingName: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  inboxButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  availabilityLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  toggleTrack: {
    width: 38,
    height: 22,
    borderRadius: 11,
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heading: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 20,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  linkLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primaryHover,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  verifyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  verifyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyPromptTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#78350F',
  },
  verifyPromptSub: {
    fontSize: 12.5,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 17,
  },
  miniStatCard: {
    ...(card as object),
    flex: 1,
    padding: 14,
  },
  overline,
  miniStatValue: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  miniStatSub: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  jobCard: {
    ...(card as object),
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobTime: {
    width: 60,
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderSubtle,
  },
  jobTimeValue: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 19,
    color: theme.colors.textPrimary,
  },
  jobTimeSub: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  jobTitle: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  jobClientName: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textBody,
  },
  jobMetaDivider: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  jobMeta: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  requestCard: {
    ...(card as object),
    padding: 14,
    position: 'relative',
  },
  urgentBadge: {
    position: 'absolute',
    top: -8,
    left: 14,
    backgroundColor: theme.colors.danger,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  requestClientName: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 14.5,
    color: theme.colors.textPrimary,
  },
  requestMeta: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  matchLabel: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  matchValue: {
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    fontSize: 14,
    color: theme.colors.success,
  },
  requestKind: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  requestMsg: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textBody,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  requestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    height: 40,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnSecondaryText: {
    color: theme.colors.textBody,
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '600',
    fontSize: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statGridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  emptyLine: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyLineText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
});
