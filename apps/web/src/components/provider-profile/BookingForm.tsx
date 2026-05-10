"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Clock,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "@/lib/api";
import { bookingsApi } from "@kayu/api";
import { useMutation } from "@tanstack/react-query";

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: {
    id: string;
    userId: string;
    profession: string;
    hourlyRate?: number | null;
    user: {
      firstName: string;
      lastName: string;
      city?: string | null;
    };
    serviceZones: Array<{
      city: string;
      commune?: string | null;
    }>;
  };
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

export function BookingForm({
  open,
  onOpenChange,
  provider,
  isAuthenticated,
  onLoginRequired,
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("1");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(provider.user.city || "");
  const [notes, setNotes] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CD", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const hourlyRate = provider.hourlyRate || 0;
  const durationHours = parseFloat(duration);
  const estimatedPrice = hourlyRate * durationHours;

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  const durationOptions = [
    { value: "1", label: "1 heure" },
    { value: "1.5", label: "1h30" },
    { value: "2", label: "2 heures" },
    { value: "3", label: "3 heures" },
    { value: "4", label: "4 heures" },
    { value: "8", label: "Journée complète (8h)" },
  ];

  // Get unique cities from service zones
  const availableCities = [...new Set(provider.serviceZones.map((z) => z.city))];

  const createBooking = useMutation({
    mutationFn: (payload: Parameters<ReturnType<typeof bookingsApi>["create"]>[0]) =>
      bookingsApi(apiClient).create(payload),
    onSuccess: (result) => {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
        router.push(`/bookings/${result.booking.id}`);
      }, 2000);
    },
    onError: (error: Error) => {
      alert(error.message || "Erreur lors de la réservation");
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    if (!title || !date || !time || !address) {
      return;
    }

    const scheduledDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    scheduledDate.setHours(hours, minutes, 0, 0);

    createBooking.mutate({
      providerId: provider.id,
      title,
      description,
      address,
      city,
      scheduledDate: scheduledDate,
      duration: durationHours * 60, // in minutes
      price: estimatedPrice,
      clientNotes: notes,
    });
  };

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setDescription("");
    setDate(undefined);
    setTime("");
    setDuration("1");
    setAddress("");
    setCity(provider.user.city || "");
    setNotes("");
    setSuccess(false);
  };

  const canProceedStep1 = title.trim().length > 0;
  const canProceedStep2 = date && time && address.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réserver {provider.user.firstName} {provider.user.lastName}</DialogTitle>
          <DialogDescription>
            {provider.profession}
            {hourlyRate > 0 && (
              <span className="ml-2">• À partir de {formatPrice(hourlyRate)} FC/heure</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Réservation envoyée!</h3>
            <p className="text-muted-foreground text-center">
              Votre demande a été envoyée au prestataire. Vous allez être redirigé vers la réservation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1.5 rounded-full ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Service Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre du service *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Réparation plomberie"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description du travail</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez le travail à effectuer..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                >
                  Continuer
                </Button>
              </div>
            )}

            {/* Step 2: Date, Time & Location */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1.5"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "d MMMM yyyy", { locale: fr }) : "Choisir"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(d) => d < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Heure *</Label>
                    <Select value={time} onValueChange={setTime}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Choisir">
                          {time && (
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {time}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Durée estimée</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse complète"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.length > 0 ? (
                        availableCities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={city}>{city}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Retour
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!canProceedStep2}
                    onClick={() => setStep(3)}
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Summary & Confirm */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Résumé de la réservation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium">{title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{date && format(date, "d MMMM yyyy", { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heure:</span>
                      <span>{time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée:</span>
                      <span>{durationOptions.find(o => o.value === duration)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adresse:</span>
                      <span className="text-right max-w-[60%]">{address}, {city}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes supplémentaires</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informations complémentaires..."
                    className="mt-1.5"
                    rows={2}
                  />
                </div>

                {estimatedPrice > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Prix estimé</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(estimatedPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">CDF</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Le prix final sera confirmé après discussion avec le prestataire.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Retour
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={handleSubmit}
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Confirmer la réservation
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
