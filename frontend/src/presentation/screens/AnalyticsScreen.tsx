import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../data/apiClient';

interface AnalyticsScreenProps {
  navigation: any;
  route: {
    params?: {
      placeId?: number;
      googlePlaceId?: string;
      placeName?: string;
    };
  };
}

interface BusinessAnalytics {
  id: string;
  business_name: string;
  total_reviews: number;
  average_rating: number;
  sentiment_percentage: number;
  predicted_status: string;
  predicted_status_display: string;
  confidence_score: number;
  recommendations: AIRecommendation[];
  last_analysis: string;
}

interface AIRecommendation {
  id: number;
  category: string;
  priority: string;
  content: string;
  is_implemented: boolean;
}

interface DashboardSummary {
  total_businesses: number;
  successful_businesses: number;
  at_risk_businesses: number;
  avg_rating: number;
  total_reviews: number;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ navigation, route }) => {
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const { placeId, googlePlaceId } = route.params || {};

  useEffect(() => {
    loadDashboard();
    // Siempre cargar analytics (con parámetros o por defecto)
    loadBusinessAnalytics();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      // Usar endpoint de demostración sin autenticación
      const response = await fetch('http://192.168.100.13:8000/api/v1/analytics/demo/dashboard/');
      const data = await response.json();
      
      if (data && data.summary) {
        setDashboard(data.summary);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el dashboard de analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinessAnalytics = async () => {
    // Si no tiene parámetros específicos, usar un negocio de demostración
    const targetGooglePlaceId = googlePlaceId || "ChIJG3oPcxWi1ZERCgWw5lOKuHY"; // El Imperio Lojano por defecto

    try {
      setIsLoading(true);
      const requestData = {
        google_place_id: targetGooglePlaceId,
        include_recommendations: true
      };

      console.log('📊 Requesting analytics for:', targetGooglePlaceId);

      // Usar endpoint de demostración sin autenticación
      const response = await fetch('http://192.168.100.13:8000/api/v1/analytics/demo/analyze/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('📊 Analytics data received:', JSON.stringify(data, null, 2));
        console.log('📋 Recommendations:', data.recommendations);
        setAnalytics(data);
      } else {
        throw new Error(data.error || 'Error en análisis');
      }
    } catch (error: any) {
      console.error('Error loading business analytics:', error);
      Alert.alert('Error', 'No se pudo cargar el análisis del negocio');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeNow = async () => {
    if (!placeId && !googlePlaceId) return;

    try {
      setAnalyzing(true);
      const requestData = {
        google_place_id: googlePlaceId || placeId,
        force_refresh: true,
        include_recommendations: true
      };

      // Usar endpoint de demostración sin autenticación
      const response = await fetch('http://192.168.100.13:8000/api/v1/analytics/demo/analyze/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
        Alert.alert('Éxito', 'Análisis actualizado correctamente');
      } else {
        throw new Error(data.error || 'Error en análisis');
      }
    } catch (error: any) {
      console.error('Error analyzing business:', error);
      Alert.alert('Error', 'No se pudo realizar el análisis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    if (placeId || googlePlaceId) {
      await loadBusinessAnalytics();
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful': return '#10B981';
      case 'recovering': return '#F59E0B';
      case 'at_risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful': return 'checkmark-circle';
      case 'recovering': return 'trending-up';
      case 'at_risk': return 'warning';
      default: return 'help-circle';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

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
        <Text style={styles.headerTitle}>Analytics IA</Text>
        {(placeId || googlePlaceId) && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={analyzeNow}
            disabled={analyzing}
          >
            <Ionicons 
              name={analyzing ? "sync" : "refresh"} 
              size={24} 
              color="#4299E1" 
              style={analyzing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Dashboard Summary */}
        {dashboard && (
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Resumen General</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{dashboard.total_businesses}</Text>
                <Text style={styles.metricLabel}>Negocios</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: '#10B981' }]}>
                  {dashboard.successful_businesses}
                </Text>
                <Text style={styles.metricLabel}>Exitosos</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: '#EF4444' }]}>
                  {dashboard.at_risk_businesses}
                </Text>
                <Text style={styles.metricLabel}>En Riesgo</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{dashboard.avg_rating?.toFixed(1)}</Text>
                <Text style={styles.metricLabel}>Rating Prom.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Business Analytics */}
        {analytics && (
          <>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Ionicons
                  name={getStatusIcon(analytics.predicted_status)}
                  size={32}
                  color={getStatusColor(analytics.predicted_status)}
                />
                <View style={styles.statusInfo}>
                  <Text style={styles.businessName}>{analytics.business_name}</Text>
                  <Text style={[styles.statusText, { color: getStatusColor(analytics.predicted_status) }]}>
                    {analytics.predicted_status_display}
                  </Text>
                  <Text style={styles.confidenceText}>
                    Confianza: {(analytics.confidence_score * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Metrics Card */}
            <View style={styles.metricsCard}>
              <Text style={styles.cardTitle}>Métricas del Negocio</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{analytics.total_reviews}</Text>
                  <Text style={styles.metricLabel}>Reseñas</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{analytics.average_rating.toFixed(1)}</Text>
                  <Text style={styles.metricLabel}>Rating</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{analytics.sentiment_percentage}%</Text>
                  <Text style={styles.metricLabel}>Positivo</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{analytics.recommendations?.length || 0}</Text>
                  <Text style={styles.metricLabel}>Recomendaciones</Text>
                </View>
              </View>
            </View>

            {/* Recommendations */}
            {analytics.recommendations && analytics.recommendations.length > 0 && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.cardTitle}>Recomendaciones de IA</Text>
                {analytics.recommendations.map((recommendation) => (
                  <View key={recommendation.id} style={styles.recommendationItem}>
                    <View style={styles.recommendationHeader}>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(recommendation.priority) }
                      ]}>
                        <Text style={styles.priorityText}>
                          {recommendation.priority}
                        </Text>
                      </View>
                      <Text style={styles.categoryText}>
                        {recommendation.category}
                      </Text>
                    </View>
                    <Text style={styles.recommendationTitle}>
                      {recommendation.category}
                    </Text>
                    <Text style={styles.recommendationDescription}>
                      {recommendation.content}
                    </Text>
                    {recommendation.is_implemented && (
                      <View style={styles.implementedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.implementedText}>Implementado</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* No Data State */}
        {!analytics && !isLoading && (placeId || googlePlaceId) && (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={64} color="#CBD5E0" />
            <Text style={styles.noDataTitle}>Sin Análisis Disponible</Text>
            <Text style={styles.noDataText}>
              No hay suficientes reseñas para generar un análisis predictivo
            </Text>
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeNow}>
              <Text style={styles.analyzeButtonText}>Analizar Ahora</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4299E1" />
            <Text style={styles.loadingText}>Cargando análisis...</Text>
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  refreshButton: {
    padding: 4,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299E1',
  },
  metricLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  metricsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
    paddingLeft: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 12,
    color: '#718096',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  implementedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  implementedText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  analyzeButton: {
    backgroundColor: '#4299E1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
});
