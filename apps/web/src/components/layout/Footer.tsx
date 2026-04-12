"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowRight,
} from "lucide-react";

const footerLinks = {
  services: {
    title: "Services",
    links: [
      { name: "Plomberie", href: "#" },
      { name: "Électricité", href: "#" },
      { name: "Ménage", href: "#" },
      { name: "Jardinage", href: "#" },
      { name: "Réparation", href: "#" },
      { name: "Transport", href: "#" },
    ],
  },
  entreprise: {
    title: "Entreprise",
    links: [
      { name: "À propos de nous", href: "#" },
      { name: "Comment ça marche", href: "#" },
      { name: "Devenir prestataire", href: "#" },
      { name: "Carrières", href: "#" },
      { name: "Blog", href: "#" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { name: "Centre d'aide", href: "#" },
      { name: "Contactez-nous", href: "#" },
      { name: "FAQ", href: "#" },
      { name: "Signaler un problème", href: "#" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { name: "Conditions d'utilisation", href: "#" },
      { name: "Politique de confidentialité", href: "#" },
      { name: "Politique de cookies", href: "#" },
      { name: "Mentions légales", href: "#" },
    ],
  },
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    // Simulate subscription
    setTimeout(() => {
      setIsSubscribing(false);
      setEmail("");
      alert("Merci pour votre inscription !");
    }, 1000);
  };

  return (
    <footer className="w-full border-t border-border/40 bg-background mt-auto">
      {/* Newsletter Section */}
      <div className="bg-primary/5 border-b border-border/40">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-foreground">
                Restez informé
              </h3>
              <p className="text-sm text-muted-foreground">
                Recevez nos dernières offres et actualités
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full md:w-64"
                required
              />
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 shrink-0"
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                  </span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/kayou-logo-transparent.png"
                alt="KAYOU"
                width={140}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              Un service à portée de main
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>Kinshasa & Brazzaville</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+243 XXX XXX XXX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>contact@kayou.cd</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} KAYOU. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-primary transition-colors">
                Conditions
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Confidentialité
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
