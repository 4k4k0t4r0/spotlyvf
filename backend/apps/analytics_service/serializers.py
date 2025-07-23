from rest_framework import serializers
from .models import BusinessAnalytics, SentimentPrediction, AIRecommendation, AnalyticsTrend


class SentimentPredictionSerializer(serializers.ModelSerializer):
    """Serializer para predicciones de sentimiento"""
    
    class Meta:
        model = SentimentPrediction
        fields = [
            'id', 'sentiment_label', 'sentiment_score', 
            'key_aspects', 'emotional_intensity', 'analyzed_at'
        ]


class AIRecommendationSerializer(serializers.ModelSerializer):
    """Serializer para recomendaciones de IA"""
    
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = AIRecommendation
        fields = [
            'id', 'title', 'description', 'priority', 'priority_display',
            'category', 'category_display', 'is_implemented', 
            'implementation_notes', 'generated_at', 'updated_at'
        ]


class AnalyticsTrendSerializer(serializers.ModelSerializer):
    """Serializer para tendencias de analytics"""
    
    class Meta:
        model = AnalyticsTrend
        fields = [
            'id', 'period_start', 'period_end', 'reviews_count',
            'avg_rating', 'sentiment_ratio', 'rating_change',
            'sentiment_change', 'created_at'
        ]


class BusinessAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer principal para analytics del negocio"""
    
    recommendations = AIRecommendationSerializer(many=True, read_only=True)
    trends = AnalyticsTrendSerializer(many=True, read_only=True)
    predicted_status_display = serializers.CharField(source='get_predicted_status_display', read_only=True)
    
    # Campos calculados
    sentiment_percentage = serializers.SerializerMethodField()
    trend_direction = serializers.SerializerMethodField()
    risk_level = serializers.SerializerMethodField()
    
    class Meta:
        model = BusinessAnalytics
        fields = [
            'id', 'business_name', 'total_reviews', 'average_rating',
            'positive_sentiment_count', 'negative_sentiment_count',
            'sentiment_score', 'sentiment_percentage', 'predicted_status',
            'predicted_status_display', 'confidence_score', 'trend_direction',
            'risk_level', 'last_analysis', 'created_at',
            'recommendations', 'trends'
        ]
    
    def get_sentiment_percentage(self, obj):
        """Calcular porcentaje de sentimientos positivos"""
        total = obj.positive_sentiment_count + obj.negative_sentiment_count
        if total == 0:
            return 0
        return round((obj.positive_sentiment_count / total) * 100, 1)
    
    def get_trend_direction(self, obj):
        """Obtener dirección de la tendencia más reciente"""
        latest_trend = obj.trends.first()
        if not latest_trend:
            return 'unknown'
        
        if latest_trend.rating_change > 0.2:
            return 'up'
        elif latest_trend.rating_change < -0.2:
            return 'down'
        else:
            return 'stable'
    
    def get_risk_level(self, obj):
        """Calcular nivel de riesgo basado en métricas"""
        if obj.predicted_status == 'at_risk':
            return 'high'
        elif obj.predicted_status == 'uncertain':
            return 'medium'
        elif obj.predicted_status == 'recovering':
            return 'low'
        else:
            return 'minimal'


class BusinessAnalyticsSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para dashboard"""
    
    sentiment_percentage = serializers.SerializerMethodField()
    predicted_status_display = serializers.CharField(source='get_predicted_status_display', read_only=True)
    recommendations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BusinessAnalytics
        fields = [
            'id', 'business_name', 'total_reviews', 'average_rating',
            'sentiment_score', 'sentiment_percentage', 'predicted_status',
            'predicted_status_display', 'confidence_score', 'recommendations_count',
            'last_analysis'
        ]
    
    def get_sentiment_percentage(self, obj):
        """Calcular porcentaje de sentimientos positivos"""
        total = obj.positive_sentiment_count + obj.negative_sentiment_count
        if total == 0:
            return 0
        return round((obj.positive_sentiment_count / total) * 100, 1)
    
    def get_recommendations_count(self, obj):
        """Contar recomendaciones activas"""
        return obj.recommendations.filter(is_implemented=False).count()


class AnalyticsInsightSerializer(serializers.Serializer):
    """Serializer para insights generados por IA"""
    
    business_status = serializers.CharField()
    confidence_score = serializers.FloatField()
    key_insights = serializers.ListField(child=serializers.CharField())
    improvement_areas = serializers.ListField(child=serializers.CharField())
    strengths = serializers.ListField(child=serializers.CharField())
    urgent_actions = serializers.ListField(child=serializers.CharField())
    predicted_trend = serializers.CharField()


class ReviewAnalysisRequestSerializer(serializers.Serializer):
    """Serializer para solicitudes de análisis de reseñas"""
    
    place_id = serializers.CharField(required=False, allow_blank=True)
    google_place_id = serializers.CharField(required=False, allow_blank=True)
    force_refresh = serializers.BooleanField(default=False)
    include_recommendations = serializers.BooleanField(default=True)
    
    def validate(self, data):
        """Validar que se proporcione al menos un ID de lugar"""
        if not data.get('place_id') and not data.get('google_place_id'):
            raise serializers.ValidationError(
                "Se debe proporcionar place_id o google_place_id"
            )
        return data
