from django.contrib import admin
from .models import BusinessAnalytics, SentimentPrediction, AIRecommendation, AnalyticsTrend


@admin.register(BusinessAnalytics)
class BusinessAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'predicted_status', 'total_reviews', 
        'average_rating', 'sentiment_score', 'confidence_score', 'last_analysis'
    ]
    list_filter = ['predicted_status', 'last_analysis', 'created_at']
    search_fields = ['business_name', 'google_place_id']
    readonly_fields = ['id', 'created_at', 'last_analysis']
    
    fieldsets = (
        ('Información General', {
            'fields': ('business_name', 'place', 'google_place_id')
        }),
        ('Métricas', {
            'fields': (
                'total_reviews', 'average_rating', 'positive_sentiment_count',
                'negative_sentiment_count', 'sentiment_score'
            )
        }),
        ('Predicción', {
            'fields': ('predicted_status', 'confidence_score')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_analysis'),
            'classes': ('collapse',)
        })
    )


@admin.register(SentimentPrediction)
class SentimentPredictionAdmin(admin.ModelAdmin):
    list_display = [
        'review', 'sentiment_label', 'sentiment_score', 
        'emotional_intensity', 'analyzed_at'
    ]
    list_filter = ['sentiment_label', 'analyzed_at']
    search_fields = ['review__content']
    readonly_fields = ['id', 'analyzed_at']


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'analytics', 'category', 'priority', 
        'is_implemented', 'generated_at'
    ]
    list_filter = ['category', 'priority', 'is_implemented', 'generated_at']
    search_fields = ['title', 'description', 'analytics__business_name']
    readonly_fields = ['id', 'generated_at', 'updated_at']
    
    fieldsets = (
        ('Recomendación', {
            'fields': ('analytics', 'title', 'description')
        }),
        ('Clasificación', {
            'fields': ('category', 'priority')
        }),
        ('Implementación', {
            'fields': ('is_implemented', 'implementation_notes')
        }),
        ('Timestamps', {
            'fields': ('generated_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(AnalyticsTrend)
class AnalyticsTrendAdmin(admin.ModelAdmin):
    list_display = [
        'analytics', 'period_start', 'period_end', 
        'reviews_count', 'avg_rating', 'sentiment_ratio'
    ]
    list_filter = ['period_start', 'created_at']
    search_fields = ['analytics__business_name']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'period_start'
