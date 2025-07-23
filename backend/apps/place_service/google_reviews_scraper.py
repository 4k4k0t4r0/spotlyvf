"""
Google Reviews Scraping Service
Servicio para obtener reseñas de Google Places
"""

import requests
import json
import re
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from django.utils import timezone
from django.conf import settings
from apps.place_service.models import GoogleReview
import logging

logger = logging.getLogger(__name__)


class GoogleReviewsScraper:
    """
    Scraper de reseñas de Google Places usando Google Places API
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', 'AIzaSyC0O4LIdC9uQPGL0RU9xXgejC9YdbM6fow')
        self.base_url = "https://maps.googleapis.com/maps/api/place"
        
    def get_place_reviews(self, place_id: str, max_reviews: int = 20) -> List[Dict]:
        """
        Obtener reseñas de un lugar específico usando Google Places API
        
        Args:
            place_id: Google Place ID
            max_reviews: Número máximo de reseñas a obtener
            
        Returns:
            Lista de reseñas
        """
        try:
            logger.info(f"🔍 Obteniendo reseñas para Google Place ID: {place_id}")
            
            # Primero obtener detalles del lugar
            place_details = self._get_place_details(place_id)
            if not place_details:
                logger.error(f"❌ No se pudieron obtener detalles del lugar {place_id}")
                return []
            
            place_name = place_details.get('name', 'Unknown Place')
            reviews_data = place_details.get('reviews', [])
            
            if not reviews_data:
                logger.info(f"📝 No hay reseñas disponibles para {place_name}")
                return []
            
            logger.info(f"📝 Encontradas {len(reviews_data)} reseñas para {place_name}")
            
            # Procesar reseñas
            processed_reviews = []
            for i, review in enumerate(reviews_data[:max_reviews]):
                try:
                    processed_review = self._process_review(review, place_id, place_name)
                    if processed_review:
                        processed_reviews.append(processed_review)
                except Exception as e:
                    logger.error(f"❌ Error procesando reseña {i}: {e}")
                    continue
            
            logger.info(f"✅ Procesadas {len(processed_reviews)} reseñas para {place_name}")
            return processed_reviews
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo reseñas para {place_id}: {e}")
            return []
    
    def _get_place_details(self, place_id: str) -> Optional[Dict]:
        """
        Obtener detalles del lugar incluyendo reseñas
        
        NOTA: La API de Google Places devuelve máximo 5 reseñas por lugar.
        Esta es una limitación de Google, no de nuestro código.
        """
        try:
            url = f"{self.base_url}/details/json"
            params = {
                'place_id': place_id,
                'fields': 'name,rating,reviews,user_ratings_total',
                'key': self.api_key,
                'language': 'es'  # Reseñas en español si están disponibles
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') == 'OK':
                result = data.get('result', {})
                total_reviews = result.get('user_ratings_total', 0)
                reviews_returned = len(result.get('reviews', []))
                
                logger.info(f"📊 Lugar: {result.get('name')} - Total en Google: {total_reviews}, Obtenidas: {reviews_returned}")
                
                return result
            else:
                logger.error(f"❌ Error en API de Google: {data.get('status')} - {data.get('error_message')}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error en solicitud a Google Places API: {e}")
            return None
    
    def _process_review(self, review_data: Dict, place_id: str, place_name: str) -> Optional[Dict]:
        """
        Procesar una reseña individual
        """
        try:
            # Generar ID único para la reseña
            review_id = f"{place_id}_{review_data.get('time', int(time.time()))}"
            
            # Información del reviewer
            reviewer_name = review_data.get('author_name', 'Anonymous')
            reviewer_avatar = review_data.get('profile_photo_url', '')
            
            # Contenido de la reseña
            rating = review_data.get('rating', 0)
            review_text = review_data.get('text', '')
            
            # Fecha de la reseña (Unix timestamp)
            review_timestamp = review_data.get('time', int(time.time()))
            review_date = datetime.fromtimestamp(review_timestamp)
            
            # Información adicional
            helpful_count = 0  # Google API no proporciona esto directamente
            is_verified = False  # Por defecto false
            
            processed_review = {
                'google_place_id': place_id,
                'place_name': place_name,
                'reviewer_name': reviewer_name,
                'reviewer_avatar_url': reviewer_avatar,
                'reviewer_review_count': 0,  # No disponible en API básica
                'rating': rating,
                'review_text': review_text,
                'review_date': review_date,
                'is_verified': is_verified,
                'helpful_count': helpful_count,
                'google_review_id': review_id,
                'source_url': f"https://maps.google.com/maps/place/?q=place_id:{place_id}"
            }
            
            return processed_review
            
        except Exception as e:
            logger.error(f"❌ Error procesando reseña: {e}")
            return None
    
    def save_reviews_to_db(self, reviews: List[Dict]) -> int:
        """
        Guardar reseñas en la base de datos
        
        Returns:
            Número de reseñas guardadas
        """
        saved_count = 0
        
        for review_data in reviews:
            try:
                # Verificar si la reseña ya existe
                google_review_id = review_data['google_review_id']
                
                if GoogleReview.objects.filter(google_review_id=google_review_id).exists():
                    logger.debug(f"🔄 Reseña {google_review_id} ya existe, saltando...")
                    continue
                
                # Crear nueva reseña
                review = GoogleReview.objects.create(**review_data)
                saved_count += 1
                logger.debug(f"✅ Guardada reseña de {review.reviewer_name} para {review.place_name}")
                
            except Exception as e:
                logger.error(f"❌ Error guardando reseña: {e}")
                continue
        
        logger.info(f"💾 Guardadas {saved_count} nuevas reseñas en la base de datos")
        return saved_count
    
    def scrape_and_save_reviews(self, place_id: str, max_reviews: int = 20) -> Dict:
        """
        Proceso completo: scraping y guardado de reseñas
        
        Returns:
            Diccionario con estadísticas del proceso
        """
        start_time = time.time()
        
        logger.info(f"🚀 Iniciando scraping de reseñas para {place_id}")
        
        # Obtener reseñas
        reviews = self.get_place_reviews(place_id, max_reviews)
        
        # Guardar en base de datos
        saved_count = self.save_reviews_to_db(reviews) if reviews else 0
        
        end_time = time.time()
        duration = round(end_time - start_time, 2)
        
        result = {
            'place_id': place_id,
            'total_reviews_found': len(reviews),
            'new_reviews_saved': saved_count,
            'duration_seconds': duration,
            'success': saved_count > 0 or len(reviews) == 0
        }
        
        logger.info(f"🏁 Scraping completado: {result}")
        return result


def get_cached_reviews(place_id: str, force_refresh: bool = False) -> List[GoogleReview]:
    """
    Obtener reseñas de Google con cache
    
    Args:
        place_id: Google Place ID
        force_refresh: Forzar actualización desde Google
        
    Returns:
        Lista de objetos GoogleReview
    """
    # Verificar si necesitamos actualizar
    latest_review = GoogleReview.objects.filter(
        google_place_id=place_id
    ).first()
    
    should_refresh = (
        force_refresh or 
        not latest_review or 
        latest_review.scraped_at < timezone.now() - timedelta(hours=24)
    )
    
    if should_refresh:
        logger.info(f"🔄 Actualizando reseñas para {place_id}")
        scraper = GoogleReviewsScraper()
        scraper.scrape_and_save_reviews(place_id)
    
    # Obtener reseñas de la base de datos
    reviews = GoogleReview.objects.filter(
        google_place_id=place_id
    ).order_by('-review_date')
    
    return reviews


def scrape_reviews_for_place(place_id: str) -> Dict:
    """
    Función helper para scraping individual
    """
    scraper = GoogleReviewsScraper()
    return scraper.scrape_and_save_reviews(place_id)
