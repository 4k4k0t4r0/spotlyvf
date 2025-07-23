import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserRole } from '../../hooks/useUserRole';
import { apiClient } from '../../data/apiClient';

interface RoleDiagnosticProps {
  visible: boolean;
  onClose: () => void;
}

export const RoleDiagnostic: React.FC<RoleDiagnosticProps> = ({ visible, onClose }) => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { userRole, isBusinessUser, isNormalUser, isLoading: roleLoading, refreshRole } = useUserRole();

  const runDiagnostic = async () => {
    setIsLoading(true);
    
    try {
      const data: any = {
        hookData: {
          userRole,
          isBusinessUser,
          isNormalUser,
          roleLoading
        },
        storage: {},
        apiTests: {}
      };

      // Verificar AsyncStorage
      const authToken = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      data.storage = {
        hasToken: !!authToken,
        tokenLength: authToken ? authToken.length : 0,
        userData: userData ? JSON.parse(userData) : null
      };

      // Probar endpoints
      try {
        const userInfo = await apiClient.getDirect('/auth/user-info/');
        data.apiTests.userInfo = { success: true, data: userInfo };
      } catch (error: any) {
        data.apiTests.userInfo = { success: false, error: error.message };
      }

      try {
        const dashboard = await apiClient.getDirect('/places/business/dashboard/');
        data.apiTests.businessDashboard = { success: true, hasAccess: true };
      } catch (error: any) {
        data.apiTests.businessDashboard = { 
          success: false, 
          hasAccess: false, 
          error: error.message,
          status: error.response?.status 
        };
      }

      try {
        const reservations = await apiClient.getDirect('/places/reservations/');
        data.apiTests.userReservations = { 
          success: true, 
          count: Array.isArray(reservations) ? reservations.length : 'unknown'
        };
      } catch (error: any) {
        data.apiTests.userReservations = { success: false, error: error.message };
      }

      setDiagnosticData(data);
    } catch (error) {
      console.error('Error in diagnostic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatData = (obj: any, indent = 0): string => {
    if (!obj) return 'null';
    
    if (typeof obj === 'object') {
      const spaces = '  '.repeat(indent);
      const items: string[] = Object.entries(obj).map(([key, value]): string => {
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${formatData(value, indent + 1)}`;
        }
        return `${spaces}${key}: ${String(value)}`;
      });
      return items.join('\n');
    }
    
    return String(obj);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Diagnóstico de Rol</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#4299E1" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado Actual</Text>
            <Text style={styles.info}>Rol: {userRole || 'Cargando...'}</Text>
            <Text style={styles.info}>Es negocio: {isBusinessUser ? 'Sí' : 'No'}</Text>
            <Text style={styles.info}>Es usuario normal: {isNormalUser ? 'Sí' : 'No'}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={runDiagnostic}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
            </Text>
          </TouchableOpacity>

          {diagnosticData && (
            <View style={styles.results}>
              <Text style={styles.sectionTitle}>Resultados</Text>
              <View style={styles.dataContainer}>
                <Text style={styles.dataText}>{formatData(diagnosticData)}</Text>
              </View>
            </View>
          )}

          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>¿Qué debería pasar?</Text>
            <Text style={styles.explanationText}>
              • Si eres usuario NORMAL: solo ves reservas que TÚ hiciste como cliente
            </Text>
            <Text style={styles.explanationText}>
              • Si eres usuario de NEGOCIO: solo ves reservas que recibiste en tus lugares
            </Text>
            <Text style={styles.explanationText}>
              • No deberías ver opciones para "crear negocio" si ya tienes un rol definido
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
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
  info: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#4299E1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  results: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dataContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#4A5568',
  },
  explanation: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    borderRadius: 12,
    padding: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
});
