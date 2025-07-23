import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BusinessOption {
  id: string;
  name: string;
  google_place_id: string;
  reviews_count: number;
  avg_rating: number;
}

interface BusinessSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectBusiness: (business: BusinessOption) => void;
}

const DEMO_BUSINESSES: BusinessOption[] = [
  {
    id: '1',
    name: 'El Imperio Lojano',
    google_place_id: 'ChIJG3oPcxWi1ZERCgWw5lOKuHY',
    reviews_count: 42,
    avg_rating: 3.83
  },
  {
    id: '2', 
    name: 'Pizza Sport',
    google_place_id: 'ChIJtWxC4tGj1ZERojjfo6AmbzY',
    reviews_count: 1,
    avg_rating: 5.0
  },
  {
    id: '3',
    name: 'Otro Restaurante',
    google_place_id: 'ChIJlfT_cRWi1ZERD3uiH4e1LIw',
    reviews_count: 1,
    avg_rating: 5.0
  }
];

export const BusinessSelector: React.FC<BusinessSelectorProps> = ({
  visible,
  onClose,
  onSelectBusiness
}) => {
  const renderBusinessItem = ({ item }: { item: BusinessOption }) => (
    <TouchableOpacity 
      style={styles.businessItem}
      onPress={() => {
        onSelectBusiness(item);
        onClose();
      }}
    >
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{item.name}</Text>
        <Text style={styles.businessStats}>
          {item.reviews_count} reseñas • ⭐ {item.avg_rating}/5
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar Negocio para Analytics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Estos son negocios de demostración con reseñas reales en la base de datos:
        </Text>

        <FlatList
          data={DEMO_BUSINESSES}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    padding: 20,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  businessStats: {
    fontSize: 14,
    color: '#718096',
  },
});
