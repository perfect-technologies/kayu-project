"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Globe, Mail, MapPin, MessageSquare, Phone, Send } from "lucide-react";
import { ApiError, contactApi } from "@kayu/api";
import { toast } from "sonner";
import { contactCopy } from "@/copy/contact";
import { errorMessage } from "@/copy/errors";
import { settingOr, useSiteSettings } from "@/hooks/useSiteSettings";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const copy = contactCopy;

const schema = z.object({
  name: z.string().trim().min(2, copy.errors.name).max(160, copy.errors.name),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email(copy.errors.email).max(254, copy.errors.email),
  subject: z.string().trim().min(3, copy.errors.subject).max(160, copy.errors.subject),
  message: z.string().trim().min(10, copy.errors.message).max(5000, copy.errors.message),
});
type FormValues = z.infer<typeof schema>;

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
        {label}
        {required && (
          <span className="text-red-500" aria-label={copy.form.required}>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactClient() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { settings } = useSiteSettings();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const phone = settingOr(settings.contact_phone, copy.channels.fallbackPhone);
  const email = settingOr(settings.contact_email, copy.channels.fallbackEmail);
  const website = settingOr(settings.contact_website, copy.channels.fallbackWebsite);
  const channels = [
    { Icon: Phone, label: copy.channels.phone, value: phone, href: `tel:${phone.replace(/\s+/g, "")}` },
    { Icon: Mail, label: copy.channels.email, value: email, href: `mailto:${email}` },
    { Icon: Globe, label: copy.channels.website, value: website, href: website.startsWith("http") ? website : `https://${website}` },
  ];

  const onSubmit = async (values: FormValues) => {
    try {
      await contactApi(apiClient).send({
        name: values.name,
        email: values.email,
        phone: values.phone?.trim() || null,
        subject: values.subject,
        message: values.message,
      });
      setDone(true);
      reset();
    } catch (error) {
      toast.error(error instanceof ApiError && error.status === 429 ? copy.errors.rateLimited : errorMessage(error));
    }
  };

  const invalid = (key: keyof FormValues) => (errors[key] ? { "aria-invalid": true as const, "aria-describedby": `${key}-error` } : {});

  return (
    <div className="mobile-page max-w-5xl sm:py-10">
      <button type="button" onClick={() => router.back()} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-primary">
        <ArrowLeft size={16} aria-hidden /> {copy.back}
      </button>

      <header className="mt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{copy.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{copy.subtitle}</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {channels.map(({ Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-soft transition hover:border-primary/20 hover:shadow-soft-lg"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={20} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
                <span className="block truncate text-sm font-bold text-foreground">{value}</span>
              </span>
            </a>
          ))}
          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-soft">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-amber-600">
              <MapPin size={20} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">{copy.channels.zone}</span>
              <span className="block text-sm font-bold text-foreground">{copy.channels.zoneValue}</span>
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : undefined}
          className="rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-7 lg:col-span-3"
        >
          {done ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
              <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={36} aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-foreground">{copy.success.title}</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{copy.success.body}</p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
              >
                <MessageSquare size={16} aria-hidden /> {copy.success.again}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="name" label={copy.form.name} required error={errors.name?.message}>
                  <input id="name" {...register("name")} {...invalid("name")} autoComplete="name" placeholder={copy.form.namePlaceholder} className={cn("field", errors.name && "border-destructive")} />
                </Field>
                <Field id="phone" label={copy.form.phone} error={errors.phone?.message}>
                  <input id="phone" {...register("phone")} type="tel" autoComplete="tel" placeholder={copy.form.phonePlaceholder} className="field" />
                </Field>
              </div>
              <Field id="email" label={copy.form.email} required error={errors.email?.message}>
                <input id="email" {...register("email")} {...invalid("email")} type="email" autoComplete="email" placeholder={copy.form.emailPlaceholder} className={cn("field", errors.email && "border-destructive")} />
              </Field>
              <Field id="subject" label={copy.form.subject} required error={errors.subject?.message}>
                <input id="subject" {...register("subject")} {...invalid("subject")} placeholder={copy.form.subjectPlaceholder} className={cn("field", errors.subject && "border-destructive")} />
              </Field>
              <Field id="message" label={copy.form.message} required error={errors.message?.message}>
                <textarea id="message" {...register("message")} {...invalid("message")} rows={5} placeholder={copy.form.messagePlaceholder} className={cn("field h-auto resize-none py-3", errors.message && "border-destructive")} />
              </Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 to-teal-700 px-6 text-[15px] font-bold text-white shadow-brand transition hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                ) : (
                  <Send size={18} aria-hidden />
                )}
                {isSubmitting ? copy.form.submitting : copy.form.submit}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
