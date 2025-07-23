import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationState {
  location: LocationCoords | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: true,
    error: null,
    hasPermission: false,
  });

  // Ubicación específica del usuario en Quito, Ecuador
  const defaultEcuadorLocation: LocationCoords = {
    latitude: -0.311655,
    longitude: -78.545162,
    accuracy: 50, // Alta precisión para ubicación específica
  };

  const requestLocation = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('🌍 Solicitando permisos de ubicación...');

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ Permiso denegado, usando ubicación por defecto en Ecuador');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Usando ubicación por defecto en Quito, Ecuador',
          hasPermission: false,
          location: defaultEcuadorLocation,
        }));
        return;
      }

      setState(prev => ({ ...prev, hasPermission: true }));

      console.log('✅ Permisos concedidos, obteniendo ubicación...');

      // Obtener ubicación actual con configuración optimizada para móviles
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Cambiado de High a Balanced para mejor compatibilidad
        timeInterval: 5000, // Intentar por 5 segundos
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      };

      console.log('📍 Ubicación obtenida:', userLocation);

      // Verificar si la ubicación está en Ecuador (aproximadamente)
      const isInEcuador = 
        userLocation.latitude >= -5 && userLocation.latitude <= 2 &&
        userLocation.longitude >= -92 && userLocation.longitude <= -75;

      if (!isInEcuador) {
        console.log('⚠️  Ubicación fuera de Ecuador, usando ubicación por defecto');
        setState(prev => ({
          ...prev,
          location: defaultEcuadorLocation,
          isLoading: false,
          error: 'Ubicación detectada fuera de Ecuador. Usando Quito como referencia.',
        }));
      } else {
        setState(prev => ({
          ...prev,
          location: userLocation,
          isLoading: false,
          error: null,
        }));
      }

    } catch (error: any) {
      console.error('❌ Error getting location:', error);
      console.log('🔄 Usando ubicación por defecto en Ecuador');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Usando ubicación por defecto en Quito, Ecuador',
        location: defaultEcuadorLocation,
      }));
    }
  };

  const watchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setState(prev => ({
          ...prev,
          error: 'Permiso de ubicación denegado',
          hasPermission: false,
        }));
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Actualizar cada 10 segundos
          distanceInterval: 100, // O cuando se mueva 100 metros
        },
        (location) => {
          setState(prev => ({
            ...prev,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || undefined,
            },
            isLoading: false,
            error: null,
          }));
        }
      );

      return subscription;
    } catch (error: any) {
      console.error('Error watching location:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al monitorear ubicación',
      }));
      return null;
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return {
    ...state,
    requestLocation,
    watchLocation,
  };
};
