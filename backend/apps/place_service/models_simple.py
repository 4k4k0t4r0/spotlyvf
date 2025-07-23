# Versión simplificada para crear migraciones básicas
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class GoogleReview(models.Model):
    """
    Modelo para almacenar reseñas scrapeadas de Google Places
    """
    # Identificación del lugar
    google_place_id = models.CharField(max_length=200, db_index=True)
    place_name = models.CharField(max_length=200)
    
    # Información del reviewer (de Google)
    reviewer_name = models.CharField(max_length=100)
    reviewer_avatar_url = models.URLField(blank=True, null=True)
    reviewer_review_count = models.PositiveIntegerField(default=0, help_text="Número total de reseñas del usuario en Google")
    
    # Contenido de la reseña
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating de 1 a 5 estrellas"
    )
    review_text = models.TextField(blank=True, null=True)
    review_date = models.DateTimeField(help_text="Fecha de la reseña en Google")
    
    # Información adicional
    is_verified = models.BooleanField(default=False, help_text="Si Google marca al reviewer como verificado")
    helpful_count = models.PositiveIntegerField(default=0, help_text="Número de personas que marcaron como útil")
    
    # Respuesta del negocio (si existe)
    business_response = models.TextField(blank=True, null=True)
    business_response_date = models.DateTimeField(blank=True, null=True)
    
    # Metadatos de scraping
    scraped_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    source_url = models.URLField(blank=True, null=True)
    
    # Para evitar duplicados
    google_review_id = models.CharField(
        max_length=200, 
        unique=True, 
        help_text="ID único de la reseña en Google"
    )
    
    class Meta:
        ordering = ['-review_date']
        indexes = [
            models.Index(fields=['google_place_id', 'review_date']),
            models.Index(fields=['rating']),
            models.Index(fields=['scraped_at']),
        ]
        unique_together = ['google_place_id', 'google_review_id']
    
    def __str__(self):
        return f"Google Review by {self.reviewer_name} for {self.place_name} ({self.rating}★)"


class Favorite(models.Model):
    """
    Modelo para lugares favoritos de los usuarios
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    place = models.ForeignKey('place_service.Place', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'place']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['place']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.place.name}"
