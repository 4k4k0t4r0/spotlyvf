import axios from 'axios';

const GOOGLE_PLACES_API_KEY = 'AIzaSyC0O4LIdC9uQPGL0RU9xXgejC9YdbM6fow';
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Configuración específica para Ecuador
const ECUADOR_COUNTRY_CODE = 'EC';
const ECUADOR_BOUNDS = {
  north: 1.5,
  south: -5.0,
  east: -75.0,
  west: -92.0
};

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  vicinity: string;
}

export interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  next_page_token?: string;
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

class GooglePlacesService {
  /**
   * Buscar lugares cercanos usando Google Places Nearby Search
   */
  async searchNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 3000, // 3km por defecto para lugares más cercanos
    type?: string
  ): Promise<GooglePlace[]> {
    try {
      console.log(`🔍 Buscando lugares cerca de: ${latitude}, ${longitude} (Radio: ${radius}m)`);
      
      const params: any = {
        location: `${latitude},${longitude}`,
        radius: radius.toString(),
        key: GOOGLE_PLACES_API_KEY,
        language: 'es', // Español para Ecuador
        region: ECUADOR_COUNTRY_CODE, // Forzar resultados de Ecuador
      };

      // Solo agregar type si se especifica
      if (type) {
        params.type = type;
      }

      console.log('📡 Parámetros de búsqueda:', params);

      const response = await axios.get<GooglePlacesResponse>(
        `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`,
        { params }
      );

      console.log('📦 Respuesta de Google Places:', response.data);

      if (response.data.status === 'OK') {
        console.log(`✅ ${response.data.results.length} lugares encontrados`);
        return response.data.results;
      } else if (response.data.status === 'ZERO_RESULTS') {
        console.log('⚠️  No se encontraron lugares en esta área');
        return [];
      } else {
        console.error('❌ Google Places API error:', response.data.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error searching nearby places:', error);
      return [];
    }
  }

  /**
   * Buscar múltiples tipos de lugares específicos
   */
  async searchNearbyPlacesByTypes(
    latitude: number,
    longitude: number,
    types: string[] = ['restaurant', 'cafe', 'tourist_attraction', 'lodging'],
    radius: number = 3000
  ): Promise<GooglePlace[]> {
    try {
      const allPlaces: GooglePlace[] = [];
      
      // Hacer búsquedas para cada tipo específico
      for (const type of types) {
        console.log(`🔍 Buscando lugares de tipo: ${type}`);
        const placesForType = await this.searchNearbyPlaces(latitude, longitude, radius, type);
        allPlaces.push(...placesForType);
      }

      // Eliminar duplicados basados en place_id
      const uniquePlaces = allPlaces.filter((place, index, self) =>
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      console.log(`✅ Total de ${uniquePlaces.length} lugares únicos encontrados`);
      return uniquePlaces;
    } catch (error) {
      console.error('❌ Error searching places by types:', error);
      return [];
    }
  }

  /**
   * Buscar lugares por texto usando Google Places Text Search
   */
  async searchPlacesByText(
    query: string,
    latitude?: number,
    longitude?: number,
    radius?: number
  ): Promise<GooglePlace[]> {
    try {
      console.log(`🔍 Buscando lugares por texto: "${query}"`);
      
      const params: any = {
        query,
        key: GOOGLE_PLACES_API_KEY,
        language: 'es',
        region: ECUADOR_COUNTRY_CODE
      };

      // Si tenemos ubicación, agregar bias hacia esa ubicación
      if (latitude && longitude) {
        params.location = `${latitude},${longitude}`;
        if (radius) {
          params.radius = radius;
        }
      }

      console.log('📡 Parámetros de búsqueda por texto:', params);

      const response = await axios.get<GooglePlacesResponse>(
        `${GOOGLE_PLACES_BASE_URL}/textsearch/json`,
        { params }
      );

      console.log('📦 Respuesta de búsqueda por texto:', response.data);

      if (response.data.status === 'OK') {
        console.log(`✅ ${response.data.results.length} lugares encontrados por texto`);
        return response.data.results;
      } else if (response.data.status === 'ZERO_RESULTS') {
        console.log(`⚠️  No se encontraron lugares para: "${query}"`);
        return [];
      } else {
        console.error('❌ Google Places API error:', response.data.status);
        return [];
      }
    } catch (error) {
      console.error('Error searching places by text:', error);
      return [];
    }
  }

  /**
   * Obtener detalles de un lugar específico
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    try {
      const params = {
        place_id: placeId,
        fields: 'place_id,name,formatted_address,formatted_phone_number,website,geometry,photos,rating,user_ratings_total,price_level,types,opening_hours,reviews',
        key: GOOGLE_PLACES_API_KEY
      };

      const response = await axios.get(
        `${GOOGLE_PLACES_BASE_URL}/details/json`,
        { params }
      );

      if (response.data.status === 'OK') {
        return response.data.result;
      } else {
        console.error('Google Places API error:', response.data.status);
        return null;
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  /**
   * Obtener URL de foto de Google Places
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
  }

  /**
   * Convertir tipos de Google Places a categorías de Spotlyvf
   */
  mapGoogleTypesToCategory(types: string[]): { name: string; icon: string; color: string } {
    const categoryMap: { [key: string]: { name: string; icon: string; color: string } } = {
      // Comida y bebida
      restaurant: { name: 'Restaurantes', icon: 'restaurant-outline', color: '#E74C3C' },
      food: { name: 'Restaurantes', icon: 'restaurant-outline', color: '#E74C3C' },
      meal_takeaway: { name: 'Restaurantes', icon: 'restaurant-outline', color: '#E74C3C' },
      meal_delivery: { name: 'Restaurantes', icon: 'restaurant-outline', color: '#E74C3C' },
      cafe: { name: 'Cafeterías', icon: 'cafe-outline', color: '#8D6E63' },
      bakery: { name: 'Cafeterías', icon: 'cafe-outline', color: '#8D6E63' },
      bar: { name: 'Vida Nocturna', icon: 'wine-outline', color: '#F39C12' },
      night_club: { name: 'Vida Nocturna', icon: 'musical-notes-outline', color: '#F39C12' },
      
      // Hospedaje
      lodging: { name: 'Hoteles', icon: 'bed-outline', color: '#3498DB' },
      
      // Turismo y entretenimiento
      tourist_attraction: { name: 'Turismo', icon: 'camera-outline', color: '#2ECC71' },
      amusement_park: { name: 'Entretenimiento', icon: 'game-controller-outline', color: '#9B59B6' },
      zoo: { name: 'Entretenimiento', icon: 'paw-outline', color: '#9B59B6' },
      aquarium: { name: 'Entretenimiento', icon: 'fish-outline', color: '#16A085' },
      movie_theater: { name: 'Cine', icon: 'videocam-outline', color: '#34495E' },
      bowling_alley: { name: 'Entretenimiento', icon: 'game-controller-outline', color: '#9B59B6' },
      
      // Compras
      shopping_mall: { name: 'Compras', icon: 'storefront-outline', color: '#8E44AD' },
      store: { name: 'Compras', icon: 'storefront-outline', color: '#8E44AD' },
      supermarket: { name: 'Compras', icon: 'basket-outline', color: '#8E44AD' },
      
      // Cultura
      museum: { name: 'Cultura', icon: 'library-outline', color: '#1ABC9C' },
      art_gallery: { name: 'Cultura', icon: 'color-palette-outline', color: '#1ABC9C' },
      library: { name: 'Bibliotecas', icon: 'book-outline', color: '#1ABC9C' },
      
      // Deportes y fitness
      gym: { name: 'Deportes', icon: 'barbell-outline', color: '#E67E22' },
      stadium: { name: 'Deportes', icon: 'football-outline', color: '#E67E22' },
      spa: { name: 'Bienestar', icon: 'flower-outline', color: '#16A085' },
      
      // Naturaleza
      park: { name: 'Parques', icon: 'leaf-outline', color: '#27AE60' },
      
      // Servicios
      hospital: { name: 'Salud', icon: 'medical-outline', color: '#C0392B' },
      bank: { name: 'Servicios', icon: 'card-outline', color: '#34495E' },
      atm: { name: 'Servicios', icon: 'cash-outline', color: '#34495E' },
      gas_station: { name: 'Servicios', icon: 'car-outline', color: '#F39C12' },
      pharmacy: { name: 'Salud', icon: 'medical-outline', color: '#C0392B' },
      
      // Transporte
      subway_station: { name: 'Transporte', icon: 'train-outline', color: '#7F8C8D' },
      bus_station: { name: 'Transporte', icon: 'bus-outline', color: '#7F8C8D' },
      airport: { name: 'Transporte', icon: 'airplane-outline', color: '#7F8C8D' }
    };

    // Buscar el primer tipo que coincida con prioridad
    const priorityTypes = [
      'restaurant', 'cafe', 'tourist_attraction', 'lodging', 'museum', 
      'park', 'shopping_mall', 'gym', 'bar', 'night_club', 'movie_theater'
    ];
    
    for (const priorityType of priorityTypes) {
      if (types.includes(priorityType) && categoryMap[priorityType]) {
        return categoryMap[priorityType];
      }
    }

    // Buscar cualquier tipo que coincida
    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    // Categoría por defecto
    return { name: 'Otros', icon: 'location-outline', color: '#95A5A6' };
  }

  /**
   * Convertir precio level de Google a formato Spotlyvf
   */
  mapPriceLevel(priceLevel?: number): string {
    switch (priceLevel) {
      case 0: return 'Gratis';
      case 1: return '$';
      case 2: return '$$';
      case 3: return '$$$';
      case 4: return '$$$$';
      default: return '$';
    }
  }

  /**
   * Buscar lugares específicos en Quito por categorías
   */
  async searchQuitoPlacesByCategory(
    latitude: number,
    longitude: number,
    category: string,
    radius: number = 5000
  ): Promise<GooglePlace[]> {
    try {
      // Mapear categorías a consultas específicas para Quito
      const categoryQueries: { [key: string]: string[] } = {
        'Restaurantes': [
          'restaurantes cerca de mi Quito', 
          'pizza Quito', 
          'comida Quito', 
          'SportPizza Quito',
          'Don Feliciano Quito',
          'KFC Quito',
          'McDonald\'s Quito',
          'Burger King Quito'
        ],
        'Cafeterías': [
          'café Quito', 
          'cafetería Quito', 
          'Juan Valdez Quito',
          'Sweet & Coffee Quito',
          'Starbucks Quito'
        ],
        'Turismo': [
          'turismo Quito', 
          'lugares turísticos Quito', 
          'Centro Histórico Quito',
          'Plaza Grande Quito',
          'Basílica del Voto Nacional',
          'Panecillo Quito'
        ],
        'Hoteles': [
          'hoteles Quito', 
          'hospedaje Quito', 
          'alojamiento Quito',
          'Hilton Quito',
          'JW Marriott Quito'
        ],
        'Cultura': [
          'museos Quito', 
          'cultura Quito', 
          'centro histórico Quito',
          'Casa de la Cultura Quito',
          'Museo de la Ciudad'
        ],
        'Parques': [
          'parques Quito', 
          'espacios verdes Quito',
          'Parque El Ejido',
          'Parque La Carolina',
          'Parque Metropolitano'
        ],
        'Compras': [
          'centros comerciales Quito', 
          'shopping Quito', 
          'Mall El Jardín',
          'CCI Quito',
          'Quicentro Shopping'
        ],
        'Deportes': [
          'gimnasios Quito', 
          'canchas Quito', 
          'deporte Quito',
          'Smart Fit Quito',
          'canchas de fútbol Quito',
          'canchas sintéticas Quito'
        ],
        'Vida Nocturna': [
          'bares Quito', 
          'discotecas Quito', 
          'vida nocturna Quito',
          'Mariscal Quito',
          'zona rosa Quito'
        ],
        'Entretenimiento': [
          'cine Quito', 
          'entretenimiento Quito', 
          'Cinemark Quito',
          'Multicines Quito',
          'bowling Quito'
        ]
      };

      const queries = categoryQueries[category] || [category + ' Quito'];
      const allPlaces: GooglePlace[] = [];

      for (const query of queries) {
        console.log(`🔍 Buscando: "${query}" cerca de Quito`);
        const places = await this.searchPlacesByText(query, latitude, longitude, radius);
        allPlaces.push(...places);
        
        // Pausa pequeña entre consultas para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Eliminar duplicados
      const uniquePlaces = allPlaces.filter((place, index, self) =>
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      return uniquePlaces;
    } catch (error) {
      console.error('❌ Error searching Quito places by category:', error);
      return [];
    }
  }

  /**
   * Buscar lugares específicos cercanos al usuario (radio pequeño)
   */
  async searchNearbySpecificPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000 // 2km para lugares muy cercanos
  ): Promise<GooglePlace[]> {
    try {
      const specificQueries = [
        'pizza cerca de mi',
        'restaurantes cerca de mi',
        'café cerca de mi',
        'canchas cerca de mi',
        'gimnasio cerca de mi',
        'farmacia cerca de mi',
        'supermercado cerca de mi',
        'gasolinera cerca de mi'
      ];

      const allResults: GooglePlace[] = [];

      for (const query of specificQueries) {
        const places = await this.searchPlacesByText(
          query, 
          latitude, 
          longitude, 
          radius
        );
        allResults.push(...places);
        
        // Pausa pequeña entre consultas
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Eliminar duplicados
      const uniquePlaces = allResults.filter((place, index, self) =>
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      // Filtrar por distancia real
      const nearbyPlaces = uniquePlaces.filter(place => {
        if (!place.geometry?.location) return false;
        
        const distance = this.calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );
        
        return distance <= (radius / 1000); // Convertir metros a km
      });

      console.log(`✅ ${nearbyPlaces.length} lugares específicos cercanos encontrados`);
      return nearbyPlaces;
    } catch (error) {
      console.error('❌ Error searching nearby specific places:', error);
      return [];
    }
  }

  /**
   * Buscar lugares populares específicos de Quito
   */
  async searchQuitoPopularPlaces(
    latitude: number,
    longitude: number,
    radius: number = 3000
  ): Promise<GooglePlace[]> {
    try {
      // Lugares específicos y populares que debería encontrar en Quito
      const quitoSpecificPlaces = [
        'SportPizza Quito',
        'Don Feliciano Quito',
        'Tokyo Internacional Quito',
        'El Corral Quito',
        'Papas & Beer Quito',
        'KFC Quito norte',
        'McDonald\'s Quito',
        'Domino\'s Pizza Quito',
        'Pizza Hut Quito',
        'Burger King Quito',
        'Juan Valdez Café Quito',
        'Sweet & Coffee Quito',
        'Starbucks Quito',
        'Mall El Jardín Quito',
        'CCI Quito',
        'Quicentro Shopping',
        'Smart Fit Quito',
        'Multicines Quito',
        'Cinemark Quito',
        'Plaza Grande Quito',
        'Basílica del Voto Nacional',
        'Teleférico Quito',
        'Parque La Carolina',
        'Centro Histórico Quito',
        'Mitad del Mundo',
        'canchas sintéticas Quito norte',
        'canchas de fútbol Quito',
        'farmacias Fybeca Quito',
        'SuperMaxi Quito',
        'Mega Santa María Quito'
      ];

      const allResults: GooglePlace[] = [];

      // Buscar cada lugar específico
      for (const placeName of quitoSpecificPlaces) {
        try {
          console.log(`🔍 Buscando lugar específico: ${placeName}`);
          const places = await this.searchPlacesByText(
            placeName,
            latitude,
            longitude,
            radius
          );
          
          if (places.length > 0) {
            allResults.push(...places);
          }
          
          // Pausa pequeña para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`⚠️ Error buscando ${placeName}:`, error);
        }
      }

      // Eliminar duplicados
      const uniquePlaces = allResults.filter((place, index, self) =>
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      // Filtrar por distancia real
      const nearbyPlaces = uniquePlaces.filter(place => {
        if (!place.geometry?.location) return false;
        
        const distance = this.calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );
        
        return distance <= (radius / 1000);
      });

      console.log(`✅ ${nearbyPlaces.length} lugares populares de Quito encontrados`);
      return nearbyPlaces;
    } catch (error) {
      console.error('❌ Error searching Quito popular places:', error);
      return [];
    }
  }

  /**
   * Calcular distancia entre dos puntos en km
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const googlePlacesService = new GooglePlacesService();
