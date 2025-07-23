import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
  Switch,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../data/apiClient';
import { googlePlacesService, GooglePlace } from '../../data/googlePlacesService';
import { useLocation } from '../../hooks/useLocation';
import { Place, PriceRange, PlaceCategory, PLACE_CATEGORIES } from '../../domain/types';
import { DEFAULT_CATEGORIES } from '../../domain/defaultCategories';
import { FeedScreenProps } from '../navigation/types';

interface CategoryChipProps {
  category: PlaceCategory;
  isSelected: boolean;
  onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({ category, isSelected, onPress }) => {
  // Verificar si el ícono existe en Ionicons - lista expandida de íconos válidos
  const getValidIcon = (iconName: string): string => {
    // Mapeo de íconos que no existen en Ionicons a íconos válidos
    const iconMapping: { [key: string]: string } = {
      // Cafés y restaurantes
      'local_cafe': 'cafe',
      'fastfood': 'fast-food',
      
      // Alojamiento
      'hotel': 'bed',
      
      // Lugares genéricos
      'place': 'location',
      
      // Compras
      'shopping_bag': 'bag',
      'shopping-bag': 'bag',
      
      // Vida nocturna
      'nightlife': 'moon',
      'wine-bar': 'wine',
      'wine_bar': 'wine',
      
      // Cultura y educación
      'museum': 'library',
      'local_library': 'library',
      
      // Deportes y fitness
      'fitness_center': 'fitness',
      
      // Naturaleza
      'park': 'leaf',
      
      // Salud
      'local_hospital': 'medical',
      
      // Entretenimiento
      'local_play': 'game-controller',
      'local_movies': 'film',
      'movie': 'film',
      'movie_theater': 'videocam',
      
      // Servicios adicionales comunes
      'local_gas_station': 'car',
      'local_pharmacy': 'medical',
      'local_grocery_or_supermarket': 'basket',
      'local_bank': 'card',
      'local_atm': 'card',
      'local_post_office': 'mail',
      'local_taxi_service': 'car',
      'local_car_rental': 'car',
      'local_car_repair': 'construct',
      'local_car_wash': 'water',
      'local_laundry_service': 'shirt',
      'local_florist': 'flower',
      'local_dentist': 'medical',
      'local_veterinary_care': 'paw',
    };

    // Si hay un mapeo directo, usarlo
    if (iconMapping[iconName]) {
      console.log(`🔄 Mapeando "${iconName}" → "${iconMapping[iconName]}"`);
      return iconMapping[iconName];
    }

    // Lista expandida de íconos válidos de Ionicons que sabemos que funcionan
    const validIcons = [
      // Comida y bebida
      'restaurant', 'restaurant-outline', 'cafe', 'cafe-outline', 
      'wine', 'wine-outline', 'beer', 'beer-outline', 'pizza', 'ice-cream',
      'fast-food', 'fast-food-outline',
      // Entretenimiento
      'camera', 'camera-outline', 'videocam', 'videocam-outline', 
      'game-controller', 'game-controller-outline', 'musical-notes', 'musical-notes-outline',
      'headset', 'headset-outline', 'tv', 'tv-outline', 'radio', 'radio-outline',
      'film', 'film-outline', 'play-circle', 'play-circle-outline', 
      'microphone', 'microphone-outline', 'ticket', 'ticket-outline',
      // Alojamiento
      'bed', 'bed-outline', 'home', 'home-outline', 'business', 'business-outline', 
      'storefront', 'storefront-outline',
      // Deportes y recreación
      'football', 'football-outline', 'basketball', 'basketball-outline',
      'tennis-ball', 'golf', 'golf-outline', 'bicycle', 'bicycle-outline',
      'boat', 'boat-outline', 'barbell', 'barbell-outline', 'fitness', 'fitness-outline',
      'walk', 'walk-outline', 'medal', 'medal-outline', 'trophy', 'trophy-outline',
      // Vida nocturna
      'moon', 'moon-outline', 'star', 'star-outline', 'sparkles', 'sparkles-outline',
      // Educación y cultura
      'library', 'library-outline', 'school', 'school-outline', 'book', 'book-outline',
      'newspaper', 'newspaper-outline', 'glasses', 'glasses-outline', 
      'pencil', 'pencil-outline', 'graduation-cap', 'graduation-cap-outline',
      'bookmarks', 'bookmarks-outline',
      // Compras
      'basket', 'basket-outline', 'card', 'card-outline', 'cash', 'cash-outline',
      'gift', 'gift-outline', 'bag', 'bag-outline', 'shirt', 'shirt-outline',
      'diamond', 'diamond-outline',
      // Salud y bienestar
      'medical', 'medical-outline', 'fitness', 'fitness-outline', 'leaf', 'leaf-outline',
      'heart', 'heart-outline', 'pulse', 'pulse-outline', 'bandage', 'bandage-outline',
      // Transporte
      'location', 'location-outline', 'car', 'car-outline', 'train', 'train-outline',
      'airplane', 'airplane-outline', 'bus', 'bus-outline', 'subway', 'subway-outline',
      'taxi', 'taxi-outline', 'rocket', 'rocket-outline', 'speedometer', 'speedometer-outline',
      'navigate', 'navigate-outline',
      // Mascotas y animales
      'paw', 'paw-outline', 'fish', 'fish-outline', 'bug', 'bug-outline',
      // Arte y cultura
      'color-palette', 'color-palette-outline', 'brush', 'brush-outline',
      'easel', 'easel-outline', 'flower', 'flower-outline', 'rose', 'rose-outline',
      'images', 'images-outline', 'image', 'image-outline',
      // Tecnología
      'phone-portrait', 'phone-portrait-outline', 'laptop', 'laptop-outline',
      'desktop', 'desktop-outline', 'watch', 'watch-outline',
      'wifi', 'wifi-outline', 'bluetooth', 'bluetooth-outline',
      // Servicios
      'hammer', 'hammer-outline', 'build', 'build-outline', 'construct', 'construct-outline',
      'wrench', 'wrench-outline', 'settings', 'settings-outline', 'cut', 'cut-outline',
      'scissors', 'scissors-outline', 'flash', 'flash-outline', 
      'battery-charging', 'battery-charging-outline', 'cog', 'cog-outline',
      // Naturaleza
      'tree', 'tree-outline', 'sunny', 'sunny-outline', 'partly-sunny', 'partly-sunny-outline',
      'cloudy', 'cloudy-outline', 'rainy', 'rainy-outline', 'snow', 'snow-outline',
      'water', 'water-outline', 'flame', 'flame-outline',
      // Adicionales comunes
      'apps', 'apps-outline', 'grid', 'grid-outline', 'list', 'list-outline',
      'map', 'map-outline', 'compass', 'compass-outline', 'time', 'time-outline',
      'alarm', 'alarm-outline', 'calendar', 'calendar-outline', 'clock', 'clock-outline',
      'hourglass', 'hourglass-outline', 'people', 'people-outline', 'person', 'person-outline',
      'body', 'body-outline', 'eye', 'eye-outline', 'ear', 'ear-outline',
      'checkmark', 'checkmark-outline', 'close', 'close-outline', 'add', 'add-outline',
      'remove', 'remove-outline', 'bookmark', 'bookmark-outline', 'flag', 'flag-outline',
      'pin', 'pin-outline', 'magnet', 'magnet-outline', 'receipt', 'receipt-outline',
      'mail', 'mail-outline'
    ];
    
    // Si el ícono no está en la lista, intentar con la versión sin outline
    if (!validIcons.includes(iconName) && iconName.endsWith('-outline')) {
      const baseIcon = iconName.replace('-outline', '');
      if (validIcons.includes(baseIcon)) {
        console.log(`✅ Usando ícono base "${baseIcon}" en lugar de "${iconName}"`);
        return baseIcon;
      }
    }
    
    // Si el ícono no está en la lista, intentar con la versión outline
    if (!validIcons.includes(iconName) && !iconName.endsWith('-outline')) {
      const outlineIcon = iconName + '-outline';
      if (validIcons.includes(outlineIcon)) {
        console.log(`✅ Usando ícono outline "${outlineIcon}" en lugar de "${iconName}"`);
        return outlineIcon;
      }
    }
    
    // Log para debug - ver qué íconos no están siendo encontrados
    if (!validIcons.includes(iconName)) {
      console.log(`⚠️ Ícono no encontrado en lista válida: "${iconName}" - usando "location" por defecto`);
    } else {
      console.log(`✅ Ícono válido encontrado: "${iconName}"`);
    }
    
    return validIcons.includes(iconName) ? iconName : 'location';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.categoryChip, 
        isSelected && { backgroundColor: category.color }
      ]} 
      onPress={onPress}
    >
      <Ionicons 
        name={getValidIcon(category.icon) as any}
        size={16} 
        color={isSelected ? '#fff' : category.color} 
      />
      <Text style={[
        styles.categoryChipText,
        isSelected && { color: '#fff' }
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress }) => (
  <TouchableOpacity style={styles.placeCard} onPress={onPress}>
    <Image
      source={{ 
        uri: place.primary_image || 
             (place.images && place.images[0] ? place.images[0].image : null) ||
             'https://via.placeholder.com/300x200?text=No+Image'
      }}
      style={styles.placeImage}
    />
    <View style={styles.placeInfo}>
      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.placeCategory}>{place.category.name}</Text>
      <Text style={styles.placeAddress}>{place.address}, {place.city}</Text>
      <View style={styles.placeRating}>
        <Ionicons name="star" size={16} color="#F6AD55" />
        <Text style={styles.ratingText}>
          {place.average_rating ? parseFloat(place.average_rating).toFixed(1) : '0.0'}
        </Text>
        <Text style={styles.reviewCount}>({place.total_reviews || 0} reviews)</Text>
        {place.distance && (
          <Text style={styles.distance}>{place.distance.toFixed(1)}km</Text>
        )}
        <Text style={styles.priceRange}>
          {place.city === 'Ubicación actual' ? '🗺️ Google' : '🇪🇨 Ecuador'}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [googlePlaces, setGooglePlaces] = useState<GooglePlace[]>([]);
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [useGooglePlaces, setUseGooglePlaces] = useState(true);
  const [showEcuadorPlaces, setShowEcuadorPlaces] = useState(true);
  
  const { location, isLoading: locationLoading, error: locationError, hasPermission } = useLocation();

  useEffect(() => {
    loadCategories();
    loadAllPlaces();
  }, [location, useGooglePlaces, showEcuadorPlaces, selectedCategory]);

  const loadCategories = async () => {
    try {
      console.log('🏷️ Cargando categorías...');
      const response = await apiClient.getDirect('/categories/') as any;
      
      if (response && response.results) {
        setCategories(response.results);
        console.log(`✅ ${response.results.length} categorías cargadas del backend`);
      } else if (response && Array.isArray(response)) {
        setCategories(response);
        console.log(`✅ ${response.length} categorías cargadas del backend`);
      } else {
        console.log('⚠️ No se pudieron cargar categorías del backend, usando categorías por defecto');
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error: any) {
      console.error('❌ Error loading categories:', error);
      console.log('🔄 Usando categorías por defecto debido al error');
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  };

  const convertGooglePlacesToSpotlyvf = (googlePlaces: GooglePlace[]): Place[] => {
    return googlePlaces.map(gPlace => {
      const category = googlePlacesService.mapGoogleTypesToCategory(gPlace.types);
      const imageUrl = gPlace.photos && gPlace.photos[0] 
        ? googlePlacesService.getPhotoUrl(gPlace.photos[0].photo_reference)
        : null;

      const distance = location 
        ? calculateDistance(
            location.latitude,
            location.longitude,
            gPlace.geometry.location.lat,
            gPlace.geometry.location.lng
          )
        : null;

      return {
        id: gPlace.place_id,
        name: gPlace.name,
        description: `${gPlace.vicinity} - Lugar verificado por Google`,
        category: {
          id: Math.random(),
          name: category.name,
          icon: category.icon,
          color: category.color
        },
        images: imageUrl ? [{ 
          id: Math.random(), 
          image: imageUrl, 
          caption: gPlace.name,
          isPrimary: true,
          order: 1 
        }] : [],
        average_rating: gPlace.rating ? gPlace.rating.toString() : '0.0',
        total_reviews: gPlace.user_ratings_total || 0,
        price_range: googlePlacesService.mapPriceLevel(gPlace.price_level),
        features: gPlace.types.slice(0, 3),
        businessHours: [],
        contactInfo: { phone: '', email: '', website: '' },
        isActive: true,
        ownerId: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        latitude: gPlace.geometry.location.lat.toString(),
        longitude: gPlace.geometry.location.lng.toString(),
        address: gPlace.formatted_address || gPlace.vicinity,
        city: 'Ubicación actual',
        state: '',
        country: '',
        distance: distance,
        primary_image: imageUrl,
        isGooglePlace: true, // AGREGAR ESTE CAMPO
      } as Place;
    });
  };

  const loadAllPlaces = async () => {
    setIsLoading(true);
    try {
      const allPlaces: Place[] = [];

      // Cargar lugares de Ecuador si está habilitado
      if (showEcuadorPlaces) {
        const ecuadorPlaces = await loadEcuadorPlaces();
        allPlaces.push(...ecuadorPlaces);
      }

      // Cargar lugares de Google si está habilitado y tenemos ubicación
      if (useGooglePlaces && location && hasPermission) {
        const nearbyGooglePlaces = await loadGooglePlaces();
        const convertedGooglePlaces = convertGooglePlacesToSpotlyvf(nearbyGooglePlaces);
        allPlaces.push(...convertedGooglePlaces);
      }

      // Calcular distancias y ordenar
      if (location) {
        allPlaces.forEach(place => {
          if (!place.distance) {
            place.distance = calculateDistance(
              location.latitude,
              location.longitude,
              parseFloat(place.latitude),
              parseFloat(place.longitude)
            );
          }
        });

        allPlaces.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }

      setPlaces(allPlaces);
      console.log(`✅ Total de ${allPlaces.length} lugares cargados`);
    } catch (error) {
      console.error('Error loading all places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEcuadorPlaces = async (): Promise<Place[]> => {
    try {
      console.log('🇪🇨 Cargando lugares de Ecuador...');
      
      // Construir URL con filtro de categoría si está seleccionada
      let url = '/places/';
      if (selectedCategory) {
        url += `?category=${selectedCategory}`;
      }
      
      const response = await apiClient.getDirect(url) as any;
      
      if (response && response.results) {
        console.log(`✅ ${response.results.length} lugares de Ecuador cargados`);
        // Asegurar que todos los lugares de la BD tengan isGooglePlace: false
        const ecuadorPlaces = response.results.map((place: Place) => ({
          ...place,
          isGooglePlace: false
        }));
        return ecuadorPlaces;
      } else if (response && Array.isArray(response)) {
        console.log(`✅ ${response.length} lugares de Ecuador cargados`);
        // Asegurar que todos los lugares de la BD tengan isGooglePlace: false
        const ecuadorPlaces = response.map((place: Place) => ({
          ...place,
          isGooglePlace: false
        }));
        return ecuadorPlaces;
      } else {
        console.warn('⚠️ Formato de respuesta inesperado:', response);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Error loading Ecuador places:', error);
      return [];
    }
  };

  const loadGooglePlaces = async (): Promise<GooglePlace[]> => {
    if (!location) {
      console.log('📍 No hay ubicación disponible para cargar lugares de Google');
      return [];
    }

    try {
      console.log(`🗺️ Cargando lugares cercanos de Google para ubicación: ${location.latitude}, ${location.longitude}`);
      
      let nearbyPlaces: GooglePlace[] = [];

      // Si hay una categoría seleccionada, hacer búsqueda específica
      if (selectedCategory && categories.length > 0) {
        const selectedCat = categories.find(cat => cat.id === selectedCategory);
        if (selectedCat) {
          console.log(`🏷️ Buscando lugares de categoría: ${selectedCat.name}`);
          nearbyPlaces = await googlePlacesService.searchQuitoPlacesByCategory(
            location.latitude,
            location.longitude,
            selectedCat.name,
            5000 // 5km radius
          );
          console.log(`📊 Encontrados ${nearbyPlaces.length} lugares para categoría ${selectedCat.name}`);
        }
      }

      // Si no hay categoría específica o no se encontraron lugares, usar búsqueda general
      if (nearbyPlaces.length === 0) {
        console.log('🔍 No se encontraron lugares por categoría, buscando lugares específicos cercanos...');
        
        // Primero buscar lugares muy cercanos con el nuevo método
        const veryNearbyPlaces = await googlePlacesService.searchNearbySpecificPlaces(
          location.latitude,
          location.longitude,
          2000 // 2km radius para lugares cercanos
        );
        console.log(`📊 Lugares muy cercanos encontrados: ${veryNearbyPlaces.length}`);

        if (veryNearbyPlaces.length > 0) {
          nearbyPlaces = veryNearbyPlaces;
        } else {
          // Buscar lugares populares específicos de Quito
          console.log('🔍 Buscando lugares populares de Quito...');
          const popularPlaces = await googlePlacesService.searchQuitoPopularPlaces(
            location.latitude,
            location.longitude,
            5000 // 5km radius para lugares populares
          );
          console.log(`📊 Lugares populares encontrados: ${popularPlaces.length}`);

          if (popularPlaces.length > 0) {
            nearbyPlaces = popularPlaces;
          } else {
            // Si aún no hay lugares, ampliar búsqueda con tipos específicos
            console.log('🔍 Ampliando búsqueda a tipos específicos...');
            const searchTypes = [
              'restaurant',
              'cafe', 
              'tourist_attraction',
              'lodging',
              'museum',
              'park',
              'shopping_mall',
              'gym',
              'bar',
              'movie_theater',
              'gas_station',
              'pharmacy',
              'supermarket',
              'bank'
            ];

            nearbyPlaces = await googlePlacesService.searchNearbyPlacesByTypes(
              location.latitude,
              location.longitude,
              searchTypes,
              4000 // 4km radius
            );
            console.log(`📊 Lugares por tipos encontrados: ${nearbyPlaces.length}`);
          }
        }
      }

      // Filtrar lugares con buena información y que estén realmente cerca
      console.log(`🔍 Filtrando ${nearbyPlaces.length} lugares encontrados...`);
      const relevantPlaces = nearbyPlaces.filter(place => {
        // Asegurar que tenga nombre y ubicación válida
        const hasValidInfo = place.name && 
                           place.geometry?.location?.lat && 
                           place.geometry?.location?.lng;
        
        // Verificar que esté dentro del área de Ecuador (aproximado)
        const isInEcuador = place.geometry?.location?.lat >= -5.0 && 
                          place.geometry?.location?.lat <= 1.5 &&
                          place.geometry?.location?.lng >= -92.0 && 
                          place.geometry?.location?.lng <= -75.0;
        
        // Filtrar lugares muy genéricos
        const isRelevant = !place.types.includes('political') &&
                          !place.types.includes('postal_code') &&
                          !place.types.includes('administrative_area_level_1') &&
                          !place.types.includes('administrative_area_level_2') &&
                          !place.types.includes('route') &&
                          place.name.length > 3; // Evitar nombres muy cortos

        // Calcular distancia real
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        // Solo incluir lugares realmente cercanos (máximo 10km)
        const isNearby = distance <= 10;

        if (!hasValidInfo) console.log(`❌ Lugar sin info válida: ${place.name}`);
        if (!isInEcuador) console.log(`❌ Lugar fuera de Ecuador: ${place.name} (${place.geometry?.location?.lat}, ${place.geometry?.location?.lng})`);
        if (!isRelevant) console.log(`❌ Lugar no relevante: ${place.name} - tipos: ${place.types.join(', ')}`);
        if (!isNearby) console.log(`❌ Lugar muy lejano: ${place.name} - distancia: ${distance.toFixed(1)}km`);

        return hasValidInfo && isInEcuador && isRelevant && isNearby;
      });

      console.log(`✅ ${relevantPlaces.length} lugares relevantes después del filtro`);

      // Ordenar por distancia primero, luego por rating
      relevantPlaces.sort((a, b) => {
        const distanceA = calculateDistance(
          location.latitude,
          location.longitude,
          a.geometry.location.lat,
          a.geometry.location.lng
        );
        const distanceB = calculateDistance(
          location.latitude,
          location.longitude,
          b.geometry.location.lat,
          b.geometry.location.lng
        );
        
        // Priorizar distancia, luego rating
        if (Math.abs(distanceA - distanceB) < 1) { // Si están a menos de 1km de diferencia
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        }
        
        return distanceA - distanceB;
      });

      // Limitar a los mejores 25 lugares cercanos
      const topPlaces = relevantPlaces.slice(0, 25);

      console.log(`🗺️ ${topPlaces.length} lugares finales de Google cargados`);
      console.log('📍 Lugares encontrados:', topPlaces.map(p => `${p.name} (${calculateDistance(location.latitude, location.longitude, p.geometry.location.lat, p.geometry.location.lng).toFixed(1)}km)`));
      
      setGooglePlaces(topPlaces);
      return topPlaces;
    } catch (error: any) {
      console.error('❌ Error loading Google places:', error);
      return [];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllPlaces();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAllPlaces();
      return;
    }

    setIsLoading(true);
    try {
      const allResults: Place[] = [];

      // Buscar en lugares de Ecuador
      if (showEcuadorPlaces) {
        console.log('🔍 Buscando lugares de Ecuador:', searchQuery);
        const response = await apiClient.getDirect(`/places/?search=${searchQuery}`) as any;
        
        if (response && response.results) {
          // Asegurar que los lugares de la BD tengan isGooglePlace: false
          const ecuadorResults = response.results.map((place: Place) => ({
            ...place,
            isGooglePlace: false
          }));
          allResults.push(...ecuadorResults);
        } else if (response && Array.isArray(response)) {
          // Asegurar que los lugares de la BD tengan isGooglePlace: false
          const ecuadorResults = response.map((place: Place) => ({
            ...place,
            isGooglePlace: false
          }));
          allResults.push(...ecuadorResults);
        }
      }

      // Buscar en Google Places si tenemos ubicación
      if (useGooglePlaces && location && hasPermission) {
        console.log('🔍 Buscando lugares de Google:', searchQuery);
        
        // Mejorar la búsqueda agregando "cerca de mi" para obtener resultados más locales
        const enhancedQuery = searchQuery.toLowerCase().includes('cerca') || 
                             searchQuery.toLowerCase().includes('quito') || 
                             searchQuery.toLowerCase().includes('ecuador') 
                             ? searchQuery 
                             : `${searchQuery} cerca de mi Quito`;
        
        const googleResults = await googlePlacesService.searchPlacesByText(
          enhancedQuery,
          location.latitude,
          location.longitude,
          8000 // Radio de 8km para búsquedas de texto
        );
        
        // Filtrar resultados relevantes para Ecuador
        const relevantGoogleResults = googleResults.filter(place => {
          const isInEcuador = place.geometry?.location?.lat >= -5.0 && 
                            place.geometry?.location?.lat <= 1.5 &&
                            place.geometry?.location?.lng >= -92.0 && 
                            place.geometry?.location?.lng <= -75.0;
          
          const hasGoodInfo = place.name && 
                            place.name.length > 3 &&
                            !place.types.includes('political') &&
                            !place.types.includes('route');

          // Calcular distancia para filtrar lugares muy lejanos
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          
          const isNearby = distance <= 15; // Máximo 15km para búsquedas
          
          return isInEcuador && hasGoodInfo && isNearby;
        });
        
        const convertedResults = convertGooglePlacesToSpotlyvf(relevantGoogleResults);
        allResults.push(...convertedResults);
      }

      setPlaces(allResults);
      console.log(`🔍 ${allResults.length} lugares encontrados`);
    } catch (error: any) {
      console.error('❌ Error searching places:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToPlace = (place: Place) => {
    // Navegar a la pantalla de detalles del lugar usando el navegador raíz
    (navigation as any).getParent()?.navigate('PlaceDetails', { place });
  };

  const renderPlaceCard = ({ item }: { item: Place }) => (
    <PlaceCard
      place={item}
      onPress={() => navigateToPlace(item)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spotlyvf</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={32} color="#4299E1" />
        </TouchableOpacity>
      </View>

      {/* Location Status */}
      {locationLoading && (
        <View style={styles.locationStatus}>
          <ActivityIndicator size="small" color="#4299E1" />
          <Text style={styles.locationText}>Obteniendo ubicación...</Text>
        </View>
      )}

      {locationError && (
        <View style={[styles.locationStatus, { backgroundColor: '#FED7D7' }]}>
          <Ionicons name="location-outline" size={16} color="#E53E3E" />
          <Text style={styles.locationErrorText}>{locationError}</Text>
        </View>
      )}

      {location && (
        <View style={styles.locationStatus}>
          <Ionicons name="location" size={16} color="#38A169" />
          <Text style={styles.locationText}>
            📍 Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#718096" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar lugares..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={24} color="#4299E1" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Categorías</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            <TouchableOpacity 
              style={[
                styles.categoryChip, 
                !selectedCategory && { backgroundColor: '#4299E1' }
              ]} 
              onPress={() => setSelectedCategory(null)}
            >
              <Ionicons 
                name="apps" 
                size={16} 
                color={!selectedCategory ? '#fff' : '#4299E1'} 
              />
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && { color: '#fff' }
              ]}>
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>🇪🇨 Ecuador</Text>
          <Switch
            value={showEcuadorPlaces}
            onValueChange={setShowEcuadorPlaces}
            trackColor={{ false: '#CBD5E0', true: '#4299E1' }}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>🗺️ Google</Text>
          <Switch
            value={useGooglePlaces}
            onValueChange={setUseGooglePlaces}
            trackColor={{ false: '#CBD5E0', true: '#4299E1' }}
            disabled={!hasPermission}
          />
        </View>
      </View>

      {/* Places List */}
      <FlatList
        data={places}
        renderItem={renderPlaceCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.placesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyStateTitle}>No se encontraron lugares</Text>
            <Text style={styles.emptyStateText}>
              {!hasPermission 
                ? 'Necesitas permitir el acceso a la ubicación para ver lugares cercanos'
                : 'Intenta ajustar tu búsqueda o vuelve a intentar más tarde'
              }
            </Text>
            {!hasPermission && (
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={() => Alert.alert('Permisos', 'Ve a Configuración > Spotlyvf > Ubicación para habilitar el acceso')}
              >
                <Text style={styles.permissionButtonText}>Configurar Permisos</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Cargando lugares...</Text>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  profileButton: {
    padding: 4,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F0FFF4',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#38A169',
  },
  locationErrorText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#E53E3E',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2D3748',
  },
  filterButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    width: 48,
    height: 48,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  switchContainer: {
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 4,
    fontWeight: '600',
  },
  placesList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E2E8F0',
  },
  placeInfo: {
    padding: 16,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 14,
    color: '#4299E1',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  placeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  reviewCount: {
    fontSize: 12,
    color: '#718096',
  },
  distance: {
    fontSize: 12,
    color: '#38A169',
    fontWeight: '600',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceRange: {
    fontSize: 12,
    color: '#E67E22',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 16,
    backgroundColor: '#4299E1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  categoriesContainer: {
    paddingVertical: 12,
    paddingLeft: 16,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
});
