// src/presentation/screens/ClaimPlaceScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { businessApi } from '../../data/businessApi';
import { ClaimPlaceScreenProps } from '../navigation/types';

export const ClaimPlaceScreen: React.FC<ClaimPlaceScreenProps> = ({ navigation }) => {
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessRegistration, setBusinessRegistration] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClaimPlace = async () => {
    if (!googlePlaceId.trim() || !businessName.trim() || !businessRegistration.trim() || 
        !contactPhone.trim() || !contactEmail.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    try {
      await businessApi.claimGooglePlace({
        google_place_id: googlePlaceId.trim(),
        business_name: businessName.trim(),
        business_registration: businessRegistration.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        claim_message: claimMessage.trim(),
      });

      Alert.alert(
        'Reclamación Enviada',
        'Tu reclamación ha sido enviada y será revisada por nuestro equipo. Te notificaremos el resultado por email.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error claiming place:', error);
      
      let errorMessage = 'No se pudo enviar la reclamación. Intenta nuevamente.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reclamar Lugar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#4299E1" />
          <View style={styles.instructionsText}>
            <Text style={styles.instructionsTitle}>¿Cómo funciona?</Text>
            <Text style={styles.instructionsDescription}>
              Reclama lugares de Google Places para gestionarlos en Spotlyvf. 
              Necesitarás proporcionar el ID del lugar de Google y un número de contacto para verificación.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información del Lugar</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Google Place ID *</Text>
              <Text style={styles.inputHelp}>
                Ejemplo: ChIJN1t_tDeuEmsRUsoyG83frY4
              </Text>
              <TextInput
                style={styles.textInput}
                value={googlePlaceId}
                onChangeText={setGooglePlaceId}
                placeholder="Ingresa el Google Place ID"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono de Contacto *</Text>
              <Text style={styles.inputHelp}>
                Número de teléfono del negocio para verificación
              </Text>
              <TextInput
                style={styles.textInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+593 99 123 4567"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del Negocio *</Text>
              <TextInput
                style={styles.textInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Nombre oficial de tu negocio"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Registro del Negocio *</Text>
              <Text style={styles.inputHelp}>
                RUC, Cédula o número de registro comercial
              </Text>
              <TextInput
                style={styles.textInput}
                value={businessRegistration}
                onChangeText={setBusinessRegistration}
                placeholder="Ej: 1234567890001"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email de Contacto *</Text>
              <TextInput
                style={styles.textInput}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="negocio@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mensaje Adicional (Opcional)</Text>
              <Text style={styles.inputHelp}>
                Información adicional sobre tu reclamación
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={claimMessage}
                onChangeText={setClaimMessage}
                placeholder="Ej: Soy el propietario de este restaurante desde 2020..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* How to find Google Place ID */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>¿Cómo encontrar el Google Place ID?</Text>
            <View style={styles.helpSteps}>
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Ve a Google Maps y busca tu negocio
                </Text>
              </View>
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Copia la URL de la página de tu negocio
                </Text>
              </View>
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  Usa herramientas online para extraer el Place ID
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled
            ]}
            onPress={handleClaimPlace}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Enviando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Enviar Reclamación</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="shield-checkmark" size={16} color="#718096" />
            <Text style={styles.disclaimerText}>
              Tu reclamación será revisada por nuestro equipo. El proceso de verificación 
              puede tomar de 1 a 3 días hábiles.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#4299E1',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  instructionsDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  inputHelp: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpSection: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  helpSteps: {
    gap: 12,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4299E1',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
  },
});
