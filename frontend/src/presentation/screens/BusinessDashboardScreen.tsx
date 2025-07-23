// src/presentation/screens/BusinessDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { businessApi, BusinessDashboard } from '../../data/businessApi';
import { BusinessDashboardScreenProps } from '../navigation/types';
import { BusinessSelector } from '../components/BusinessSelector';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  onPress?: () => void;
}> = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity 
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.statCardHeader}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statCardTitle}>{title}</Text>
    </View>
    <Text style={[styles.statCardValue, { color }]}>{value}</Text>
  </TouchableOpacity>
);

const QuickAction: React.FC<{
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  badge?: number;
}> = ({ title, description, icon, color, onPress, badge }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
    <View style={styles.quickActionContent}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDescription}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
  </TouchableOpacity>
);

export const BusinessDashboardScreen: React.FC<BusinessDashboardScreenProps> = ({ navigation }) => {
  const [dashboard, setDashboard] = useState<BusinessDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBusinessSelector, setShowBusinessSelector] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await businessApi.getDashboard();
      setDashboard(data);
      
      if (!data.has_places && data.pending_claims === 0) {
        // Mostrar opción para reclamar lugares
        Alert.alert(
          '¡Bienvenido a Spotlyvf Negocios!',
          'Para comenzar, puedes reclamar lugares de Google Places o registrar nuevos lugares.',
          [
            { text: 'Más tarde', style: 'cancel' },
            { text: 'Reclamar Lugar', onPress: () => navigation.navigate('ClaimPlace') }
          ]
        );
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const navigateToReservations = (status?: string) => {
    navigation.navigate('BusinessReservations', { initialStatus: status });
  };

  const navigateToReviews = (unrespondedOnly?: boolean) => {
    navigation.navigate('BusinessReviews', { unrespondedOnly });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299E1" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error al cargar el dashboard</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard Negocio</Text>
          <Text style={styles.headerSubtitle}>
            {dashboard.has_places 
              ? `Gestionando ${dashboard.stats?.total_places || 0} lugares`
              : 'Configura tu negocio'
            }
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('BusinessSettings')}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {dashboard.has_places ? (
          <>
            {/* Estadísticas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estadísticas</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Reservas Pendientes"
                  value={dashboard.stats.pending_reservations}
                  icon="time-outline"
                  color="#F6AD55"
                  onPress={() => navigateToReservations('pending')}
                />
                <StatCard
                  title="Reservas Confirmadas"
                  value={dashboard.stats.confirmed_reservations}
                  icon="checkmark-circle-outline"
                  color="#68D391"
                />
                <StatCard
                  title="Total Reseñas"
                  value={dashboard.stats.total_reviews}
                  icon="star-outline"
                  color="#4299E1"
                  onPress={() => navigateToReviews()}
                />
                <StatCard
                  title="Rating Promedio"
                  value={dashboard.stats.average_rating.toFixed(1)}
                  icon="heart-outline"
                  color="#ED8936"
                />
              </View>
            </View>

            {/* Acciones Rápidas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
              <View style={styles.quickActions}>
                <QuickAction
                  title="Reservas Pendientes"
                  description="Revisar y gestionar reservas"
                  icon="calendar-outline"
                  color="#F6AD55"
                  badge={dashboard.stats.pending_reservations}
                  onPress={() => navigateToReservations('pending')}
                />
                <QuickAction
                  title="Reseñas Sin Responder"
                  description="Responder a reseñas de clientes"
                  icon="chatbubble-outline"
                  color="#4299E1"
                  badge={dashboard.stats.unresponded_reviews}
                  onPress={() => navigateToReviews(true)}
                />
                <QuickAction
                  title="Analytics"
                  description="Ver estadísticas detalladas con IA"
                  icon="analytics-outline"
                  color="#9F7AEA"
                  onPress={() => {
                    // Obtener el google_place_id del primer lugar del usuario
                    if (dashboard.places && dashboard.places.length > 0) {
                      const userPlace = dashboard.places[0];
                      navigation.navigate('BusinessAnalytics', {
                        googlePlaceId: userPlace.google_place_id,
                        placeName: userPlace.name
                      });
                    } else {
                      // Si no tiene lugares, mostrar el selector como demo
                      setShowBusinessSelector(true);
                    }
                  }}
                />
                <QuickAction
                  title="Gestionar Lugares"
                  description="Configurar lugares y servicios"
                  icon="business-outline"
                  color="#38A169"
                  onPress={() => navigation.navigate('BusinessPlaces')}
                />
              </View>
            </View>

            {/* Actividad Reciente */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              <View style={styles.activityCard}>
                <View style={styles.activityItem}>
                  <Ionicons name="calendar" size={20} color="#4299E1" />
                  <Text style={styles.activityText}>
                    {dashboard.stats.recent_reservations} reservas en los últimos 7 días
                  </Text>
                </View>
                <View style={styles.activityItem}>
                  <Ionicons name="star" size={20} color="#F6AD55" />
                  <Text style={styles.activityText}>
                    Rating promedio: {dashboard.stats.average_rating.toFixed(1)}/5.0
                  </Text>
                </View>
                <View style={styles.activityItem}>
                  <Ionicons name="chatbubble" size={20} color="#ED8936" />
                  <Text style={styles.activityText}>
                    {dashboard.stats.unresponded_reviews} reseñas esperan respuesta
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* Estado sin lugares */
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={80} color="#CBD5E0" />
            <Text style={styles.emptyStateTitle}>¡Configura tu Negocio!</Text>
            <Text style={styles.emptyStateText}>
              Para comenzar, reclama lugares de Google Places o registra nuevos lugares para tu negocio.
            </Text>
            
            {dashboard.pending_claims && dashboard.pending_claims > 0 && (
              <TouchableOpacity 
                style={styles.pendingClaimsCard}
                onPress={() => navigation.navigate('MyClaims')}
              >
                <Ionicons name="hourglass-outline" size={24} color="#F6AD55" />
                <Text style={styles.pendingClaimsText}>
                  Tienes {dashboard.pending_claims} reclamación(es) pendiente(s) de revisión
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#F6AD55" />
              </TouchableOpacity>
            )}
            
            <View style={styles.setupActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('ClaimPlace')}
              >
                <Ionicons name="map-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Reclamar Lugar de Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('CreatePlace')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4299E1" />
                <Text style={styles.secondaryButtonText}>Registrar Nuevo Lugar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={() => navigation.navigate('MyClaims')}
              >
                <Ionicons name="list-outline" size={20} color="#718096" />
                <Text style={styles.tertiaryButtonText}>Ver Mis Reclamaciones</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <BusinessSelector
        visible={showBusinessSelector}
        onClose={() => setShowBusinessSelector(false)}
        onSelectBusiness={(business) => {
          navigation.navigate('BusinessAnalytics', {
            googlePlaceId: business.google_place_id,
            placeName: business.name
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A5568',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#E53E3E',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#4299E1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#BEE3F8',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 8,
    flex: 1,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActions: {
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  quickActionDescription: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  pendingClaimsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F6AD55',
  },
  pendingClaimsText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#B7791F',
    flex: 1,
  },
  setupActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4299E1',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4299E1',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4299E1',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  tertiaryButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
  },
});
