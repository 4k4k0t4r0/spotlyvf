import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GooglePlaceReservation {
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
  is_google_place: boolean;
  confirmation_code: string;
  external_place_id?: string;
}

const STORAGE_KEY = 'googlePlacesReservations';

export const googlePlacesReservationsService = {
  // Cargar todas las reservas de Google Places
  async loadReservations(): Promise<GooglePlaceReservation[]> {
    try {
      const storedReservations = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedReservations) {
        const reservations = JSON.parse(storedReservations);
        console.log('✅ Reservas de Google Places cargadas desde AsyncStorage:', reservations);
        return reservations;
      }
      return [];
    } catch (error) {
      console.error('❌ Error cargando reservas de Google Places:', error);
      return [];
    }
  },

  // Guardar una nueva reserva de Google Places
  async saveReservation(reservation: GooglePlaceReservation): Promise<void> {
    try {
      const existingReservations = await this.loadReservations();
      const updatedReservations = [...existingReservations, reservation];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReservations));
      console.log('✅ Reserva de Google Places guardada:', reservation);
    } catch (error) {
      console.error('❌ Error guardando reserva de Google Places:', error);
      throw error;
    }
  },

  // Cancelar una reserva de Google Places
  async cancelReservation(reservationId: string): Promise<void> {
    try {
      const reservations = await this.loadReservations();
      const updatedReservations = reservations.map(reservation =>
        reservation.id === reservationId
          ? { ...reservation, status: 'cancelled' }
          : reservation
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReservations));
      console.log('✅ Reserva de Google Places cancelada:', reservationId);
    } catch (error) {
      console.error('❌ Error cancelando reserva de Google Places:', error);
      throw error;
    }
  },

  // Eliminar una reserva de Google Places
  async deleteReservation(reservationId: string): Promise<void> {
    try {
      const reservations = await this.loadReservations();
      const updatedReservations = reservations.filter(
        reservation => reservation.id !== reservationId
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReservations));
      console.log('✅ Reserva de Google Places eliminada:', reservationId);
    } catch (error) {
      console.error('❌ Error eliminando reserva de Google Places:', error);
      throw error;
    }
  },

  // Limpiar todas las reservas (para testing)
  async clearAllReservations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('✅ Todas las reservas de Google Places han sido eliminadas');
    } catch (error) {
      console.error('❌ Error limpiando reservas de Google Places:', error);
      throw error;
    }
  }
};
