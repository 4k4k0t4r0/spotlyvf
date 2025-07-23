from rest_framework import serializers
from .models import (
    Place, PlaceCategory, PlaceImage, PlaceReview, Reservation, Review,
    PlaceClaim, BusinessProfile, GooglePlaceSync, GoogleReview, Favorite
)
from django.contrib.auth import get_user_model

User = get_user_model()


class PlaceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaceCategory
        fields = ['id', 'name', 'icon', 'color', 'description']


class PlaceImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PlaceImage
        fields = ['id', 'image', 'image_url', 'caption', 'is_primary', 'order']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GoogleReviewSerializer(serializers.ModelSerializer):
    """
    Serializer para reseñas de Google Places
    """
    class Meta:
        model = GoogleReview
        fields = [
            'id',
            'google_place_id', 
            'place_name',
            'reviewer_name',
            'reviewer_avatar_url',
            'reviewer_review_count',
            'rating',
            'review_text',
            'review_date',
            'is_verified',
            'helpful_count',
            'business_response',
            'business_response_date',
            'scraped_at'
        ]


class PlaceReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar', read_only=True)

    class Meta:
        model = PlaceReview
        fields = [
            'id', 'rating', 'title', 'comment', 'visit_date', 
            'user_name', 'user_avatar', 'helpful_count', 'created_at'
        ]


class PlaceListSerializer(serializers.ModelSerializer):
    category = PlaceCategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    isGooglePlace = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = [
            'id', 'name', 'description', 'category', 'latitude', 'longitude',
            'address', 'city', 'price_range', 'average_rating', 'total_reviews',
            'primary_image', 'distance', 'features', 'isGooglePlace', 'google_place_id'
        ]

    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if not primary_image:
            primary_image = obj.images.first()
        
        if primary_image:
            # Ahora image es una URLField (string), no ImageField
            return primary_image.image
        return None

    def get_distance(self, obj):
        # This will be calculated in the view based on user location
        return getattr(obj, 'distance', None)

    def get_isGooglePlace(self, obj):
        # Check if place has a google_place_id
        return bool(obj.google_place_id)


class PlaceDetailSerializer(serializers.ModelSerializer):
    category = PlaceCategorySerializer(read_only=True)
    images = PlaceImageSerializer(many=True, read_only=True)
    reviews = PlaceReviewSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    isGooglePlace = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = [
            'id', 'name', 'description', 'category', 'latitude', 'longitude',
            'address', 'city', 'state', 'country', 'zip_code', 'phone', 'email',
            'website', 'price_range', 'features', 'cuisines', 'average_rating',
            'total_reviews', 'business_hours', 'owner_name', 'is_verified',
            'images', 'reviews', 'created_at', 'isGooglePlace', 'google_place_id'
        ]

    def get_isGooglePlace(self, obj):
        # Check if place has a google_place_id
        return bool(obj.google_place_id)


class PlaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = [
            'name', 'description', 'category', 'latitude', 'longitude',
            'address', 'city', 'state', 'country', 'zip_code', 'phone',
            'email', 'website', 'price_range', 'features', 'cuisines',
            'business_hours'
        ]

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class PlaceReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaceReview
        fields = ['place', 'rating', 'title', 'comment', 'visit_date']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReservationSerializer(serializers.ModelSerializer):
    place_name = serializers.CharField(source='place.name', read_only=True)
    place_address = serializers.CharField(source='place.address', read_only=True)
    place_image = serializers.SerializerMethodField()
    user_name = serializers.CharField(source='user.username', read_only=True)
    is_upcoming = serializers.SerializerMethodField()
    can_be_cancelled = serializers.SerializerMethodField()
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'place', 'place_name', 'place_address', 'place_image',
            'user', 'user_name', 'reservation_date', 'reservation_time', 'party_size', 
            'special_requests', 'status', 'contact_name', 'contact_phone', 
            'contact_email', 'confirmation_code', 'business_notes', 'rejection_reason',
            'approved_by', 'approved_at', 'completed_at', 'no_show_at', 
            'assigned_table', 'created_at', 'updated_at',
            'is_upcoming', 'can_be_cancelled'
        ]
        read_only_fields = ['user', 'confirmation_code', 'approved_by', 'approved_at', 
                          'completed_at', 'no_show_at', 'created_at', 'updated_at']
    
    def get_place_image(self, obj):
        # Verificar si place existe antes de acceder a sus imágenes
        if not obj.place:
            return None
            
        main_image = obj.place.images.filter(is_primary=True).first()
        if main_image:
            return main_image.image.url if main_image.image else None
        return None

    def get_is_upcoming(self, obj):
        from django.utils import timezone
        return obj.reservation_date > timezone.now().date() and obj.status in ['PENDING', 'CONFIRMED']

    def get_can_be_cancelled(self, obj):
        from django.utils import timezone
        return obj.status in ['PENDING', 'CONFIRMED'] and obj.reservation_date > timezone.now().date()
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        # Generar código de confirmación
        import random, string
        validated_data['confirmation_code'] = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        return super().create(validated_data)


class ReservationCreateSerializer(serializers.Serializer):
    # Campos requeridos
    reservation_date = serializers.DateField()
    reservation_time = serializers.TimeField()
    party_size = serializers.IntegerField(min_value=1, max_value=20)
    contact_name = serializers.CharField(max_length=200)
    contact_phone = serializers.CharField(max_length=20)
    contact_email = serializers.EmailField()
    
    # Campos opcionales
    special_requests = serializers.CharField(required=False, allow_blank=True)
    place = serializers.UUIDField(required=False, allow_null=True)
    google_place_id = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validar que se proporcione place O google_place_id"""
        place = data.get('place')
        google_place_id = data.get('google_place_id')
        
        if not place and not google_place_id:
            raise serializers.ValidationError(
                "Debe proporcionar 'place' (UUID) o 'google_place_id'"
            )
        
        return data
    
    def create(self, validated_data):
        google_place_id = validated_data.pop('google_place_id', None)
        place_uuid = validated_data.get('place')
        
        # Si se proporciona un UUID de place, convertirlo a instancia
        if place_uuid:
            try:
                place_instance = Place.objects.get(id=place_uuid)
                validated_data['place'] = place_instance
                print(f"✅ Using place instance: {place_instance.name} (ID: {place_instance.id})")
            except Place.DoesNotExist:
                raise serializers.ValidationError(f"Place with UUID {place_uuid} not found")
        
        # Si se proporciona un Google Place ID pero no un place UUID
        elif google_place_id:
            try:
                # Buscar lugar en BD que tenga este Google Place ID
                place_instance = Place.objects.get(google_place_id=google_place_id)
                validated_data['place'] = place_instance
                print(f"✅ Found linked place for Google Place ID {google_place_id}: {place_instance.name} (Owner: {place_instance.owner.username})")
            except Place.DoesNotExist:
                print(f"⚠️ No linked place found for Google Place ID {google_place_id} - creating Google Places only reservation")
                # Para Google Places sin lugar vinculado, crear reserva sin place
                validated_data['google_place_id'] = google_place_id
                validated_data['place'] = None
        
        # Generar código de confirmación
        import random
        import string
        validated_data['confirmation_code'] = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        return Reservation.objects.create(**validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    place_name = serializers.SerializerMethodField(read_only=True)
    place_address = serializers.SerializerMethodField(read_only=True)
    is_google_place = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'user_email', 'place', 'place_name', 'place_address',
            'google_place_id', 'google_place_name', 'google_place_address', 'is_google_place',
            'rating', 'title', 'content', 'visited_date', 'would_recommend',
            'created_at', 'updated_at', 'is_approved', 'is_featured'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'is_approved', 'is_featured']
    
    def get_place_name(self, obj):
        return obj.place_name
    
    def get_place_address(self, obj):
        return obj.place_address
    
    def get_is_google_place(self, obj):
        return obj.is_google_place
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, data):
        # Validar que se proporcione exactamente uno: place o google_place_id
        place = data.get('place')
        google_place_id = data.get('google_place_id')
        
        if not place and not google_place_id:
            raise serializers.ValidationError('Debe proporcionar un lugar de la BD o un Google Place ID')
        
        if place and google_place_id:
            raise serializers.ValidationError('No puede proporcionar tanto un lugar de la BD como un Google Place ID')
        
        # Si es un Google Place, requerir nombre
        if google_place_id and not data.get('google_place_name'):
            raise serializers.ValidationError('El nombre del Google Place es requerido')
        
        return data


class ReviewWithPlaceSerializer(serializers.ModelSerializer):
    """Serializer para mostrar reseñas con información completa del lugar"""
    user = serializers.SerializerMethodField()
    place = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'place', 'rating', 'title', 'content', 'visited_date', 
            'would_recommend', 'created_at', 'updated_at', 'is_approved', 'is_featured'
        ]
    
    def get_user(self, obj):
        if obj.user:
            # Safely get avatar URL if it exists
            avatar_url = None
            try:
                if hasattr(obj.user, 'avatar') and obj.user.avatar:
                    avatar_url = obj.user.avatar.url
            except (ValueError, AttributeError):
                pass  # Avatar field exists but no file is associated
            
            return {
                'firstName': obj.user.first_name or obj.user.username,
                'lastName': obj.user.last_name or '',
                'avatar': avatar_url
            }
        return None
    
    def get_place(self, obj):
        if obj.place:
            # Para lugares de nuestra BD
            primary_image = None
            if hasattr(obj.place, 'images') and obj.place.images.exists():
                first_image = obj.place.images.filter(is_primary=True).first()
                if not first_image:
                    first_image = obj.place.images.first()
                if first_image and first_image.image:
                    request = self.context.get('request')
                    if request:
                        primary_image = request.build_absolute_uri(first_image.image.url)
                    else:
                        primary_image = first_image.image.url
            
            return {
                'id': str(obj.place.id),
                'name': obj.place.name,
                'category': {
                    'name': obj.place.category.name if obj.place.category else 'Sin categoría',
                    'icon': obj.place.category.icon if obj.place.category else 'location',
                    'color': obj.place.category.color if obj.place.category else '#95A5A6'
                },
                'primary_image': primary_image,
                'city': obj.place.city,
                'address': f"{obj.place.address}, {obj.place.city}",
                'is_google_place': False
            }
        elif obj.google_place_id:
            # Para lugares de Google Places
            return {
                'id': obj.google_place_id,
                'name': obj.google_place_name,
                'category': {
                    'name': 'Google Places',
                    'icon': 'map',
                    'color': '#4285F4'
                },
                'primary_image': None,  # Google Places no tienen imágenes en nuestra BD
                'city': 'Ubicación actual',
                'address': obj.google_place_address or 'Dirección no disponible',
                'is_google_place': True
            }
        return None


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'place', 'google_place_id', 'google_place_name', 'google_place_address',
            'rating', 'title', 'content', 'visited_date', 'would_recommend'
        ]
    
    def create(self, validated_data):
        # Asignar el usuario autenticado
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, data):
        # Validar que se proporcione exactamente uno: place o google_place_id
        place = data.get('place')
        google_place_id = data.get('google_place_id')
        
        if not place and not google_place_id:
            raise serializers.ValidationError('Debe proporcionar un lugar de la BD o un Google Place ID')
        
        if place and google_place_id:
            raise serializers.ValidationError('No puede proporcionar tanto un lugar de la BD como un Google Place ID')
        
        # Si es un Google Place, requerir nombre
        if google_place_id and not data.get('google_place_name'):
            raise serializers.ValidationError('El nombre del Google Place es requerido')
        
        return data


class BusinessProfileSerializer(serializers.ModelSerializer):
    """Serializer para el perfil de negocio"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = BusinessProfile
        fields = [
            'id', 'user', 'user_name', 'user_email', 'business_name', 
            'business_type', 'tax_id', 'address', 'phone', 'website',
            'description', 'logo', 'is_verified', 'verification_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'is_verified', 'verification_date']


class PlaceClaimSerializer(serializers.ModelSerializer):
    """Serializer para reclamaciones de lugares"""
    claimant_name = serializers.CharField(source='claimant.get_full_name', read_only=True)
    claimant_email = serializers.CharField(source='claimant.email', read_only=True)
    place_name = serializers.SerializerMethodField()

    class Meta:
        model = PlaceClaim
        fields = [
            'id', 'place', 'google_place_id', 'claimant', 'claimant_name', 'claimant_email',
            'business_name', 'business_registration', 'contact_phone', 'contact_email',
            'verification_documents', 'claim_message', 'status', 
            'admin_notes', 'created_at', 'reviewed_at', 'approved_at', 'place_name'
        ]
        read_only_fields = [
            'claimant', 'created_at', 'reviewed_at', 'approved_at'
        ]
    
    def get_place_name(self, obj):
        """Obtener nombre del lugar (local o Google)"""
        if obj.place:
            return obj.place.name
        elif obj.google_place_id:
            return f"Google Place {obj.google_place_id}"
        return "Lugar no especificado"


class GooglePlaceSyncSerializer(serializers.ModelSerializer):
    """Serializer para sincronización de Google Places"""
    place_name = serializers.CharField(source='place.name', read_only=True)

    class Meta:
        model = GooglePlaceSync
        fields = [
            'id', 'place', 'place_name', 'google_place_id', 
            'google_data', 'last_sync', 'sync_status', 
            'error_message', 'created_at', 'updated_at'
        ]


class PlaceClaimCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear reclamaciones de lugares"""
    
    class Meta:
        model = PlaceClaim
        fields = [
            'place', 'google_place_id', 'business_name', 'business_registration',
            'contact_phone', 'contact_email', 'verification_documents', 'claim_message'
        ]
    
    def validate(self, data):
        """Validar que se especifique lugar local o Google Place ID, pero no ambos"""
        place = data.get('place')
        google_place_id = data.get('google_place_id')
        
        if not place and not google_place_id:
            raise serializers.ValidationError(
                "Debe especificar un lugar local o un Google Place ID"
            )
        
        if place and google_place_id:
            raise serializers.ValidationError(
                "No puede especificar tanto un lugar local como un Google Place ID"
            )
        
        return data

    def create(self, validated_data):
        """Crear reclamación asignando el usuario actual"""
        validated_data['claimant'] = self.context['request'].user
        return super().create(validated_data)


class BusinessReservationSerializer(serializers.ModelSerializer):
    """Serializer para reservas en vistas de negocio con más detalles"""
    place_name = serializers.SerializerMethodField()
    place_address = serializers.SerializerMethodField()
    place_image = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_google_place = serializers.SerializerMethodField()
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'place', 'place_name', 'place_address', 'place_image', 'google_place_id',
            'user', 'user_name', 'user_email', 'user_phone', 
            'reservation_date', 'reservation_time', 'party_size', 
            'special_requests', 'status', 'status_display', 'contact_name', 'contact_phone', 
            'contact_email', 'confirmation_code', 'business_notes', 'rejection_reason',
            'approved_by', 'approved_by_name', 'approved_at', 'completed_at', 'no_show_at', 
            'assigned_table', 'created_at', 'updated_at', 'is_google_place'
        ]
        read_only_fields = ['user', 'confirmation_code', 'approved_by', 'approved_at', 
                          'completed_at', 'no_show_at', 'created_at', 'updated_at']

    def get_place_name(self, obj):
        """Obtener el nombre del lugar, ya sea de Place o de google_place_name"""
        if obj.place:
            return obj.place.name
        elif obj.google_place_id and obj.google_place_name:
            return obj.google_place_name
        return "Lugar no disponible"

    def get_place_address(self, obj):
        """Obtener la dirección del lugar"""
        if obj.place:
            return obj.place.address
        elif obj.google_place_id and obj.google_place_address:
            return obj.google_place_address
        return "Dirección no disponible"

    def get_user_name(self, obj):
        """Obtener el nombre completo del usuario o username como fallback"""
        if obj.user:
            full_name = obj.user.get_full_name()
            if full_name.strip():
                return full_name
            return obj.user.username
        return "Usuario desconocido"

    def get_approved_by_name(self, obj):
        """Obtener el nombre de quien aprobó la reserva"""
        if obj.approved_by:
            full_name = obj.approved_by.get_full_name()
            if full_name.strip():
                return full_name
            return obj.approved_by.username
        return None

    def get_is_google_place(self, obj):
        """Verificar si es una reserva de Google Place"""
        return bool(obj.google_place_id)

    def get_place_image(self, obj):
        if obj.place:
            main_image = obj.place.images.filter(is_primary=True).first()
            if main_image:
                return main_image.image if main_image.image else None
        return None


class GoogleReviewSerializer(serializers.ModelSerializer):
    """
    Serializer para reseñas de Google Places
    """
    class Meta:
        model = GoogleReview
        fields = [
            'id',
            'google_place_id', 
            'place_name',
            'reviewer_name',
            'reviewer_avatar_url',
            'reviewer_review_count',
            'rating',
            'review_text',
            'review_date',
            'is_verified',
            'helpful_count',
            'business_response',
            'business_response_date',
            'scraped_at'
        ]


class FavoriteSerializer(serializers.ModelSerializer):
    place = PlaceListSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'place', 'created_at']
        read_only_fields = ['user', 'created_at']
