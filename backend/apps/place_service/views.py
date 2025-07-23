from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from geopy.distance import geodesic
import math
import uuid
from django.utils import timezone

from .models import Place, PlaceCategory, PlaceReview, Reservation, Review, GoogleReview, Favorite
from .serializers import (
    PlaceListSerializer, PlaceDetailSerializer, PlaceCreateSerializer,
    PlaceCategorySerializer, PlaceReviewSerializer, PlaceReviewCreateSerializer,
    ReservationSerializer, ReservationCreateSerializer,
    ReviewSerializer, ReviewCreateSerializer, ReviewWithPlaceSerializer,
    GoogleReviewSerializer, FavoriteSerializer
)
from .google_reviews_scraper import get_cached_reviews, scrape_reviews_for_place


class PlaceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlaceCategory.objects.filter(is_active=True)
    serializer_class = PlaceCategorySerializer
    permission_classes = [permissions.AllowAny]


class PlaceViewSet(viewsets.ModelViewSet):
    queryset = Place.objects.filter(is_active=True).select_related('category', 'owner').prefetch_related('images', 'reviews')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'price_range', 'city']
    search_fields = ['name', 'description', 'address', 'city']
    ordering_fields = ['created_at', 'average_rating', 'name']
    ordering = ['-average_rating', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PlaceListSerializer
        elif self.action == 'create':
            return PlaceCreateSerializer
        return PlaceDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by location radius
        latitude = self.request.query_params.get('latitude')
        longitude = self.request.query_params.get('longitude')
        radius = self.request.query_params.get('radius', 10)  # Default 10km
        
        if latitude and longitude:
            try:
                user_lat = float(latitude)
                user_lon = float(longitude)
                radius_km = float(radius)
                
                # Filter places within radius and calculate distance
                places_with_distance = []
                for place in queryset:
                    place_coords = (float(place.latitude), float(place.longitude))
                    user_coords = (user_lat, user_lon)
                    distance = geodesic(user_coords, place_coords).kilometers
                    
                    if distance <= radius_km:
                        place.distance = round(distance, 2)
                        places_with_distance.append(place)
                
                # Sort by distance
                places_with_distance.sort(key=lambda x: x.distance)
                
                # Convert back to queryset
                place_ids = [place.id for place in places_with_distance]
                queryset = queryset.filter(id__in=place_ids)
                
                # Preserve order and distance info
                queryset = sorted(queryset, key=lambda x: next(p.distance for p in places_with_distance if p.id == x.id))
                
            except (ValueError, TypeError):
                pass
        
        return queryset

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get places near user location"""
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        radius = request.query_params.get('radius', 5)  # Default 5km for nearby
        
        if not latitude or not longitude:
            return Response(
                {'error': 'latitude and longitude parameters are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the same logic as get_queryset but with smaller radius
        request.query_params._mutable = True
        request.query_params['radius'] = radius
        request.query_params._mutable = False
        
        queryset = self.get_queryset()[:20]  # Limit to 20 nearby places
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular places (highest rated)"""
        queryset = self.get_queryset().filter(
            average_rating__gte=4.0,
            total_reviews__gte=5
        ).order_by('-average_rating', '-total_reviews')[:20]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_review(self, request, pk=None):
        """Add a review to a place"""
        place = self.get_object()
        serializer = PlaceReviewCreateSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Check if user already reviewed this place
            existing_review = PlaceReview.objects.filter(place=place, user=request.user).first()
            if existing_review:
                return Response(
                    {'error': 'You have already reviewed this place'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            review = serializer.save(place=place)
            
            # Update place rating
            self._update_place_rating(place)
            
            return Response(PlaceReviewSerializer(review).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_favorite(self, request, pk=None):
        """Add place to user's favorites"""
        place = self.get_object()
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            place=place
        )
        
        if created:
            return Response({'message': 'Lugar agregado a favoritos'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'El lugar ya está en tus favoritos'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def remove_favorite(self, request, pk=None):
        """Remove place from user's favorites"""
        place = self.get_object()
        
        try:
            favorite = Favorite.objects.get(user=request.user, place=place)
            favorite.delete()
            return Response({'message': 'Lugar eliminado de favoritos'}, status=status.HTTP_200_OK)
        except Favorite.DoesNotExist:
            return Response({'message': 'El lugar no está en tus favoritos'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def favorites(self, request):
        """Get user's favorite places"""
        favorites = Favorite.objects.filter(user=request.user).select_related('place')
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def is_favorite(self, request, pk=None):
        """Check if place is in user's favorites"""
        place = self.get_object()
        is_favorite = Favorite.objects.filter(user=request.user, place=place).exists()
        return Response({'is_favorite': is_favorite})

    def _update_place_rating(self, place):
        """Update place average rating and total reviews"""
        reviews = place.reviews.all()
        if reviews:
            total_rating = sum(review.rating for review in reviews)
            place.average_rating = total_rating / len(reviews)
            place.total_reviews = len(reviews)
            place.save(update_fields=['average_rating', 'total_reviews'])


class PlaceReviewViewSet(viewsets.ModelViewSet):
    queryset = PlaceReview.objects.all().select_related('user', 'place')
    serializer_class = PlaceReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['place', 'rating']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PlaceReviewCreateSerializer
        return PlaceReviewSerializer

    def get_queryset(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return self.queryset.filter(user=self.request.user)
        return self.queryset


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['place', 'status']
    ordering = ['-reservation_date']

    def get_queryset(self):
        return Reservation.objects.filter(user=self.request.user).select_related('place', 'user')

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer

    def create(self, request, *args, **kwargs):
        """Override create para manejar Google Places sin place vinculado"""
        # Log para debugging
        print(f"🔍 Create reservation request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Ejecutar el método perform_create que maneja la lógica
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """Crear reserva con el usuario autenticado y status PENDING"""
        print(f"🔍 Perform create with validated data: {serializer.validated_data}")
        serializer.save(user=self.request.user, status='PENDING')

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.can_be_cancelled:
            reservation.status = 'cancelled'
            reservation.save()
            return Response({'status': 'Reserva cancelada'})
        return Response(
            {'error': 'No se puede cancelar esta reserva'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Obtener reservas próximas del usuario"""
        upcoming_reservations = self.get_queryset().filter(
            status__in=['pending', 'confirmed'],
            reservation_date__gt=timezone.now()
        )
        serializer = self.get_serializer(upcoming_reservations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_reservations(self, request):
        """Obtener todas las reservas del usuario actual"""
        user_reservations = self.get_queryset().order_by('-created_at')
        serializer = self.get_serializer(user_reservations, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewWithPlaceSerializer
    permission_classes = [permissions.AllowAny]  # Permitir acceso sin autenticación para ver reseñas
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['place', 'google_place_id', 'rating', 'is_approved']
    ordering = ['-created_at']

    def get_queryset(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Para operaciones de escritura, solo permitir al propietario
            if not self.request.user.is_authenticated:
                return Review.objects.none()
            return Review.objects.filter(user=self.request.user)
        
        # Para lectura, mostrar solo reseñas aprobadas con información del lugar
        queryset = Review.objects.filter(is_approved=True).select_related(
            'user', 'place', 'place__category'
        ).prefetch_related('place__images')
        
        # Filtrar por place_id si se proporciona (puede ser para lugares de BD o Google Places)
        place_id = self.request.query_params.get('place_id')
        if place_id:
            # Intentar filtrar por lugar de BD primero
            try:
                place_uuid = uuid.UUID(place_id)
                queryset = queryset.filter(place_id=place_uuid)
            except ValueError:
                # Si no es un UUID válido, asumir que es un Google Place ID
                queryset = queryset.filter(google_place_id=place_id)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReviewSerializer
        elif self.action == 'place_reviews':
            return ReviewSerializer  # Usar ReviewSerializer que incluye user_name y place_name
        return ReviewWithPlaceSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        """Crear una nueva reseña"""
        # Verificar si ya existe una reseña del usuario para este lugar
        user = request.user
        place = request.data.get('place')
        google_place_id = request.data.get('google_place_id')
        
        existing_review = None
        if place:
            existing_review = Review.objects.filter(user=user, place=place).first()
        elif google_place_id:
            existing_review = Review.objects.filter(user=user, google_place_id=google_place_id).first()
        
        if existing_review:
            return Response(
                {'error': 'Ya has reseñado este lugar anteriormente'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Obtener las reseñas del usuario actual"""
        user_reviews = Review.objects.filter(user=request.user).select_related('place')
        serializer = self.get_serializer(user_reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def place_reviews(self, request):
        """Obtener reseñas de un lugar específico (BD o Google Places)"""
        place_id = request.query_params.get('place_id')
        if not place_id:
            return Response(
                {'error': 'place_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Intentar filtrar por lugar de BD primero
        try:
            place_uuid = uuid.UUID(place_id)
            place_reviews = Review.objects.filter(
                place_id=place_uuid, 
                is_approved=True
            ).select_related('user', 'place')
        except ValueError:
            # Si no es un UUID válido, asumir que es un Google Place ID
            place_reviews = Review.objects.filter(
                google_place_id=place_id,
                is_approved=True
            ).select_related('user')
        
        serializer = self.get_serializer(place_reviews, many=True)
        return Response(serializer.data)


class GoogleReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para reseñas de Google Places
    """
    queryset = GoogleReview.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = GoogleReviewSerializer
    
    @action(detail=False, methods=['get'])
    def by_place(self, request):
        """
        Obtener reseñas de Google para un lugar específico
        URL: /api/v1/google-reviews/by_place/?place_id=GOOGLE_PLACE_ID&refresh=true
        """
        place_id = request.query_params.get('place_id')
        force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'
        
        if not place_id:
            return Response(
                {'error': 'place_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obtener reseñas (con cache o scraping si es necesario)
            reviews = get_cached_reviews(place_id, force_refresh)
            
            # Serializar
            serializer = self.get_serializer(reviews, many=True)
            
            # Obtener información total del lugar para mostrar limitaciones
            total_reviews_info = None
            try:
                from .google_reviews_scraper import GoogleReviewsScraper
                scraper = GoogleReviewsScraper()
                place_details = scraper._get_place_details(place_id)
                if place_details:
                    total_reviews_info = place_details.get('user_ratings_total', 0)
            except:
                pass
            
            response_data = {
                'place_id': place_id,
                'reviews_in_database': len(reviews),
                'reviews': serializer.data,
                'last_updated': reviews[0].scraped_at if reviews else None,
                'google_limitation_note': 'Google Places API solo proporciona máximo 5 reseñas por lugar'
            }
            
            # Agregar información del total si está disponible
            if total_reviews_info:
                response_data['total_reviews_on_google'] = total_reviews_info
                response_data['limitation_explanation'] = f'Este lugar tiene {total_reviews_info} reseñas en Google, pero solo podemos obtener 5 debido a limitaciones de la API de Google Places'
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error obteniendo reseñas: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def scrape_now(self, request):
        """
        Forzar scraping inmediato de reseñas
        URL: POST /api/v1/google-reviews/scrape_now/
        Body: {"place_id": "GOOGLE_PLACE_ID"}
        """
        place_id = request.data.get('place_id')
        
        if not place_id:
            return Response(
                {'error': 'place_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Realizar scraping
            result = scrape_reviews_for_place(place_id)
            
            return Response({
                'message': 'Scraping completado',
                'result': result
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error en scraping: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
