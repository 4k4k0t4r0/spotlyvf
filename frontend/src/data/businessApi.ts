// src/data/businessApi.ts
import { apiClient } from './apiClient';

export interface BusinessStats {
  total_places: number;
  pending_reservations: number;
  confirmed_reservations: number;
  total_reviews: number;
  average_rating: number;
  recent_reservations: number;
  unresponded_reviews: number;
}

export interface BusinessDashboard {
  has_places: boolean;
  stats: BusinessStats;
  places: any[];
  pending_claims?: number;
}

export interface PlaceClaim {
  id: number;
  place?: number | null;
  google_place_id?: string | null;
  claimant: number;
  claimant_name?: string;
  claimant_email?: string;
  business_name: string;
  business_registration: string;
  contact_phone: string;
  contact_email: string;
  verification_documents?: string[];
  claim_message: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string | null;
  approved_at?: string | null;
  place_name?: string;
  rejection_reason?: string; // Para compatibilidad con el modelo
}

export interface BusinessReservation {
  id: number;
  place_name: string;
  place_address: string;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  special_requests?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  status_display?: string;
  business_notes?: string;
  rejection_reason?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  approved_by_name?: string;
  approved_at?: string;
  completed_at?: string;
  no_show_at?: string;
  assigned_table?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessReview {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  place: {
    id: string;
    name: string;
    category: {
      name: string;
      icon: string;
      color: string;
    };
    primary_image?: string;
  };
  rating: number;
  title: string;
  content: string;
  visited_date?: string;
  created_at: string;
  business_response?: string;
  business_response_date?: string;
}

export interface BusinessAnalytics {
  period_days: number;
  reservations_by_day: Array<{
    date: string;
    count: number;
  }>;
  reviews_by_rating: Array<{
    rating: number;
    count: number;
  }>;
  top_places: Array<{
    name: string;
    reservation_count: number;
    average_rating: number;
  }>;
}

class BusinessApiClient {
  
  /**
   * Obtener dashboard del negocio
   */
  async getDashboard(): Promise<BusinessDashboard> {
    try {
      const response = await apiClient.getDirect('/business/dashboard/');
      return response as BusinessDashboard;
    } catch (error) {
      console.error('Error getting business dashboard:', error);
      throw error;
    }
  }

  /**
   * Obtener reservas del negocio
   */
  async getReservations(filters?: {
    status?: string;
    date?: string;
  }): Promise<BusinessReservation[]> {
    try {
      let url = '/business/reservations/';
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.date) params.append('date', filters.date);
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
      }
      
      const response = await apiClient.getDirect(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting business reservations:', error);
      throw error;
    }
  }

  /**
   * Aprobar una reserva
   */
  async approveReservation(reservationId: number, notes?: string): Promise<BusinessReservation> {
    try {
      const response = await apiClient.postDirect('/business/approve_reservation/', {
        reservation_id: reservationId,
        notes: notes || ''
      }) as any;
      return response.reservation;
    } catch (error) {
      console.error('Error approving reservation:', error);
      throw error;
    }
  }

  /**
   * Rechazar una reserva
   */
  async rejectReservation(reservationId: number, reason: string): Promise<BusinessReservation> {
    try {
      const response = await apiClient.postDirect('/business/reject_reservation/', {
        reservation_id: reservationId,
        reason: reason
      }) as any;
      return response.reservation;
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      throw error;
    }
  }

  /**
   * Marcar una reserva como completada
   */
  async completeReservation(reservationId: number, notes?: string): Promise<BusinessReservation> {
    try {
      const response = await apiClient.postDirect('/business/complete_reservation/', {
        reservation_id: reservationId,
        notes: notes || ''
      }) as any;
      return response.reservation;
    } catch (error) {
      console.error('Error completing reservation:', error);
      throw error;
    }
  }

  /**
   * Marcar una reserva como no presentada
   */
  async noShowReservation(reservationId: number, notes?: string): Promise<BusinessReservation> {
    try {
      const response = await apiClient.postDirect('/business/no_show_reservation/', {
        reservation_id: reservationId,
        notes: notes || ''
      }) as any;
      return response.reservation;
    } catch (error) {
      console.error('Error marking reservation as no-show:', error);
      throw error;
    }
  }

  /**
   * Obtener reseñas del negocio
   */
  async getReviews(unrespondedOnly: boolean = false): Promise<BusinessReview[]> {
    try {
      const url = `/business/reviews/${unrespondedOnly ? '?unresponded=true' : ''}`;
      const response = await apiClient.getDirect(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting business reviews:', error);
      throw error;
    }
  }

  /**
   * Responder a una reseña
   */
  async respondToReview(reviewId: number, response: string): Promise<BusinessReview> {
    try {
      const result = await apiClient.postDirect('/business/respond_to_review/', {
        review_id: reviewId,
        response: response
      }) as any;
      return result.review;
    } catch (error) {
      console.error('Error responding to review:', error);
      throw error;
    }
  }

  /**
   * Reclamar un lugar de Google Places
   */
  async claimGooglePlace(data: {
    google_place_id: string;
    business_name: string;
    business_registration: string;
    contact_phone: string;
    contact_email: string;
    verification_documents?: string[];
    claim_message?: string;
  }): Promise<PlaceClaim> {
    try {
      const response = await apiClient.postDirect('/business/claim_google_place/', data) as any;
      return response.claim;
    } catch (error) {
      console.error('Error claiming Google place:', error);
      throw error;
    }
  }

  /**
   * Obtener mis reclamaciones
   */
  async getMyClaims(): Promise<PlaceClaim[]> {
    try {
      const response = await apiClient.getDirect('/business/my_claims/');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting my claims:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuraciones del lugar
   */
  async updatePlaceSettings(placeId: string, settings: {
    accepts_reservations?: boolean;
    auto_approve_reservations?: boolean;
    max_advance_days?: number;
    max_capacity?: number;
    business_phone?: string;
    business_email?: string;
    business_website?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.postDirect('/business/update_place_settings/', {
        place_id: placeId,
        ...settings
      }) as any;
      return response.place;
    } catch (error) {
      console.error('Error updating place settings:', error);
      throw error;
    }
  }

  /**
   * Obtener analytics del negocio
   */
  async getAnalytics(days: number = 30): Promise<BusinessAnalytics> {
    try {
      const response = await apiClient.getDirect(`/business/analytics/?days=${days}`);
      return response as BusinessAnalytics;
    } catch (error) {
      console.error('Error getting business analytics:', error);
      throw error;
    }
  }
}

export const businessApi = new BusinessApiClient();
