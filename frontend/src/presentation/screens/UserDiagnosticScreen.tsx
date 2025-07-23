import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserRole } from '../../hooks/useUserRole';
import { apiClient } from '../../data/apiClient';

interface UserDiagnosticScreenProps {
  navigation: any;
}

export const UserDiagnosticScreen: React.FC<UserDiagnosticScreenProps> = ({ navigation }) => {
  const [diagnosticData, setDiagnosticData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { userRole, isBusinessUser, isNormalUser, isLoading: roleLoading } = useUserRole();

  const runDiagnostic = async () => {
    setIsLoading(true);
    
    try {
      const diagnostic = {
        // 1. Datos del hook
        hookData: {
          userRole,
          isBusinessUser,
          isNormalUser,
          roleLoading
        },
        
        // 2. Datos de AsyncStorage
        asyncStorageData: {} as any,
        
        // 3. Datos de la API
        apiData: {} as any,
        
        // 4. Estado de navegación
        navigationState: {},
      };

      // Verificar AsyncStorage
      try {
        const authToken = await AsyncStorage.getItem('auth_token');
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        const userData = await AsyncStorage.getItem('user_data');
        
        diagnostic.asyncStorageData = {
          hasAuthToken: !!authToken,
          hasRefreshToken: !!refreshToken,
          userData: userData ? JSON.parse(userData) : null,
          authTokenLength: authToken ? authToken.length : 0,
        };
      } catch (error) {
        diagnostic.asyncStorageData.error = error;
      }

      // Verificar datos de la API
      try {
        const userInfo = await apiClient.getDirect('/auth/user-info/');
        diagnostic.apiData.userInfo = userInfo;
      } catch (error) {
        diagnostic.apiData.userInfoError = error;
      }

      // Probar acceso al dashboard de negocio
      try {
        const dashboardData = await apiClient.getDirect('/places/business/dashboard/');
        diagnostic.apiData.businessDashboard = dashboardData;
        diagnostic.apiData.hasBusinessAccess = true;
      } catch (error) {
        diagnostic.apiData.businessDashboardError = error;
        diagnostic.apiData.hasBusinessAccess = false;
      }

      // Probar acceso a reservas de usuario
      try {
        const userReservations = await apiClient.getDirect('/places/reservations/');
        diagnostic.apiData.userReservations = userReservations;
        diagnostic.apiData.hasUserReservationAccess = true;
      } catch (error) {
        diagnostic.apiData.userReservationsError = error;
        diagnostic.apiData.hasUserReservationAccess = false;
      }

      setDiagnosticData(diagnostic);
    } catch (error) {
      Alert.alert('Error', 'Error ejecutando diagnóstico');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDiagnosticSection = (title: string, data: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        <Text style={styles.dataText}>{JSON.stringify(data, null, 2)}</Text>
      </View>
    </View>
  );

  const switchUserRole = async () => {
    Alert.alert(
      'Cambiar Rol de Usuario',
      '¿Quieres cambiar tu rol de usuario? Esto puede ayudar a resolver problemas de permisos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cambiar a Usuario Normal',
          onPress: async () => {
            try {
              // Llamar endpoint para cambiar rol (si existe)
              await apiClient.postDirect('/auth/change-role/', { role: 'USER' });
              Alert.alert('Éxito', 'Rol cambiado a Usuario Normal. Reinicia la app.');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cambiar el rol');
            }
          }
        },
        {
          text: 'Cambiar a Negocio',
          onPress: async () => {
            try {
              await apiClient.postDirect('/auth/change-role/', { role: 'BUSINESS' });
              Alert.alert('Éxito', 'Rol cambiado a Negocio. Reinicia la app.');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cambiar el rol');
            }
          }
        },
      ]
    );
  };

  const clearCacheAndRestart = async () => {
    Alert.alert(
      'Limpiar Caché',
      'Esto eliminará todos los datos locales y te enviará a la pantalla de login.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.getParent()?.navigate('Login');
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar el caché');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4299E1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diagnóstico de Usuario</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.quickInfo}>
            <Text style={styles.quickInfoTitle}>Estado Actual</Text>
            <Text style={styles.quickInfoText}>
              Rol detectado: <Text style={styles.boldText}>{userRole || 'Cargando...'}</Text>
            </Text>
            <Text style={styles.quickInfoText}>
              Es usuario de negocio: <Text style={styles.boldText}>{isBusinessUser ? 'Sí' : 'No'}</Text>
            </Text>
            <Text style={styles.quickInfoText}>
              Es usuario normal: <Text style={styles.boldText}>{isNormalUser ? 'Sí' : 'No'}</Text>
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={runDiagnostic}
              disabled={isLoading}
            >
              <Ionicons name="analytics" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={switchUserRole}
            >
              <Ionicons name="swap-horizontal" size={20} color="#4299E1" />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Cambiar Rol
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={clearCacheAndRestart}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                Limpiar Caché
              </Text>
            </TouchableOpacity>
          </View>

          {Object.keys(diagnosticData).length > 0 && (
            <View style={styles.diagnosticResults}>
              <Text style={styles.resultsTitle}>Resultados del Diagnóstico</Text>
              
              {renderDiagnosticSection('Hook de Rol', diagnosticData.hookData)}
              {renderDiagnosticSection('AsyncStorage', diagnosticData.asyncStorageData)}
              {renderDiagnosticSection('API', diagnosticData.apiData)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  quickInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  quickInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  quickInfoText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#2D3748',
  },
  actions: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#4299E1',
  },
  dangerButton: {
    backgroundColor: '#E53E3E',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#4299E1',
  },
  diagnosticResults: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#4A5568',
  },
});
