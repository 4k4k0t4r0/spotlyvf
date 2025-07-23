// src/hooks/useUserRole.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../data/apiClient';
import { businessApi } from '../data/businessApi';

export type UserRole = 'USER' | 'BUSINESS' | null;

interface UserData {
  role?: string;
  user_type?: string;
  email?: string;
  id?: number;
}

interface BusinessDashboardData {
  has_places?: boolean;
  pending_claims?: number;
  stats?: any;
}

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasClaims, setHasClaims] = useState(false);
  const [hasPlaces, setHasPlaces] = useState(false);

  const checkUserRole = async () => {
    try {
      setIsLoading(true);
      
      // Primero verificar si tenemos un token
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setUserRole('USER');
        setIsLoading(false);
        return;
      }

      // Obtener información del usuario directamente
      try {
        const response = await apiClient.getDirect('/auth/user-info/') as any;
        const userInfo = response?.user || response; // Manejar ambos formatos
        
        // Verificar el rol del usuario desde la respuesta
        const actualRole = userInfo?.role || userInfo?.user_type || 'USER';
        
        console.log('👤 Información del usuario obtenida:', {
          role: actualRole,
          email: userInfo?.email,
          id: userInfo?.id,
          fullResponse: response
        });
        
        if (actualRole === 'BUSINESS') {
          // Es usuario de negocio, obtener información adicional
          try {
            const dashboardData = await businessApi.getDashboard() as BusinessDashboardData;
            setUserRole('BUSINESS');
            setHasPlaces(dashboardData?.has_places || false);
            setHasClaims((dashboardData?.pending_claims || 0) > 0);
            
            console.log('✅ Usuario de negocio confirmado:', {
              hasPlaces: dashboardData?.has_places,
              pendingClaims: dashboardData?.pending_claims
            });
          } catch (dashboardError) {
            // Aunque falle el dashboard, si el rol es BUSINESS, mantenerlo
            console.log('⚠️ Error obteniendo dashboard, pero usuario es BUSINESS:', dashboardError);
            setUserRole('BUSINESS');
            setHasPlaces(false);
            setHasClaims(false);
          }
        } else {
          // Es usuario normal
          setUserRole('USER');
          setHasPlaces(false);
          setHasClaims(false);
          console.log('✅ Usuario normal confirmado');
        }
        
      } catch (userInfoError: any) {
        console.log('❌ Error obteniendo información del usuario:', userInfoError);
        
        // Fallback: intentar con el método anterior pero con mejor lógica
        try {
          const dashboardData = await businessApi.getDashboard() as BusinessDashboardData;
          
          // Solo considerar BUSINESS si el dashboard indica que realmente es un negocio
          // O si tiene lugares reclamados
          if (dashboardData?.has_places || (dashboardData?.pending_claims || 0) > 0) {
            setUserRole('BUSINESS');
            setHasPlaces(dashboardData?.has_places || false);
            setHasClaims((dashboardData?.pending_claims || 0) > 0);
            console.log('✅ Usuario detectado como BUSINESS (fallback)');
          } else {
            // Si el dashboard responde pero no indica actividad de negocio, es USER
            setUserRole('USER');
            setHasPlaces(false);
            setHasClaims(false);
            console.log('✅ Usuario detectado como USER (dashboard vacío)');
          }
          
        } catch (dashboardError: any) {
          // Si falla el dashboard, es un usuario normal
          console.log('✅ Usuario detectado como USER (sin acceso a dashboard)');
          setUserRole('USER');
          setHasPlaces(false);
          setHasClaims(false);
        }
      }
      
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('USER'); // Default a usuario normal en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRole = () => {
    checkUserRole();
  };

  useEffect(() => {
    checkUserRole();
  }, []);

  const isBusinessUser = userRole === 'BUSINESS';
  const isNormalUser = userRole === 'USER';
  const isBusinessWithPlaces = isBusinessUser && hasPlaces;
  const isBusinessWithoutPlaces = isBusinessUser && !hasPlaces;

  return {
    userRole,
    isLoading,
    isBusinessUser,
    isNormalUser,
    isBusinessWithPlaces,
    isBusinessWithoutPlaces,
    hasClaims,
    hasPlaces,
    refreshRole,
  };
};
