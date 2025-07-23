import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place, Reservation } from '../../domain/types';
import { reservationApi } from '../../data/apiClient';
import { googlePlacesReservationsService } from '../../data/googlePlacesReservations';

interface MakeReservationScreenProps {
  route: {
    params: {
      place: Place;
    };
  };
  navigation: any;
}

export const MakeReservationScreen: React.FC<MakeReservationScreenProps> = ({ route, navigation }) => {
  const { place } = route.params;
  
  // Log para verificar qué datos recibe la pantalla de reservas
  console.log('🎯 MakeReservationScreen iniciado con lugar:', {
    id: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    isGooglePlace: place.isGooglePlace,
    google_place_id: place.google_place_id,
    primary_image: place.primary_image
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [partySize, setPartySize] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setSelectedTime(date);
    }
  };

  const validateReservation = (): boolean => {
    const now = new Date();
    const reservationDate = new Date(selectedDate);
    reservationDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());

    if (reservationDate <= now) {
      Alert.alert('Fecha inválida', 'La reserva debe ser para una fecha y hora futura');
      return false;
    }

    const partySizeNum = parseInt(partySize);
    if (isNaN(partySizeNum) || partySizeNum < 1 || partySizeNum > 20) {
      Alert.alert('Tamaño de grupo inválido', 'El tamaño del grupo debe ser entre 1 y 20 personas');
      return false;
    }

    return true;
  };

  const handleMakeReservation = async () => {
    if (!validateReservation()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 DEBUGGING LUGAR RECIBIDO:');
      console.log('- ID:', place.id);
      console.log('- Nombre:', place.name);
      console.log('- Ciudad:', place.city);
      console.log('- Dirección:', place.address);
      console.log('- ¿Es Google Place?:', place.isGooglePlace);
      console.log('- Lugar completo:', JSON.stringify(place, null, 2));
      
      // Crear objeto Date combinando fecha y hora
      const reservationDateTime = new Date(selectedDate);
      reservationDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

      // NUEVA LÓGICA SIMPLIFICADA: Determinar si es Google Place
      // Usar la información ya procesada desde PlaceDetailsScreen
      const isGooglePlace = place.isGooglePlace || !!place.google_place_id;
      
      console.log('🔍 Información del lugar para reserva:', {
        esGooglePlace: isGooglePlace,
        id: place.id,
        googlePlaceId: place.google_place_id,
        nombre: place.name,
        direccion: place.address,
        ciudad: place.city
      });
      
      let reservationData: any = {
        reservation_date: selectedDate.toISOString().split('T')[0], // Solo la fecha (YYYY-MM-DD)
        reservation_time: selectedTime.toTimeString().split(' ')[0], // Solo la hora (HH:MM:SS)
        party_size: parseInt(partySize),
        special_requests: specialRequests.trim(),
        contact_name: 'Usuario Actual', // TODO: Obtener del perfil del usuario
        contact_phone: '+593 99 999 9999', // TODO: Obtener del perfil del usuario
        contact_email: 'usuario@email.com', // TODO: Obtener del perfil del usuario
      };
      
      if (isGooglePlace) {
        // Para lugares de Google Places, usar el google_place_id correcto
        const googlePlaceId = place.google_place_id || place.id;
        // NO asignar place, solo google_place_id
        reservationData.google_place_id = googlePlaceId;
        console.log('🗺️ Creando reserva para lugar de Google Places:', place.name, 'Google Place ID:', googlePlaceId);
      } else {
        // Para lugares de nuestra BD, usar el UUID directamente
        reservationData.place = place.id;
        console.log('🏢 Creando reserva para lugar de BD (UUID):', place.name, 'UUID:', place.id);
      }

      console.log('📝 Enviando reserva:', reservationData);
      
      // NUEVA LÓGICA: Siempre intentar crear en la API primero
      // Si es Google Place con lugar vinculado en BD, se creará normalmente
      // Si no hay lugar vinculado, se manejará como antes
      
      let response;
      try {
        // Intentar crear en la API real primero
        response = await reservationApi.createReservation(reservationData);
        console.log('✅ Reserva creada exitosamente en BD:', response);
        
        const confirmationMessage = `Tu reserva en ${place.name} ha sido enviada.\n\nFecha: ${formatDate(selectedDate)}\nHora: ${formatTime(selectedTime)}\nPersonas: ${partySize}\nCódigo: ${(response as any).confirmation_code || 'PENDIENTE'}\n\nEstado: Pendiente de aprobación\n\nEl negocio revisará tu solicitud y te notificaremos cuando sea aprobada.`;
        
        Alert.alert(
          'Reserva Enviada',
          confirmationMessage,
          [
            {
              text: 'Ver Mis Reservas',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'MainTabs', params: { screen: 'Reservations' } }
                  ],
                });
              },
            },
            {
              text: 'Aceptar',
              style: 'default',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        
      } catch (apiError) {
        console.log('❌ Error en API, creando reserva local para Google Places:', apiError);
        
        // Si falla la API y es Google Place, guardar localmente como fallback
        if (isGooglePlace) {
          const googlePlaceId = place.google_place_id || place.id;
          const googlePlaceReservation = {
            id: Date.now().toString(),
            place_name: place.name,
            place_address: place.address,
            place_city: place.city,
            reservation_date: `${reservationData.reservation_date} ${reservationData.reservation_time}`,
            party_size: reservationData.party_size,
            status: 'pending',
            contact_name: reservationData.contact_name,
            contact_phone: reservationData.contact_phone,
            contact_email: reservationData.contact_email,
            special_requests: reservationData.special_requests,
            created_at: new Date().toISOString(),
            is_google_place: true,
            confirmation_code: `GP${Date.now().toString().slice(-6)}`,
            external_place_id: googlePlaceId,
          };

          await googlePlacesReservationsService.saveReservation(googlePlaceReservation);
          response = googlePlaceReservation;
          
          const confirmationMessage = `Tu reserva en ${place.name} ha sido registrada.\n\nFecha: ${formatDate(selectedDate)}\nHora: ${formatTime(selectedTime)}\nPersonas: ${partySize}\nCódigo: ${response.confirmation_code}\n\nEstado: Pendiente\n\nNota: Este es un lugar de Google Places. Te recomendamos contactar directamente al establecimiento para confirmar tu reserva.`;

          Alert.alert(
            'Reserva Registrada',
            confirmationMessage,
            [
              {
                text: 'Ver Mis Reservas',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [
                      { name: 'MainTabs', params: { screen: 'Reservations' } }
                    ],
                  });
                },
              },
              {
                text: 'Aceptar',
                style: 'default',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          // Si no es Google Place y falla la API, mostrar error
          throw apiError;
        }
      }
    } catch (error) {
      console.error('❌ Error al crear reserva:', error);
      Alert.alert(
        'Error',
        'No se pudo crear la reserva. Por favor intenta nuevamente.',
        [{ text: 'Aceptar' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const partySizeOptions = Array.from({ length: 10 }, (_, i) => i + 1);

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
        <Text style={styles.headerTitle}>Hacer Reserva</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del lugar */}
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{place.name}</Text>
          <View style={styles.placeAddress}>
            <Ionicons name="location" size={16} color="#718096" />
            <Text style={styles.addressText}>
              {place.address}{place.city ? `, ${place.city}` : ''}
            </Text>
          </View>
          <View style={styles.placeRating}>
            <Ionicons name="star" size={16} color="#F6AD55" />
            <Text style={styles.ratingText}>
              {place.average_rating ? parseFloat(place.average_rating).toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.reviewCount}>
              ({place.total_reviews || 0} reseñas)
            </Text>
            {(place.isGooglePlace || place.google_place_id) && (
              <View style={styles.googleBadge}>
                <Ionicons name="logo-google" size={12} color="#4285F4" />
                <Text style={styles.googleBadgeText}>Google</Text>
              </View>
            )}
          </View>
        </View>

        {/* Formulario de reserva */}
        <View style={styles.form}>
          {/* Fecha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#4299E1" />
              <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
              <Ionicons name="chevron-down" size={20} color="#718096" />
            </TouchableOpacity>
          </View>

          {/* Hora */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hora</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color="#4299E1" />
              <Text style={styles.dateTimeText}>{formatTime(selectedTime)}</Text>
              <Ionicons name="chevron-down" size={20} color="#718096" />
            </TouchableOpacity>
          </View>

          {/* Tamaño del grupo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de personas</Text>
            <View style={styles.partySizeContainer}>
              {partySizeOptions.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.partySizeButton,
                    partySize === size.toString() && styles.partySizeButtonActive
                  ]}
                  onPress={() => setPartySize(size.toString())}
                >
                  <Text style={[
                    styles.partySizeText,
                    partySize === size.toString() && styles.partySizeTextActive
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Solicitudes especiales */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Solicitudes especiales (opcional)</Text>
            <TextInput
              style={styles.textArea}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Ej: Mesa junto a la ventana, celebración de cumpleaños..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Información adicional */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#4299E1" />
          <Text style={styles.infoText}>
            Tu reserva estará sujeta a confirmación del restaurante. 
            Recibirás una notificación cuando sea confirmada.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Botón de reservar */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.reserveButton, isLoading && styles.reserveButtonDisabled]}
          onPress={handleMakeReservation}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.reserveButtonText}>Creando reserva...</Text>
          ) : (
            <>
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.reserveButtonText}>Solicitar Reserva</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  placeInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  placeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  placeAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
  placeRating: {
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
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    gap: 2,
  },
  googleBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4285F4',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  partySizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partySizeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  partySizeButtonActive: {
    backgroundColor: '#4299E1',
    borderColor: '#4299E1',
  },
  partySizeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
  partySizeTextActive: {
    color: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
    minHeight: 80,
    backgroundColor: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2B6CB0',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4299E1',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  reserveButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  reserveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
  },
  backToDetailsButton: {
    backgroundColor: '#4299E1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backToDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
