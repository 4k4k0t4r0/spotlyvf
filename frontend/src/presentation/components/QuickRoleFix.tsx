import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserRole } from '../../hooks/useUserRole';

interface QuickRoleFixProps {
  onClose?: () => void;
}

export const QuickRoleFix: React.FC<QuickRoleFixProps> = ({ onClose }) => {
  const { userRole, isBusinessUser, isNormalUser, refreshRole } = useUserRole();

  const handleRefreshRole = async () => {
    try {
      refreshRole();
      Alert.alert(
        'Rol Actualizado',
        'Se ha refrescado la detección de rol. Si el problema persiste, intenta limpiar el caché.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo refrescar el rol');
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Limpiar Caché',
      'Esto eliminará todos los datos locales y tendrás que hacer login nuevamente. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                'Caché Limpiado',
                'Por favor, cierra la app completamente y vuelve a abrirla.'
              );
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
      <View style={styles.problemBox}>
        <Ionicons name="warning" size={24} color="#E53E3E" />
        <Text style={styles.problemText}>
          Detectado problema de rol: Te registraste como Usuario pero el sistema te detecta como Negocio
        </Text>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>Estado Actual:</Text>
        <Text style={styles.statusText}>Rol detectado: <Text style={styles.boldText}>{userRole}</Text></Text>
        <Text style={styles.statusText}>Es negocio: <Text style={styles.boldText}>{isBusinessUser ? 'Sí' : 'No'}</Text></Text>
        <Text style={styles.statusText}>Es usuario normal: <Text style={styles.boldText}>{isNormalUser ? 'Sí' : 'No'}</Text></Text>
      </View>

      <View style={styles.solutionsBox}>
        <Text style={styles.solutionsTitle}>Soluciones Rápidas:</Text>
        
        <TouchableOpacity style={styles.solutionButton} onPress={handleRefreshRole}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.solutionButtonText}>1. Refrescar Detección de Rol</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.solutionButton, styles.warningButton]} 
          onPress={handleClearCache}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.solutionButtonText}>2. Limpiar Caché (Requiere Re-login)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>¿Qué debería pasar?</Text>
        <Text style={styles.infoText}>
          • Si te registraste como "User": Solo deberías ver tus reservas como cliente
        </Text>
        <Text style={styles.infoText}>
          • Si te registraste como "Business": Solo deberías gestionar reservas de tu negocio
        </Text>
        <Text style={styles.infoText}>
          • No deberías ver opciones mixtas entre ambos roles
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  problemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FED7D7',
    borderWidth: 1,
    borderColor: '#FC8181',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  problemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '600',
  },
  statusBox: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#90CDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#2B6CB0',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  solutionsBox: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#9AE6B4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  solutionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2F855A',
    marginBottom: 12,
  },
  solutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  warningButton: {
    backgroundColor: '#E53E3E',
  },
  solutionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F6E05E',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#744210',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#744210',
    marginBottom: 4,
  },
});
