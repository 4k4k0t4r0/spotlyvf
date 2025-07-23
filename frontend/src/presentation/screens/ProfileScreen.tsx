import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { apiClient } from '../../data/apiClient';
import { User } from '../../domain/types';
import { ProfileScreenProps } from '../navigation/types';
import { useUserRole } from '../../hooks/useUserRole';

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  badge?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showArrow = true,
  badge = false
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={styles.menuItemIconContainer}>
        <Ionicons name={icon as any} size={24} color="#4299E1" />
        {badge && <View style={styles.newBadge} />}
      </View>
      <View style={styles.menuItemText}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {showArrow && (
      <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
    )}
  </TouchableOpacity>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Usar useNavigation para acceder al navigation del nivel raíz
  const rootNavigation = useNavigation();
  
  // Obtener información del rol del usuario
  const { isBusinessUser, isNormalUser, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // First try to get user from AsyncStorage
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Then fetch fresh data from API
      const response = await apiClient.getDirect<{user: any, profile: any}>('/auth/user-info/');
      const userInfo = response.user || response;
      
      if (userInfo) {
        setUser(userInfo);
        await AsyncStorage.setItem('user_data', JSON.stringify(userInfo));
      }
    } catch (error: any) {
      console.log('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 Iniciando proceso de logout...');
            
            try {
              // Call logout endpoint to invalidate tokens on server
              const refreshToken = await AsyncStorage.getItem('refresh_token');
              if (refreshToken) {
                try {
                  await apiClient.postDirect('/auth/logout/', {
                    refresh_token: refreshToken
                  });
                  console.log('✅ Logout API call successful - tokens invalidated on server');
                } catch (apiError) {
                  console.log('⚠️ Logout API call failed, but continuing with local logout:', apiError);
                }
              }
            } catch (error) {
              console.log('⚠️ Error during logout API call:', error);
            }

            try {
              // Get all keys to clear absolutely everything
              const allKeys = await AsyncStorage.getAllKeys();
              console.log('📋 All AsyncStorage keys before logout:', allKeys);
              
              // Clear ALL AsyncStorage data to ensure complete session cleanup
              await AsyncStorage.clear();
              console.log('✅ ALL AsyncStorage data cleared');

              // Clear API client state
              apiClient.clearClientState();

              // Reset any component state to initial values
              setUser(null);
              setIsLoading(false);

              // Reset navigation stack completely to Login screen
              (rootNavigation as any).dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
              console.log('✅ Navigation reset to Login');
              console.log('🔒 Logout process completed successfully');
              
            } catch (storageError) {
              console.error('❌ Error clearing storage:', storageError);
              // Even if storage clearing fails, navigate to login
              (rootNavigation as any).dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            }
          }
        }
      ]
    );
  };

  // Menú para usuarios normales
  const normalUserMenuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => console.log('Edit Profile'),
    },
    {
      icon: 'heart-outline',
      title: 'Favorites',
      subtitle: 'Your saved places',
      onPress: () => (navigation as any).navigate('Favorites'),
    },
    {
      icon: 'calendar-outline',
      title: 'My Reservations',
      subtitle: 'View and manage your bookings',
      onPress: () => navigation.navigate('Reservations'),
    },
    {
      icon: 'chatbubbles-outline',
      title: 'My Reviews',
      subtitle: 'Reviews you have written',
      onPress: () => (navigation as any).navigate('MyReviews'),
    },
    {
      icon: 'chatbubbles',
      title: 'All Reviews',
      subtitle: 'See all community reviews',
      onPress: () => (navigation as any).navigate('Reviews'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage your payment options',
      onPress: () => console.log('Payment Methods'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => console.log('Notifications'),
    },
    {
      icon: 'shield-outline',
      title: 'Privacy & Security',
      subtitle: 'Control your privacy settings',
      onPress: () => console.log('Privacy'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => console.log('Help'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and legal info',
      onPress: () => console.log('About'),
    },
  ];

  // Menú para usuarios de negocio
  const businessUserMenuItems = [
    {
      icon: 'apps-outline',
      title: 'Business Dashboard',
      subtitle: 'Overview of your business performance',
      onPress: () => (navigation as any).navigate('BusinessDashboard'),
      badge: true,
    },
    {
      icon: 'calendar-outline',
      title: 'Manage Reservations',
      subtitle: 'Accept or reject customer bookings',
      onPress: () => (navigation as any).navigate('BusinessReservations'),
    },
    {
      icon: 'list-outline',
      title: 'My Claims',
      subtitle: 'Track your place claim requests',
      onPress: () => (navigation as any).navigate('MyClaims'),
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Customer Reviews',
      subtitle: 'View and respond to reviews',
      onPress: () => (navigation as any).navigate('BusinessReviews'),
    },
    {
      icon: 'add-circle-outline',
      title: 'Claim New Place',
      subtitle: 'Add a Google Place to your business',
      onPress: () => (navigation as any).navigate('ClaimPlace'),
    },
    {
      icon: 'bar-chart-outline',
      title: 'Analytics',
      subtitle: 'View business insights and stats',
      onPress: () => (navigation as any).navigate('BusinessAnalytics'),
    },
    {
      icon: 'person-outline',
      title: 'Business Profile',
      subtitle: 'Update your business information',
      onPress: () => console.log('Business Profile'),
    },
    {
      icon: 'settings-outline',
      title: 'Business Settings',
      subtitle: 'Configure your business preferences',
      onPress: () => (navigation as any).navigate('BusinessSettings'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => console.log('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => console.log('Help'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and legal info',
      onPress: () => console.log('About'),
    },
  ];

  // Seleccionar el menú según el tipo de usuario
  const menuItems = isBusinessUser ? businessUserMenuItems : normalUserMenuItems;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => console.log('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#4299E1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#CBD5E0" />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {user ? `${user.firstName} ${user.lastName}` : 'User Name'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || 'user@email.com'}</Text>
          <Text style={styles.userRole}>
            {isBusinessUser ? 'Business Owner' : 'User'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>25</Text>
            <Text style={styles.statLabel}>Visits</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#E53E3E" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Spotlyvf v1.0.0</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  settingsButton: {
    padding: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: '#fff',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4299E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIconContainer: {
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F6AD55',
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 32,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53E3E',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#CBD5E0',
  },
});
