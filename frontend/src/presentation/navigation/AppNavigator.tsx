import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import {
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  FeedScreen,
  MapScreen,
  ReservationsScreen,
  ProfileScreen,
  PlaceDetailsScreen,
  MakeReservationScreen,
  ReviewsScreen,
  IconTestScreen,
} from '../screens';

// Profile related screens
import MyReviewsScreen from '../screens/MyReviewsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

// Business screens
import { BusinessDashboardScreen } from '../screens/BusinessDashboardScreen';
import { BusinessReservationsScreen } from '../screens/BusinessReservationsScreen';
import { ClaimPlaceScreen } from '../screens/ClaimPlaceScreen';
import { MyClaimsScreen } from '../screens/MyClaimsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';

// Types
import type { RootStackParamList, MainTabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('🔍 User role in MainTabs:', user.role);
          setUserRole(user.role);
        } else {
          console.log('⚠️ No user data found, defaulting to USER role');
          setUserRole('USER'); // Default to USER if no data
        }
      } catch (error) {
        console.error('❌ Error checking user role:', error);
        setUserRole('USER'); // Default to USER on error
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();

    // Listen for role changes (e.g., after logout/login)
    const interval = setInterval(checkUserRole, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return null; // O un componente de loading
  }
  // Navegador para usuarios BUSINESS
  if (userRole === 'BUSINESS') {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Reservations') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4299E1',
          tabBarInactiveTintColor: '#718096',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Reservations" 
          component={ReservationsScreen}
          options={{ title: 'Bookings' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    );
  }

  // Navegador para usuarios normales (USER)
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Reservations') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4299E1',
        tabBarInactiveTintColor: '#718096',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{ title: 'Discover' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Map' }}
      />
      <Tab.Screen 
        name="Reservations" 
        component={ReservationsScreen}
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="PlaceDetails" 
          component={PlaceDetailsScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="MakeReservation" 
          component={MakeReservationScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="Reviews" 
          component={ReviewsScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="MyReviews" 
          component={MyReviewsScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="Favorites" 
          component={FavoritesScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="IconTest" 
          component={IconTestScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        
        {/* Business Screens */}
        <Stack.Screen 
          name="BusinessDashboard" 
          component={BusinessDashboardScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="BusinessReservations" 
          component={BusinessReservationsScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="ClaimPlace" 
          component={ClaimPlaceScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="MyClaims" 
          component={MyClaimsScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="BusinessAnalytics" 
          component={AnalyticsScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
