import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { resolvePublicWebMode } from "@/lib/campaign-routing";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-k-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-k-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-k-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "KAYOU arrive bientôt à Kinshasa",
  description:
    "Préinscrivez-vous gratuitement au lancement de KAYOU à Kinshasa : proposez vos services ou soyez averti parmi les premiers, sans créer de compte.",
  keywords: [
    "KAYOU",
    "services",
    "Kinshasa",
    "RDC",
    "prestataires",
    "lancement",
  ],
  authors: [{ name: "KAYOU Team" }],
  icons: {
    icon: "/kayou-logo.png",
  },
  openGraph: {
    title: "KAYOU arrive bientôt à Kinshasa",
    description:
      "Préinscrivez-vous gratuitement pour faire partie des premiers prestataires KAYOU ou des premiers à chercher un prestataire de confiance à Kinshasa.",
    url: appUrl,
    siteName: "KAYOU",
    type: "website",
    locale: "fr_CD",
  },
  twitter: {
    card: "summary",
    title: "KAYOU arrive bientôt à Kinshasa",
    description:
      "Préinscrivez-vous gratuitement pour faire partie des premiers à Kinshasa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicMode = resolvePublicWebMode(process.env.KAYOU_PUBLIC_WEB_MODE);

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${inter.variable} ${jetBrainsMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AppProviders publicMode={publicMode}>{children}</AppProviders>
      </body>
    </html>
  );
}
