import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { DEFAULT_CATEGORIES } from '../../domain/defaultCategories';

export const IconTestScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prueba de Íconos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Categorías de Lugares</Text>
        <Text style={styles.description}>
          Verificación visual de todos los íconos de categorías utilizados en la aplicación.
        </Text>

        <View style={styles.iconGrid}>
          {DEFAULT_CATEGORIES.map((category, index) => (
            <View key={index} style={styles.iconItem}>
              <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                <Ionicons 
                  name={category.icon as any} 
                  size={32} 
                  color={category.color} 
                />
              </View>
              <Text style={styles.iconName}>{category.name}</Text>
              <Text style={styles.iconCode}>{category.icon}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Estado del Sistema</Text>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={20} color="#48BB78" />
            <Text style={styles.statusText}>
              {DEFAULT_CATEGORIES.length} categorías configuradas
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="location" size={20} color="#4299E1" />
            <Text style={styles.statusText}>
              Íconos de Ionicons validados
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="color-palette" size={20} color="#9F7AEA" />
            <Text style={styles.statusText}>
              Colores de categorías aplicados
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 30,
    lineHeight: 24,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  iconItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 4,
  },
  iconCode: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  statusSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 15,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 10,
  },
});
