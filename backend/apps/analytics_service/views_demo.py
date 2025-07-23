# views_demo.py - Endpoints de demostración para Analytics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Avg, Count
import uuid

from apps.place_service.models import Review, Place
from .models import BusinessAnalytics

@api_view(['GET'])
@permission_classes([AllowAny])  # Sin autenticación para demo
def demo_dashboard(request):
    """Dashboard de demostración sin autenticación"""
    try:
        # Obtener estadísticas generales de la base de datos
        total_places_with_reviews = Review.objects.filter(
            google_place_id__isnull=False,
            is_approved=True
        ).values('google_place_id').distinct().count()
        
        total_reviews = Review.objects.filter(is_approved=True).count()
        avg_rating = Review.objects.filter(is_approved=True).aggregate(
            avg=Avg('rating')
        )['avg'] or 0
        
        # Simular análisis por estado
        high_rated_places = Review.objects.filter(
            is_approved=True,
            rating__gte=4
        ).values('google_place_id').distinct().count()
        
        low_rated_places = Review.objects.filter(
            is_approved=True,
            rating__lte=2
        ).values('google_place_id').distinct().count()
        
        dashboard_data = {
            'summary': {
                'total_businesses': total_places_with_reviews,
                'successful_businesses': high_rated_places,
                'at_risk_businesses': low_rated_places,
                'avg_rating': round(avg_rating, 2),
                'total_reviews': total_reviews
            },
            'top_businesses': [
                {
                    'name': 'El Imperio Lojano',
                    'google_place_id': 'ChIJG3oPcxWi1ZERCgWw5lOKuHY',
                    'total_reviews': 42,
                    'avg_rating': 3.83,
                    'status': 'recovering'
                },
                {
                    'name': 'Pizza Sport',
                    'google_place_id': 'ChIJtWxC4tGj1ZERojjfo6AmbzY',
                    'total_reviews': 1,
                    'avg_rating': 5.0,
                    'status': 'successful'
                }
            ]
        }
        
        return Response(dashboard_data)
    
    except Exception as e:
        return Response(
            {'error': f'Error en demo dashboard: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])  # Sin autenticación para demo
def demo_analyze_business(request):
    """Análisis de negocio de demostración"""
    try:
        google_place_id = request.data.get('google_place_id')
        if not google_place_id:
            return Response(
                {'error': 'google_place_id requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener reseñas reales del negocio
        reviews = Review.objects.filter(
            google_place_id=google_place_id,
            is_approved=True
        ).select_related('user')
        
        if not reviews.exists():
            return Response(
                {'error': 'No se encontraron reseñas para este negocio'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calcular métricas
        total_reviews = reviews.count()
        ratings = [r.rating for r in reviews]
        avg_rating = sum(ratings) / len(ratings)
        
        positive_count = len([r for r in ratings if r >= 4])
        negative_count = len([r for r in ratings if r <= 2])
        
        # Determinar estado
        if avg_rating >= 4.0:
            status_label = 'successful'
            status_display = 'Exitoso'
            confidence = 0.85
        elif avg_rating >= 3.5:
            status_label = 'recovering'
            status_display = 'En Recuperación'
            confidence = 0.70
        elif avg_rating <= 2.5:
            status_label = 'at_risk'
            status_display = 'En Peligro'
            confidence = 0.90
        else:
            status_label = 'uncertain'
            status_display = 'Incierto'
            confidence = 0.60
        
        # Generar recomendaciones basadas en reseñas negativas
        recent_negative = reviews.filter(rating__lte=2)[:5]
        recommendations = []
        
        negative_content = []
        for review in recent_negative:
            negative_content.append(review.content.lower())
        
        if any('servicio' in content for content in negative_content):
            recommendations.append({
                'id': 1,
                'category': 'Servicio al Cliente',
                'priority': 'ALTA',
                'content': 'Mejorar la calidad del servicio al cliente y capacitar al personal',
                'is_implemented': False
            })
        
        if any('comida' in content or 'sabor' in content for content in negative_content):
            recommendations.append({
                'id': 2,
                'category': 'Calidad de Alimentos',
                'priority': 'ALTA', 
                'content': 'Revisar la calidad y preparación de los alimentos',
                'is_implemented': False
            })
        
        if any('espera' in content or 'tiempo' in content for content in negative_content):
            recommendations.append({
                'id': 3,
                'category': 'Eficiencia',
                'priority': 'MEDIA',
                'content': 'Optimizar los tiempos de espera y procesos de atención',
                'is_implemented': False
            })
        
        if not recommendations:
            recommendations.append({
                'id': 4,
                'category': 'General',
                'priority': 'BAJA',
                'content': 'Mantener el nivel actual de calidad y solicitar más reseñas',
                'is_implemented': False
            })
        
        # Obtener nombre del lugar
        place = Place.objects.filter(google_place_id=google_place_id).first()
        if place:
            business_name = place.name
        else:
            # Si no existe en Place, buscar en las reseñas el google_place_name
            review_with_name = reviews.filter(google_place_name__isnull=False).first()
            if review_with_name and review_with_name.google_place_name:
                business_name = review_with_name.google_place_name
            else:
                business_name = "Negocio"
        
        analysis_result = {
            'id': str(uuid.uuid4()),
            'business_name': business_name,
            'google_place_id': google_place_id,
            'total_reviews': total_reviews,
            'average_rating': round(avg_rating, 2),
            'positive_sentiment_count': positive_count,
            'negative_sentiment_count': negative_count,
            'sentiment_score': avg_rating / 5.0,
            'predicted_status': status_label,
            'predicted_status_display': status_display,
            'confidence_score': confidence,
            'recommendations': recommendations,
            'last_analysis': '2025-07-20T16:10:00Z'
        }
        
        return Response(analysis_result)
    
    except Exception as e:
        return Response(
            {'error': f'Error en análisis: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
