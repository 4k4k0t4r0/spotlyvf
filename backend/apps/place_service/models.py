from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class PlaceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#000000")  # Hex color
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Place Category"
        verbose_name_plural = "Place Categories"

    def __str__(self):
        return self.name


class Place(models.Model):
    PRICE_RANGE_CHOICES = [
        ('$', 'Budget'),
        ('$$', 'Moderate'),
        ('$$$', 'Expensive'),
        ('$$$$', 'Very Expensive'),
    ]

    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(PlaceCategory, on_delete=models.CASCADE, related_name='places')
    
    # Location
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    
    # Business Details
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    price_range = models.CharField(max_length=4, choices=PRICE_RANGE_CHOICES)
    
    # Features and Attributes
    features = models.JSONField(default=list)  # ["WiFi", "Parking", "Pet Friendly", etc.]
    cuisines = models.JSONField(default=list)  # For restaurants
    
    # Ratings and Reviews
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    
    # Business Hours
    business_hours = models.JSONField(default=dict)  # {"monday": {"open": "09:00", "close": "18:00"}, ...}
    
    # Ownership and Status
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_places')
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # ============ NUEVOS CAMPOS PARA GESTIÓN DE NEGOCIOS ============
    
    # Integración con Google Places
    google_place_id = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        unique=True,
        help_text="Google Places ID si proviene de Google Maps"
    )
    
    # Gestión de reclamación por negocios
    is_claimed = models.BooleanField(
        default=False,
        help_text="Si un negocio ha reclamado este lugar"
    )
    claimed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='claimed_places',
        help_text="Usuario que reclamó este lugar"
    )
    claimed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha cuando fue reclamado"
    )
    
    # Estado de verificación
    VERIFICATION_STATUS_CHOICES = [
        ('unverified', 'No Verificado'),
        ('pending', 'Verificación Pendiente'),
        ('verified', 'Verificado'),
        ('rejected', 'Rechazado'),
    ]
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='unverified'
    )
    verification_notes = models.TextField(
        blank=True,
        help_text="Notas del proceso de verificación"
    )
    
    # Información adicional del negocio
    business_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nombre legal del negocio"
    )
    business_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Teléfono principal del negocio"
    )
    business_email = models.EmailField(
        blank=True,
        help_text="Email de contacto del negocio"
    )
    business_registration = models.CharField(
        max_length=50,
        blank=True,
        help_text="Número de registro o RUC"
    )
    
    # Configuración de reservas
    accepts_reservations = models.BooleanField(
        default=True,
        help_text="Si acepta reservas en línea"
    )
    auto_approve_reservations = models.BooleanField(
        default=False,
        help_text="Si las reservas se aprueban automáticamente"
    )
    max_advance_days = models.IntegerField(
        default=30,
        help_text="Días máximos de anticipación para reservas"
    )
    min_advance_hours = models.IntegerField(
        default=2,
        help_text="Horas mínimas de anticipación para reservas"
    )
    
    # Configuración de capacidad
    max_capacity = models.IntegerField(
        null=True,
        blank=True,
        help_text="Capacidad máxima del lugar"
    )
    tables_count = models.IntegerField(
        null=True,
        blank=True,
        help_text="Número de mesas (para restaurantes)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['category']),
            models.Index(fields=['city']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.city}"


class PlaceImage(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='images')
    image = models.URLField(max_length=500)  # Cambiado a URLField para URLs de imágenes
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.place.name} - Image {self.order}"


class PlaceReview(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200)
    comment = models.TextField()
    visit_date = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['place', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.place.name} - {self.rating}★"


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente de Aprobación'),
        ('CONFIRMED', 'Confirmada'),
        ('REJECTED', 'Rechazada'),
        ('CANCELLED', 'Cancelada'),
        ('COMPLETED', 'Completada'),
        ('NO_SHOW', 'No se presentó'),
    ]

    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    place = models.ForeignKey(
        Place, 
        on_delete=models.CASCADE, 
        related_name='reservations',
        null=True,
        blank=True,
        help_text="Lugar interno vinculado (opcional si es Google Place no vinculado)"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    
    # Reservation Details
    reservation_date = models.DateField()
    reservation_time = models.TimeField()
    party_size = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    
    # Contact Info
    contact_name = models.CharField(max_length=200)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField()
    
    # Special Requests
    special_requests = models.TextField(blank=True)
    
    # Google Places Integration
    google_place_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Google Place ID si la reserva es de un lugar de Google Places"
    )
    google_place_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Nombre del lugar de Google Places (solo para reservas de Google Places)"
    )
    google_place_address = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Dirección del lugar de Google Places (solo para reservas de Google Places)"
    )
    
    # ============ GESTIÓN DEL NEGOCIO ============
    
    # Status and Confirmation
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    confirmation_code = models.CharField(max_length=10, unique=True)
    
    # Gestión por parte del negocio
    business_notes = models.TextField(
        blank=True,
        help_text="Notas internas del negocio"
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Razón del rechazo si aplica"
    )
    approved_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_reservations',
        help_text="Usuario del negocio que aprobó/rechazó"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha de aprobación/rechazo"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha cuando se marcó como completada"
    )
    no_show_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha cuando se marcó como no presentada"
    )
    
    # Mesa asignada (para restaurantes)
    assigned_table = models.CharField(
        max_length=50,
        blank=True,
        help_text="Mesa asignada por el restaurante"
    )
    
    # Business Info
    estimated_duration = models.DurationField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-reservation_date', '-reservation_time']
        unique_together = ['place', 'reservation_date', 'reservation_time']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['place']),
            models.Index(fields=['reservation_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.contact_name} - {self.place.name} - {self.reservation_date} {self.reservation_time}"
    
    def save(self, *args, **kwargs):
        if not self.confirmation_code:
            import random
            import string
            self.confirmation_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)


class ReservationTimeSlot(models.Model):
    """Horarios disponibles para reservas por día de la semana"""
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='time_slots')
    day_of_week = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(6)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_capacity = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['place', 'day_of_week', 'start_time']
        ordering = ['day_of_week', 'start_time']
    
    def __str__(self):
        days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        return f"{self.place.name} - {days[self.day_of_week]} {self.start_time}-{self.end_time}"


class Review(models.Model):
    RATING_CHOICES = [
        (1, '1 estrella'),
        (2, '2 estrellas'),
        (3, '3 estrellas'),
        (4, '4 estrellas'),
        (5, '5 estrellas'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_reviews'
    )
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='place_reviews',
        null=True,
        blank=True
    )
    
    # Para lugares de Google Places que no están en nuestra BD
    google_place_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Google Places ID para lugares externos"
    )
    google_place_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Nombre del lugar de Google Places"
    )
    google_place_address = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Dirección del lugar de Google Places"
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
    
    # ============ RESPUESTA DEL NEGOCIO ============
    business_response = models.TextField(
        blank=True,
        null=True,
        help_text="Respuesta del negocio a la reseña"
    )
    business_response_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Fecha de la respuesta del negocio"
    )
    business_responder = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='business_responses',
        help_text="Usuario del negocio que respondió"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['place', 'is_approved']),
            models.Index(fields=['google_place_id']),
            models.Index(fields=['user']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
        constraints = [
            # Un usuario solo puede reseñar un lugar una vez (para lugares de BD)
            models.UniqueConstraint(
                fields=['user', 'place'],
                condition=models.Q(place__isnull=False),
                name='unique_user_place_review'
            ),
            # Un usuario solo puede reseñar un Google Place una vez
            models.UniqueConstraint(
                fields=['user', 'google_place_id'],
                condition=models.Q(google_place_id__isnull=False),
                name='unique_user_google_place_review'
            ),
            # Debe tener place O google_place_id
            models.CheckConstraint(
                check=models.Q(place__isnull=False) | models.Q(google_place_id__isnull=False),
                name='review_must_have_place_or_google_place'
            ),
        ]
    
    def __str__(self):
        place_name = self.place.name if self.place else self.google_place_name
        return f"Reseña de {self.user.email} para {place_name} - {self.rating} estrellas"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validar que se proporcione exactamente uno: place o google_place_id
        if not self.place and not self.google_place_id:
            raise ValidationError('Debe proporcionar un lugar de la BD o un Google Place ID')
        
        if self.place and self.google_place_id:
            raise ValidationError('No puede proporcionar tanto un lugar de la BD como un Google Place ID')
        
        # Si es un Google Place, requerir nombre y dirección
        if self.google_place_id and not self.google_place_name:
            raise ValidationError('El nombre del Google Place es requerido')
    
    @property
    def place_name(self):
        """Retorna el nombre del lugar, sea de BD o Google Places"""
        return self.place.name if self.place else self.google_place_name
    
    @property
    def place_address(self):
        """Retorna la dirección del lugar, sea de BD o Google Places"""
        if self.place:
            return f"{self.place.address}, {self.place.city}"
        return self.google_place_address or "Dirección no disponible"
    
    @property
    def is_google_place(self):
        """Indica si esta reseña es para un lugar de Google Places"""
        return bool(self.google_place_id)


# ============ NUEVOS MODELOS PARA GESTIÓN DE NEGOCIOS ============

class PlaceClaim(models.Model):
    """Modelo para gestionar las reclamaciones de lugares por parte de negocios"""
    
    CLAIM_STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('under_review', 'En Revisión'),
        ('approved', 'Aprobada'),
        ('rejected', 'Rechazada'),
    ]
    
    # Información básica
    place = models.ForeignKey(
        Place, 
        on_delete=models.CASCADE, 
        related_name='claims',
        null=True,
        blank=True,
        help_text="Lugar local (para lugares ya en nuestra base de datos)"
    )
    google_place_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Google Place ID (para lugares de Google Places)"
    )
    claimant = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='place_claims'
    )
    
    # Documentación de la reclamación
    business_name = models.CharField(max_length=200)
    business_registration = models.CharField(
        max_length=50,
        help_text="RUC, Cédula o número de registro"
    )
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField()
    
    # Documentos de verificación
    verification_documents = models.JSONField(
        default=list,
        help_text="URLs de documentos subidos para verificación"
    )
    
    # Estado y proceso
    status = models.CharField(
        max_length=20,
        choices=CLAIM_STATUS_CHOICES,
        default='pending'
    )
    claim_message = models.TextField(
        help_text="Mensaje explicando por qué reclama este lugar"
    )
    admin_notes = models.TextField(
        blank=True,
        help_text="Notas del administrador durante la revisión"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        # Actualizar unique_together para incluir google_place_id
        constraints = [
            models.UniqueConstraint(
                fields=['place', 'claimant'],
                condition=models.Q(place__isnull=False),
                name='unique_place_claimant'
            ),
            models.UniqueConstraint(
                fields=['google_place_id', 'claimant'],
                condition=models.Q(google_place_id__isnull=False),
                name='unique_google_place_claimant'
            ),
        ]
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.place and not self.google_place_id:
            raise ValidationError("Debe especificar un lugar local o un Google Place ID")
        if self.place and self.google_place_id:
            raise ValidationError("No puede especificar tanto un lugar local como un Google Place ID")
    
    def __str__(self):
        place_name = self.place.name if self.place else f"Google Place {self.google_place_id}"
        return f"Reclamación de {self.claimant.email} para {place_name}"


class BusinessProfile(models.Model):
    """Perfil extendido para usuarios que son negocios"""
    
    BUSINESS_TYPE_CHOICES = [
        ('restaurant', 'Restaurante'),
        ('hotel', 'Hotel'),
        ('cafe', 'Café'),
        ('bar', 'Bar'),
        ('retail', 'Tienda'),
        ('service', 'Servicio'),
        ('entertainment', 'Entretenimiento'),
        ('other', 'Otro'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='business_profile',
        null=True,
        blank=True
    )
    
    # Información del negocio
    business_name = models.CharField(max_length=200, blank=True, default="")
    business_type = models.CharField(
        max_length=20,
        choices=BUSINESS_TYPE_CHOICES,
        default='other'
    )
    business_registration = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="RUC o número de registro"
    )
    
    # Información de contacto
    contact_phone = models.CharField(max_length=20, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    website = models.URLField(blank=True)
    
    # Configuración de notificaciones
    email_notifications = models.BooleanField(
        default=True,
        help_text="Recibir notificaciones por email"
    )
    sms_notifications = models.BooleanField(
        default=False,
        help_text="Recibir notificaciones por SMS"
    )
    
    # Estado del perfil
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.business_name} ({self.user.email})"


class GooglePlaceSync(models.Model):
    """Modelo para sincronizar y cachear lugares de Google Places"""
    
    google_place_id = models.CharField(max_length=200, unique=True)
    name = models.CharField(max_length=200)
    formatted_address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Información de Google
    google_types = models.JSONField(default=list)
    google_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    google_user_ratings_total = models.IntegerField(null=True, blank=True)
    google_price_level = models.IntegerField(null=True, blank=True)
    google_photos = models.JSONField(default=list)
    
    # Relación con lugar local (si existe)
    local_place = models.OneToOneField(
        Place,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='google_sync'
    )
    
    # Timestamps
    last_synced = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-last_synced']
        indexes = [
            models.Index(fields=['google_place_id']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"Google Place: {self.name}"


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
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='favorited_by')
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
