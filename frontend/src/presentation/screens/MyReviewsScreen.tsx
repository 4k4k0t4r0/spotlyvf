import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../data/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Review {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  place: {
    id: number;
    name: string;
    primary_image?: string;
    address?: string;
    category?: {
      name: string;
      icon: string;
    };
  } | null;
  google_place_name?: string;
  google_place_address?: string;
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

const MyReviewsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyReviews = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de acceso');
        return;
      }

      const response = await apiClient.get('/reviews/my_reviews/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setReviews(response.data as Review[]);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'No se pudieron cargar tus reseñas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMyReviews();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMyReviews();
  };

  const handleDeleteReview = (reviewId: number) => {
    Alert.alert(
      'Eliminar Reseña',
      '¿Estás seguro de que quieres eliminar esta reseña?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteReview(reviewId)
        },
      ]
    );
  };

  const deleteReview = async (reviewId: number) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await apiClient.delete(`/reviews/${reviewId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setReviews(reviews.filter(review => review.id !== reviewId));
      Alert.alert('Éxito', 'Reseña eliminada correctamente');
    } catch (error) {
      console.error('Error deleting review:', error);
      Alert.alert('Error', 'No se pudo eliminar la reseña');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    const placeName = review.place?.name || review.google_place_name || 'Lugar no disponible';
    const placeImage = review.place?.primary_image;
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.placeInfo}>
            {placeImage && (
              <Image 
                source={{ uri: placeImage }} 
                style={styles.placeImage}
              />
            )}
            <View style={styles.placeDetails}>
              <Text style={styles.placeName}>{placeName}</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {renderStars(review.rating)}
                </View>
                <Text style={styles.ratingText}>({review.rating}/5)</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteReview(review.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        
        {review.content && (
          <Text style={styles.reviewComment}>{review.content}</Text>
        )}
        
        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4299E1" />
        <Text style={styles.loadingText}>Cargando tus reseñas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Reseñas</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No tienes reseñas aún</Text>
            <Text style={styles.emptySubtitle}>
              Visita algunos lugares y deja tus comentarios
            </Text>
          </View>
        ) : (
          <View style={styles.reviewsList}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  reviewsList: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  placeInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  placeImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#4A5568',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MyReviewsScreen;
