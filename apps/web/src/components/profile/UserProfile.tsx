"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User, CreditCard, MapPin, Bell, Settings, Shield,
  HelpCircle, FileText, LogOut, ChevronRight, Plus, Pencil, Trash2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Profile Menu Component
export function ProfileMenu() {
  const menuItems = [
    { icon: User, label: 'Mon Profil', href: '/dashboard/profile', color: 'text-primary' },
    { icon: CreditCard, label: 'Paiement', href: '/dashboard/cards', color: 'text-blue-600' },
    { icon: MapPin, label: 'Mes Adresses', href: '/dashboard/addresses', color: 'text-green-600' },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications', color: 'text-orange-600' },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings', color: 'text-gray-600' },
  ];

  const legalItems = [
    { icon: Shield, label: 'Politique de confidentialité', href: '/privacy' },
    { icon: FileText, label: "Conditions d'utilisation", href: '/terms' },
    { icon: HelpCircle, label: 'Aide & Support', href: '/help' },
  ];

  return (
    <Card className="kayou-card">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <item.icon className={cn("h-5 w-5", item.color)} />
              <span className="flex-1 font-medium">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="divide-y divide-border">
          {legalItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <Separator />

        <button className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors text-red-600">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </CardContent>
    </Card>
  );
}

// User Profile Header
export function UserProfileHeader({ user }: { user: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}}) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Card className="kayou-card">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-1">
              {user.role === 'CLIENT' ? 'Client' : 'Prestataire'}
            </Badge>
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Address Section
export function AddressSection({
  addresses = []
}: {
  addresses?: Array<{ id: string; name: string; address: string; city: string; phone: string; isDefault?: boolean }>
}) {
  return (
    <Card className="kayou-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Mes Adresses</CardTitle>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Aucune adresse</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez votre adresse pour commencer
            </p>
            <Button className="bg-primary hover:bg-primary/90">
              Ajouter une adresse
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{addr.name}</h4>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{addr.address}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Cards Section
export function CardsSection({
  cards = []
}: {
  cards?: Array<{ id: string; last4: string; brand: string; expiryMonth: number; expiryYear: number; isDefault?: boolean }>
}) {
  return (
    <Card className="kayou-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Paiement</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {cards.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Paiement en espèces</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Le règlement se fait directement avec le prestataire à la fin de la mission.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div key={card.id} className="p-4 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium">{card.brand}</span>
                    <p className="text-xl font-mono mt-3">•••• {card.last4}</p>
                    <p className="text-sm opacity-80 mt-2">
                      Expire {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                    </p>
                  </div>
                  {card.isDefault && (
                    <Badge className="bg-white/20 text-white border-0">Par défaut</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfileMenu;
