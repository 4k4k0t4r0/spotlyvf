from django.db import models
from django.conf import settings
from .models import Place

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('rejected', 'Rechazada'),
        ('cancelled', 'Cancelada'),
        ('completed', 'Completada'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    
    # Detalles de la reserva
    reservation_date = models.DateTimeField()
    party_size = models.PositiveIntegerField(default=1)
    special_requests = models.TextField(blank=True, null=True)
    
    # Estado y seguimiento
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Contacto
    contact_name = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField()
    
    # Campos para gestión de negocios
    business_notes = models.TextField(blank=True, null=True, help_text="Notas del negocio sobre la reserva")
    rejection_reason = models.TextField(blank=True, null=True, help_text="Razón del rechazo por parte del negocio")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_reservations',
        help_text="Usuario del negocio que aprobó la reserva"
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Campos opcionales para confirmación
    confirmation_code = models.CharField(max_length=20, blank=True, null=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['place', 'reservation_date']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Reserva de {self.contact_name} en {self.place.name} - {self.reservation_date}"
    
    @property
    def is_upcoming(self):
        from django.utils import timezone
        return self.reservation_date > timezone.now() and self.status in ['pending', 'confirmed']
    
    @property
    def can_be_cancelled(self):
        from django.utils import timezone
        from datetime import timedelta
        # Se puede cancelar hasta 2 horas antes
        return self.reservation_date > timezone.now() + timedelta(hours=2) and self.status in ['pending', 'confirmed']


class Review(models.Model):
    RATING_CHOICES = [
        (1, '1 estrella'),
        (2, '2 estrellas'),
        (3, '3 estrellas'),
        (4, '4 estrellas'),
        (5, '5 estrellas'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    reservation = models.OneToOneField(
        Reservation,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='review'
    )
    
    # Contenido de la reseña
    rating = models.PositiveIntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    # Detalles adicionales
    visited_date = models.DateField(blank=True, null=True)
    would_recommend = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Moderación
    is_approved = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'place']  # Un usuario solo puede reseñar un lugar una vez
        indexes = [
            models.Index(fields=['place', 'is_approved']),
            models.Index(fields=['user']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Reseña de {self.user.email} para {self.place.name} - {self.rating} estrellas"
