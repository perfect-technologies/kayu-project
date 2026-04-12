'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Camera,
  X,
  Plus,
  MapPin,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { categoriesApi } from '@kayu/api';

// Types
interface Trade {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | null;
  duration: number | null;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  trades: Trade[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description?: string | null;
  subcategories: Subcategory[];
}

export interface SelectedTrade {
  tradeId: string;
  tradeName: string;
  subcategoryName: string;
  categoryName: string;
  isPrimary: boolean;
}

export interface ProviderOnboardingData {
  description: string;
  experience: number | null;
  hourlyRate: number | null;
  selectedTrades: SelectedTrade[];
  skills: string[];
  serviceZones: { city: string; commune: string }[];
  avatar: string | null;
  // Legacy fields for backward compatibility
  profession: string;
  categoryIds: string[];
  subcategoryIds: string[];
}

interface ProviderOnboardingProps {
  data: ProviderOnboardingData;
  onChange: (data: Partial<ProviderOnboardingData>) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
  country: string;
}

// Common cities and communes
const rdcCities = ['Kinshasa', 'Lubumbashi', 'Goma', 'Mbuji-Mayi', 'Kisangani', 'Matadi', 'Boma', 'Likasi', 'Kolwezi'];
const cgCities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Impfondo'];
const kinshasaCommunes = [
  'Gombe', 'Ngaliema', 'Limete', 'Barumbu', 'Kintambo', 'Bandalungwa',
  'Kalamu', 'Kasavubu', 'Makala', 'Matonge', 'Ngaba', 'Selembao',
  'Bumbu', 'Kimbanseke', 'Maluku', 'Masina', 'Nsele', 'Lemba'
];
const brazzavilleCommunes = [
  'Bacongo', 'Mfilou', 'Madibou', 'Poto-Poto', 'Moungali', 'Ouenzé',
  'Talangaï', 'Makélékélé', 'Djiri'
];

const skillSuggestions = [
  'Travail soigné', 'Rapidité', 'Disponible week-end', 'Urgences',
  'Devis gratuit', 'Déplacement possible', 'Matériel fourni',
  'Première visite gratuite', 'Garantie incluse', 'Paiement mobile',
];

const MAX_TRADES = 3;
const TOTAL_STEPS = 4;

export function ProviderOnboarding({
  data,
  onChange,
  onComplete,
  onBack,
  isLoading,
  error,
  country,
}: ProviderOnboardingProps) {
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [newSkill, setNewSkill] = useState('');
  const [newZoneCity, setNewZoneCity] = useState('');
  const [newZoneCommune, setNewZoneCommune] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories using @kayu/api
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await categoriesApi(apiClient).getHierarchy();
        const cats = Array.isArray(result) ? result : (result as any).categories ?? [];
        setCategories(cats as unknown as Category[]);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const availableCommunes = useMemo(() => {
    if (newZoneCity === 'Kinshasa') return kinshasaCommunes;
    if (newZoneCity === 'Brazzaville') return brazzavilleCommunes;
    return [];
  }, [newZoneCity]);

  const availableCities = useMemo(() => {
    return country === 'RDC' ? rdcCities : cgCities;
  }, [country]);

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory) return null;
    return selectedCategory.subcategories.find(s => s.id === selectedSubcategoryId);
  }, [selectedCategory, selectedSubcategoryId]);

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const validateStep1 = (): boolean => {
    setStepError('');
    return true;
  };

  const validateStep2 = (): boolean => {
    if (data.selectedTrades.length === 0) {
      setStepError('Veuillez sélectionner au moins un métier');
      return false;
    }
    setStepError('');
    return true;
  };

  const validateStep3 = (): boolean => {
    setStepError('');
    return true;
  };

  const validateStep4 = (): boolean => {
    setStepError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    } else if (step === 4 && validateStep4()) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setStepError('');
    } else {
      onBack();
    }
  };

  const handleAddTrade = (trade: Trade) => {
    if (data.selectedTrades.length >= MAX_TRADES) {
      setStepError(`Vous ne pouvez sélectionner que ${MAX_TRADES} métiers maximum`);
      return;
    }

    if (data.selectedTrades.some(t => t.tradeId === trade.id)) {
      return;
    }

    const newTrade: SelectedTrade = {
      tradeId: trade.id,
      tradeName: trade.name,
      subcategoryName: selectedSubcategory?.name || '',
      categoryName: selectedCategory?.name || '',
      isPrimary: data.selectedTrades.length === 0,
    };

    onChange({
      selectedTrades: [...data.selectedTrades, newTrade],
      profession: data.selectedTrades.length === 0 ? trade.name : data.profession,
    });
    setStepError('');
  };

  const handleRemoveTrade = (tradeId: string) => {
    const newTrades = data.selectedTrades.filter(t => t.tradeId !== tradeId);

    if (newTrades.length > 0 && !newTrades.some(t => t.isPrimary)) {
      newTrades[0].isPrimary = true;
    }

    onChange({
      selectedTrades: newTrades,
      profession: newTrades.length > 0 ? newTrades.find(t => t.isPrimary)?.tradeName || newTrades[0].tradeName : '',
    });
  };

  const handleAddSkill = (skill?: string) => {
    const skillToAdd = skill || newSkill.trim();
    if (skillToAdd && !data.skills.includes(skillToAdd)) {
      onChange({ skills: [...data.skills, skillToAdd] });
      setNewSkill('');
      setShowSkillSuggestions(false);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    onChange({ skills: data.skills.filter(s => s !== skill) });
  };

  const handleAddServiceZone = () => {
    if (newZoneCity && newZoneCommune) {
      const exists = data.serviceZones.some(
        z => z.city === newZoneCity && z.commune === newZoneCommune
      );
      if (!exists) {
        onChange({
          serviceZones: [...data.serviceZones, { city: newZoneCity, commune: newZoneCommune }]
        });
        setNewZoneCommune('');
      }
    }
  };

  const handleRemoveServiceZone = (city: string, commune: string) => {
    onChange({
      serviceZones: data.serviceZones.filter(z => !(z.city === city && z.commune === commune))
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStepError('La photo ne doit pas dépasser 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ avatar: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    onChange({ avatar: null });
  };

  const stepTitles = [
    'Informations professionnelles',
    'Vos métiers',
    'Compétences & Zones',
    'Photo de profil'
  ];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Étape {step} sur {TOTAL_STEPS}</span>
          <span className="text-muted-foreground">{stepTitles[step - 1]}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between">
          {stepTitles.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1 text-xs',
                index + 1 <= step ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                  index + 1 < step
                    ? 'bg-primary text-primary-foreground'
                    : index + 1 === step
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {index + 1 < step ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {(stepError || error) && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{stepError || error}</span>
        </div>
      )}

      {/* Step 1: Professional Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Briefcase className="h-10 w-10 mx-auto text-primary mb-2" />
            <h3 className="font-semibold text-lg">Complétez votre profil</h3>
            <p className="text-sm text-muted-foreground">
              Ces informations aideront les clients à mieux vous connaître
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Années d&apos;expérience
            </Label>
            <Select
              value={data.experience?.toString() || ''}
              onValueChange={(value) => onChange({ experience: value ? parseInt(value) : null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Moins d&apos;un an</SelectItem>
                <SelectItem value="1">1 an</SelectItem>
                <SelectItem value="2">2 ans</SelectItem>
                <SelectItem value="3">3 ans</SelectItem>
                <SelectItem value="5">5 ans</SelectItem>
                <SelectItem value="10">10 ans et plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Tarif horaire (CDF)
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              placeholder="Ex: 5000"
              value={data.hourlyRate || ''}
              onChange={(e) => onChange({ hourlyRate: e.target.value ? parseFloat(e.target.value) : null })}
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Indiquez votre tarif de base (optionnel)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description de vos services
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre activité, vos spécialités, ce qui vous distingue..."
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {data.description.length}/500 caractères
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Trade Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Briefcase className="h-10 w-10 mx-auto text-primary mb-2" />
            <h3 className="font-semibold text-lg">Sélectionnez vos métiers</h3>
            <p className="text-sm text-muted-foreground">
              Choisissez jusqu&apos;à {MAX_TRADES} métiers que vous exercez
            </p>
          </div>

          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {data.selectedTrades.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <Label className="text-sm font-medium">Métiers sélectionnés ({data.selectedTrades.length}/{MAX_TRADES})</Label>
                  <div className="flex flex-wrap gap-2">
                    {data.selectedTrades.map((trade) => (
                      <Badge
                        key={trade.tradeId}
                        variant={trade.isPrimary ? 'default' : 'secondary'}
                        className={cn(
                          'flex items-center gap-1 py-1 px-3',
                          trade.isPrimary && 'ring-2 ring-primary ring-offset-1'
                        )}
                      >
                        {trade.isPrimary && <span className="text-xs mr-1">★</span>}
                        {trade.tradeName}
                        <button
                          type="button"
                          onClick={() => handleRemoveTrade(trade.tradeId)}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {data.selectedTrades.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Cliquez sur un métier pour le définir comme principal (★)
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    setSelectedSubcategoryId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategory && (
                <div className="space-y-2">
                  <Label>Sous-catégorie</Label>
                  <Select
                    value={selectedSubcategoryId}
                    onValueChange={setSelectedSubcategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory.subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedSubcategory && selectedSubcategory.trades.length > 0 && (
                <div className="space-y-2">
                  <Label>Métiers disponibles</Label>
                  <p className="text-xs text-muted-foreground">
                    Cliquez pour ajouter un métier
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSubcategory.trades.map((trade) => {
                      const isSelected = data.selectedTrades.some(t => t.tradeId === trade.id);
                      return (
                        <div
                          key={trade.id}
                          onClick={() => !isSelected && handleAddTrade(trade)}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-all',
                            isSelected
                              ? 'bg-muted border-muted cursor-not-allowed opacity-50'
                              : 'hover:border-primary hover:bg-primary/5'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{trade.name}</span>
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : (
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {trade.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {trade.description}
                            </p>
                          )}
                          {trade.basePrice && (
                            <p className="text-xs text-primary mt-1">
                              À partir de {trade.basePrice.toLocaleString()} CDF
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedSubcategory && selectedSubcategory.trades.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Aucun métier disponible dans cette sous-catégorie</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3: Skills & Service Zones */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Compétences
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une compétence..."
                value={newSkill}
                onChange={(e) => {
                  setNewSkill(e.target.value);
                  setShowSkillSuggestions(true);
                }}
                onFocus={() => setShowSkillSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleAddSkill()}
                disabled={!newSkill.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showSkillSuggestions && (
              <div className="flex flex-wrap gap-2">
                {skillSuggestions
                  .filter(s => !data.skills.includes(s))
                  .slice(0, 6)
                  .map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => handleAddSkill(suggestion)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {suggestion}
                    </Badge>
                  ))}
              </div>
            )}

            {data.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zones d&apos;intervention
            </Label>
            <p className="text-sm text-muted-foreground">
              Ajoutez les villes et communes où vous offrez vos services
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={newZoneCity} onValueChange={setNewZoneCity}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newZoneCommune}
                onValueChange={setNewZoneCommune}
                disabled={!newZoneCity}
              >
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Commune" />
                </SelectTrigger>
                <SelectContent>
                  {availableCommunes.map((commune) => (
                    <SelectItem key={commune} value={commune}>
                      {commune}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddServiceZone}
                disabled={!newZoneCity || !newZoneCommune}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {data.serviceZones.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.serviceZones.map((zone) => (
                  <Badge
                    key={`${zone.city}-${zone.commune}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {zone.commune}, {zone.city}
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceZone(zone.city, zone.commune)}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Profile Photo & Summary */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div
                onClick={handlePhotoClick}
                className={cn(
                  'w-32 h-32 rounded-full overflow-hidden border-2 cursor-pointer',
                  'hover:border-primary transition-colors flex items-center justify-center',
                  'bg-muted',
                  data.avatar ? 'border-primary' : 'border-dashed border-muted-foreground/30'
                )}
              >
                {data.avatar ? (
                  <img
                    src={data.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="h-8 w-8" />
                    <span className="text-xs">Ajouter une photo</span>
                  </div>
                )}
              </div>
              {data.avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">Photo de profil</p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG. Maximum 5 MB
              </p>
            </div>

            {!data.avatar && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePhotoClick}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Choisir une photo
              </Button>
            )}
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Récapitulatif de votre profil
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Métier principal:</span>
                  <span className="font-medium">
                    {data.selectedTrades.find(t => t.isPrimary)?.tradeName || data.selectedTrades[0]?.tradeName || 'Non défini'}
                  </span>
                </div>
                {data.selectedTrades.length > 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Autres métiers:</span>
                    <span className="font-medium">
                      {data.selectedTrades.filter(t => !t.isPrimary).map(t => t.tradeName).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expérience:</span>
                  <span className="font-medium">
                    {data.experience !== null
                      ? data.experience === 0
                        ? 'Moins d\'un an'
                        : `${data.experience} an${data.experience > 1 ? 's' : ''}`
                      : 'Non spécifié'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarif:</span>
                  <span className="font-medium">
                    {data.hourlyRate ? `${data.hourlyRate.toLocaleString()} CDF/h` : 'Non spécifié'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compétences:</span>
                  <span className="font-medium">
                    {data.skills.length > 0
                      ? `${data.skills.length} ajoutée${data.skills.length > 1 ? 's' : ''}`
                      : 'Aucune'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zones:</span>
                  <span className="font-medium">
                    {data.serviceZones.length > 0
                      ? `${data.serviceZones.length} zone${data.serviceZones.length > 1 ? 's' : ''}`
                      : 'Aucune'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              💡 Vous pourrez modifier ces informations et compléter votre profil depuis votre tableau de bord.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={isLoading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1 gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Inscription...
            </>
          ) : step === TOTAL_STEPS ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Terminer l&apos;inscription
            </>
          ) : (
            <>
              Continuer
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
