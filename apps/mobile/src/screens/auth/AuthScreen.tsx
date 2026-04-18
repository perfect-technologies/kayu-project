// DS02 — Auth phone OTP flow (mobile).
// UI pixel-source-of-truth: docs/design-plan-v2/prototype/components/Auth.jsx.
// Full-bleed single column. Backend OTP wiring (supabase.auth.signInWithOtp /
// verifyOtp) is out of scope for this chunk — see docs/design-plan-v2/PROGRESS.md.
// For dev end-to-end testing, the DoneStep signs in with a seeded demo account
// matching the picked role so the navigator flips to the role-appropriate tabs.

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I } from '@kayu/ui/mobile';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';

type CountryCode = 'cd' | 'cg';

interface Country {
  code: CountryCode;
  dial: string;
  name: string;
  flag: string;
  hint: string;
}

const COUNTRIES: readonly Country[] = [
  {
    code: 'cd',
    dial: '+243',
    name: 'RD Congo',
    flag: '🇨🇩',
    hint: '9 chiffres — ex. 897 123 456',
  },
  {
    code: 'cg',
    dial: '+242',
    name: 'Congo-Brazzaville',
    flag: '🇨🇬',
    hint: '9 chiffres — ex. 06 123 4567',
  },
] as const;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 32;

// Dev-only seeded accounts. Phone+OTP is the real flow; these exist so the
// team can exercise each role end-to-end before the SMS provider is wired up.
// DoneStep ("Je cherche un pro" / "Je suis un pro") also falls back to the
// matching entry so the navigator flips after the full phone flow.
type DemoTone = 'success' | 'primary' | 'danger';
interface DemoAccount {
  role: 'Client' | 'Prestataire' | 'Admin';
  name: string;
  email: string;
  password: string;
  hint: string;
  tone: DemoTone;
  initials: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: 'Client',
    name: 'Paul Kabasele',
    email: 'paul.kabasele@email.cd',
    password: 'Password123!',
    hint: 'Réservations et favoris',
    tone: 'success',
    initials: 'PK',
  },
  {
    role: 'Prestataire',
    name: 'Jean-Pierre Mukendi',
    email: 'jeanpierre.mukendi@kayou.cd',
    password: 'Password123!',
    hint: 'Profil pro et demandes',
    tone: 'primary',
    initials: 'JM',
  },
  {
    role: 'Admin',
    name: 'Admin KAYOU',
    email: 'admin@kayou.cd',
    password: 'Password123!',
    hint: 'Pilotage et modération',
    tone: 'danger',
    initials: 'AK',
  },
] as const;

const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== 'production';

const DEMO_CLIENT = DEMO_ACCOUNTS[0];
const DEMO_PRO = DEMO_ACCOUNTS[1];

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithEmail } = useAuth();

  const [step, setStep] = React.useState<0 | 1 | 2>(0);
  const [country, setCountry] = React.useState<CountryCode>('cd');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState<string[]>(
    () => Array.from({ length: OTP_LENGTH }, () => ''),
  );
  const [resendLeft, setResendLeft] = React.useState(RESEND_SECONDS);
  const [signingIn, setSigningIn] = React.useState<'client' | 'pro' | null>(
    null,
  );
  const [demoLoadingEmail, setDemoLoadingEmail] = React.useState<string | null>(
    null,
  );
  const [demoError, setDemoError] = React.useState<string | null>(null);
  const otpRefs = React.useRef<Array<TextInput | null>>([]);

  const c = COUNTRIES.find((x) => x.code === country)!;
  const prettyPhone = phone.replace(/(\d{3})(?=\d)/g, '$1 ');
  const phoneValid = phone.length === 9;
  const otpValid = otp.every((d) => d.length > 0);

  // Resend countdown — only ticks on OTP step.
  React.useEffect(() => {
    if (step !== 1) return;
    setResendLeft(RESEND_SECONDS);
    const id = setInterval(() => {
      setResendLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Auto-advance when OTP complete.
  React.useEffect(() => {
    if (step !== 1 || !otpValid) return;
    const t = setTimeout(() => setStep(2), 600);
    return () => clearTimeout(t);
  }, [otpValid, step]);

  const handleOtpChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    // Paste of a 6-digit code into any slot: fill all slots.
    if (digits.length > 1) {
      const filled = Array.from({ length: OTP_LENGTH }, (_, k) => digits[k] ?? '');
      setOtp(filled);
      const target = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[target]?.focus();
      return;
    }
    if (!/^\d?$/.test(digits)) return;
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (digits && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyPress = (i: number, key: string) => {
    if (key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const requestOtp = () => {
    // Backend wiring deferred — see PROGRESS.md.
    setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
    setStep(1);
  };

  const pickRole = async (role: 'client' | 'pro') => {
    setSigningIn(role);
    try {
      const creds = role === 'client' ? DEMO_CLIENT : DEMO_PRO;
      await signInWithEmail(creds.email, creds.password);
      // useAuth().user flips → AppNavigator swaps to MainNavigator automatically.
    } catch {
      // Silently revert — in dev the demo accounts may be absent. Design-first chunk.
      setSigningIn(null);
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setDemoError(null);
    setDemoLoadingEmail(account.email);
    try {
      await signInWithEmail(account.email, account.password);
      // AppNavigator flips to MainNavigator; nothing else to do here.
    } catch (err) {
      setDemoError(
        err instanceof Error ? err.message : 'Erreur de connexion',
      );
      setDemoLoadingEmail(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 8,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexGrow: 1 }}>
          {step === 0 && (
            <PhoneStep
              country={c}
              onCountry={setCountry}
              phone={phone}
              prettyPhone={prettyPhone}
              onChangePhone={setPhone}
              phoneValid={phoneValid}
              onSubmit={requestOtp}
              demoLoadingEmail={demoLoadingEmail}
              demoError={demoError}
              onDemoLogin={handleDemoLogin}
            />
          )}
          {step === 1 && (
            <OtpStep
              country={c}
              prettyPhone={prettyPhone}
              otp={otp}
              onChangeOtp={handleOtpChange}
              onKeyPress={handleOtpKeyPress}
              otpRefs={otpRefs}
              resendLeft={resendLeft}
              onResend={() => setResendLeft(RESEND_SECONDS)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <DoneStep
              onPickClient={() => pickRole('client')}
              onPickPro={() => pickRole('pro')}
              signingIn={signingIn}
            />
          )}
        </View>

        {step < 2 && (
          <View style={styles.dotsContainer}>
            <StepDots step={step} total={2} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step dots ────────────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 22 : 6,
            height: 6,
            borderRadius: 999,
            backgroundColor:
              i <= step ? theme.colors.primary : theme.colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Phone step ───────────────────────────────────────────────────────────────

function PhoneStep({
  country,
  onCountry,
  phone,
  prettyPhone,
  onChangePhone,
  phoneValid,
  onSubmit,
  demoLoadingEmail,
  demoError,
  onDemoLogin,
}: {
  country: Country;
  onCountry: (c: CountryCode) => void;
  phone: string;
  prettyPhone: string;
  onChangePhone: (v: string) => void;
  phoneValid: boolean;
  onSubmit: () => void;
  demoLoadingEmail: string | null;
  demoError: string | null;
  onDemoLogin: (account: DemoAccount) => void;
}) {
  return (
    <View>
      <View style={styles.logoBlock}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoLetter}>K</Text>
        </View>
      </View>

      <Text style={styles.h1}>Bienvenue sur KAYOU</Text>
      <Text style={styles.body}>
        Entrez votre numéro pour vous connecter ou créer un compte. On vous
        enverra un code par SMS.
      </Text>

      <View style={styles.countryTabs}>
        {COUNTRIES.map((x) => {
          const active = country.code === x.code;
          return (
            <Pressable
              key={x.code}
              onPress={() => onCountry(x.code)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.countryTab, active && styles.countryTabActive]}
            >
              <Text
                style={[
                  styles.countryFlag,
                  { opacity: active ? 1 : 0.85 },
                ]}
              >
                {x.flag}
              </Text>
              <Text
                style={[
                  styles.countryLabel,
                  active && styles.countryLabelActive,
                ]}
              >
                {x.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.phoneRow}>
        <View style={styles.dialBox}>
          <Text style={styles.dialFlag}>{country.flag}</Text>
          <Text style={styles.dialText}>{country.dial}</Text>
        </View>
        <TextInput
          value={prettyPhone}
          onChangeText={(v) => onChangePhone(v.replace(/\D/g, '').slice(0, 9))}
          placeholder="897 123 456"
          placeholderTextColor={theme.colors.textSubtle}
          keyboardType="phone-pad"
          inputMode="numeric"
          autoComplete="tel"
          autoFocus
          maxLength={11}
          accessibilityLabel={`Numéro de téléphone (${country.name})`}
          style={styles.phoneInput}
        />
      </View>
      <Text style={styles.hint}>{country.hint}</Text>

      <Pressable
        onPress={onSubmit}
        disabled={!phoneValid}
        accessibilityRole="button"
        accessibilityState={{ disabled: !phoneValid }}
        style={[styles.cta, !phoneValid && styles.ctaDisabled]}
      >
        <Text style={styles.ctaLabel}>Envoyer le code</Text>
        <I.arrowRight size={16} color="#FFFFFF" />
      </Pressable>

      <View style={styles.assurance}>
        <I.shieldCheck size={18} color={theme.colors.primary} />
        <Text style={styles.assuranceText}>
          KAYOU ne partage jamais votre numéro avec les pros tant que vous
          n&apos;avez pas confirmé une mission.
        </Text>
      </View>

      {SHOW_DEMO_ACCOUNTS && (
        <DemoAccountsPanel
          loadingEmail={demoLoadingEmail}
          error={demoError}
          onPick={onDemoLogin}
        />
      )}
    </View>
  );
}

// ─── Dev-only demo accounts ──────────────────────────────────────────────────

const DEMO_TONE: Record<DemoTone, string> = {
  success: theme.colors.success,
  primary: theme.colors.primary,
  danger: theme.colors.danger,
};

function DemoAccountsPanel({
  loadingEmail,
  error,
  onPick,
}: {
  loadingEmail: string | null;
  error: string | null;
  onPick: (account: DemoAccount) => void;
}) {
  const busy = loadingEmail !== null;
  return (
    <View style={styles.demoPanel}>
      <Text style={styles.demoOverline}>Accès rapide (dev)</Text>
      <Text style={styles.demoHint}>
        Comptes seedés — email pour l&apos;instant, OTP à venir.
      </Text>
      {error && (
        <View style={styles.demoError}>
          <Text style={styles.demoErrorText}>{error}</Text>
        </View>
      )}
      <View style={{ gap: 8 }}>
        {DEMO_ACCOUNTS.map((a) => {
          const isLoading = loadingEmail === a.email;
          return (
            <Pressable
              key={a.email}
              onPress={() => onPick(a)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Se connecter en tant que ${a.name} (${a.role})`}
              style={({ pressed }) => [
                styles.demoCard,
                pressed && !busy && { borderColor: DEMO_TONE[a.tone] },
                busy && !isLoading && { opacity: 0.55 },
              ]}
            >
              <View
                style={[
                  styles.demoInitials,
                  { backgroundColor: DEMO_TONE[a.tone] },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.demoInitialsText}>{a.initials}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Text style={styles.demoName} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={styles.demoRolePill}>{a.role}</Text>
                </View>
                <Text style={styles.demoSubhint} numberOfLines={1}>
                  {a.hint}
                </Text>
              </View>
              <I.chevronRight size={14} color={theme.colors.textSubtle} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── OTP step ─────────────────────────────────────────────────────────────────

function OtpStep({
  country,
  prettyPhone,
  otp,
  onChangeOtp,
  onKeyPress,
  otpRefs,
  resendLeft,
  onResend,
  onBack,
}: {
  country: Country;
  prettyPhone: string;
  otp: string[];
  onChangeOtp: (i: number, v: string) => void;
  onKeyPress: (i: number, key: string) => void;
  otpRefs: React.MutableRefObject<Array<TextInput | null>>;
  resendLeft: number;
  onResend: () => void;
  onBack: () => void;
}) {
  return (
    <View>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        style={styles.backLink}
      >
        <I.arrowLeft size={14} color={theme.colors.textMuted} />
        <Text style={styles.backLinkText}>Retour</Text>
      </Pressable>

      <Text style={styles.h1}>Entrez le code à 6 chiffres</Text>
      <Text style={styles.body}>
        <Text>Envoyé par SMS à </Text>
        <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
          {country.dial} {prettyPhone}
        </Text>
        <Text> · </Text>
        <Text
          onPress={onBack}
          style={{
            color: theme.colors.primaryHover,
            fontWeight: '600',
          }}
        >
          modifier
        </Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            value={d}
            onChangeText={(v) => onChangeOtp(i, v)}
            onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
            keyboardType="number-pad"
            inputMode="numeric"
            textContentType={i === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={i === 0 ? 'sms-otp' : 'off'}
            maxLength={i === 0 ? OTP_LENGTH : 1}
            autoFocus={i === 0}
            accessibilityLabel={`Chiffre ${i + 1}`}
            style={[
              styles.otpCell,
              d.length > 0 && styles.otpCellFilled,
            ]}
          />
        ))}
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text style={styles.resendLine}>
          <Text>Pas de SMS ? </Text>
          <Text
            onPress={resendLeft > 0 ? undefined : onResend}
            style={{
              color: theme.colors.primaryHover,
              fontWeight: '600',
              opacity: resendLeft > 0 ? 0.75 : 1,
            }}
          >
            {resendLeft > 0
              ? `Renvoyer dans ${resendLeft}s`
              : 'Renvoyer le code'}
          </Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Done step ────────────────────────────────────────────────────────────────

function DoneStep({
  onPickClient,
  onPickPro,
  signingIn,
}: {
  onPickClient: () => void;
  onPickPro: () => void;
  signingIn: 'client' | 'pro' | null;
}) {
  const disabled = signingIn !== null;
  return (
    <View>
      <View
        accessibilityRole="image"
        accessibilityLabel="Connexion réussie"
        style={styles.successCircle}
      >
        <I.check size={38} color="#FFFFFF" strokeWidth={2.5} />
      </View>
      <Text style={[styles.h1, { textAlign: 'center' }]}>
        Vous êtes connecté·e
      </Text>
      <Text style={[styles.body, styles.doneBody]}>
        Comment voulez-vous utiliser KAYOU ?
      </Text>

      <View style={styles.roleStack}>
        <RoleCard
          title="Je cherche un pro"
          subtitle="Plombier, électricien, coiffeuse, ménage…"
          tone="primary"
          icon={<I.search size={22} color={theme.colors.primary} />}
          onPress={onPickClient}
          loading={signingIn === 'client'}
          disabled={disabled}
        />
        <RoleCard
          title="Je suis un pro"
          subtitle="Recevez des demandes, gérez vos missions, payez-vous en M-Pesa."
          tone="accent"
          icon={<I.sparkles size={22} color={theme.colors.accent} />}
          onPress={onPickPro}
          loading={signingIn === 'pro'}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

function RoleCard({
  title,
  subtitle,
  tone,
  icon,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  subtitle: string;
  tone: 'primary' | 'accent';
  icon: React.ReactNode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const tint =
    tone === 'primary' ? theme.colors.primary : theme.colors.accent;
  const tintSubtle =
    tone === 'primary'
      ? theme.colors.primarySubtle
      : theme.colors.accentSubtle;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.roleCard,
        pressed && { borderColor: tint, transform: [{ scale: 0.99 }] },
        disabled && { opacity: 0.6 },
      ]}
    >
      <View style={[styles.roleIconBox, { backgroundColor: tintSubtle }]}>
        {loading ? <ActivityIndicator size="small" color={tint} /> : icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSubtitle}>{subtitle}</Text>
      </View>
      <I.chevronRight size={18} color={theme.colors.textSubtle} />
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    flexDirection: 'column',
  },
  dotsContainer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },

  // Logo
  logoBlock: {
    marginBottom: 24,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.brand,
  },
  logoLetter: {
    fontFamily: theme.fonts.display,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Text
  h1: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 30,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    marginBottom: 28,
  },

  // Country tabs
  countryTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceMuted,
    padding: 4,
    borderRadius: 12,
  },
  countryTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countryTabActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13.5,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  countryLabelActive: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  // Phone input
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  dialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceMuted,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  dialFlag: {
    fontSize: 18,
  },
  dialText: {
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: theme.fonts.mono,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: theme.colors.textPrimary,
  },
  hint: {
    marginTop: 8,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  // CTA
  cta: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadow.brand,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    fontFamily: theme.fonts.body,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Assurance
  assurance: {
    marginTop: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  assuranceText: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textBody,
  },

  // Demo accounts panel (dev only)
  demoPanel: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  demoOverline: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  demoHint: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  demoError: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.dangerSubtle,
  },
  demoErrorText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.danger,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
  },
  demoInitials: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoInitialsText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bodySemi,
    fontWeight: '700',
    fontSize: 12.5,
  },
  demoName: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  demoRolePill: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    overflow: 'hidden',
  },
  demoSubhint: {
    marginTop: 1,
    fontFamily: theme.fonts.body,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },

  // OTP step
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backLinkText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpCell: {
    width: 44,
    height: 56,
    textAlign: 'center',
    fontFamily: theme.fonts.mono,
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    flex: 1,
  },
  otpCellFilled: {
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.02 }],
  },
  resendLine: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  // Done
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.success,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  doneBody: {
    textAlign: 'center',
    maxWidth: 340,
    alignSelf: 'center',
  },
  roleStack: {
    gap: 10,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  roleSubtitle: {
    marginTop: 2,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },
});
