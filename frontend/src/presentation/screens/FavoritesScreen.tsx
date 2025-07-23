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

interface FavoritePlace {
  id: number;
  place: {
    id: number;
    name: string;
    description: string;
    rating?: number;
    category: {
      name: string;
      icon: string;
    };
    primary_image?: string;
    address?: string;
  };
  created_at: string;
}

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de acceso');
        return;
      }

      const response = await apiClient.get('/places/favorites/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setFavorites(response.data as FavoritePlace[]);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'No se pudieron cargar tus favoritos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = (favoriteId: number) => {
    Alert.alert(
      'Eliminar de Favoritos',
      '¿Estás seguro de que quieres eliminar este lugar de tus favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => removeFavorite(favoriteId)
        },
      ]
    );
  };

  const removeFavorite = async (favoriteId: number) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await apiClient.delete(`/places/favorites/${favoriteId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
      Alert.alert('Éxito', 'Lugar eliminado de favoritos');
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'No se pudo eliminar de favoritos');
    }
  };

  const handlePlacePress = (placeId: number) => {
    // Navigate to place detail
    (navigation as any).navigate('PlaceDetail', { id: placeId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const FavoriteCard: React.FC<{ favorite: FavoritePlace }> = ({ favorite }) => (
    <TouchableOpacity 
      style={styles.favoriteCard}
      onPress={() => handlePlacePress(favorite.place.id)}
    >
      <View style={styles.cardContent}>
        {favorite.place.primary_image && (
          <Image 
            source={{ uri: favorite.place.primary_image }} 
            style={styles.placeImage}
          />
        )}
        <View style={styles.placeInfo}>
          <View style={styles.placeHeader}>
            <Text style={styles.placeName}>{favorite.place.name}</Text>
            <TouchableOpacity 
              style={styles.heartButton}
              onPress={() => handleRemoveFavorite(favorite.id)}
            >
              <Ionicons name="heart" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryContainer}>
            <Ionicons 
              name={favorite.place.category.icon as any} 
              size={16} 
              color="#4299E1" 
            />
            <Text style={styles.categoryText}>{favorite.place.category.name}</Text>
          </View>
          
          {favorite.place.rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(favorite.place.rating)}
              </View>
              <Text style={styles.ratingText}>({favorite.place.rating}/5)</Text>
            </View>
          )}
          
          {favorite.place.address && (
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={14} color="#A0AEC0" />
              <Text style={styles.addressText}>{favorite.place.address}</Text>
            </View>
          )}
          
          <Text style={styles.favoriteDate}>
            Agregado el {formatDate(favorite.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4299E1" />
        <Text style={styles.loadingText}>Cargando tus favoritos...</Text>
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
        <Text style={styles.headerTitle}>Mis Favoritos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
            <Text style={styles.emptySubtitle}>
              Explora lugares y agrega los que más te gusten a tus favoritos
            </Text>
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {favorites.map((favorite) => (
              <FavoriteCard key={favorite.id} favorite={favorite} />
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
  favoritesList: {
    padding: 20,
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  placeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  placeInfo: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    flex: 1,
    marginRight: 8,
  },
  heartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#4299E1',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#4A5568',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#A0AEC0',
    marginLeft: 4,
    flex: 1,
  },
  favoriteDate: {
    fontSize: 12,
    color: '#CBD5E0',
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

export default FavoritesScreen;
