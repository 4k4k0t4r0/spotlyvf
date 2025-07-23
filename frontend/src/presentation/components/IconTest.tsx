import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Test de íconos de Ionicons para verificar que funcionan
export const IconTest: React.FC = () => {
  const testIcons = [
    'restaurant-outline',
    'cafe-outline', 
    'map-outline',
    'business-outline',
    'game-controller-outline',
    'videocam-outline',
    'moon-outline',
    'football-outline',
    'library-outline',
    'storefront-outline',
    'flower-outline',
    'medical-outline'
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test de Íconos</Text>
      <View style={styles.iconGrid}>
        {testIcons.map((iconName, index) => (
          <View key={index} style={styles.iconItem}>
            <Ionicons name={iconName as any} size={24} color="#4299E1" />
            <Text style={styles.iconName}>{iconName}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  iconItem: {
    alignItems: 'center',
    margin: 10,
    width: 80,
  },
  iconName: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
});
