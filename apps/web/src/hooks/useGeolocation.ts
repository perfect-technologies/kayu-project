"use client";

import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationReturn extends LocationState {
  requestLocation: () => void;
  hasPermission: boolean | null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "La géolocalisation n'est pas supportée par votre navigateur",
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
        setHasPermission(true);
        
        // Save to localStorage for persistence
        localStorage.setItem('kayou_user_location', JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        }));
      },
      (error) => {
        let errorMessage = "Impossible d'obtenir votre position";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission de géolocalisation refusée";
            setHasPermission(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position non disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Délai d'attente dépassé";
            break;
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  // Load cached location on mount
  useEffect(() => {
    const cached = localStorage.getItem('kayou_user_location');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Use cache if less than 30 minutes old
        if (Date.now() - parsed.timestamp < 1800000) {
          setState({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            error: null,
            loading: false,
          });
          setHasPermission(true);
          return;
        }
      } catch {
        // Invalid cache
      }
    }
  }, []);

  return {
    ...state,
    requestLocation,
    hasPermission,
  };
}

// Utility function to calculate distance client-side (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Get distance color based on proximity
export function getDistanceColor(distanceKm: number): string {
  if (distanceKm <= 2) return 'text-emerald-600';
  if (distanceKm <= 10) return 'text-amber-600';
  return 'text-rose-600';
}

export function getDistanceBg(distanceKm: number): string {
  if (distanceKm <= 2) return 'bg-emerald-50 border-emerald-200';
  if (distanceKm <= 10) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-200';
}
