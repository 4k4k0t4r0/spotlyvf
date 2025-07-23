import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../../data/apiClient';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  place: any;
  onReviewSubmitted: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  visible,
  onClose,
  place,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Por favor escribe tu reseña');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: any = {
        rating,
        title: title.trim(),
        content: content.trim(),
        would_recommend: wouldRecommend,
      };

      // Para lugares de Google Places, usamos los campos específicos
      if (place.city === 'Ubicación actual') {
        reviewData.google_place_id = place.id;
        reviewData.google_place_name = place.name;
        reviewData.google_place_address = place.address;
      } else {
        // Para lugares de nuestra BD, usamos el UUID directamente (no convertir a int)
        reviewData.place = place.id;
      }

      console.log('📝 Enviando reseña:', reviewData);

      await reviewApi.createReview(reviewData);
      
      Alert.alert(
        '¡Éxito!',
        'Tu reseña ha sido publicada correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
              onReviewSubmitted();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error creando reseña:', error);
      Alert.alert(
        'Error',
        'No se pudo enviar tu reseña. Inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(5);
    setTitle('');
    setContent('');
    setWouldRecommend(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escribir Reseña</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            <Text style={[styles.submitButtonText, isSubmitting && styles.submitButtonTextDisabled]}>
              {isSubmitting ? 'Enviando...' : 'Publicar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Información del lugar */}
          <View style={styles.placeInfo}>
            <Text style={styles.placeName}>{place.name}</Text>
            <View style={styles.placeAddress}>
              <Ionicons name="location-outline" size={14} color="#718096" />
              <Text style={styles.addressText}>
                {place.address}, {place.city}
              </Text>
            </View>
            {place.city === 'Ubicación actual' && (
              <View style={styles.googleBadge}>
                <Ionicons name="map" size={12} color="#4299E1" />
                <Text style={styles.googleBadgeText}>Lugar de Google Places</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calificación</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#F6AD55' : '#CBD5E0'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating} de 5 estrellas
            </Text>
          </View>

          {/* Título (opcional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Título (opcional)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Resumen de tu experiencia"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Contenido */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu reseña *</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Comparte tu experiencia en este lugar..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {content.length}/500 caracteres
            </Text>
          </View>

          {/* Recomendación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Recomendarías este lugar?</Text>
            <View style={styles.recommendContainer}>
              <TouchableOpacity
                style={[
                  styles.recommendOption,
                  wouldRecommend && styles.recommendOptionActive,
                ]}
                onPress={() => setWouldRecommend(true)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={20}
                  color={wouldRecommend ? '#fff' : '#38A169'}
                />
                <Text
                  style={[
                    styles.recommendOptionText,
                    wouldRecommend && styles.recommendOptionTextActive,
                  ]}
                >
                  Sí, lo recomiendo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.recommendOption,
                  !wouldRecommend && styles.recommendOptionActive,
                ]}
                onPress={() => setWouldRecommend(false)}
              >
                <Ionicons
                  name="thumbs-down"
                  size={20}
                  color={!wouldRecommend ? '#fff' : '#E53E3E'}
                />
                <Text
                  style={[
                    styles.recommendOptionText,
                    !wouldRecommend && styles.recommendOptionTextActive,
                  ]}
                >
                  No lo recomiendo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  cancelButton: {
    fontSize: 16,
    color: '#718096',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4299E1',
    borderRadius: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonTextDisabled: {
    color: '#718096',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  placeInfo: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  placeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  placeAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 4,
  },
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  googleBadgeText: {
    fontSize: 12,
    color: '#4299E1',
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    marginHorizontal: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#718096',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  recommendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  recommendOptionActive: {
    backgroundColor: '#38A169',
    borderColor: '#38A169',
  },
  recommendOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A202C',
    marginLeft: 8,
  },
  recommendOptionTextActive: {
    color: '#fff',
  },
  bottomSpacing: {
    height: 40,
  },
});
