import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../data/apiClient';
import { RegisterScreenProps } from '../navigation/types';

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'USER',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateValue.stopAnimation();
      rotateValue.setValue(0);
    }
  }, [isLoading]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Registering user with data:', { ...formData, password: '[HIDDEN]', password_confirm: '[HIDDEN]' });
      const response = await apiClient.postDirect('/auth/register/', formData);
      console.log('Registration response:', response);
      
      Alert.alert(
        'Success',
        'Account created successfully! Please login.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'An error occurred during registration';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          // Handle validation errors
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header con fondo azul */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>Únete a Spotlyvf</Text>
          <Text style={styles.tagline}>Crea tu cuenta y comienza a explorar</Text>
        </View>
      </View>

      {/* Formulario */}
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          
          {/* Nombres */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Nombre *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.first_name}
                  onChangeText={(value) => handleInputChange('first_name', value)}
                  placeholder="Tu nombre"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
              </View>
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Apellido *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.last_name}
                  onChangeText={(value) => handleInputChange('last_name', value)}
                  placeholder="Tu apellido"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                placeholder="Elige un nombre de usuario"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="tu@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Tu número de teléfono"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Tipo de cuenta */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de cuenta *</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'USER' && styles.roleButtonActive
                ]}
                onPress={() => handleInputChange('role', 'USER')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={formData.role === 'USER' ? "person" : "person-outline"} 
                  size={20} 
                  color={formData.role === 'USER' ? "#fff" : "#4F46E5"} 
                />
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'USER' && styles.roleButtonTextActive
                ]}>
                  Usuario
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'BUSINESS' && styles.roleButtonActive
                ]}
                onPress={() => handleInputChange('role', 'BUSINESS')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={formData.role === 'BUSINESS' ? "business" : "business-outline"} 
                  size={20} 
                  color={formData.role === 'BUSINESS' ? "#fff" : "#4F46E5"} 
                />
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'BUSINESS' && styles.roleButtonTextActive
                ]}>
                  Negocio
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Crea una contraseña"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#64748B" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                value={formData.password_confirm}
                onChangeText={(value) => handleInputChange('password_confirm', value)}
                placeholder="Confirma tu contraseña"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPasswordConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
              >
                <Ionicons 
                  name={showPasswordConfirm ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#64748B" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="refresh" size={20} color="#fff" />
                </Animated.View>
                <Text style={styles.registerButtonText}>Creando cuenta...</Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={20} color="#4F46E5" />
            <Text style={styles.loginButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  formContent: {
    padding: 24,
    paddingTop: 32,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  registerButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
