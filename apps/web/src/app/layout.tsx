import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KAYOU - Un service a portee de main",
  description: "KAYOU connecte les prestataires de services qualifies avec les clients en RDC et Congo-Brazzaville. Trouvez facilement des professionnels pour tous vos besoins: plomberie, electricite, menage, et plus encore.",
  keywords: ["KAYOU", "services", "Kinshasa", "Brazzaville", "RDC", "Congo", "plomberie", "electricite", "menage", "prestataires", "Afrique"],
  authors: [{ name: "KAYOU Team" }],
  icons: {
    icon: "/kayou-logo.png",
  },
  openGraph: {
    title: "KAYOU - Un service a portee de main",
    description: "Trouvez des prestataires de services qualifies a Kinshasa et Brazzaville",
    url: "https://kayou.cd",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
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
