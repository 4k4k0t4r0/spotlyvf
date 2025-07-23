import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../../domain/types';
import { reviewApi, apiClient } from '../../data/apiClient';
import { googleReviewsApi, GoogleReview } from '../../data/googleReviewsApi';
import { WriteReviewModal } from '../components/WriteReviewModal';

interface PlaceDetailsScreenProps {
  route: {
    params: {
      place?: Place;
      placeId?: string;
    };
  };
  navigation: any;
}

export const PlaceDetailsScreen: React.FC<PlaceDetailsScreenProps> = ({ route, navigation }) => {
  const { place: initialPlace, placeId } = route.params;
  const [place, setPlace] = useState<Place | null>(initialPlace || null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingGoogleReviews, setIsLoadingGoogleReviews] = useState(false);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);

  useEffect(() => {
    console.log('🔍 PlaceDetailsScreen iniciado con:', {
      initialPlace: initialPlace ? {
        id: initialPlace.id,
        name: initialPlace.name,
        address: initialPlace.address,
        city: initialPlace.city,
        isGooglePlace: initialPlace.isGooglePlace,
        primary_image: initialPlace.primary_image
      } : null,
      placeId
    });
    
    if (initialPlace) {
      // Verificar si el ID del lugar es un UUID válido o un google_place_id
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(initialPlace.id);
      
      if (isUUID && initialPlace.google_place_id !== undefined) {
        // ID válido y datos completos
        console.log('✅ Usando lugar existente con UUID válido y datos completos');
        setPlace(initialPlace);
        // Usar setTimeout para asegurar que el estado se haya actualizado
        setTimeout(() => {
          loadReviews();
          loadGoogleReviews(initialPlace); // Pasar el lugar directamente
        }, 100);
      } else if (!isUUID) {
        // El ID es probablemente un google_place_id, usar los datos del Discover directamente
        console.log('🔍 ID no es UUID (probablemente google_place_id). Usando datos del Discover directamente:', initialPlace.name);
        
        // Para lugares de Google Places del Discover, usar los datos directamente
        const enhancedPlace = {
          ...initialPlace,
          google_place_id: initialPlace.id,  // El ID es el google_place_id
          isGooglePlace: true
        };
        
        setPlace(enhancedPlace);
        
        // Cargar reseñas después de establecer el lugar
        setTimeout(() => {
          loadReviews();
          loadGoogleReviews(enhancedPlace);
        }, 100);
      } else {
        // UUID válido pero datos incompletos, recargar
        console.log('🔄 UUID válido pero datos incompletos, recargando');
        loadPlaceDetails();
      }
    } else if (placeId) {
      // Solo tenemos el ID, necesitamos cargar todo
      console.log('🔄 Cargando lugar desde ID:', placeId);
      loadPlaceById(placeId);
    } else {
      console.error('❌ No se proporcionó lugar ni placeId');
    }
  }, []);

  const loadPlaceById = async (id: string) => {
    setIsLoadingPlace(true);
    try {
      console.log('🔄 Cargando lugar por ID:', id);
      
      let response;
      let loadedPlace;
      
      try {
        // Primero intentar buscar por ID normal
        const placeResponse = await apiClient.get(`/places/${id}/`);
        loadedPlace = placeResponse as unknown as Place;
      } catch (error) {
        // Si falla, podría ser que el ID sea un google_place_id
        console.log('🔍 ID no encontrado, buscando por google_place_id:', id);
        
        try {
          const searchData = await apiClient.get(`/places/?google_place_id=${id}`);
          console.log('🔍 Search data type:', typeof searchData);
          console.log('🔍 Search data:', JSON.stringify(searchData));
          console.log('🔍 searchData has results?', searchData && typeof searchData === 'object' && 'results' in searchData);
          
          if (searchData && 
              typeof searchData === 'object' && 
              'results' in searchData && 
              Array.isArray((searchData as any).results) && 
              (searchData as any).results.length > 0) {
            loadedPlace = (searchData as any).results[0] as Place;
            console.log('✅ Lugar encontrado por google_place_id:', loadedPlace.name);
          } else {
            console.log('❌ No se encontraron resultados en searchData');
            console.log('❌ searchData debug:', {
              exists: !!searchData,
              isObject: typeof searchData === 'object',
              hasResults: searchData && typeof searchData === 'object' && 'results' in searchData,
              resultsLength: searchData && typeof searchData === 'object' && 'results' in searchData ? (searchData as any).results?.length : 'N/A'
            });
            throw new Error('Lugar no encontrado por google_place_id');
          }
        } catch (searchError) {
          console.error('❌ Error en búsqueda por google_place_id:', searchError);
          throw new Error('Error buscando lugar por google_place_id');
        }
      }
      
      console.log('✅ Lugar cargado:', {
        id: loadedPlace.id,
        name: loadedPlace.name,
        isGooglePlace: loadedPlace.isGooglePlace,
        google_place_id: loadedPlace.google_place_id
      });
      
      setPlace(loadedPlace);
      
      // Cargar reseñas solo después de tener el lugar cargado
      console.log('🔄 Iniciando carga de reseñas para lugar cargado');
      
      // Usar setTimeout para asegurar que el estado se haya actualizado
      setTimeout(() => {
        loadReviews();
        loadGoogleReviews(loadedPlace); // Pasar el lugar directamente
      }, 100);
    } catch (error) {
      console.error('❌ Error cargando lugar por ID:', error);
      Alert.alert('Error', 'No se pudo cargar la información del lugar');
      navigation.goBack();
    } finally {
      setIsLoadingPlace(false);
    }
  };

  const loadPlaceDetails = async () => {
    if (!initialPlace) return;
    
    setIsLoadingPlace(true);
    try {
      console.log('🔄 Recargando datos completos del lugar:', initialPlace.id);
      const response = await apiClient.get(`/places/${initialPlace.id}/`);
      const completePlace = response.data as Place;
      
      console.log('✅ Lugar recargado:', {
        id: completePlace.id,
        name: completePlace.name,
        isGooglePlace: completePlace.isGooglePlace,
        google_place_id: completePlace.google_place_id
      });
      
      setPlace(completePlace);
      
      // Cargar reseñas después de actualizar el lugar
      setTimeout(() => {
        loadReviews();
        loadGoogleReviews(completePlace); // Pasar el lugar directamente
      }, 100);
    } catch (error) {
      console.error('❌ Error recargando lugar:', error);
    } finally {
      setIsLoadingPlace(false);
    }
  };

  const loadReviews = async () => {
    if (!place) {
      console.log('⚠️ No hay lugar disponible para cargar reseñas');
      return;
    }
    
    setIsLoadingReviews(true);
    
    try {
      // Verificar si es un lugar de Google Places usando el campo correcto
      const isGooglePlace = place.isGooglePlace || !!place.google_place_id;
      
      if (isGooglePlace) {
        console.log('🗺️ Lugar de Google Places - buscando reseñas locales...');
        
        // Para lugares de Google Places, usar el endpoint place_reviews que maneja Google Place IDs
        try {
          console.log('🔍 Cargando reseñas para Google Place ID:', place.id);
          const response = await reviewApi.getPlaceReviews(place.id);
          const localReviews = (response as any).results || (response as any) || [];
          
          console.log('📊 Respuesta de reseñas lugar Google:', JSON.stringify(response, null, 2));
          console.log('📝 Primera reseña:', localReviews[0] ? JSON.stringify(localReviews[0], null, 2) : 'No hay reseñas');
          console.log('👤 user_name de primera reseña:', localReviews[0]?.user_name);
          
          setReviews(localReviews);
          
          if (localReviews.length === 0) {
            console.log('📝 No hay reseñas locales para este lugar de Google Places');
          } else {
            console.log(`✅ ${localReviews.length} reseñas locales encontradas`);
          }
        } catch (error) {
          console.log('ℹ️ No hay reseñas locales para este lugar de Google:', error);
          setReviews([]);
        }
        
        // NO hacer return aquí - continuar con la carga normal
      } else {
        // Para lugares de nuestra base de datos
        const placeId = place.id; // Keep as UUID string
        if (!placeId) {
          console.log('❌ ID de lugar no válido para reseñas:', place.id);
          setReviews([]);
          return;
        }

        const response = await reviewApi.getPlaceReviews(placeId);
        console.log('📊 Respuesta de reseñas lugar regular:', JSON.stringify(response, null, 2));
        const reviewsData = (response as any).results || (response as any) || [];
        console.log('👤 user_name de primera reseña regular:', reviewsData[0]?.user_name);
        console.log('✅ Reseñas cargadas:', response);
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('❌ Error cargando reseñas:', error);
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const loadGoogleReviews = async (placeToUse?: Place) => {
    const currentPlace = placeToUse || place;
    
    if (!currentPlace) {
      console.log('⚠️ No hay lugar disponible para cargar reseñas de Google');
      return;
    }
    
    // Verificar si es un lugar de Google Places usando el campo correcto
    const isGooglePlace = currentPlace.isGooglePlace || !!currentPlace.google_place_id;
    console.log('🔍 Verificando si es lugar de Google:', { 
      isGooglePlace, 
      hasGooglePlaceId: !!currentPlace.google_place_id,
      googlePlaceId: currentPlace.google_place_id,
      placeId: currentPlace.id 
    });
    
    if (!isGooglePlace || !currentPlace.google_place_id) {
      console.log('⏭️ No es un lugar de Google Places o no tiene google_place_id, saltando carga de reseñas de Google');
      return;
    }

    setIsLoadingGoogleReviews(true);
    
    try {
      console.log('🔍 Cargando reseñas de Google para:', currentPlace.google_place_id);
      
      // Test directo con fetch para debug
      const testUrl = `http://192.168.100.13:8000/api/v1/google-reviews/by_place/?place_id=${currentPlace.google_place_id}`;
      console.log('🌐 URL de prueba:', testUrl);
      
      const directResponse = await fetch(testUrl);
      const directData = await directResponse.json();
      console.log('🔬 Respuesta directa con fetch:', directData);
      
      // Usar la API normal
      const response = await googleReviewsApi.getGoogleReviews(currentPlace.google_place_id);
      console.log('📊 Respuesta de reseñas de Google via API:', response);
      console.log(`✅ ${response.reviews_in_database} reseñas de Google en BD`);
      
      if (response.total_reviews_on_google) {
        console.log(`📊 Total en Google: ${response.total_reviews_on_google}, Obtenidas: ${response.reviews_in_database}`);
        console.log(`ℹ️ Limitación: ${response.limitation_explanation}`);
      }
      
      setGoogleReviews(response.reviews);
    } catch (error) {
      console.error('❌ Error cargando reseñas de Google:', error);
      setGoogleReviews([]);
    } finally {
      setIsLoadingGoogleReviews(false);
    }
  };

  const handleReservation = () => {
    if (!place) {
      Alert.alert('Error', 'Información del lugar no disponible');
      return;
    }
    
    // Determinar si es un lugar de Google Places usando el campo correcto
    const isGooglePlace = place.isGooglePlace || !!place.google_place_id;
    const placeWithGoogleFlag = {
      ...place,
      isGooglePlace
    };
    navigation.navigate('MakeReservation', { place: placeWithGoogleFlag });
  };

  const handleCall = () => {
    if (!place) {
      Alert.alert('Error', 'Información del lugar no disponible');
      return;
    }
    
    if (place.contactInfo?.phone || place.phone) {
      const phoneNumber = place.contactInfo?.phone || place.phone || '';
      Alert.alert(
        'Llamar al lugar',
        `¿Deseas llamar a ${place.name}?\n${phoneNumber}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Llamar', onPress: () => console.log('Calling:', phoneNumber) }
        ]
      );
    } else {
      Alert.alert('Sin información', 'No hay número de teléfono disponible');
    }
  };

  const handleDirections = () => {
    if (!place) {
      Alert.alert('Error', 'Información del lugar no disponible');
      return;
    }
    
    Alert.alert(
      'Ir al lugar',
      `¿Deseas abrir el mapa para ir a ${place.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Mapa', onPress: () => console.log('Opening maps for:', place.name) }
      ]
    );
  };

  // Loading state o lugar no disponible
  if (isLoadingPlace || !place) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
        <Text style={{ fontSize: 16, color: '#666' }}>
          {isLoadingPlace ? 'Cargando lugar...' : 'Lugar no disponible'}
        </Text>
      </View>
    );
  }

  const images = place.images && place.images.length > 0 
    ? place.images.map(img => img.image)
    : place.primary_image 
    ? [place.primary_image]
    : place.isGooglePlace && place.name?.toLowerCase().includes('pizza')
    ? ['https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'] // Pizza restaurant
    : place.category?.name === 'Restaurantes' || place.name?.toLowerCase().includes('pizza')
    ? ['https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'] // Pizza restaurant
    : place.category?.name === 'Hoteles' 
    ? ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'] // Hotel
    : ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']; // Generic restaurant

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header con imagen */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: images[selectedImageIndex] }}
          style={styles.headerImage}
        />
        
        {/* Botón de regreso */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Indicadores de imágenes si hay múltiples */}
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.activeIndicator
                ]}
                onPress={() => setSelectedImageIndex(index)}
              />
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información básica */}
        <View style={styles.basicInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.placeName}>{place.name}</Text>
            
            <View style={styles.categoryBadge}>
              <Ionicons 
                name={place.category.icon as any} 
                size={14} 
                color={place.category.color} 
              />
              <Text style={[styles.categoryText, { color: place.category.color }]}>
                {place.category.name}
              </Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#F6AD55" />
              <Text style={styles.ratingText}>
                {place.average_rating ? parseFloat(place.average_rating).toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.reviewCount}>
                ({place.total_reviews || 0} reseñas)
              </Text>
            </View>
            {place.distance && (
              <Text style={styles.distance}>
                {place.distance.toFixed(1)}km de distancia
              </Text>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color="#718096" />
            <Text style={styles.address}>
              {place.address}, {place.city}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Ionicons name="card" size={16} color="#718096" />
            <Text style={styles.priceRange}>
              Rango de precios: {place.price_range || place.priceRange || '$'}
            </Text>
          </View>
        </View>

        {/* Descripción */}
        {place.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{place.description}</Text>
          </View>
        )}

        {/* Características */}
        {place.features && place.features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Características</Text>
            <View style={styles.featuresContainer}>
              {place.features.map((feature, index) => (
                <View key={index} style={styles.featureChip}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Información de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          {(place.contactInfo?.phone || place.phone) && (
            <View style={styles.contactItem}>
              <Ionicons name="call" size={16} color="#4299E1" />
              <Text style={styles.contactText}>
                {place.contactInfo?.phone || place.phone}
              </Text>
            </View>
          )}
          {(place.contactInfo?.email || place.email) && (
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={16} color="#4299E1" />
              <Text style={styles.contactText}>
                {place.contactInfo?.email || place.email}
              </Text>
            </View>
          )}
          {(place.contactInfo?.website || place.website) && (
            <View style={styles.contactItem}>
              <Ionicons name="globe" size={16} color="#4299E1" />
              <Text style={styles.contactText}>
                {place.contactInfo?.website || place.website}
              </Text>
            </View>
          )}
        </View>

        {/* Sección de Reseñas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reseñas</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F6AD55" />
              <Text style={styles.averageRating}>
                {place.average_rating ? parseFloat(place.average_rating).toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.reviewCount}>
                ({place.total_reviews || 0} reseñas)
              </Text>
            </View>
          </View>

          {/* Mostrar reseñas basado en si es lugar de Google o lugar normal */}
          {(place.isGooglePlace || place.google_place_id) ? (
            <View style={styles.reviewsList}>
              {/* Loading state para Google reviews */}
              {isLoadingGoogleReviews && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Cargando reseñas de Google...</Text>
                </View>
              )}

              {/* Mostrar reseñas de Google si están disponibles */}
              {googleReviews.length > 0 && (
                <View style={styles.googleReviewsSection}>
                  <View style={styles.googleSectionHeader}>
                    <Ionicons name="logo-google" size={16} color="#4285F4" />
                    <Text style={styles.googleSectionTitle}>Reseñas de Google</Text>
                    <Text style={styles.reviewsCount}>({googleReviews.length})</Text>
                  </View>
                  
                  {googleReviews.slice(0, 3).map((googleReview, index) => (
                    <View key={`google-${index}`} style={styles.googleReviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUserInfo}>
                          {googleReview.reviewer_avatar_url ? (
                            <Image 
                              source={{ uri: googleReview.reviewer_avatar_url }} 
                              style={styles.googleUserAvatar}
                            />
                          ) : (
                            <View style={styles.googleUserAvatarPlaceholder}>
                              <Text style={styles.userInitial}>
                                {googleReview.reviewer_name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View>
                            <Text style={styles.userName}>{googleReview.reviewer_name}</Text>
                            <Text style={styles.reviewerCount}>
                              {googleReview.reviewer_review_count} reseñas en Google
                            </Text>
                            <View style={styles.reviewRating}>
                              {[...Array(5)].map((_, i) => (
                                <Ionicons
                                  key={i}
                                  name={i < googleReview.rating ? "star" : "star-outline"}
                                  size={12}
                                  color="#F6AD55"
                                />
                              ))}
                            </View>
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>
                          {new Date(googleReview.review_date).toLocaleDateString('es-ES')}
                        </Text>
                      </View>
                      
                      {googleReview.review_text && (
                        <Text style={styles.reviewContent} numberOfLines={4}>
                          {googleReview.review_text}
                        </Text>
                      )}
                      
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="logo-google" size={12} color="#4285F4" />
                        <Text style={styles.verifiedText}>Reseña de Google</Text>
                      </View>
                    </View>
                  ))}
                  
                  {/* Explicación de limitación de Google */}
                  <View style={styles.googleLimitationBox}>
                    <View style={styles.limitationHeader}>
                      <Ionicons name="information-circle" size={16} color="#FF9500" />
                      <Text style={styles.limitationTitle}>Sobre las reseñas de Google</Text>
                    </View>
                    <Text style={styles.limitationText}>
                      Google Places API solo proporciona máximo 5 reseñas por lugar. 
                      Este lugar tiene {place.total_reviews || 111} reseñas en Google Maps.
                    </Text>
                  </View>
                  
                  {googleReviews.length > 3 && (
                    <TouchableOpacity style={styles.viewAllReviews}>
                      <Text style={styles.viewAllText}>
                        Ver todas las reseñas de Google ({googleReviews.length})
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#4285F4" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Si no hay reseñas de Google y no está cargando, mostrar botón para recargar */}
              {googleReviews.length === 0 && !isLoadingGoogleReviews && (
                <View style={styles.googlePlaceContainer}>
                  <Ionicons name="logo-google" size={40} color="#4285F4" />
                  <Text style={styles.googlePlaceTitle}>Lugar de Google Places</Text>
                  <Text style={styles.googlePlaceSubtext}>
                    Este lugar está verificado por Google con {place.total_reviews || 111} reseñas.
                  </Text>
                  <TouchableOpacity 
                    style={styles.writeReviewButton}
                    onPress={() => {
                      console.log('🔄 Recargando reseñas de Google manualmente');
                      loadGoogleReviews();
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.writeReviewText}>Cargar Reseñas de Google</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reseñas locales */}
              {reviews.length > 0 && (
                <View style={styles.googleReviewsSection}>
                  <View style={styles.googlePlaceHeader}>
                    <Ionicons name="people" size={16} color="#4299E1" />
                    <Text style={styles.googlePlaceHeaderText}>
                      Reseñas locales ({reviews.length})
                    </Text>
                  </View>
                  {reviews.slice(0, 3).map((review, index) => (
                    <View key={index} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUserInfo}>
                          <View style={styles.userAvatar}>
                            <Text style={styles.userInitial}>
                              {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.userName}>{review.user_name || 'Usuario'}</Text>
                            <View style={styles.reviewRating}>
                              {[...Array(5)].map((_, i) => (
                                <Ionicons
                                  key={i}
                                  name={i < review.rating ? "star" : "star-outline"}
                                  size={12}
                                  color="#F6AD55"
                                />
                              ))}
                            </View>
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString('es-ES')}
                        </Text>
                      </View>
                      
                      {review.title && (
                        <Text style={styles.reviewTitle}>{review.title}</Text>
                      )}
                      
                      <Text style={styles.reviewContent} numberOfLines={3}>
                        {review.content}
                      </Text>
                      
                      {review.would_recommend && (
                        <View style={styles.recommendBadge}>
                          <Ionicons name="thumbs-up" size={12} color="#38A169" />
                          <Text style={styles.recommendText}>Recomendado</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Botón para agregar reseña */}
              <TouchableOpacity 
                style={styles.addReviewButton}
                onPress={() => setShowWriteReviewModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4299E1" />
                <Text style={styles.addReviewText}>Agregar mi reseña</Text>
              </TouchableOpacity>
            </View>
          ) : isLoadingReviews ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando reseñas...</Text>
            </View>
          ) : reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.slice(0, 3).map((review, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUserInfo}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userInitial}>
                          {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.userName}>{review.user_name || 'Usuario'}</Text>
                        <View style={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.rating ? "star" : "star-outline"}
                              size={12}
                              color="#F6AD55"
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                  
                  {review.title && (
                    <Text style={styles.reviewTitle}>{review.title}</Text>
                  )}
                  
                  <Text style={styles.reviewContent} numberOfLines={3}>
                    {review.content}
                  </Text>
                  
                  {review.would_recommend && (
                    <View style={styles.recommendBadge}>
                      <Ionicons name="thumbs-up" size={12} color="#38A169" />
                      <Text style={styles.recommendText}>Recomendado</Text>
                    </View>
                  )}
                </View>
              ))}
              
              {reviews.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllReviews}
                  onPress={() => navigation.navigate('Reviews')}
                >
                  <Text style={styles.viewAllText}>
                    Ver todas las reseñas ({reviews.length})
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#4299E1" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="chatbubble-outline" size={40} color="#CBD5E0" />
              <Text style={styles.noReviewsText}>No hay reseñas aún</Text>
              <Text style={styles.noReviewsSubtext}>
                Sé el primero en compartir tu experiencia
              </Text>
            </View>
          )}
        </View>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Botones de acción fijos */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#4299E1" />
          <Text style={styles.secondaryButtonText}>Llamar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={20} color="#4299E1" />
          <Text style={styles.secondaryButtonText}>Direcciones</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleReservation}>
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para escribir reseña */}
      <WriteReviewModal
        visible={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
        place={place}
        onReviewSubmitted={loadReviews}
      />
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  basicInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  reviewCount: {
    fontSize: 14,
    color: '#718096',
  },
  distance: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceRange: {
    fontSize: 14,
    color: '#4A5568',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A5568',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    color: '#4A5568',
  },
  bottomSpacing: {
    height: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4299E1',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4299E1',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4299E1',
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
  },
  disabledButtonText: {
    color: '#A0AEC0',
  },
  // Estilos para reseñas
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  averageRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#718096',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  recommendText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#38A169',
  },
  viewAllReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4299E1',
  },
  noReviewsContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  // Estilos para lugares de Google Places
  googlePlaceContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    margin: 16,
    gap: 12,
  },
  googlePlaceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  googlePlaceSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299E1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  googlePlaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    marginBottom: 12,
  },
  googlePlaceHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4299E1',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#4299E1',
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  addReviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4299E1',
  },
  // Estilos para reseñas de Google
  googleReviewsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  googleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  googleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  reviewsCount: {
    fontSize: 14,
    color: '#718096',
  },
  googleReviewCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  googleUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  googleUserAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4285F4',
  },
  helpfulBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  helpfulText: {
    fontSize: 12,
    color: '#666',
  },
  businessResponse: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 3,
    borderLeftColor: '#FFB800',
    borderRadius: 8,
  },
  businessResponseTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    marginBottom: 4,
  },
  businessResponseText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  // Estilos para limitación de Google
  googleLimitationBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  limitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  limitationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  limitationText: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 16,
    marginBottom: 8,
  },
  viewOnGoogleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  viewOnGoogleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4285F4',
  },
});
