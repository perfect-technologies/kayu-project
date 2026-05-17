import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

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
  title: "KAYOU - Un service a portee de main",
  description:
    "KAYOU connecte les prestataires de services qualifies avec les clients en RDC et Congo-Brazzaville. Trouvez facilement des professionnels pour tous vos besoins: plomberie, electricite, menage, et plus encore.",
  keywords: ["KAYOU", "services", "Kinshasa", "Brazzaville", "RDC", "Congo", "plomberie", "electricite", "menage", "prestataires", "Afrique"],
  authors: [{ name: "KAYOU Team" }],
  icons: {
    icon: "/kayou-logo.png",
  },
  openGraph: {
    title: "KAYOU - Un service a portee de main",
    description: "Trouvez des prestataires de services qualifies a Kinshasa et Brazzaville",
    url: appUrl,
    siteName: "KAYOU",
    type: "website",
    locale: "fr_CD",
  },
  twitter: {
    card: "summary_large_image",
    title: "KAYOU - Un service a portee de main",
    description: "Trouvez des prestataires de services qualifies a Kinshasa et Brazzaville",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${inter.variable} ${jetBrainsMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
