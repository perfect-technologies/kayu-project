"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Lock,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Briefcase,
  Star,
  Calendar,
  Award,
  History,
  MessageSquare,
  Search,
  Shield,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { settingsApi } from "@kayu/api";

// Types
interface VisibilitySettingsData {
  profileVisible: "PUBLIC" | "REGISTERED" | "CLIENTS_ONLY" | "PRIVATE";
  showEmail: boolean;
  showPhone: boolean;
  showExactLocation: boolean;
  showHourlyRate: boolean;
  showPastWork: boolean;
  showReviews: boolean;
  showAvailability: boolean;
  showCertifications: boolean;
  showClientHistory: boolean;
  showClientReviews: boolean;
  allowDirectContact: boolean;
  allowMessages: boolean;
  appearInSearch: boolean;
  appearInCategory: boolean;
}

interface VisibilitySettingsProps {
  userRole: "CLIENT" | "PROVIDER" | "ADMIN";
}

const defaultSettings: VisibilitySettingsData = {
  profileVisible: "PUBLIC",
  showEmail: false,
  showPhone: false,
  showExactLocation: false,
  showHourlyRate: true,
  showPastWork: true,
  showReviews: true,
  showAvailability: true,
  showCertifications: true,
  showClientHistory: true,
  showClientReviews: true,
  allowDirectContact: true,
  allowMessages: true,
  appearInSearch: true,
  appearInCategory: true,
};

const visibilityLevelLabels: Record<string, { label: string; description: string; icon: typeof Globe }> = {
  PUBLIC: { label: "Public", description: "Visible par tous les visiteurs", icon: Globe },
  REGISTERED: { label: "Inscrits uniquement", description: "Visible uniquement par les utilisateurs inscrits", icon: Users },
  CLIENTS_ONLY: { label: "Clients uniquement", description: "Visible uniquement par vos clients confirmés", icon: Lock },
  PRIVATE: { label: "Privé", description: "Profil masqué, non visible", icon: EyeOff },
};

export function VisibilitySettings({ userRole }: VisibilitySettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<VisibilitySettingsData | null>(null);

  // Fetch current settings via React Query + @kayu/api
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'visibility'],
    queryFn: () => settingsApi(apiClient).getVisibility(),
    select: (res) => res.settings as unknown as VisibilitySettingsData,
  });

  // Initialise local state once data is fetched
  useEffect(() => {
    if (data && !localSettings) {
      setLocalSettings(data);
    }
  }, [data, localSettings]);

  const settings = localSettings ?? data ?? defaultSettings;

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (updated: VisibilitySettingsData) =>
      settingsApi(apiClient).updateVisibility(updated as Parameters<typeof settingsApi>[0] extends never ? never : Parameters<ReturnType<typeof settingsApi>['updateVisibility']>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'visibility'] });
      toast({
        title: "Paramètres enregistrés",
        description: "Vos paramètres de visibilité ont été mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres de visibilité",
      });
    },
  });

  // Update a single setting locally
  const updateSetting = <K extends keyof VisibilitySettingsData>(
    key: K,
    value: VisibilitySettingsData[K]
  ) => {
    setLocalSettings((prev) => ({ ...(prev ?? defaultSettings), [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading && !localSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isProvider = userRole === "PROVIDER";
  const isClient = userRole === "CLIENT";

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Visibilité du profil</CardTitle>
          </div>
          <CardDescription>
            Contrôlez qui peut voir votre profil sur KAYOU
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="profileVisible">Niveau de visibilité</Label>
            <Select
              value={settings.profileVisible}
              onValueChange={(value: VisibilitySettingsData["profileVisible"]) =>
                updateSetting("profileVisible", value)
              }
            >
              <SelectTrigger id="profileVisible" className="w-full max-w-sm">
                <SelectValue placeholder="Sélectionnez un niveau" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(visibilityLevelLabels).map(([value, { label, icon: Icon }]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {settings.profileVisible && (
              <p className="text-sm text-muted-foreground">
                {visibilityLevelLabels[settings.profileVisible].description}
              </p>
            )}
          </div>

          <Separator />

          {/* Contact Information Visibility */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Informations de contact
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showEmail" className="font-medium">
                      Email
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher votre email sur votre profil
                    </p>
                  </div>
                </div>
                <Switch
                  id="showEmail"
                  checked={settings.showEmail}
                  onCheckedChange={(checked) => updateSetting("showEmail", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showPhone" className="font-medium">
                      Téléphone
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher votre numéro de téléphone
                    </p>
                  </div>
                </div>
                <Switch
                  id="showPhone"
                  checked={settings.showPhone}
                  onCheckedChange={(checked) => updateSetting("showPhone", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showExactLocation" className="font-medium">
                      Localisation exacte
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher votre adresse précise
                    </p>
                  </div>
                </div>
                <Switch
                  id="showExactLocation"
                  checked={settings.showExactLocation}
                  onCheckedChange={(checked) => updateSetting("showExactLocation", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider-specific settings */}
      {isProvider && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ce que les clients peuvent voir</CardTitle>
            </div>
            <CardDescription>
              Contrôlez les informations visibles par les clients sur votre profil prestataire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showHourlyRate" className="font-medium">
                      Prix de départ
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher votre prix indicatif
                    </p>
                  </div>
                </div>
                <Switch
                  id="showHourlyRate"
                  checked={settings.showHourlyRate}
                  onCheckedChange={(checked) => updateSetting("showHourlyRate", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showPastWork" className="font-medium">
                      Travaux passés
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher votre portfolio
                    </p>
                  </div>
                </div>
                <Switch
                  id="showPastWork"
                  checked={settings.showPastWork}
                  onCheckedChange={(checked) => updateSetting("showPastWork", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showReviews" className="font-medium">
                      Avis clients
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher les évaluations reçues
                    </p>
                  </div>
                </div>
                <Switch
                  id="showReviews"
                  checked={settings.showReviews}
                  onCheckedChange={(checked) => updateSetting("showReviews", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showAvailability" className="font-medium">
                      Disponibilité
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher vos disponibilités
                    </p>
                  </div>
                </div>
                <Switch
                  id="showAvailability"
                  checked={settings.showAvailability}
                  onCheckedChange={(checked) => updateSetting("showAvailability", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showCertifications" className="font-medium">
                      Certifications & Diplômes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher vos certifications et diplômes vérifiés
                    </p>
                  </div>
                </div>
                <Switch
                  id="showCertifications"
                  checked={settings.showCertifications}
                  onCheckedChange={(checked) => updateSetting("showCertifications", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client-specific settings */}
      {isClient && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ce que les prestataires peuvent voir</CardTitle>
            </div>
            <CardDescription>
              Contrôlez les informations visibles par les prestataires sur votre profil client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showClientHistory" className="font-medium">
                      Historique
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher votre historique de réservations
                    </p>
                  </div>
                </div>
                <Switch
                  id="showClientHistory"
                  checked={settings.showClientHistory}
                  onCheckedChange={(checked) => updateSetting("showClientHistory", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="showClientReviews" className="font-medium">
                      Avis reçus
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher les avis des prestataires
                    </p>
                  </div>
                </div>
                <Switch
                  id="showClientReviews"
                  checked={settings.showClientReviews}
                  onCheckedChange={(checked) => updateSetting("showClientReviews", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Préférences de contact</CardTitle>
          </div>
          <CardDescription>
            Définissez comment les autres utilisateurs peuvent vous contacter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="allowDirectContact" className="font-medium">
                    Contact direct
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Autoriser les appels téléphoniques directs
                  </p>
                </div>
              </div>
              <Switch
                id="allowDirectContact"
                checked={settings.allowDirectContact}
                onCheckedChange={(checked) => updateSetting("allowDirectContact", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="allowMessages" className="font-medium">
                    Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Autoriser la réception de messages
                  </p>
                </div>
              </div>
              <Switch
                id="allowMessages"
                checked={settings.allowMessages}
                onCheckedChange={(checked) => updateSetting("allowMessages", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Visibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Visibilité dans les recherches</CardTitle>
          </div>
          <CardDescription>
            Contrôlez votre apparition dans les résultats de recherche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="appearInSearch" className="font-medium">
                    Recherche générale
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Apparaître dans les résultats de recherche
                  </p>
                </div>
              </div>
              <Switch
                id="appearInSearch"
                checked={settings.appearInSearch}
                onCheckedChange={(checked) => updateSetting("appearInSearch", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="appearInCategory" className="font-medium">
                    Pages de catégories
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Apparaître dans les pages de catégories
                  </p>
                </div>
              </div>
              <Switch
                id="appearInCategory"
                checked={settings.appearInCategory}
                onCheckedChange={(checked) => updateSetting("appearInCategory", checked)}
              />
            </div>
          </div>

          {(!settings.appearInSearch || !settings.appearInCategory) && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <EyeOff className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Attention
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Si vous désactivez ces options, vous serez moins visible pour les clients potentiels.
                    {isProvider && " Cela peut réduire vos opportunités de travail."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary & Save */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium">Résumé de vos paramètres</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant={settings.profileVisible === "PUBLIC" ? "default" : "secondary"}>
                  {visibilityLevelLabels[settings.profileVisible].label}
                </Badge>
                {settings.appearInSearch ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Search className="h-3 w-3 mr-1" />
                    Visible en recherche
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Masqué en recherche
                  </Badge>
                )}
                {settings.allowMessages ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Messages activés
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Messages désactivés
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full sm:w-auto">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Enregistrer les paramètres
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
