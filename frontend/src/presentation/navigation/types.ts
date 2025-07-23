// Navigation types for TypeScript
import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Place } from '../../domain/types';

// Root Stack Navigator types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  PlaceDetails: { place: Place };
  MakeReservation: { place: Place };
  Reviews: undefined;
  MyReviews: undefined;
  Favorites: undefined;
  IconTest: undefined;
  // Business screens
  BusinessDashboard: undefined;
  BusinessReservations: { initialStatus?: string };
  BusinessReviews: { unrespondedOnly?: boolean };
  BusinessAnalytics: { 
    placeId?: number; 
    googlePlaceId?: string; 
    placeName?: string; 
  } | undefined;
  BusinessPlaces: undefined;
  BusinessSettings: undefined;
  ClaimPlace: undefined;
  MyClaims: undefined;
  CreatePlace: undefined;
};

// Main Tab Navigator types  
export type MainTabParamList = {
  Feed: undefined;
  Map: undefined;
  Reservations: undefined;
  Profile: undefined;
};

// Screen props types
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
export type FeedScreenProps = BottomTabScreenProps<MainTabParamList, 'Feed'>;
export type MapScreenProps = BottomTabScreenProps<MainTabParamList, 'Map'>;
export type ReservationsScreenProps = BottomTabScreenProps<MainTabParamList, 'Reservations'>;
export type ProfileScreenProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;
export type PlaceDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'PlaceDetails'>;
export type MakeReservationScreenProps = NativeStackScreenProps<RootStackParamList, 'MakeReservation'>;
export type ReviewsScreenProps = NativeStackScreenProps<RootStackParamList, 'Reviews'>;
export type MyReviewsScreenProps = NativeStackScreenProps<RootStackParamList, 'MyReviews'>;
export type FavoritesScreenProps = NativeStackScreenProps<RootStackParamList, 'Favorites'>;
export type IconTestScreenProps = NativeStackScreenProps<RootStackParamList, 'IconTest'>;

// Business screen props types
export type BusinessDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessDashboard'>;
export type BusinessReservationsScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessReservations'>;
export type BusinessReviewsScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessReviews'>;
export type BusinessAnalyticsScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessAnalytics'>;
export type BusinessPlacesScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessPlaces'>;
export type BusinessSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessSettings'>;
export type ClaimPlaceScreenProps = NativeStackScreenProps<RootStackParamList, 'ClaimPlace'>;
export type MyClaimsScreenProps = NativeStackScreenProps<RootStackParamList, 'MyClaims'>;
export type CreatePlaceScreenProps = NativeStackScreenProps<RootStackParamList, 'CreatePlace'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
