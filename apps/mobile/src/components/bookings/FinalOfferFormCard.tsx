import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { I } from '@kayu/ui/mobile';
import type { finalOffersApi } from '@kayu/api';
import { theme } from '@/lib/theme';

type CreateFinalOfferInput = Parameters<ReturnType<typeof finalOffersApi>['create']>[0];

export type FinalOfferFormInitialValues = {
  title?: string;
  description?: string;
  price?: number | string;
  durationHours?: number | string;
  scheduledDate?: Date | string;
  address?: string;
  city?: string;
  notes?: string;
};

export type FinalOfferFormCardProps = {
  providerId: string;
  clientId: string;
  conversationId?: string;
  bookingId?: string;
  initialValues?: FinalOfferFormInitialValues;
  heading?: string;
  subheading?: string;
  submitLabel?: string;
  busy: boolean;
  onSubmit: (data: CreateFinalOfferInput) => Promise<unknown>;
  onCancel: () => void;
};

function defaultOfferDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

function toDate(value: Date | string | undefined): Date {
  if (!value) return defaultOfferDate();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? defaultOfferDate() : d;
}

function formatOfferDate(d: Date) {
  return d
    .toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', ' ·');
}

export function FinalOfferFormCard({
  providerId,
  clientId,
  conversationId,
  bookingId,
  initialValues,
  heading = "Enregistrer l'accord",
  subheading = "La réservation est confirmée dès que l'accord est enregistré.",
  submitLabel = "Enregistrer l'accord",
  busy,
  onSubmit,
  onCancel,
}: FinalOfferFormCardProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [price, setPrice] = useState(
    initialValues?.price != null ? String(initialValues.price) : '',
  );
  const [duration, setDuration] = useState(
    initialValues?.durationHours != null ? String(initialValues.durationHours) : '2',
  );
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [city] = useState(initialValues?.city ?? 'Kinshasa');
  const [date, setDate] = useState<Date>(toDate(initialValues?.scheduledDate));
  const [notes] = useState(initialValues?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setPrice(initialValues?.price != null ? String(initialValues.price) : '');
    setDuration(
      initialValues?.durationHours != null ? String(initialValues.durationHours) : '2',
    );
    setAddress(initialValues?.address ?? '');
    setDate(toDate(initialValues?.scheduledDate));
    setError(null);
  }, [initialValues]);

  const shiftDate = (days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    setDate(next);
  };

  const submit = async () => {
    const parsedPrice = Number(price.replace(/\s/g, '').replace(',', '.'));
    const parsedDurationHours = Number(duration.replace(',', '.'));
    if (!title.trim()) {
      setError('Ajoutez un titre de service.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Ajoutez un prix valide.');
      return;
    }
    if (!Number.isFinite(parsedDurationHours) || parsedDurationHours <= 0) {
      setError('Ajoutez une durée valide.');
      return;
    }
    setError(null);
    await onSubmit({
      providerId,
      clientId,
      conversationId,
      bookingId,
      title: title.trim(),
      description: description.trim() || undefined,
      price: parsedPrice,
      duration: Math.max(1, Math.round(parsedDurationHours * 60)),
      scheduledDate: date,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentMethod: 'cash',
    });
  };

  return (
    <View style={styles.formCard}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <I.fileText size={16} color={theme.colors.primaryHover} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overline}>Accord final</Text>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.hint}>{subheading}</Text>
        </View>
      </View>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Service"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, styles.multiline]}
        multiline
      />
      <View style={styles.row}>
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Prix convenu FC"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }]}
        />
        <TextInput
          value={duration}
          onChangeText={setDuration}
          placeholder="Durée h"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }]}
        />
      </View>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Adresse"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
      />
      <View style={styles.dateRow}>
        <Pressable style={styles.dateBtn} onPress={() => shiftDate(-1)}>
          <I.arrowLeft size={14} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.dateText}>{formatOfferDate(date)}</Text>
        <Pressable style={styles.dateBtn} onPress={() => shiftDate(1)}>
          <I.arrowRight size={14} color={theme.colors.textPrimary} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.cashCopy}>Paiement en espèces à la fin de la mission.</Text>
      <View style={styles.actions}>
        <Pressable
          style={[styles.secondaryBtn, { flex: 1 }]}
          disabled={busy}
          onPress={onCancel}
        >
          <Text style={styles.secondaryText}>Annuler</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryBtn, { flex: 1.4 }]}
          disabled={busy}
          onPress={submit}
        >
          <Text style={styles.primaryText}>{busy ? 'Enregistrement…' : submitLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primarySubtle,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySubtle,
  },
  overline: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  hint: {
    fontFamily: theme.fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  multiline: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  cashCopy: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: theme.colors.primarySubtle,
    fontFamily: theme.fonts.bodySemi,
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  error: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 12.5,
    color: '#BE123C',
    backgroundColor: theme.colors.dangerSubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
