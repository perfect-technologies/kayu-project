'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Check,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { categoriesApi } from '@kayu/api';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  subcategories: Subcategory[];
}

interface ProfessionSelectionProps {
  value: string;
  onChange: (value: string) => void;
  selectedCategoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
  disabled?: boolean;
}

const commonProfessions = [
  'Plombier', 'Électricien', 'Menuisier', 'Maçon', 'Peintre', 'Couturier',
  'Coiffeur', 'Mécanicien', 'Jardinier', 'Agent de ménage', 'Cuisinier',
  'Photographe', 'Développeur', 'Designer', 'Chauffeur', 'Électricien auto',
  'Climaticien', 'Serrurier', 'Plâtrier', 'Carreleur', 'Terrassier',
  'Architecte', 'Infirmier', 'Kinésithérapeute', 'Coach sportif',
  'Professeur particulier', 'Musicien', 'DJ', 'Décorateur', 'Esthéticienne',
  'Manucure', 'Baby-sitter', 'Nounou', 'Traiteur', 'Pâtissier',
];

export function ProfessionSelection({
  value,
  onChange,
  selectedCategoryIds,
  onCategoryChange,
  disabled,
}: ProfessionSelectionProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories using @kayu/api
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await categoriesApi(apiClient).getAll();
        if (result.categories) {
          setCategories(result.categories as unknown as Category[]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const filteredProfessions = useMemo(() => {
    if (!searchQuery) return commonProfessions;
    return commonProfessions.filter((prof) =>
      prof.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subcategories.some((sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [categories, searchQuery]);

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onCategoryChange(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategoryIds, categoryId]);
    }
  };

  const handleProfessionSelect = (profession: string) => {
    onChange(profession);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Profession Input with Dropdown */}
      <div className="space-y-2">
        <Label>Votre profession *</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between h-auto min-h-9 py-2"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                {value || (
                  <span className="text-muted-foreground">
                    Sélectionnez ou entrez votre profession
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Rechercher une profession..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-64">
                <CommandEmpty>
                  <div className="p-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Profession non trouvée ?
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleProfessionSelect(searchQuery)}
                    >
                      Utiliser &quot;{searchQuery}&quot;
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup heading="Professions courantes">
                  {filteredProfessions.slice(0, 10).map((profession) => (
                    <CommandItem
                      key={profession}
                      value={profession}
                      onSelect={() => handleProfessionSelect(profession)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === profession ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {profession}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Custom profession input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ou entrez une profession personnalisée"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-3">
        <Label>Catégories de services (optionnel)</Label>
        <p className="text-xs text-muted-foreground">
          Sélectionnez les catégories correspondant à vos services pour être
          mieux référencé
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-2 py-1"
              >
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategoryIds.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  disabled={disabled}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Selected Categories Display */}
        {selectedCategoryIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategoryIds.map((categoryId) => {
              const category = categories.find((c) => c.id === categoryId);
              return category ? (
                <Badge
                  key={categoryId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {category.name}
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
