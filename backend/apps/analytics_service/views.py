from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count, Sum
from django.utils import timezone
from datetime import timedelta
import uuid
import logging

from .models import BusinessAnalytics, SentimentPrediction, AIRecommendation, AnalyticsTrend
from .serializers import (
    BusinessAnalyticsSerializer, BusinessAnalyticsSummarySerializer,
    AIRecommendationSerializer, AnalyticsInsightSerializer,
    ReviewAnalysisRequestSerializer
)
from apps.place_service.models import Review, Place

logger = logging.getLogger(__name__)


class AnalyticsViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Analytics de Negocios con IA
    """
    queryset = BusinessAnalytics.objects.all()
    serializer_class = BusinessAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar analytics según el usuario"""
        user = self.request.user
        
        # Si es superuser, puede ver todo
        if user.is_superuser:
            return BusinessAnalytics.objects.all()
        
        # Si es business owner, solo ve sus negocios
        if hasattr(user, 'business_profile'):
            # Filtrar por lugares que posee el usuario
            owned_places = Place.objects.filter(owner=user)
            return BusinessAnalytics.objects.filter(
                Q(place__in=owned_places) | Q(place__isnull=True)
            )
        
        # Otros usuarios no ven analytics privados
        return BusinessAnalytics.objects.none()
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Endpoint principal del dashboard de analytics
        GET /api/v1/analytics/dashboard/
        """
        try:
            # Obtener analytics del usuario
            analytics_qs = self.get_queryset()
            
            # Resumen general
            total_businesses = analytics_qs.count()
            successful_businesses = analytics_qs.filter(predicted_status='successful').count()
            at_risk_businesses = analytics_qs.filter(predicted_status='at_risk').count()
            
            # Analytics recientes (últimos 30 días)
            recent_analytics = analytics_qs.filter(
                last_analysis__gte=timezone.now() - timedelta(days=30)
            )
            
            # Datos para el dashboard
            dashboard_data = {
                'summary': {
                    'total_businesses': total_businesses,
                    'successful_businesses': successful_businesses,
                    'at_risk_businesses': at_risk_businesses,
                    'avg_rating': analytics_qs.aggregate(avg_rating=Avg('average_rating'))['avg_rating'] or 0,
                    'total_reviews': analytics_qs.aggregate(total=Sum('total_reviews'))['total'] or 0
                },
                'recent_analytics': BusinessAnalyticsSummarySerializer(recent_analytics, many=True).data,
                'status_distribution': self._get_status_distribution(analytics_qs),
                'trends': self._get_trends_summary(analytics_qs)
            }
            
            return Response(dashboard_data)
            
        except Exception as e:
            logger.error(f"Error en dashboard de analytics: {str(e)}")
            return Response(
                {'error': 'Error interno del servidor'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def analyze_business(self, request):
        """
        Analizar un negocio específico
        POST /api/v1/analytics/analyze_business/
        """
        serializer = ReviewAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            place_id = serializer.validated_data.get('place_id')
            google_place_id = serializer.validated_data.get('google_place_id')
            force_refresh = serializer.validated_data.get('force_refresh', False)
            include_recommendations = serializer.validated_data.get('include_recommendations', True)
            
            # Obtener o crear analytics
            analytics = self._get_or_create_analytics(place_id, google_place_id)
            
            # Verificar si necesita actualización
            if force_refresh or self._needs_analysis_update(analytics):
                # Realizar análisis
                self._perform_business_analysis(analytics, include_recommendations)
            
            # Serializar respuesta
            serializer = BusinessAnalyticsSerializer(analytics)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error analizando negocio: {str(e)}")
            return Response(
                {'error': f'Error en análisis: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def insights(self, request, pk=None):
        """
        Obtener insights detallados de un negocio
        GET /api/v1/analytics/{id}/insights/
        """
        try:
            analytics = self.get_object()
            insights = self._generate_insights(analytics)
            
            serializer = AnalyticsInsightSerializer(insights)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error generando insights: {str(e)}")
            return Response(
                {'error': 'Error generando insights'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_recommendation(self, request, pk=None):
        """
        Marcar una recomendación como implementada
        POST /api/v1/analytics/{id}/update_recommendation/
        """
        try:
            analytics = self.get_object()
            recommendation_id = request.data.get('recommendation_id')
            is_implemented = request.data.get('is_implemented', True)
            notes = request.data.get('implementation_notes', '')
            
            recommendation = analytics.recommendations.get(id=recommendation_id)
            recommendation.is_implemented = is_implemented
            recommendation.implementation_notes = notes
            recommendation.save()
            
            return Response({'message': 'Recomendación actualizada exitosamente'})
            
        except AIRecommendation.DoesNotExist:
            return Response(
                {'error': 'Recomendación no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error actualizando recomendación: {str(e)}")
            return Response(
                {'error': 'Error interno del servidor'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_or_create_analytics(self, place_id=None, google_place_id=None):
        """Obtener o crear objeto BusinessAnalytics"""
        if place_id:
            try:
                place_uuid = uuid.UUID(place_id)
                place = Place.objects.get(id=place_uuid)
                analytics, created = BusinessAnalytics.objects.get_or_create(
                    place=place,
                    defaults={'business_name': place.name}
                )
            except (ValueError, Place.DoesNotExist):
                raise ValueError("Place ID inválido")
        elif google_place_id:
            # Para Google Places, usar el google_place_id
            analytics, created = BusinessAnalytics.objects.get_or_create(
                google_place_id=google_place_id,
                defaults={'business_name': f'Google Place {google_place_id[:8]}...'}
            )
        else:
            raise ValueError("Se requiere place_id o google_place_id")
        
        return analytics
    
    def _needs_analysis_update(self, analytics):
        """Verificar si el análisis necesita actualización"""
        if not analytics.last_analysis:
            return True
        
        # Actualizar si han pasado más de 24 horas
        time_since_update = timezone.now() - analytics.last_analysis
        return time_since_update > timedelta(hours=24)
    
    def _perform_business_analysis(self, analytics, include_recommendations=True):
        """Realizar análisis completo del negocio"""
        try:
            # Importar aquí para evitar errores si las librerías no están instaladas
            from .ai_predictor import business_predictor, recommendation_generator
            
            # Obtener reseñas del negocio
            if analytics.place:
                reviews = Review.objects.filter(
                    place=analytics.place, 
                    is_approved=True
                ).select_related('user')
            else:
                reviews = Review.objects.filter(
                    google_place_id=analytics.google_place_id,
                    is_approved=True
                ).select_related('user')
            
            # Preparar datos para el análisis
            reviews_data = []
            for review in reviews:
                reviews_data.append({
                    'content': review.content,
                    'rating': review.rating,
                    'created_at': review.created_at
                })
            
            # Realizar predicción
            prediction_result = business_predictor.predict_business_status(reviews_data)
            
            # Actualizar analytics
            analytics.total_reviews = len(reviews_data)
            analytics.average_rating = prediction_result['metrics'].get('average_rating', 0)
            analytics.positive_sentiment_count = int(
                prediction_result['metrics'].get('positive_sentiment_ratio', 0) * len(reviews_data)
            )
            analytics.negative_sentiment_count = len(reviews_data) - analytics.positive_sentiment_count
            analytics.sentiment_score = prediction_result['metrics'].get('average_sentiment_score', 0.5)
            analytics.predicted_status = prediction_result['status']
            analytics.confidence_score = prediction_result['confidence']
            analytics.save()
            
            # Generar recomendaciones si es necesario
            if include_recommendations and prediction_result.get('recommendations_needed'):
                self._generate_recommendations(analytics, prediction_result, reviews_data)
            
        except ImportError:
            logger.warning("Librerías de IA no disponibles, usando análisis básico")
            self._perform_basic_analysis(analytics)
        except Exception as e:
            logger.error(f"Error en análisis de negocio: {str(e)}")
            self._perform_basic_analysis(analytics)
    
    def _perform_basic_analysis(self, analytics):
        """Análisis básico sin IA cuando las librerías no están disponibles"""
        try:
            # Obtener reseñas
            if analytics.place:
                reviews = Review.objects.filter(place=analytics.place, is_approved=True)
            else:
                reviews = Review.objects.filter(google_place_id=analytics.google_place_id, is_approved=True)
            
            total_reviews = reviews.count()
            avg_rating = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
            
            # Análisis simple basado en rating
            if avg_rating >= 4.0:
                predicted_status = 'successful'
            elif avg_rating >= 3.5:
                predicted_status = 'recovering'
            elif avg_rating < 3.0:
                predicted_status = 'at_risk'
            else:
                predicted_status = 'uncertain'
            
            # Actualizar analytics
            analytics.total_reviews = total_reviews
            analytics.average_rating = avg_rating
            analytics.predicted_status = predicted_status
            analytics.confidence_score = min(total_reviews / 10, 0.8)  # Baja confianza sin IA
            analytics.save()
            
        except Exception as e:
            logger.error(f"Error en análisis básico: {str(e)}")
    
    def _generate_recommendations(self, analytics, prediction_result, reviews_data):
        """Generar recomendaciones con IA"""
        try:
            from .ai_predictor import recommendation_generator
            
            # Tomar textos de reseñas recientes
            recent_review_texts = [r['content'] for r in reviews_data[-10:]]
            
            # Generar recomendaciones
            recommendations = recommendation_generator.generate_recommendations(
                analytics.business_name,
                prediction_result,
                recent_review_texts
            )
            
            # Guardar recomendaciones
            for rec_data in recommendations:
                AIRecommendation.objects.update_or_create(
                    analytics=analytics,
                    title=rec_data['title'],
                    defaults={
                        'description': rec_data['description'],
                        'priority': rec_data['priority'],
                        'category': rec_data['category']
                    }
                )
                
        except Exception as e:
            logger.error(f"Error generando recomendaciones: {str(e)}")
    
    def _generate_insights(self, analytics):
        """Generar insights detallados"""
        # Por ahora, insights básicos - se puede expandir con más IA
        return {
            'business_status': analytics.get_predicted_status_display(),
            'confidence_score': analytics.confidence_score,
            'key_insights': [
                f"Tu negocio tiene {analytics.total_reviews} reseñas con promedio de {analytics.average_rating:.1f}",
                f"El {self._get_sentiment_percentage(analytics):.1f}% de sentimientos son positivos"
            ],
            'improvement_areas': self._get_improvement_areas(analytics),
            'strengths': self._get_strengths(analytics),
            'urgent_actions': self._get_urgent_actions(analytics),
            'predicted_trend': 'stable'  # Se puede mejorar con más datos
        }
    
    def _get_sentiment_percentage(self, analytics):
        """Calcular porcentaje de sentimientos positivos"""
        total = analytics.positive_sentiment_count + analytics.negative_sentiment_count
        if total == 0:
            return 0
        return (analytics.positive_sentiment_count / total) * 100
    
    def _get_improvement_areas(self, analytics):
        """Obtener áreas de mejora"""
        areas = []
        if analytics.average_rating < 4.0:
            areas.append("Calidad del servicio")
        if analytics.sentiment_score < 0.6:
            areas.append("Experiencia del cliente")
        if analytics.total_reviews < 10:
            areas.append("Visibilidad y marketing")
        return areas
    
    def _get_strengths(self, analytics):
        """Obtener fortalezas del negocio"""
        strengths = []
        if analytics.average_rating >= 4.0:
            strengths.append("Excelente calificación promedio")
        if analytics.sentiment_score >= 0.7:
            strengths.append("Sentimientos muy positivos")
        if analytics.total_reviews >= 20:
            strengths.append("Buena cantidad de reseñas")
        return strengths
    
    def _get_urgent_actions(self, analytics):
        """Obtener acciones urgentes"""
        actions = []
        if analytics.predicted_status == 'at_risk':
            actions.append("Revisar calidad del servicio inmediatamente")
            actions.append("Capacitar al personal")
        elif analytics.total_reviews == 0:
            actions.append("Solicitar reseñas a clientes")
        return actions
    
    def _get_status_distribution(self, analytics_qs):
        """Obtener distribución de estados"""
        distribution = analytics_qs.values('predicted_status').annotate(
            count=Count('predicted_status')
        )
        return {item['predicted_status']: item['count'] for item in distribution}
    
    def _get_trends_summary(self, analytics_qs):
        """Obtener resumen de tendencias"""
        # Implementación básica - se puede expandir
        return {
            'avg_rating_trend': 'stable',
            'sentiment_trend': 'stable',
            'reviews_trend': 'growing'
        }
