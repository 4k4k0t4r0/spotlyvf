// src/presentation/screens/BusinessReservationsScreen.tsx
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
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { businessApi, BusinessReservation } from '../../data/businessApi';
import { BusinessReservationsScreenProps } from '../navigation/types';

const StatusFilter: React.FC<{
  options: Array<{ label: string; value: string; color: string }>;
  selected: string;
  onSelect: (value: string) => void;
}> = ({ options, selected, onSelect }) => (
  <View style={styles.filterContainer}>
    <FlatList
      data={options}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.value}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.filterChip,
            selected === item.value && { backgroundColor: item.color }
          ]}
          onPress={() => onSelect(item.value)}
        >
          <Text
            style={[
              styles.filterChipText,
              selected === item.value && { color: '#fff' }
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  </View>
);

const ReservationCard: React.FC<{
  reservation: BusinessReservation;
  onApprove: () => void;
  onReject: () => void;
  onComplete: () => void;
  onNoShow: () => void;
}> = ({ reservation, onApprove, onReject, onComplete, onNoShow }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#F6AD55';
      case 'confirmed': return '#68D391';
      case 'rejected': return '#FC8181';
      case 'cancelled': return '#CBD5E0';
      case 'completed': return '#9F7AEA';
      case 'no_show': return '#A0AEC0';
      default: return '#CBD5E0';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'rejected': return 'Rechazada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      case 'no_show': return 'No se presentó';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.reservationInfo}>
          <Text style={styles.reservationPlace}>{reservation.place_name}</Text>
          <Text style={styles.reservationCustomer}>{reservation.user_name || reservation.contact_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) }]}>
          <Text style={styles.statusText}>{getStatusText(reservation.status)}</Text>
        </View>
      </View>

      <View style={styles.reservationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#718096" />
          <Text style={styles.detailText}>{formatDate(reservation.reservation_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#718096" />
          <Text style={styles.detailText}>{reservation.party_size} personas</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#718096" />
          <Text style={styles.detailText}>{reservation.user_phone || reservation.contact_phone}</Text>
        </View>
        {(reservation.user_email || reservation.contact_email) && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#718096" />
            <Text style={styles.detailText}>{reservation.user_email || reservation.contact_email}</Text>
          </View>
        )}
      </View>

      {reservation.special_requests && (
        <View style={styles.specialRequests}>
          <Text style={styles.specialRequestsLabel}>Solicitudes especiales:</Text>
          <Text style={styles.specialRequestsText}>{reservation.special_requests}</Text>
        </View>
      )}

      {reservation.business_notes && (
        <View style={styles.businessNotes}>
          <Text style={styles.businessNotesLabel}>Notas del negocio:</Text>
          <Text style={styles.businessNotesText}>{reservation.business_notes}</Text>
        </View>
      )}

      {reservation.rejection_reason && (
        <View style={styles.rejectionReason}>
          <Text style={styles.rejectionReasonLabel}>Motivo del rechazo:</Text>
          <Text style={styles.rejectionReasonText}>{reservation.rejection_reason}</Text>
        </View>
      )}

      {reservation.status.toLowerCase() === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Ionicons name="close-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveButton} onPress={onApprove}>
            <Ionicons name="checkmark-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      )}

      {reservation.status.toLowerCase() === 'confirmed' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Completar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.noShowButton} onPress={onNoShow}>
            <Ionicons name="person-remove-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>No se presentó</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export const BusinessReservationsScreen: React.FC<BusinessReservationsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { initialStatus } = route.params || {};
  
  const [reservations, setReservations] = useState<BusinessReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'all');
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<BusinessReservation | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [noShowNotes, setNoShowNotes] = useState('');

  const statusOptions = [
    { label: 'Todas', value: 'all', color: '#4299E1' },
    { label: 'Pendientes', value: 'pending', color: '#F6AD55' },
    { label: 'Confirmadas', value: 'confirmed', color: '#68D391' },
    { label: 'Rechazadas', value: 'rejected', color: '#FC8181' },
    { label: 'Completadas', value: 'completed', color: '#9F7AEA' },
    { label: 'No se presentó', value: 'no_show', color: '#A0AEC0' },
  ];

  useEffect(() => {
    loadReservations();
  }, [selectedStatus]);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const filters = selectedStatus !== 'all' ? { status: selectedStatus } : undefined;
      const data = await businessApi.getReservations(filters);
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      Alert.alert('Error', 'No se pudieron cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  };

  const handleApproveReservation = (reservation: BusinessReservation) => {
    setSelectedReservation(reservation);
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const handleRejectReservation = (reservation: BusinessReservation) => {
    setSelectedReservation(reservation);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleCompleteReservation = (reservation: BusinessReservation) => {
    setSelectedReservation(reservation);
    setCompleteNotes('');
    setShowCompleteModal(true);
  };

  const handleNoShowReservation = (reservation: BusinessReservation) => {
    setSelectedReservation(reservation);
    setNoShowNotes('');
    setShowNoShowModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedReservation) return;

    try {
      await businessApi.approveReservation(selectedReservation.id, approvalNotes);
      setShowApprovalModal(false);
      setSelectedReservation(null);
      await loadReservations();
      Alert.alert('Éxito', 'Reserva aprobada exitosamente');
    } catch (error) {
      console.error('Error approving reservation:', error);
      Alert.alert('Error', 'No se pudo aprobar la reserva');
    }
  };

  const confirmRejection = async () => {
    if (!selectedReservation || !rejectionReason.trim()) {
      Alert.alert('Error', 'Debes proporcionar una razón para el rechazo');
      return;
    }

    try {
      await businessApi.rejectReservation(selectedReservation.id, rejectionReason);
      setShowRejectionModal(false);
      setSelectedReservation(null);
      await loadReservations();
      Alert.alert('Reserva rechazada', 'La reserva ha sido rechazada');
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      Alert.alert('Error', 'No se pudo rechazar la reserva');
    }
  };

  const confirmComplete = async () => {
    if (!selectedReservation) return;

    try {
      await businessApi.completeReservation(selectedReservation.id, completeNotes);
      setShowCompleteModal(false);
      setSelectedReservation(null);
      await loadReservations();
      Alert.alert('Éxito', 'Reserva marcada como completada');
    } catch (error) {
      console.error('Error completing reservation:', error);
      Alert.alert('Error', 'No se pudo completar la reserva');
    }
  };

  const confirmNoShow = async () => {
    if (!selectedReservation) return;

    try {
      await businessApi.noShowReservation(selectedReservation.id, noShowNotes);
      setShowNoShowModal(false);
      setSelectedReservation(null);
      await loadReservations();
      Alert.alert('Reserva actualizada', 'Reserva marcada como no presentada');
    } catch (error) {
      console.error('Error marking reservation as no-show:', error);
      Alert.alert('Error', 'No se pudo actualizar la reserva');
    }
  };

  const renderReservation = ({ item }: { item: BusinessReservation }) => (
    <ReservationCard
      reservation={item}
      onApprove={() => handleApproveReservation(item)}
      onReject={() => handleRejectReservation(item)}
      onComplete={() => handleCompleteReservation(item)}
      onNoShow={() => handleNoShowReservation(item)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Status Filter */}
      <StatusFilter
        options={statusOptions}
        selected={selectedStatus}
        onSelect={setSelectedStatus}
      />

      {/* Reservations List */}
      <FlatList
        data={reservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyStateTitle}>No hay reservas</Text>
            <Text style={styles.emptyStateText}>
              {selectedStatus === 'all' 
                ? 'No tienes reservas aún'
                : `No hay reservas ${statusOptions.find(o => o.value === selectedStatus)?.label.toLowerCase()}`
              }
            </Text>
          </View>
        }
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4299E1" />
        </View>
      )}

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aprobar Reserva</Text>
            <Text style={styles.modalText}>
              ¿Estás seguro de que quieres aprobar esta reserva?
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Notas opcionales para el cliente..."
              value={approvalNotes}
              onChangeText={setApprovalNotes}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowApprovalModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmApproval}
              >
                <Text style={styles.modalConfirmText}>Aprobar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rechazar Reserva</Text>
            <Text style={styles.modalText}>
              Por favor, proporciona una razón para el rechazo:
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Motivo del rechazo (requerido)..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRejectionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRejectButton]}
                onPress={confirmRejection}
              >
                <Text style={styles.modalRejectText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Completar Reserva</Text>
            <Text style={styles.modalText}>
              ¿Estás seguro de que quieres marcar esta reserva como completada?
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Notas opcionales sobre la finalización..."
              value={completeNotes}
              onChangeText={setCompleteNotes}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmComplete}
              >
                <Text style={styles.modalConfirmText}>Completar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* No Show Modal */}
      <Modal
        visible={showNoShowModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>No se presentó</Text>
            <Text style={styles.modalText}>
              ¿Estás seguro de que el cliente no se presentó a la reserva?
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Notas opcionales sobre el no-show..."
              value={noShowNotes}
              onChangeText={setNoShowNotes}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNoShowModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={confirmNoShow}
              >
                <Text style={styles.modalRejectText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#4299E1',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 32,
  },
  filterContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationPlace: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  reservationCustomer: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
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
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A5568',
  },
  specialRequests: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  specialRequestsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 4,
  },
  specialRequestsText: {
    fontSize: 14,
    color: '#2D3748',
  },
  businessNotes: {
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  businessNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38A169',
    marginBottom: 4,
  },
  businessNotesText: {
    fontSize: 14,
    color: '#2D3748',
  },
  rejectionReason: {
    backgroundColor: '#FED7D7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E53E3E',
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 14,
    color: '#2D3748',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38A169',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9F7AEA',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  noShowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A0AEC0',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#4A5568',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#38A169',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalRejectButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
  },
  modalRejectText: {
    color: '#fff',
    fontWeight: '600',
  },
});
