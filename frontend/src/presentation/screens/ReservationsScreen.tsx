import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reservationApi } from '../../data/apiClient';
import { googlePlacesReservationsService } from '../../data/googlePlacesReservations';
import { useUserRole } from '../../hooks/useUserRole';
import { RoleDiagnostic } from '../components/RoleDiagnostic';
import { QuickRoleFix } from '../components/QuickRoleFix';

interface Reservation {
  id: string;
  place_name: string;
  place_address: string;
  place_city: string;
  reservation_date: string;
  party_size: number;
  status: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  special_requests?: string;
  created_at: string;
  is_google_place?: boolean;
  confirmation_code?: string;
}

interface ReservationsScreenProps {
  navigation: any;
}

export const ReservationsScreen: React.FC<ReservationsScreenProps> = ({ navigation }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  
  // Obtener rol del usuario
  const { userRole, isBusinessUser, isNormalUser, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading) {
      loadReservations();
      // Debug: mostrar datos almacenados solo para usuarios normales
      if (isNormalUser) {
        debugAsyncStorage();
      }
    }
  }, [roleLoading, userRole]);

  // Si el usuario es de negocio, redirigir al dashboard de negocio
  useEffect(() => {
    if (isBusinessUser && !roleLoading) {
      // Mostrar mensaje informativo y redirigir
      Alert.alert(
        'Acceso de Negocio',
        'Como usuario de negocio, tus reservas se gestionan desde el Dashboard de Negocio.',
        [
          {
            text: 'Ir al Dashboard',
            onPress: () => (navigation as any).getParent()?.navigate('BusinessDashboard'),
          },
          {
            text: 'Quedarse aquí',
            style: 'cancel',
          },
        ]
      );
    }
  }, [isBusinessUser, roleLoading, navigation]);

  const debugAsyncStorage = async () => {
    try {
      console.log('🔍 Debugeando AsyncStorage...');
      
      // Verificar token de autenticación
      const authToken = await AsyncStorage.getItem('auth_token');
      console.log('🔑 Auth token:', authToken ? 'Presente' : 'No encontrado');
      
      // Verificar datos de usuario
      const userData = await AsyncStorage.getItem('user_data');
      console.log('� Datos de usuario:', userData);
      
      // Verificar reservas de Google Places
      const googleReservations = await AsyncStorage.getItem('google_places_reservations');
      console.log('🗺️ Reservas Google Places:', googleReservations);
      
    } catch (error) {
      console.error('❌ Error leyendo AsyncStorage:', error);
    }
  };

  // Función para cargar reservas locales (Google Places) desde AsyncStorage
  const loadLocalReservations = async (): Promise<Reservation[]> => {
    try {
      const reservations = await googlePlacesReservationsService.loadReservations();
      console.log('✅ Reservas locales cargadas:', reservations);
      return reservations;
    } catch (error) {
      console.error('❌ Error cargando reservas locales:', error);
      return [];
    }
  };

  const loadReservations = async (isRefresh = false) => {
    // Solo cargar reservas si es usuario normal
    if (isBusinessUser) {
      console.log('👤 Usuario de negocio detectado - no cargando reservas de cliente');
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      console.log('📋 Cargando reservas para usuario normal...');
      
      // Cargar reservas de la API (lugares de BD) - solo las propias del usuario
      let apiReservations: Reservation[] = [];
      try {
        const response = await reservationApi.getUserReservations();
        console.log('✅ Reservas propias de API cargadas:', response);
        apiReservations = (response as any).results || (response as any) || [];
      } catch (apiError) {
        console.log('⚠️ No se pudieron cargar reservas de API (normal si no hay conexión)');
      }

      // Cargar reservas locales (Google Places) - solo las que hizo el usuario
      const localReservations = await loadLocalReservations();

      // Combinar ambas listas
      const allReservations = [...apiReservations, ...localReservations];

      // Ordenar por fecha más reciente
      allReservations.sort((a, b) => new Date(b.reservation_date).getTime() - new Date(a.reservation_date).getTime());

      console.log('📋 Total de reservas del usuario:', allReservations.length);
      setReservations(allReservations);
    } catch (error) {
      console.error('❌ Error cargando reservas:', error);
      // Intentar cargar solo las locales
      const localReservations = await loadLocalReservations();
      setReservations(localReservations);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCancelReservation = (reservation: Reservation) => {
    const message = reservation.is_google_place 
      ? `¿Estás seguro de que quieres eliminar tu reserva en ${reservation.place_name}? (Esta es una reserva de Google Places)`
      : `¿Estás seguro de que quieres cancelar tu reserva en ${reservation.place_name}?`;

    Alert.alert(
      'Cancelar Reserva',
      message,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, cancelar', 
          style: 'destructive',
          onPress: () => cancelReservation(reservation)
        }
      ]
    );
  };

  const cancelReservation = async (reservation: Reservation) => {
    try {
      if (reservation.is_google_place) {
        // Para reservas de Google Places, eliminar usando el servicio
        await googlePlacesReservationsService.deleteReservation(reservation.id);
        Alert.alert('Reserva eliminada', 'Tu reserva ha sido eliminada exitosamente.');
      } else {
        // Para reservas de BD, usar la API
        await reservationApi.cancelReservation(reservation.id);
        Alert.alert('Reserva cancelada', 'Tu reserva ha sido cancelada exitosamente.');
      }
      loadReservations(); // Recargar la lista
    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      Alert.alert('Error', 'No se pudo cancelar la reserva. Intenta de nuevo.');
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Hora inválida';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return '#38A169';
      case 'PENDING':
        return '#F6AD55';
      case 'CANCELLED':
        return '#E53E3E';
      case 'REJECTED':
        return '#E53E3E';
      case 'COMPLETED':
        return '#38A169';
      case 'NO_SHOW':
        return '#A0AEC0';
      default:
        return '#718096';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'Confirmada';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelada';
      case 'REJECTED':
        return 'Rechazada';
      case 'COMPLETED':
        return 'Completada';
      case 'NO_SHOW':
        return 'No se presentó';
      default:
        return status || 'Desconocido';
    }
  };

  const renderReservationCard = ({ item }: { item: Reservation }) => (
    <View style={styles.reservationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.placeInfo}>
          <View style={styles.placeNameRow}>
            <Text style={styles.placeName}>{item.place_name}</Text>
            {item.is_google_place && (
              <View style={styles.googlePlaceBadge}>
                <Ionicons name="map" size={12} color="#4299E1" />
                <Text style={styles.googlePlaceText}>Google</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#718096" />
            <Text style={styles.placeLocation}>
              {item.place_address}, {item.place_city}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.reservationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#4299E1" />
          <Text style={styles.detailText}>{formatDate(item.reservation_date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#4299E1" />
          <Text style={styles.detailText}>{formatTime(item.reservation_date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#4299E1" />
          <Text style={styles.detailText}>{item.party_size} personas</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#4299E1" />
          <Text style={styles.detailText}>{item.contact_name}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#4299E1" />
          <Text style={styles.detailText}>{item.contact_phone}</Text>
        </View>

        {item.confirmation_code && (
          <View style={styles.detailRow}>
            <Ionicons name="receipt-outline" size={16} color="#4299E1" />
            <Text style={styles.detailText}>Código: {item.confirmation_code}</Text>
          </View>
        )}
      </View>

      {item.special_requests && (
        <View style={styles.specialRequests}>
          <Text style={styles.specialRequestsLabel}>Solicitudes especiales:</Text>
          <Text style={styles.specialRequestsText}>{item.special_requests}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <Text style={styles.reservationId}>ID: {item.id}</Text>
        {!['CANCELLED', 'REJECTED', 'COMPLETED', 'NO_SHOW'].includes(item.status?.toUpperCase()) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelReservation(item)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#E53E3E" />
            <Text style={styles.cancelButtonText}>
              {item.is_google_place ? 'Eliminar' : 'Cancelar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={80} color="#CBD5E0" />
      <Text style={styles.emptyTitle}>No tienes reservas</Text>
      <Text style={styles.emptySubtitle}>
        Cuando hagas una reserva en un lugar, aparecerá aquí.
      </Text>
      <Text style={styles.emptyNote}>
        💡 Las reservas que hagas como cliente aparecerán en esta lista, 
        y el negocio las recibirá para confirmarlas.
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Feed' })}
      >
        <Ionicons name="search" size={20} color="#fff" />
        <Text style={styles.exploreButtonText}>Explorar Lugares</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizado especial para usuarios de negocio
  const renderBusinessView = () => (
    <View style={styles.businessContainer}>
      <View style={styles.businessHeader}>
        <Ionicons name="business" size={64} color="#4299E1" />
        <Text style={styles.businessTitle}>Panel de Negocio</Text>
        <Text style={styles.businessSubtitle}>
          Como usuario de negocio, gestiona tus reservas desde el Dashboard
        </Text>
      </View>

      <View style={styles.businessActions}>
        <TouchableOpacity
          style={styles.primaryBusinessButton}
          onPress={() => (navigation as any).getParent()?.navigate('BusinessDashboard')}
        >
          <Ionicons name="apps" size={20} color="#fff" />
          <Text style={styles.primaryBusinessButtonText}>Ir al Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBusinessButton}
          onPress={() => (navigation as any).getParent()?.navigate('BusinessReservations')}
        >
          <Ionicons name="calendar" size={20} color="#4299E1" />
          <Text style={styles.secondaryBusinessButtonText}>Gestionar Reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryBusinessButton}
          onPress={() => (navigation as any).getParent()?.navigate('MyClaims')}
        >
          <Ionicons name="list" size={20} color="#718096" />
          <Text style={styles.tertiaryBusinessButtonText}>Mis Reclamaciones</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.businessInfo}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            Los usuarios de negocio no pueden hacer reservas como clientes. 
            Tu función es gestionar las reservas que recibas en tus lugares.
          </Text>
        </View>
      </View>
    </View>
  );

  // Mostrar loading mientras se determina el rol
  if (roleLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Verificando permisos...</Text>
        </View>
      </View>
    );
  }

  // Renderizar vista de negocio si es usuario de negocio
  if (isBusinessUser) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        {/* Header para usuarios de negocio */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reservas</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => (navigation as any).getParent()?.navigate('BusinessDashboard')}
          >
            <Ionicons name="business" size={24} color="#4299E1" />
          </TouchableOpacity>
        </View>

        {renderBusinessView()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Reservas</Text>
        <View style={styles.headerActions}>
          {/* Botón de diagnóstico temporal */}
          <TouchableOpacity
            style={styles.diagnosticButton}
            onPress={() => setShowDiagnostic(true)}
          >
            <Ionicons name="help-circle-outline" size={20} color="#4299E1" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadReservations(true)}
          >
            <Ionicons name="refresh" size={24} color="#4299E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mostrar alerta de problema de rol si es necesario */}
      {isBusinessUser && (
        <QuickRoleFix />
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando reservas...</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderReservationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadReservations(true)}
              tintColor="#4299E1"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
      
      {/* Modal de diagnóstico temporal */}
      <RoleDiagnostic 
        visible={showDiagnostic} 
        onClose={() => setShowDiagnostic(false)} 
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  placeInfo: {
    flex: 1,
    marginRight: 12,
  },
  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginRight: 8,
  },
  googlePlaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  googlePlaceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4299E1',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeLocation: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  reservationDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4A5568',
  },
  specialRequests: {
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  specialRequestsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 4,
  },
  specialRequestsText: {
    fontSize: 14,
    color: '#4A5568',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reservationId: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E53E3E',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyNote: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    lineHeight: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299E1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para vista de negocio
  businessContainer: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  businessHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  businessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  businessSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  businessActions: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  primaryBusinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4299E1',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryBusinessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBusinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4299E1',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryBusinessButtonText: {
    color: '#4299E1',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryBusinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  tertiaryBusinessButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
  },
  businessInfo: {
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2B6CB0',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagnosticButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EBF8FF',
  },
});
