import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../data/apiClient';
import { Review } from '../../domain/types';

interface ReviewsScreenProps {
  navigation: any;
}

interface ReviewWithPlace {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  place: number | null;
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

interface ReviewCardProps {
  review: ReviewWithPlace;
  onPlacePress: (placeId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onPlacePress }) => {
  // Debug: mostrar los datos de la reseña
  console.log('🔍 ReviewCard recibió:', {
    id: review.id,
    user_name: review.user_name,
    place_name: review.place_name,
    google_place_name: review.google_place_name,
    rating: review.rating,
    title: review.title
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#F6AD55"
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.reviewCard}>
      {/* Header con información del lugar */}
      <TouchableOpacity 
        style={styles.placeHeader}
        onPress={() => onPlacePress(review.place?.toString() || review.google_place_id || '')}
      >
        <Image
          source={{
            uri: 'https://via.placeholder.com/60x60?text=No+Image'
          }}
          style={styles.placeImage}
        />
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>
            {review.google_place_name || review.place_name || 'Lugar sin nombre'}
          </Text>
          <Text style={styles.placeCategory}>
            {review.is_google_place ? 'Google Places' : 'Lugar Local'}
          </Text>
          <Text style={styles.placeLocation}>
            {review.google_place_address || review.place_address || 'Dirección no disponible'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
      </TouchableOpacity>

      {/* Información de la reseña */}
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color="#4299E1" />
            </View>
            <View>
              <Text style={styles.userName}>
                {review.user_name || 'Usuario'}
              </Text>
              <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(review.rating)}
            </View>
            <Text style={styles.ratingNumber}>{review.rating}/5</Text>
          </View>
        </View>

        {review.content && (
          <Text style={styles.reviewComment}>{review.content}</Text>
        )}

        {/* Nota: Las imágenes no están implementadas en el backend actualmente */}
        {false && (
          <View style={styles.reviewImages}>
            <FlatList
              data={[]}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${review.id}-image-${index}`}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.reviewImage}
                />
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export const ReviewsScreen: React.FC<ReviewsScreenProps> = ({ navigation }) => {
  const [reviews, setReviews] = useState<ReviewWithPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllReviews();
  }, []);

  const loadAllReviews = async () => {
    setIsLoading(true);
    try {
      console.log('📝 Cargando todas las reseñas...');
      const response = await apiClient.getDirect('/reviews/') as any;
      
      console.log('🔍 Respuesta completa del servidor:', JSON.stringify(response, null, 2));
      
      if (response && response.results) {
        console.log('📊 Ejemplo de reseña:', JSON.stringify(response.results[0], null, 2));
        console.log('👤 user_name de primera reseña:', response.results[0]?.user_name);
        setReviews(response.results);
        console.log(`✅ ${response.results.length} reseñas cargadas`);
      } else if (response && Array.isArray(response)) {
        console.log('📊 Ejemplo de reseña (array directo):', JSON.stringify(response[0], null, 2));
        console.log('👤 user_name de primera reseña:', response[0]?.user_name);
        setReviews(response);
        console.log(`✅ ${response.length} reseñas cargadas`);
      } else {
        console.warn('⚠️ Formato de respuesta inesperado:', response);
        setReviews([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading reviews:', error);
      Alert.alert('Error', 'No se pudieron cargar las reseñas');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllReviews();
    setRefreshing(false);
  };

  const handlePlacePress = (placeId: string) => {
    // Navegar a los detalles del lugar
    navigation.navigate('PlaceDetails', { placeId });
  };

  const renderReviewItem = ({ item }: { item: ReviewWithPlace }) => (
    <ReviewCard
      review={item}
      onPlacePress={handlePlacePress}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Todas las Reseñas</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reviews.length}</Text>
          <Text style={styles.statLabel}>Total Reseñas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {reviews.length > 0 
              ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
              : '0.0'
            }
          </Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {new Set(reviews.map(review => 
              review.google_place_id || review.place?.toString() || 'unknown'
            )).size}
          </Text>
          <Text style={styles.statLabel}>Lugares</Text>
        </View>
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.reviewsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyStateTitle}>No hay reseñas disponibles</Text>
            <Text style={styles.emptyStateText}>
              Las reseñas aparecerán aquí cuando los usuarios compartan sus experiencias.
              {'\n\n'}
              • Lugares de Ecuador: Reseñas de nuestra comunidad
              • Lugares de Google Places: Los usuarios pueden crear reseñas locales
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="compass-outline" size={20} color="#4299E1" />
              <Text style={styles.exploreButtonText}>Explorar Lugares</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Cargando reseñas...</Text>
        </View>
      )}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  placeholder: {
    width: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299E1',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  reviewsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  placeImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  placeCategory: {
    fontSize: 14,
    color: '#4299E1',
    marginBottom: 2,
  },
  placeLocation: {
    fontSize: 12,
    color: '#718096',
  },
  reviewContent: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  reviewDate: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImages: {
    marginTop: 8,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E2E8F0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  exploreButtonText: {
    fontSize: 16,
    color: '#4299E1',
    fontWeight: '600',
    marginLeft: 8,
  },
});
