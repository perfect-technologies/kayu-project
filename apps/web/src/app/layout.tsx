import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { shellCopy } from "@/copy/shell";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: shellCopy.meta.title,
    template: `%s — ${shellCopy.brand}`,
  },
  description: shellCopy.meta.description,
  applicationName: shellCopy.brand,
  openGraph: {
    title: shellCopy.meta.title,
    description: shellCopy.meta.description,
    url: appUrl,
    siteName: shellCopy.brand,
    type: "website",
    locale: "fr_CD",
  },
  twitter: {
    card: "summary_large_image",
    title: shellCopy.meta.title,
    description: shellCopy.meta.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A3D36",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${sora.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
