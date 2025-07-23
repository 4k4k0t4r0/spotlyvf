import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ApiResponse, ApiError } from '../domain/types';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://127.0.0.1:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add token
    this.client.interceptors.request.use(
      async (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log('Request data:', config.data);
        
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        console.log('Response data:', response.data);
        return response;
      },
      async (error) => {
        console.error('API Error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        if (error.response?.status === 401) {
          // Token expired or invalid, clear all session data and redirect to login
          console.log('🚨 401 Unauthorized - clearing session data');
          await AsyncStorage.clear();
          this.clearClientState();
          // Navigation to login screen would be handled by the store or main app
        }
        
        const apiError: ApiError = {
          message: error.response?.data?.message || 'An error occurred',
          errors: error.response?.data?.errors,
          statusCode: error.response?.status || 500,
        };
        
        return Promise.reject(apiError);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Direct methods for auth endpoints (don't expect ApiResponse wrapper)
  async postDirect<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async getDirect<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  // Upload file with form data
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }

  // Method to clear client state on logout
  clearClientState() {
    console.log('🧹 Clearing API client state...');
    // Clear any cached tokens from headers
    delete this.client.defaults.headers.Authorization;
    console.log('✅ API client state cleared');
  }
}

export const apiClient = new ApiClient();

// Reservation API functions
export const reservationApi = {
  // Crear una nueva reserva
  async createReservation(data: {
    place: string; // Cambiado de number a string para soportar UUIDs
    reservation_date: string;
    reservation_time?: string; // Agregar campo de tiempo opcional
    party_size: number;
    special_requests?: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
  }) {
    return apiClient.post('/reservations/', data);
  },

  // Obtener reservas del usuario
  async getUserReservations() {
    return apiClient.get('/reservations/');
  },

  // Obtener reservas próximas
  async getUpcomingReservations() {
    return apiClient.get('/reservations/upcoming/');
  },

  // Cancelar una reserva
  async cancelReservation(reservationId: string) {
    return apiClient.post(`/reservations/${reservationId}/cancel/`);
  },

  // Obtener detalles de una reserva
  async getReservation(reservationId: string) {
    return apiClient.get(`/reservations/${reservationId}/`);
  }
};

// Review API functions
export const reviewApi = {
  // Crear una nueva reseña
  async createReview(data: {
    place?: string; // UUID string, not number
    google_place_id?: string;
    google_place_name?: string;
    google_place_address?: string;
    rating: number;
    title: string;
    content: string;
    visited_date?: string;
    would_recommend?: boolean;
  }) {
    return apiClient.post('/reviews/', data);
  },

  // Obtener reseñas de un lugar específico (BD o Google Places)
  async getPlaceReviews(placeId: string) { // UUID string or Google Place ID
    return apiClient.get(`/reviews/place_reviews/?place_id=${placeId}`);
  },

  // Obtener todas las reseñas con filtros opcionales
  async getAllReviews(filters?: { place_id?: string; rating?: number }) {
    let url = '/reviews/';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.place_id) params.append('place', filters.place_id);
      if (filters.rating) params.append('rating', filters.rating.toString());
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    return apiClient.getDirect(url);
  },

  // Obtener reseñas del usuario
  async getUserReviews() {
    return apiClient.get('/place-reviews/my_reviews/');
  },

  // Actualizar una reseña
  async updateReview(reviewId: string, data: {
    rating?: number;
    title?: string;
    content?: string;
    visited_date?: string;
    would_recommend?: boolean;
  }) {
    return apiClient.patch(`/place-reviews/${reviewId}/`, data);
  },

  // Eliminar una reseña
  async deleteReview(reviewId: string) {
    return apiClient.delete(`/place-reviews/${reviewId}/`);
  }
};
