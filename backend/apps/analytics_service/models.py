from django.db import models
from django.contrib.auth import get_user_model
from apps.place_service.models import Review, Place
import uuid

User = get_user_model()


class BusinessAnalytics(models.Model):
    """
    Modelo para almacenar analytics calculados de un negocio
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con el lugar (puede ser Place de BD o Google Place)
    place = models.ForeignKey(Place, on_delete=models.CASCADE, null=True, blank=True)
    google_place_id = models.CharField(max_length=255, null=True, blank=True)
    business_name = models.CharField(max_length=255)
    
    # Métricas generales
    total_reviews = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    
    # Análisis de sentimientos
    positive_sentiment_count = models.IntegerField(default=0)
    negative_sentiment_count = models.IntegerField(default=0)
    sentiment_score = models.FloatField(default=0.5)  # 0.0 = muy negativo, 1.0 = muy positivo
    
    # Predicción de éxito
    SUCCESS_CHOICES = [
        ('successful', 'Negocio Exitoso'),
        ('recovering', 'En Recuperación'),
        ('at_risk', 'En Peligro'),
        ('uncertain', 'Incierto'),
    ]
    predicted_status = models.CharField(max_length=20, choices=SUCCESS_CHOICES, default='uncertain')
    confidence_score = models.FloatField(default=0.0)  # Confianza de la predicción
    
    # Timestamps
    last_analysis = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'business_analytics'
        verbose_name = 'Business Analytics'
        verbose_name_plural = 'Business Analytics'
        indexes = [
            models.Index(fields=['google_place_id']),
            models.Index(fields=['predicted_status']),
            models.Index(fields=['last_analysis']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.business_name}"


class SentimentPrediction(models.Model):
    """
    Modelo para almacenar predicciones individuales de reseñas
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con la reseña
    review = models.OneToOneField(Review, on_delete=models.CASCADE, related_name='sentiment_prediction')
    
    # Predicción del modelo BERT
    sentiment_label = models.CharField(max_length=10)  # 'positive' o 'negative'
    sentiment_score = models.FloatField()  # Confianza de la predicción (0.0 - 1.0)
    
    # Análisis adicional
    key_aspects = models.JSONField(default=dict)  # Aspectos mencionados (comida, servicio, precio)
    emotional_intensity = models.FloatField(default=0.0)  # Intensidad emocional (0.0 - 1.0)
    
    # Timestamps
    analyzed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sentiment_predictions'
        verbose_name = 'Sentiment Prediction'
        verbose_name_plural = 'Sentiment Predictions'
        indexes = [
            models.Index(fields=['sentiment_label']),
            models.Index(fields=['analyzed_at']),
        ]
    
    def __str__(self):
        return f"Sentiment: {self.sentiment_label} ({self.sentiment_score:.2f})"


class AIRecommendation(models.Model):
    """
    Modelo para almacenar recomendaciones generadas por OpenAI
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con analytics
    analytics = models.ForeignKey(BusinessAnalytics, on_delete=models.CASCADE, related_name='recommendations')
    
    # Contenido de la recomendación
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=[
        ('high', 'Alta'),
        ('medium', 'Media'),
        ('low', 'Baja'),
    ], default='medium')
    
    # Categoría de mejora
    CATEGORY_CHOICES = [
        ('service', 'Atención al Cliente'),
        ('food_quality', 'Calidad de Comida'),
        ('pricing', 'Precios'),
        ('ambiance', 'Ambiente'),
        ('cleanliness', 'Limpieza'),
        ('marketing', 'Marketing'),
        ('operations', 'Operaciones'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    
    # Estado de implementación
    is_implemented = models.BooleanField(default=False)
    implementation_notes = models.TextField(blank=True)
    
    # Timestamps
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_recommendations'
        verbose_name = 'AI Recommendation'
        verbose_name_plural = 'AI Recommendations'
        ordering = ['-priority', '-generated_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_priority_display()}"


class AnalyticsTrend(models.Model):
    """
    Modelo para almacenar tendencias históricas
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con analytics
    analytics = models.ForeignKey(BusinessAnalytics, on_delete=models.CASCADE, related_name='trends')
    
    # Datos de la tendencia
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Métricas del período
    reviews_count = models.IntegerField(default=0)
    avg_rating = models.FloatField(default=0.0)
    sentiment_ratio = models.FloatField(default=0.0)  # Ratio positivo/total
    
    # Cambios respecto al período anterior
    rating_change = models.FloatField(default=0.0)
    sentiment_change = models.FloatField(default=0.0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_trends'
        verbose_name = 'Analytics Trend'
        verbose_name_plural = 'Analytics Trends'
        unique_together = ['analytics', 'period_start', 'period_end']
        ordering = ['-period_start']
    
    def __str__(self):
        return f"Trend {self.period_start} - {self.period_end}"
