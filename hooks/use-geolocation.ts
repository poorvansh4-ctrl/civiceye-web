"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  permissionState: "prompt" | "granted" | "denied" | "unknown";
  autoDetected: boolean;
}

interface UseGeolocationReturn extends GeolocationState {
  detectLocation: () => void;
  resetLocation: () => void;
  hasAttempted: boolean;
}

const GEOLOCATION_TIMEOUT = 15000;
const GEOLOCATION_MAX_AGE = 0;

interface ReverseGeocodeResult {
  readable: string;
  displayName: string | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const a = data.address || {};
    const locality =
      a.neighbourhood ||
      a.suburb ||
      a.village ||
      a.town ||
      a.city_district ||
      a.city ||
      a.county ||
      a.state_district ||
      a.municipality ||
      a.region;
    const city = a.city || a.town || a.village || a.county;
    const state = a.state;

    let readable = "";
    if (locality && city && locality.toLowerCase() !== city.toLowerCase()) {
      readable = `${locality}, ${city}`;
    } else if (locality) {
      readable = locality;
    } else if (city) {
      readable = city;
    }
    if (state && city && !readable.toLowerCase().includes(state.toLowerCase())) {
      readable = readable ? `${readable}, ${state}` : state;
    }
    if (!readable) {
      readable = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    return {
      readable,
      displayName: data.display_name || null,
    };
  } catch {
    return null;
  }
}

export function useGeolocation(autoDetect = false): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    loading: false,
    error: null,
    permissionState: "unknown",
    autoDetected: false,
  });

  const isRunningRef = useRef(false);

  const [hasAttempted, setHasAttempted] = useState(false);

  const resetLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      address: null,
      loading: false,
      error: null,
      permissionState: "unknown",
      autoDetected: false,
    });
    setHasAttempted(false);
  }, []);

  const performDetection = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
        loading: false,
      }));
      return;
    }

    if (isRunningRef.current) return;
    isRunningRef.current = true;

    queueMicrotask(() => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    });

    const finalize = () => {
      isRunningRef.current = false;
    };

    const successHandler = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setState((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        loading: false,
        error: null,
        permissionState: "granted",
      }));

      try {
        const result = await reverseGeocode(lat, lng);
        const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const readable = result?.readable || fallback;
        setState((prev) => ({
          ...prev,
          address: readable,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        }));
      }

      finalize();
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage: string;
      let permState: "prompt" | "granted" | "denied" | "unknown" = "unknown";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission was denied. Please allow location access in your browser and try again.";
          permState = "denied";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Your location is currently unavailable. Please try again.";
          break;
        case error.TIMEOUT:
          errorMessage = "Location detection timed out. Please try again.";
          break;
        default:
          errorMessage = "An unknown error occurred while detecting your location.";
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionState: permState,
      }));

      finalize();
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: GEOLOCATION_TIMEOUT,
      maximumAge: GEOLOCATION_MAX_AGE,
    });
  }, []);

  const detectLocation = useCallback(() => {
    setHasAttempted(true);
    performDetection();
  }, [performDetection]);

  useEffect(() => {
    if (!autoDetect) return;
    if (hasAttempted) return;
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasAttempted(true);

    if (typeof navigator.permissions !== "undefined") {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted" || result.state === "prompt") {
          performDetection();
        } else if (result.state === "denied") {
          setState((prev) => ({
            ...prev,
            error: "Location permission was denied. Please allow location access in your browser and try again.",
            permissionState: "denied",
          }));
        }
      }).catch(() => {
        performDetection();
      });
    } else {
      performDetection();
    }
  }, [autoDetect, performDetection, hasAttempted]);

  return {
    latitude: state.latitude,
    longitude: state.longitude,
    address: state.address,
    loading: state.loading,
    error: state.error,
    permissionState: state.permissionState,
    autoDetected: state.autoDetected,
    detectLocation,
    resetLocation,
    hasAttempted,
  };
}
