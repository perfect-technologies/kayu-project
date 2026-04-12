'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  Phone,
  ArrowLeft,
  CheckCircle2,
  UserCircle,
  Wrench,
  Globe,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { identityApi } from '@kayu/api';
import { ProviderOnboarding, type ProviderOnboardingData, type SelectedTrade } from './ProviderOnboarding';

interface RegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

type UserRole = 'CLIENT' | 'PROVIDER';

interface FormData {
  role: UserRole | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  city: string;
  country: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  experience: number | null;
  hourlyRate: number | null;
  selectedTrades: SelectedTrade[];
  skills: string[];
  serviceZones: { city: string; commune: string }[];
  avatar: string | null;
  profession: string;
  categoryIds: string[];
  subcategoryIds: string[];
}

const initialFormData: FormData = {
  role: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  city: '',
  country: 'RDC',
  address: '',
  latitude: null,
  longitude: null,
  description: '',
  experience: null,
  hourlyRate: null,
  selectedTrades: [],
  skills: [],
  serviceZones: [],
  avatar: null,
  profession: '',
  categoryIds: [],
  subcategoryIds: [],
};

const countries = [
  { value: 'RDC', label: 'République Démocratique du Congo', code: '+243' },
  { value: 'CG', label: 'Congo-Brazzaville', code: '+242' },
];

const rdcCities = ['Kinshasa', 'Lubumbashi', 'Goma', 'Mbuji-Mayi', 'Kisangani', 'Matadi', 'Boma', 'Likasi', 'Kolwezi'];
const cgCities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Impfondo'];

function validatePhoneNumber(phone: string, country: string): { isValid: boolean; formatted?: string; error?: string } {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  const patterns: Record<string, { pattern: RegExp; format: string }> = {
    'RDC': {
      pattern: /^(\+243|0)?[89][0-9]{8}$/,
      format: '+243'
    },
    'CG': {
      pattern: /^(\+242|0)?[0-9]{9}$/,
      format: '+242'
    }
  };

  const countryPattern = patterns[country];
  if (!countryPattern) {
    return { isValid: false, error: 'Pays non supporté' };
  }

  if (!countryPattern.pattern.test(cleanPhone)) {
    return {
      isValid: false,
      error: `Format invalide. Exemple: ${countryPattern.format} 9XX XXX XXX pour la RDC, ${countryPattern.format} 06X XXX XXX pour le Congo`
    };
  }

  let formattedPhone = cleanPhone;
  if (cleanPhone.startsWith('0')) {
    formattedPhone = countryPattern.format + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('+')) {
    formattedPhone = countryPattern.format + cleanPhone;
  }

  return { isValid: true, formatted: formattedPhone };
}

export function RegisterDialog({ open, onOpenChange, onSwitchToLogin }: RegisterDialogProps) {
  const router = useRouter();
  const { register, login } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateFormData = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
    if (field === 'phone') {
      setPhoneError('');
    }
  };

  const updateProviderData = (data: Partial<ProviderOnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setError('');
  };

  const handleRoleSelect = (role: UserRole) => {
    updateFormData('role', role);
  };

  const handlePhoneBlur = () => {
    if (formData.phone && formData.country) {
      const result = validatePhoneNumber(formData.phone, formData.country);
      if (!result.isValid) {
        setPhoneError(result.error || 'Numéro invalide');
      } else if (result.formatted) {
        setFormData((prev) => ({ ...prev, phone: result.formatted! }));
        setPhoneError('');
      }
    }
  };

  const fetchCoordinates = async (city: string, country: string) => {
    if (!city) return;
    try {
      const response = await fetch(`/api/geocode?city=${encodeURIComponent(city)}&country=${country}`);
      const result = await response.json();
      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          latitude: result.data.latitude,
          longitude: result.data.longitude,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
    }
  };

  const handleCityChange = (city: string) => {
    updateFormData('city', city);
    if (city) {
      fetchCoordinates(city, formData.country);
    } else {
      setFormData((prev) => ({ ...prev, latitude: null, longitude: null }));
    }
  };

  const handleCountryChange = (country: string) => {
    updateFormData('country', country);
    updateFormData('city', '');
    updateFormData('phone', '');
    setPhoneError('');
    setFormData((prev) => ({ ...prev, latitude: null, longitude: null }));
  };

  const validateRoleStep = (): boolean => {
    if (!formData.role) {
      setError('Veuillez sélectionner un type de compte');
      return false;
    }
    return true;
  };

  const validateAccountInfo = (): boolean => {
    if (!formData.firstName || formData.firstName.length < 2) {
      setError('Le prénom doit contenir au moins 2 caractères');
      return false;
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      setError('Le nom doit contenir au moins 2 caractères');
      return false;
    }
    if (!formData.email || !formData.email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }
    if (formData.role === 'PROVIDER') {
      if (!formData.phone) {
        setError('Le numéro de téléphone est obligatoire pour les prestataires');
        return false;
      }
      const phoneResult = validatePhoneNumber(formData.phone, formData.country);
      if (!phoneResult.isValid) {
        setPhoneError(phoneResult.error || 'Numéro invalide');
        return false;
      }
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const validateProviderData = (): boolean => {
    if (formData.selectedTrades.length === 0) {
      setError('Veuillez sélectionner au moins un métier');
      return false;
    }
    return true;
  };

  const getTotalSteps = () => {
    return formData.role === 'PROVIDER' ? 3 : 2;
  };

  const handleNextStep = () => {
    setError('');

    if (step === 1 && validateRoleStep()) {
      setStep(2);
    } else if (step === 2 && validateAccountInfo()) {
      if (formData.role === 'PROVIDER') {
        setStep(3);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleProviderOnboardingComplete = () => {
    if (validateProviderData()) {
      handleSubmit();
    }
  };

  const handleProviderOnboardingBack = () => {
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.role) return;

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Supabase signup
      await register(formData.email, formData.password);

      // Step 2: Login to get the access token set on apiClient
      await login(formData.email, formData.password);

      // Step 3: Send profile data to the backend
      await identityApi(apiClient).completeProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        phone: formData.phone || undefined,
        city: formData.city || undefined,
        country: formData.country,
        avatar: formData.avatar || undefined,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
      });

      // Step 4: Set the role
      await identityApi(apiClient).setRole({ role: formData.role });

      // Step 5: Provider-specific onboarding
      if (formData.role === 'PROVIDER') {
        const tradeIds = formData.selectedTrades.map((t) => t.tradeId);
        const primaryTrade = formData.selectedTrades.find((t) => t.isPrimary);
        await identityApi(apiClient).providerOnboarding({
          profession: formData.profession,
          categoryIds: formData.categoryIds,
          tradeIds,
          primaryTradeId: primaryTrade?.tradeId,
          experience: formData.experience ?? undefined,
          hourlyRate: formData.hourlyRate ?? undefined,
          description: formData.description || undefined,
          skills: formData.skills,
          serviceZones: formData.serviceZones,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setFormData(initialFormData);
        setStep(1);
        setSuccess(false);
        if (formData.role === 'PROVIDER') {
          router.push('/dashboard/provider');
        } else {
          router.refresh();
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    onOpenChange(false);
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  };

  const resetDialog = () => {
    setFormData(initialFormData);
    setStep(1);
    setError('');
    setPhoneError('');
    setSuccess(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const progressPercent = (step / getTotalSteps()) * 100;

  // Success Screen
  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-primary/10 p-4 animate-pulse">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-center">Inscription réussie !</h2>
            <p className="text-muted-foreground text-center">
              Bienvenue sur KAYOU. {formData.role === 'PROVIDER'
                ? 'Vous allez être redirigé vers votre tableau de bord...'
                : 'Vous allez être redirigé...'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 1 && 'Créer un compte'}
            {step === 2 && 'Vos informations'}
            {step === 3 && 'Profil prestataire'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 1 && 'Choisissez votre type de compte'}
            {step === 2 && 'Remplissez vos informations personnelles'}
            {step === 3 && 'Complétez votre profil professionnel'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Étape {step} sur {getTotalSteps()}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mt-4 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:border-primary',
                  formData.role === 'CLIENT' && 'border-primary border-2 bg-primary/5'
                )}
                onClick={() => handleRoleSelect('CLIENT')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={cn(
                    'rounded-full p-4 mb-4',
                    formData.role === 'CLIENT' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <UserCircle className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-lg">Client</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Je cherche des prestataires
                  </p>
                  <Badge variant="outline" className="mt-3 text-xs">
                    Inscription rapide
                  </Badge>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'cursor-pointer transition-all hover:border-primary',
                  formData.role === 'PROVIDER' && 'border-primary border-2 bg-primary/5'
                )}
                onClick={() => handleRoleSelect('PROVIDER')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={cn(
                    'rounded-full p-4 mb-4',
                    formData.role === 'PROVIDER' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Wrench className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-lg">Prestataire</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    J&apos;offre mes services
                  </p>
                  <Badge variant="outline" className="mt-3 text-xs">
                    Créez votre profil pro
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handleNextStep}
              className="w-full"
              disabled={!formData.role || isLoading}
            >
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Déjà inscrit ?</span>{' '}
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="text-primary font-medium hover:underline"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Account Info */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Téléphone {formData.role === 'PROVIDER' && '*'}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={formData.country === 'RDC' ? '+243 9XX XXX XXX' : '+242 06X XXX XXX'}
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  onBlur={handlePhoneBlur}
                  className={cn('pl-10', phoneError && 'border-destructive')}
                  required={formData.role === 'PROVIDER'}
                  disabled={isLoading}
                />
              </div>
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
              {formData.role === 'PROVIDER' && !phoneError && (
                <p className="text-xs text-muted-foreground">
                  Format: {formData.country === 'RDC' ? '+243 9XX XXX XXX' : '+242 06X XXX XXX'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    disabled={isLoading}
                  >
                    <option value="">Sélectionner</option>
                    {(formData.country === 'RDC' ? rdcCities : cgCities).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    disabled={isLoading}
                  >
                    {countries.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  <>
                    {formData.role === 'PROVIDER' ? 'Continuer' : 'S\'inscrire'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Provider Onboarding */}
        {step === 3 && (
          <ProviderOnboarding
            data={{
              description: formData.description,
              experience: formData.experience,
              hourlyRate: formData.hourlyRate,
              selectedTrades: formData.selectedTrades,
              skills: formData.skills,
              serviceZones: formData.serviceZones,
              avatar: formData.avatar,
              profession: formData.profession,
              categoryIds: formData.categoryIds,
              subcategoryIds: formData.subcategoryIds,
            }}
            onChange={updateProviderData}
            onComplete={handleProviderOnboardingComplete}
            onBack={handleProviderOnboardingBack}
            isLoading={isLoading}
            error={error}
            country={formData.country}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
