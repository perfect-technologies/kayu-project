"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ServiceCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string | null;
  color?: string | null;
  providersCount?: number;
  rating?: number;
  duration?: string;
  startingPrice?: number;
  compact?: boolean;
}

const categoryImages: Record<string, string> = {
  "menage-nettoyage": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
  "plomberie": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
  "electricite": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
  "coiffure-beaute": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
  "education-soutien": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
  "btp-construction": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
  "jardinage": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
  "transport": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop",
  "mecanique-auto": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop",
  "informatique": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
  "sante-bien-etre": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop",
  "art-decoration": "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&h=300&fit=crop",
  "cuisine-traiteur": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
  "couture-mode": "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop",
  "climatisation": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop",
  "serrurerie": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "garde-enfants": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop",
  "evenementiel": "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&h=300&fit=crop",
  "agriculture": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop",
  "musique-spectacle": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop",
  "services-professionnels": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
  "sport-fitness": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
  "electromenager": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop",
  "bricolage": "https://images.unsplash.com/photo-1581122584624-4a27cbec8680?w=400&h=300&fit=crop",
};

export function ServiceCard({
  id,
  name,
  slug,
  description,
  image,
  icon,
  color,
  providersCount = 0,
  rating = 4.5,
  duration = "1-2h",
  startingPrice,
  compact = false,
}: ServiceCardProps) {
  const imageUrl = image || categoryImages[slug] || categoryImages["menage-nettoyage"];

  if (compact) {
    return (
      <Link href={`/services?category=${slug}`}>
        <Card className="group cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 h-full overflow-hidden">
          <div className="relative h-24 bg-gradient-to-br from-primary/10 to-primary/5">
            <div
              className="absolute bottom-2 left-3 p-2 rounded-lg text-white shadow-sm"
              style={{ backgroundColor: color || '#1E3A8A' }}
            >
              <span className="text-lg">{icon || '🔧'}</span>
            </div>
          </div>
          <CardContent className="p-3">
            <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">{name}</h3>
            <p className="text-xs text-muted-foreground">{providersCount}+ prestataires</p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/services?category=${slug}`}>
      <Card className="group cursor-pointer kayou-card h-full overflow-hidden">
        {/* Image Container */}
        <div className="relative h-40 overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badge */}
          {providersCount > 0 && (
            <Badge className="absolute top-3 right-3 bg-white/90 text-foreground border-0 shadow-sm">
              {providersCount}+ disponibles
            </Badge>
          )}

          {/* Category Name Overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg line-clamp-1 drop-shadow-sm">
              {name}
            </h3>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Rating & Duration */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-foreground">{rating}</span>
              <span className="text-xs text-muted-foreground">(250+ avis)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">{duration}</span>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {startingPrice && (
              <div>
                <span className="text-xs text-muted-foreground">À partir de</span>
                <p className="font-bold text-primary">{startingPrice.toLocaleString("fr-FR")} FC</p>
              </div>
            )}
            <Button
              size="sm"
              className="ml-auto bg-primary hover:bg-primary/90 gap-1"
            >
              Réserver
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default ServiceCard;
