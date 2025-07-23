// src/presentation/screens/MyClaimsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { businessApi, PlaceClaim } from '../../data/businessApi';
import { MyClaimsScreenProps } from '../navigation/types';

export const MyClaimsScreen: React.FC<MyClaimsScreenProps> = ({ navigation }) => {
  const [claims, setClaims] = useState<PlaceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClaims = async () => {
    try {
      const claimsData = await businessApi.getMyClaims();
      setClaims(claimsData);
    } catch (error) {
      console.error('Error loading claims:', error);
      Alert.alert('Error', 'No se pudieron cargar las reclamaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadClaims();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9500';
      case 'under_review':
        return '#007aff';
      case 'approved':
        return '#34c759';
      case 'rejected':
        return '#ff3b30';
      default:
        return '#8e8e93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'under_review':
        return 'En Revisión';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'hourglass-empty';
      case 'under_review':
        return 'visibility';
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const renderClaim = ({ item }: { item: PlaceClaim }) => (
    <View style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.place_name || `Google Place ${item.google_place_id}`}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <MaterialIcons 
            name={getStatusIcon(item.status) as any} 
            size={14} 
            color="white" 
          />
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.claimDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="business" size={16} color="#666" />
          <Text style={styles.detailText}>{item.business_name || 'Sin nombre'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={16} color="#666" />
          <Text style={styles.detailText}>{item.contact_phone}</Text>
        </View>
        
        {item.contact_email && (
          <View style={styles.detailRow}>
            <MaterialIcons name="email" size={16} color="#666" />
            <Text style={styles.detailText}>{item.contact_email}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.detailText}>
            Enviado: {new Date(item.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {item.claim_message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Mensaje:</Text>
            <Text style={styles.messageText}>{item.claim_message}</Text>
          </View>
        )}

        {item.admin_notes && (
          <View style={styles.adminNotesContainer}>
            <Text style={styles.adminNotesLabel}>Notas del administrador:</Text>
            <Text style={styles.adminNotesText}>{item.admin_notes}</Text>
          </View>
        )}

        {item.rejection_reason && (
          <View style={styles.rejectionContainer}>
            <Text style={styles.rejectionLabel}>Motivo del rechazo:</Text>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}
      </View>

      {item.status === 'approved' && (
        <TouchableOpacity 
          style={styles.dashboardButton}
          onPress={() => navigation.navigate('BusinessDashboard')}
        >
          <Text style={styles.dashboardButtonText}>
            Ir al Dashboard
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="business-center" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No tienes reclamaciones</Text>
      <Text style={styles.emptyMessage}>
        Cuando reclames un lugar para tu negocio, aparecerá aquí.
      </Text>
      <TouchableOpacity 
        style={styles.claimButton}
        onPress={() => navigation.navigate('ClaimPlace')}
      >
        <MaterialIcons name="add" size={20} color="white" />
        <Text style={styles.claimButtonText}>Reclamar Lugar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando reclamaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Reclamaciones</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ClaimPlace')}
        >
          <MaterialIcons name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={claims}
        renderItem={renderClaim}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={claims.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  claimCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  claimDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  messageContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  rejectionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  adminNotesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  adminNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  dashboardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
});
