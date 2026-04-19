import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kayu/api';
import type {
  Dispute,
  UploadVerificationDocDtoType,
  VerificationDocKind,
  VerificationState,
  VerificationStateResponse,
} from '@kayu/schemas';
import {
  Avatar,
  I,
  StepIndicator,
  type StepIndicatorStep,
} from '@kayu/ui/mobile';
import { tokens } from '@kayu/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import type { ProviderStackParamList } from '@/navigation/AppNavigator';
import {
  STATUS_CONFIG,
  VERIFY_BENEFITS,
  VERIFY_STEPS,
  pretendUploadUrl,
  type VerifyStep,
} from './verifyData';

type Nav = NativeStackNavigationProp<ProviderStackParamList, 'ProVerification'>;

type Flow = null | 'wizard' | 'dispute';

export function ProVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [flow, setFlow] = useState<Flow>(null);

  const enabled = !!user && user.role === 'PROVIDER';

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'PROVIDER') {
      navigation.goBack();
    }
  }, [user, navigation]);

  const stateQuery = useQuery({
    queryKey: queryKeys.verification.state,
    queryFn: () => api.verification.getState(),
    enabled,
  });
  const disputeQuery = useQuery({
    queryKey: queryKeys.verification.dispute,
    queryFn: () => api.verification.getDispute(),
    enabled,
  });

  const invalidateState = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.verification.state });

  const uploadMut = useMutation({
    mutationFn: (data: UploadVerificationDocDtoType) => api.verification.uploadDoc(data),
    onSuccess: invalidateState,
    onError: (err) => Alert.alert('Erreur', err instanceof Error ? err.message : 'Téléversement impossible'),
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => api.verification.removeDoc(id),
    onSuccess: invalidateState,
  });
  const submitMut = useMutation({
    mutationFn: () => api.verification.submit(),
    onSuccess: () => {
      invalidateState();
      Alert.alert('Merci', "Votre dossier est en cours d'examen.");
    },
    onError: (err) => Alert.alert('Erreur', err instanceof Error ? err.message : 'Soumission impossible'),
  });

  if (!user) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={tokens.color.primary} />
      </View>
    );
  }

  if (stateQuery.isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={tokens.color.primary} />
      </View>
    );
  }

  if (stateQuery.isError || !stateQuery.data) {
    return (
      <View style={styles.loadingCenter}>
        <Text style={{ color: theme.colors.textBody, marginBottom: 12 }}>
          Impossible de charger votre vérification.
        </Text>
        <TouchableOpacity onPress={() => stateQuery.refetch()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const liveState = stateQuery.data;
  const dispute = disputeQuery.data?.dispute ?? null;

  if (flow === 'wizard') {
    return (
      <VerifyWizard
        liveState={liveState}
        isUploading={uploadMut.isPending}
        isSubmitting={submitMut.isPending}
        onUpload={async (data) => {
          await uploadMut.mutateAsync(data);
        }}
        onSubmitForReview={async () => {
          await submitMut.mutateAsync();
          setFlow(null);
        }}
        onExit={() => setFlow(null)}
      />
    );
  }
  if (flow === 'dispute' && dispute) {
    return (
      <DisputeView
        dispute={dispute}
        onBack={() => setFlow(null)}
        onResolved={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.verification.dispute });
          setFlow(null);
        }}
      />
    );
  }

  return (
    <VerifyStatusView
      liveState={liveState}
      hasDispute={Boolean(dispute)}
      onStart={() => {
        if (liveState.state === 'VERIFIED') return;
        setFlow('wizard');
      }}
      onOpenDispute={() => setFlow('dispute')}
      onRemoveDoc={(id) => removeMut.mutate(id)}
      onBack={() => navigation.goBack()}
      insetTop={insets.top}
      insetBottom={insets.bottom}
    />
  );
}

// ─── Status screen ────────────────────────────────────────────────────────

type StatusProps = {
  liveState: VerificationStateResponse;
  hasDispute: boolean;
  onStart: () => void;
  onOpenDispute: () => void;
  onRemoveDoc: (id: string) => void;
  onBack: () => void;
  insetTop: number;
  insetBottom: number;
};

function VerifyStatusView({
  liveState,
  hasDispute,
  onStart,
  onOpenDispute,
  onRemoveDoc,
  onBack,
  insetTop,
  insetBottom,
}: StatusProps) {
  const state = liveState.state;
  const cfg = STATUS_CONFIG[state];
  const StatusIcon = I[cfg.icon] ?? I.shieldCheck;
  const uploadedByKind = useMemo(
    () => new Map(liveState.docs.map((d) => [d.kind, d])),
    [liveState.docs],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={[styles.header, { paddingTop: insetTop + 10 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
          <I.arrowLeft size={20} color={theme.colors.textBody} />
        </Pressable>
        <Text style={styles.headerTitle}>Vérification</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insetBottom + 40 }}>
        {hasDispute && <DisputeBanner onOpen={onOpenDispute} />}

        <View style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: cfg.tintBg }]}>
            <StatusIcon size={30} color={cfg.tint} />
          </View>
          <Text style={styles.heroTitle}>{cfg.title}</Text>
          <Text style={styles.heroSub}>
            {state === 'REJECTED' && liveState.rejectionReason
              ? liveState.rejectionReason
              : cfg.sub}
          </Text>
          {liveState.progress > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progression</Text>
                <Text style={styles.progressValue}>{liveState.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${liveState.progress}%`, backgroundColor: cfg.tint },
                  ]}
                />
              </View>
            </View>
          )}
          {cfg.cta && (
            <TouchableOpacity onPress={onStart} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{cfg.cta}</Text>
              <I.arrowRight size={15} color={theme.colors.textInverse} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardOverline}>Vos documents</Text>
          <Text style={styles.cardSubtitle}>
            {state === 'VERIFIED'
              ? 'Tous vos documents ont été approuvés'
              : '4 documents demandés (dont 3 obligatoires)'}
          </Text>
          {VERIFY_STEPS.map((step, i) => (
            <DocRow
              key={step.id}
              step={step}
              state={state}
              uploadedDoc={pickUploadedForStep(step, uploadedByKind)}
              onRemove={onRemoveDoc}
              last={i === VERIFY_STEPS.length - 1}
            />
          ))}
        </View>

        {state !== 'VERIFIED' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Pourquoi se vérifier ?</Text>
            {VERIFY_BENEFITS.map((b) => {
              const Icon = I[b.icon] ?? I.check;
              return (
                <View key={b.label} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Icon size={17} color={tokens.color.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefitLabel}>{b.label}</Text>
                    <Text style={styles.benefitDesc}>{b.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.securityRow}>
          <I.lock size={16} color={tokens.color.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Vos données sont sécurisées.</Text>
            <Text style={styles.securityBody}>
              Chiffrées et stockées conformément aux réglementations RDC et Congo-B.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function pickUploadedForStep(
  step: VerifyStep,
  map: Map<VerificationDocKind, VerificationStateResponse['docs'][number]>,
) {
  for (const kind of step.kinds) {
    const doc = map.get(kind);
    if (doc) return doc;
  }
  return null;
}

function DisputeBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={styles.disputeBanner}>
      <View style={styles.disputeIcon}>
        <I.alertTriangle size={19} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.disputeTitle}>Un client a ouvert un litige</Text>
        <Text style={styles.disputeSub}>
          Réponse attendue — ouvrez le litige pour répondre
        </Text>
      </View>
      <I.chevronRight size={16} color="#92400E" />
    </Pressable>
  );
}

function DocRow({
  step,
  state,
  uploadedDoc,
  onRemove,
  last,
}: {
  step: VerifyStep;
  state: VerificationState;
  uploadedDoc: VerificationStateResponse['docs'][number] | null;
  onRemove: (id: string) => void;
  last: boolean;
}) {
  const Icon = I[step.icon] ?? I.fileText;
  const isApproved = uploadedDoc?.decision === 'APPROVED' || state === 'VERIFIED';
  const isUploaded = Boolean(uploadedDoc);
  const isUnderReview = isUploaded && state === 'IN_REVIEW';
  const tag = isApproved
    ? { bg: '#ECFDF5', fg: '#047857', label: 'Vérifié' }
    : isUnderReview
      ? { bg: '#EDE9FE', fg: '#6D28D9', label: 'En cours' }
      : isUploaded
        ? { bg: '#E0F2FE', fg: '#0369A1', label: 'Téléversé' }
        : {
            bg: theme.colors.surfaceMuted,
            fg: theme.colors.textMuted,
            label: 'À fournir',
          };
  return (
    <View
      style={[
        styles.docRow,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View style={[styles.docIcon, { backgroundColor: tag.bg }]}>
        <Icon size={18} color={tag.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Text style={styles.docLabel}>{step.label}</Text>
          {!step.required && <Text style={styles.optTag}>Optionnel</Text>}
        </View>
        <Text style={styles.docCaption}>{step.caption}</Text>
      </View>
      {isUploaded && !isApproved && state !== 'IN_REVIEW' && uploadedDoc && (
        <Pressable onPress={() => onRemove(uploadedDoc.id)} hitSlop={8}>
          <Text style={styles.removeLink}>Retirer</Text>
        </Pressable>
      )}
      <View style={[styles.docTag, { backgroundColor: tag.bg }]}>
        <Text style={[styles.docTagText, { color: tag.fg }]}>{tag.label}</Text>
      </View>
    </View>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────

const WIZARD_STEPS: StepIndicatorStep[] = VERIFY_STEPS.map((s, i) => ({
  key: s.id,
  n: i + 1,
  icon: s.icon,
}));

type WizardProps = {
  liveState: VerificationStateResponse;
  isUploading: boolean;
  isSubmitting: boolean;
  onUpload: (data: UploadVerificationDocDtoType) => Promise<void>;
  onSubmitForReview: () => Promise<void>;
  onExit: () => void;
};

function VerifyWizard({
  liveState,
  isUploading,
  isSubmitting,
  onUpload,
  onSubmitForReview,
  onExit,
}: WizardProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const total = VERIFY_STEPS.length;
  const current = VERIFY_STEPS[step];
  const uploadedSet = useMemo(
    () => new Set(liveState.docs.map((d) => d.kind)),
    [liveState.docs],
  );

  const next = async () => {
    if (step < total - 1) {
      setStep(step + 1);
      return;
    }
    const missing = VERIFY_STEPS.filter((s) => s.required).flatMap((s) =>
      s.kinds.filter((k) => !uploadedSet.has(k)),
    );
    if (missing.length > 0) {
      Alert.alert('Documents manquants', 'Il manque un ou plusieurs documents obligatoires.');
      return;
    }
    await onSubmitForReview();
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
    else onExit();
  };

  const handleUpload = async (kind: VerificationDocKind, fileName: string) => {
    await onUpload({
      kind,
      url: pretendUploadUrl(kind),
      fileName,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={back} style={styles.iconBtn} hitSlop={8}>
          <I.arrowLeft size={20} color={theme.colors.textBody} />
        </Pressable>
        <Text style={styles.headerTitle}>
          Étape {step + 1} sur {total}
        </Text>
        <Pressable onPress={onExit} hitSlop={6}>
          <Text style={styles.headerExit}>Plus tard</Text>
        </Pressable>
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 10,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderSubtle,
        }}
      >
        <StepIndicator steps={WIZARD_STEPS} step={step + 1} compact />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={styles.wizardTitle}>{current.label}</Text>
        <Text style={styles.wizardSub}>{current.caption}</Text>

        {step === 0 && (
          <WizardIdentity
            uploadedSet={uploadedSet}
            isUploading={isUploading}
            onUpload={handleUpload}
          />
        )}
        {step === 1 && (
          <WizardSelfie
            uploadedSet={uploadedSet}
            isUploading={isUploading}
            onUpload={handleUpload}
          />
        )}
        {step === 2 && (
          <WizardAddress
            uploadedSet={uploadedSet}
            isUploading={isUploading}
            onUpload={handleUpload}
          />
        )}
        {step === 3 && (
          <WizardCert
            uploadedSet={uploadedSet}
            isUploading={isUploading}
            onUpload={handleUpload}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {!current.required && step < total - 1 && (
          <TouchableOpacity onPress={next} style={styles.secondaryBtnWide}>
            <Text style={styles.secondaryBtnText}>Passer</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={next}
          style={[styles.primaryBtn, { flex: 2 }]}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>
                {step === total - 1 ? 'Soumettre pour examen' : 'Continuer'}
              </Text>
              <I.arrowRight size={15} color={theme.colors.textInverse} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

type UploadTargetProps = {
  label: string;
  sub: string;
  icon: import('@kayu/ui/mobile').IconName;
  kind: VerificationDocKind;
  done: boolean;
  isUploading: boolean;
  onUpload: (kind: VerificationDocKind, fileName: string) => Promise<void>;
};

function UploadTarget({
  label,
  sub,
  icon,
  kind,
  done,
  isUploading,
  onUpload,
}: UploadTargetProps) {
  const Icon = I[icon] ?? I.upload;
  return (
    <Pressable
      onPress={() => {
        if (isUploading) return;
        onUpload(kind, `${kind.toLowerCase()}-${Date.now()}.jpg`);
      }}
      style={[styles.uploadTarget, done && styles.uploadTargetDone]}
    >
      <View
        style={[
          styles.uploadIcon,
          {
            backgroundColor: done ? tokens.color.success : theme.colors.surfaceMuted,
          },
        ]}
      >
        {done ? (
          <I.check size={20} color={theme.colors.textInverse} strokeWidth={2.5} />
        ) : (
          <Icon size={19} color={theme.colors.textMuted} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.uploadLabel}>{done ? `✓ ${label}` : label}</Text>
        <Text style={styles.uploadSub}>
          {done ? 'Document enregistré · appuyez pour remplacer' : sub}
        </Text>
      </View>
      <I.camera size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

type StepProps = {
  uploadedSet: Set<VerificationDocKind>;
  isUploading: boolean;
  onUpload: (kind: VerificationDocKind, fileName: string) => Promise<void>;
};

function WizardIdentity({ uploadedSet, isUploading, onUpload }: StepProps) {
  return (
    <View style={{ gap: 10 }}>
      <UploadTarget
        label="Photo du recto"
        sub="Appuyez pour ouvrir l'appareil photo"
        icon="idCard"
        kind="ID_FRONT"
        done={uploadedSet.has('ID_FRONT')}
        isUploading={isUploading}
        onUpload={onUpload}
      />
      <UploadTarget
        label="Photo du verso"
        sub="Retournez votre pièce et photographiez l'autre face"
        icon="idCard"
        kind="ID_BACK"
        done={uploadedSet.has('ID_BACK')}
        isUploading={isUploading}
        onUpload={onUpload}
      />
      <View style={styles.tipBox}>
        <I.info size={15} color="#B45309" />
        <Text style={styles.tipText}>
          Évitez les reflets. Posez le document sur une surface sombre et unie.
        </Text>
      </View>
    </View>
  );
}

function WizardSelfie({ uploadedSet, isUploading, onUpload }: StepProps) {
  return (
    <View style={{ gap: 16 }}>
      <UploadTarget
        label="Prendre le selfie"
        sub="Tenez votre ID sous votre menton"
        icon="selfie"
        kind="SELFIE"
        done={uploadedSet.has('SELFIE')}
        isUploading={isUploading}
        onUpload={onUpload}
      />
    </View>
  );
}

function WizardAddress({ uploadedSet, isUploading, onUpload }: StepProps) {
  return (
    <View style={{ gap: 16 }}>
      <UploadTarget
        label="Photo de la facture"
        sub="JPEG, PNG ou PDF · max 10 Mo"
        icon="fileText"
        kind="ADDRESS"
        done={uploadedSet.has('ADDRESS')}
        isUploading={isUploading}
        onUpload={onUpload}
      />
    </View>
  );
}

function WizardCert({ uploadedSet, isUploading, onUpload }: StepProps) {
  return (
    <View style={{ gap: 16 }}>
      <UploadTarget
        label="Photo de votre certificat"
        sub="Diplôme, attestation, licence"
        icon="award"
        kind="CERT_OPTIONAL"
        done={uploadedSet.has('CERT_OPTIONAL')}
        isUploading={isUploading}
        onUpload={onUpload}
      />
      <View style={styles.certBonus}>
        <View style={styles.certBonusIcon}>
          <I.sparkles size={15} color={tokens.color.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.certBonusTitle}>
            Les pros certifiés ont 60% de conversion en plus.
          </Text>
          <Text style={styles.certBonusDesc}>
            Ils reçoivent le badge « Expert » et accèdent aux missions premium.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Dispute view ─────────────────────────────────────────────────────────

const MIN_RESPONSE_LEN = 20;

const DISPUTE_OPTIONS = [
  { id: 'revisit', label: 'Je peux revenir réparer gratuitement', desc: 'Solution préférée' },
  { id: 'partial', label: 'Remboursement partiel', desc: 'À définir avec le client' },
  { id: 'contest', label: 'Je conteste — le travail était conforme', desc: 'KAYOU arbitrera' },
];

type DisputeProps = {
  dispute: Dispute;
  onBack: () => void;
  onResolved: () => void;
};

function DisputeView({ dispute, onBack, onResolved }: DisputeProps) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState(dispute.proStatement ?? '');
  const [option, setOption] = useState<string>('');
  const clientName = formatClientName(dispute);
  const amount = dispute.booking?.price ?? null;

  const options = useMemo(() => {
    if (amount == null) return DISPUTE_OPTIONS;
    return [
      ...DISPUTE_OPTIONS.slice(0, 2),
      {
        id: 'full',
        label: 'Remboursement intégral',
        desc: `${amount.toLocaleString('fr-FR')} FC`,
      },
      ...DISPUTE_OPTIONS.slice(2),
    ];
  }, [amount]);

  const respondMut = useMutation({
    mutationFn: () =>
      api.verification.respondDispute(dispute.id, {
        statement: `[${option}] ${msg}`,
        evidenceUrls: [],
      }),
    onSuccess: () => {
      Alert.alert('Envoyé', "Votre version est transmise à l'équipe KAYOU.");
      onResolved();
    },
    onError: (err) =>
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Envoi impossible'),
  });

  const canSubmit =
    msg.length >= MIN_RESPONSE_LEN && option.length > 0 && !respondMut.isPending;

  const submit = () => {
    if (!canSubmit) return;
    respondMut.mutate();
  };

  const deadline = dispute.deadlineAt ? formatDeadline(dispute.deadlineAt) : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
          <I.arrowLeft size={20} color={theme.colors.textBody} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            Litige #{dispute.id.slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.headerSubtle}>{formatRelative(dispute.createdAt)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {deadline && (
          <View style={styles.deadlineBanner}>
            <I.clock size={16} color="#B45309" />
            <Text style={styles.deadlineText}>
              <Text style={{ fontWeight: '700' }}>{deadline}</Text> pour répondre au client.
            </Text>
          </View>
        )}

        {dispute.booking && (
          <View style={styles.card}>
            <Text style={styles.cardOverline}>Réservation concernée</Text>
            <Text style={styles.cardHeading}>{dispute.booking.title}</Text>
            <Text style={styles.cardSubtitle}>
              Client : {clientName}
              {amount != null && (
                <>
                  {' · '}
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                    {amount.toLocaleString('fr-FR')} FC
                  </Text>
                </>
              )}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}
          >
            <Avatar name={clientName} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={styles.docLabel}>{clientName}</Text>
              <Text style={styles.docCaption}>Version du client</Text>
            </View>
            <View style={styles.reasonTag}>
              <Text style={styles.reasonTagText}>{dispute.reason}</Text>
            </View>
          </View>
          {dispute.clientStatement ? (
            <View style={styles.clientQuote}>
              <Text style={styles.clientQuoteText}>« {dispute.clientStatement} »</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: theme.colors.textMuted }}>
              Le client n'a pas encore fourni de déclaration écrite.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardHeading, { marginBottom: 10 }]}>
            Votre version des faits
          </Text>
          <TextInput
            value={msg}
            onChangeText={(v) => setMsg(v.slice(0, 1000))}
            multiline
            placeholder="Expliquez calmement et factuellement ce qui s'est passé."
            placeholderTextColor={theme.colors.textSubtle}
            style={[styles.input, { height: 120, paddingVertical: 12, textAlignVertical: 'top' }]}
          />
          <Text
            style={[
              styles.counter,
              msg.length < MIN_RESPONSE_LEN && { color: theme.colors.textSubtle },
            ]}
          >
            {msg.length}/1000 {msg.length < MIN_RESPONSE_LEN ? `(min ${MIN_RESPONSE_LEN})` : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardHeading, { marginBottom: 10 }]}>
            Que souhaitez-vous proposer ?
          </Text>
          {options.map((o) => {
            const isSel = option === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setOption(o.id)}
                style={[styles.optionRow, isSel && styles.optionRowSelected]}
              >
                <View
                  style={[
                    styles.radioDot,
                    {
                      borderColor: isSel ? tokens.color.primary : tokens.color.borderStrong,
                    },
                  ]}
                >
                  {isSel ? <View style={styles.radioDotInner} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{o.label}</Text>
                  <Text style={styles.optionDesc}>{o.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity
          onPress={submit}
          style={[styles.primaryBtn, { flex: 1 }, !canSubmit && { opacity: 0.4 }]}
          disabled={!canSubmit}
        >
          {respondMut.isPending ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <I.send size={14} color={theme.colors.textInverse} />
              <Text style={[styles.primaryBtnText, { marginLeft: 6 }]}>Envoyer ma réponse</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatClientName(d: Dispute): string {
  const first = d.client?.firstName ?? '';
  const last = d.client?.lastName ?? '';
  const full = `${first} ${last}`.trim();
  return full || 'Client';
}

function formatDeadline(deadline: string | Date): string | null {
  const date = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'Délai dépassé';
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 24) return `Il vous reste ${hours}h pour répondre`;
  const days = Math.round(hours / 24);
  return `Il vous reste ${days}j pour répondre`;
}

function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return 'Ouvert il y a quelques minutes';
  if (hours < 24) return `Ouvert il y a ${hours}h`;
  const days = Math.round(hours / 24);
  return `Ouvert il y a ${days}j`;
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  iconBtn: { padding: 6, marginLeft: -6 },
  headerTitle: {
    flex: 1,
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  headerSubtle: {
    fontSize: 11.5,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
  },
  headerExit: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  heroCard: {
    padding: 22,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 14,
    ...theme.shadow.e1,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginBottom: 6,
    lineHeight: 26,
  },
  heroSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.44,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  progressValue: {
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: theme.colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 14,
  },
  cardOverline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.66,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  cardHeading: {
    fontFamily: theme.fonts.displayMed,
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  docCaption: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  optTag: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
    overflow: 'hidden',
  },
  docTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  docTagText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  removeLink: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surfacePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: {
    fontWeight: '600',
    fontSize: 13.5,
    color: theme.colors.textPrimary,
  },
  benefitDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  securityRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  securityTitle: {
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  securityBody: {
    fontSize: 12.5,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  disputeBanner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  disputeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputeTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#78350F',
  },
  disputeSub: {
    fontSize: 12.5,
    color: '#92400E',
    marginTop: 2,
  },
  wizardTitle: {
    fontFamily: theme.fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  wizardSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 22,
    lineHeight: 20,
  },
  uploadTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surface,
  },
  uploadTargetDone: {
    borderStyle: 'solid',
    borderColor: tokens.color.success,
    backgroundColor: tokens.color.successSubtle,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  uploadSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 12.5,
    color: '#78350F',
    lineHeight: 18,
  },
  secondaryBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  input: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
  certBonus: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  certBonusIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBonusTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  certBonusDesc: {
    fontSize: 12.5,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  deadlineBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  deadlineText: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
  },
  reasonTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  reasonTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
  },
  clientQuote: {
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clientQuoteText: {
    fontSize: 13.5,
    color: '#7F1D1D',
    lineHeight: 19,
  },
  counter: {
    marginTop: 6,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'right',
    fontFamily: theme.fonts.mono,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  optionRowSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primarySubtle,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.color.primary,
  },
  optionLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  optionDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
});
