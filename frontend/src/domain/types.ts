// Domain Types for Spotlyvf Application

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'USER' | 'BUSINESS';
  avatar?: string;
  isActive: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  radius: number;
  notifications: boolean;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  location?: Location; // opcional para compatibilidad
  images: PlaceImage[];
  average_rating: string; // viene como string del backend
  total_reviews: number;
  averageRating?: number; // para compatibilidad con código anterior
  totalReviews?: number; // para compatibilidad con código anterior
  price_range: string;
  priceRange?: PriceRange; // para compatibilidad
  features: string[];
  businessHours: BusinessHours[];
  contactInfo: ContactInfo;
  isActive: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  latitude: string; // viene como string del backend
  longitude: string; // viene como string del backend
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  distance?: number | null;
  primary_image?: string | null;
  isGooglePlace?: boolean; // Nuevo campo para identificar lugares de Google Places
  google_place_id?: string; // Google Place ID para lugares de Google Places
}

export interface PlaceImage {
  id: number;
  image: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface PlaceCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

// Categorías disponibles en Ecuador
export const PLACE_CATEGORIES = {
  RESTAURANTES: 'Restaurantes',
  CAFETERIAS: 'Cafeterías',
  COMIDA_RAPIDA: 'Comida Rápida',
  HOTELES: 'Hoteles',
  TURISMO: 'Turismo',
  ENTRETENIMIENTO: 'Entretenimiento',
  CINE: 'Cine',
  VIDA_NOCTURNA: 'Vida Nocturna',
  DEPORTES: 'Deportes',
  BIBLIOTECAS: 'Bibliotecas',
  CULTURA: 'Cultura',
  COMPRAS: 'Compras',
  PARQUES: 'Parques',
  SALUD: 'Salud',
  EDUCACION: 'Educación'
} as const;

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export interface BusinessHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface Review {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  place?: number;
  place_name: string;
  place_address: string;
  google_place_id?: string;
  google_place_name?: string;
  google_place_address?: string;
  is_google_place: boolean;
  rating: number;
  title: string;
  content: string;
  visited_date?: string;
  would_recommend: boolean;
  created_at: string;
  updated_at: string;
  is_approved: boolean;
  is_featured: boolean;
}

export interface Reservation {
  id: number;
  userId: number;
  placeId: string; // Cambiado a string para compatibilidad con UUIDs
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
  confirmationCode: string;
  user: Pick<User, 'firstName' | 'lastName' | 'phone'>;
  place: Pick<Place, 'name' | 'location' | 'contactInfo'>;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_CANCELLED'
  | 'NEW_REVIEW'
  | 'PLACE_RECOMMENDATION'
  | 'SYSTEM';

export interface SearchFilters {
  category?: number;
  location?: Location;
  radius?: number;
  priceRange?: PriceRange[];
  rating?: number;
  features?: string[];
  isOpen?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
