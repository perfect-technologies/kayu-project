"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Plus, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  availableDates?: Date[];
  bookings?: Array<{
    id: string;
    date: Date;
    time: string;
    service: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  }>;
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function BookingCalendar({
  onDateSelect,
  selectedDate,
  availableDates = [],
  bookings = [],
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | undefined>(selectedDate);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasBooking = (date: Date) => {
    return bookings.some(booking => isSameDay(booking.date, date));
  };

  const handleDateClick = (date: Date) => {
    if (isPast(date)) return;
    setInternalSelectedDate(date);
    onDateSelect?.(date);
  };

  const days = getDaysInMonth(currentMonth);

  const selectedDateBookings = internalSelectedDate
    ? bookings.filter(b => isSameDay(b.date, internalSelectedDate))
    : [];

  return (
    <Card className="kayou-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="h-10" />;

            const isSelected = internalSelectedDate && isSameDay(day, internalSelectedDate);
            const isTodayDate = isToday(day);
            const isPastDate = isPast(day);
            const hasBookingOnDay = hasBooking(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={isPastDate}
                className={cn(
                  "h-10 rounded-lg text-sm font-medium transition-all relative",
                  "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                  isTodayDate && !isSelected && "border-2 border-primary",
                  isPastDate && "text-muted-foreground/50 cursor-not-allowed",
                  hasBookingOnDay && !isSelected && "bg-primary/10"
                )}
              >
                {day.getDate()}
                {hasBookingOnDay && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {internalSelectedDate && selectedDateBookings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-2">
              Réservations du {internalSelectedDate.getDate()} {MONTHS[internalSelectedDate.getMonth()]}
            </h4>
            <div className="space-y-2">
              {selectedDateBookings.map(booking => (
                <div key={booking.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{booking.time}</span>
                  <span className="text-sm text-muted-foreground">{booking.service}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-auto text-xs",
                      booking.status === 'confirmed' && "bg-green-100 text-green-700",
                      booking.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      booking.status === 'completed' && "bg-blue-100 text-blue-700",
                      booking.status === 'cancelled' && "bg-red-100 text-red-700"
                    )}
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {internalSelectedDate && !isPast(internalSelectedDate) && (
          <Button variant="outline" className="w-full mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un rappel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Booking Filters Component
export function BookingFilters({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}) {
  const filters = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'Actifs' },
    { id: 'completed', label: 'Terminés' },
    { id: 'cancelled', label: 'Annulés' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map(filter => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "rounded-full px-4",
            activeFilter === filter.id && "bg-primary text-primary-foreground"
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

// Booking Card Component
export function BookingCard({
  booking,
}: {
  booking: {
    id: string;
    service: string;
    provider: { name: string; avatar?: string };
    date: string;
    time: string;
    price: number;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    rating?: number;
  };
}) {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    in_progress: 'Confirmé',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };

  return (
    <Card className="kayou-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {booking.provider.avatar ? (
                <img src={booking.provider.avatar} alt={booking.provider.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{booking.service}</h4>
              <p className="text-sm text-muted-foreground">{booking.provider.name}</p>
            </div>
          </div>
          <Badge className={statusStyles[booking.status]}>
            {statusLabels[booking.status]}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{booking.date}</span>
          </div>
          <span>{booking.time}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-xs text-muted-foreground">Montant</span>
            <p className="font-bold text-primary">{booking.price.toLocaleString()} CDF</p>
          </div>

          {booking.status === 'completed' && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    booking.rating && star <= booking.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          )}

          {booking.status === 'pending' && (
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BookingCalendar;
