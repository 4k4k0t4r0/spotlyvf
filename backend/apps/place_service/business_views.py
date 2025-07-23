# apps/place_service/business_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Count, Avg
from datetime import datetime, timedelta
from django.utils import timezone

from .models import Place, Reservation, Review, PlaceClaim, BusinessProfile
from .serializers import (
    PlaceDetailSerializer as PlaceSerializer, ReservationSerializer, ReviewSerializer,
    PlaceClaimSerializer, PlaceClaimCreateSerializer, BusinessProfileSerializer,
    BusinessReservationSerializer
)


class BusinessViewSet(viewsets.ViewSet):
    """ViewSet para la gestión de negocios"""
    permission_classes = [IsAuthenticated]

    def _check_business_role(self, user):
        """Verificar que el usuario sea de tipo BUSINESS"""
        if user.role != 'BUSINESS':
            raise PermissionDenied('Acceso denegado. Solo usuarios de negocio pueden usar este endpoint.')

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard principal del negocio con estadísticas"""
        user = request.user
        self._check_business_role(user)
        
        # Obtener lugares reclamados por el usuario a través de PlaceClaim
        approved_claims = PlaceClaim.objects.filter(
            claimant=user, 
            status='approved'
        )
        
        # Obtener IDs de lugares tanto locales como de Google Places
        place_ids = []
        google_place_ids = []
        
        for claim in approved_claims:
            if claim.place:
                place_ids.append(claim.place.id)
            if claim.google_place_id:
                google_place_ids.append(claim.google_place_id)
        
        # Filtrar lugares por IDs locales O por google_place_id
        user_places = Place.objects.filter(
            Q(id__in=place_ids) | 
            Q(google_place_id__in=google_place_ids)
        )
        
        # Si no hay claims aprobados, también buscar lugares con claimed_by (sistema legacy)
        if not user_places.exists() and not google_place_ids:
            legacy_places = Place.objects.filter(claimed_by=user, is_claimed=True)
            user_places = legacy_places
        
        # Para Google Places sin Place asociado, verificar que al menos hay claims con google_place_id
        if not user_places.exists() and google_place_ids:
            print(f"📍 Usuario tiene claims para Google Places: {google_place_ids}")
            # No hay Places en BD, pero sí hay claims para Google Places
            # Continuar con las estadísticas usando google_place_ids
        elif not user_places.exists() and not google_place_ids:
            return Response({
                'message': 'No tienes lugares reclamados',
                'has_places': False,
                'pending_claims': PlaceClaim.objects.filter(
                    claimant=user, 
                    status='pending'
                ).count()
            })

        # Estadísticas generales
        # Filtrar reservas tanto por place como por google_place_id
        total_reservations = Reservation.objects.filter(
            Q(place__in=user_places) | 
            Q(google_place_id__in=google_place_ids)
        )
        pending_reservations = total_reservations.filter(status='PENDING').count()
        confirmed_reservations = total_reservations.filter(status='CONFIRMED').count()
        total_reviews = Review.objects.filter(place__in=user_places).count()
        avg_rating = Review.objects.filter(place__in=user_places).aggregate(
            avg=Avg('rating')
        )['avg'] or 0

        # Reservas de los últimos 7 días
        week_ago = timezone.now() - timedelta(days=7)
        recent_reservations = total_reservations.filter(
            created_at__gte=week_ago
        ).count()

        # Reseñas recientes sin respuesta
        unresponded_reviews = Review.objects.filter(
            place__in=user_places,
            business_response__isnull=True
        ).count()

        return Response({
            'has_places': True,
            'stats': {
                'total_places': user_places.count(),
                'total_reservations': total_reservations.count(),
                'pending_reservations': pending_reservations,
                'confirmed_reservations': confirmed_reservations,
                'total_reviews': total_reviews,
                'average_rating': round(avg_rating, 1),
                'recent_reservations': recent_reservations,
                'unresponded_reviews': unresponded_reviews,
            },
            'places': PlaceSerializer(user_places, many=True).data
        })

    @action(detail=False, methods=['get'])
    def reservations(self, request):
        """Obtener reservas del negocio con filtros"""
        user = request.user
        self._check_business_role(user)
        
        # Obtener lugares reclamados por el usuario a través de PlaceClaim
        approved_claims = PlaceClaim.objects.filter(
            claimant=user, 
            status='approved'
        )
        
        # Obtener IDs de lugares tanto locales como de Google Places
        place_ids = []
        google_place_ids = []
        
        for claim in approved_claims:
            if claim.place:
                place_ids.append(claim.place.id)
            if claim.google_place_id:
                google_place_ids.append(claim.google_place_id)
        
        # Filtrar lugares por IDs locales O por google_place_id
        user_places = Place.objects.filter(
            Q(id__in=place_ids) | 
            Q(google_place_id__in=google_place_ids)
        )
        
        # Si no hay claims aprobados, también buscar lugares con claimed_by (sistema legacy)
        if not user_places.exists():
            legacy_places = Place.objects.filter(claimed_by=user, is_claimed=True)
            user_places = legacy_places
        
        status_filter = request.query_params.get('status', None)
        date_filter = request.query_params.get('date', None)
        
        # Filtrar reservas tanto por place como por google_place_id
        reservations = Reservation.objects.filter(
            Q(place__in=user_places) | 
            Q(google_place_id__in=google_place_ids)
        )
        
        if status_filter:
            # Convertir a uppercase para coincidir con las opciones del modelo
            status_filter = status_filter.upper()
            reservations = reservations.filter(status=status_filter)
        
        if date_filter:
            try:
                filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                reservations = reservations.filter(reservation_date=filter_date)
            except ValueError:
                pass
        
        reservations = reservations.order_by('-created_at')
        
        serializer = BusinessReservationSerializer(reservations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def approve_reservation(self, request):
        """Aprobar una reserva"""
        reservation_id = request.data.get('reservation_id')
        business_notes = request.data.get('notes', '')
        
        try:
            # Obtener places reclamados y sus google_place_ids
            place_claims = PlaceClaim.objects.filter(
                claimant=request.user,
                status='approved'
            )
            user_places = Place.objects.filter(id__in=place_claims.values_list('place_id', flat=True))
            google_place_ids = place_claims.values_list('google_place_id', flat=True)
            
            # Buscar la reserva tanto en places regulares como en Google Places
            reservation = Reservation.objects.get(
                Q(id=reservation_id) &
                (Q(place__in=user_places) | Q(google_place_id__in=google_place_ids)) &
                Q(status='PENDING')  # Usando mayúsculas para ser consistente
            )
            
            reservation.status = 'CONFIRMED'
            reservation.business_notes = business_notes
            reservation.approved_by = request.user
            reservation.approved_at = timezone.now()
            reservation.save()
            
            # TODO: Enviar notificación al cliente
            
            return Response({
                'message': 'Reserva aprobada exitosamente',
                'reservation': BusinessReservationSerializer(reservation).data
            })
            
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reserva no encontrada o no tienes permisos'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def reject_reservation(self, request):
        """Rechazar una reserva"""
        reservation_id = request.data.get('reservation_id')
        rejection_reason = request.data.get('reason', '')
        
        try:
            # Obtener places reclamados y sus google_place_ids
            place_claims = PlaceClaim.objects.filter(
                claimant=request.user,
                status='approved'
            )
            user_places = Place.objects.filter(id__in=place_claims.values_list('place_id', flat=True))
            google_place_ids = place_claims.values_list('google_place_id', flat=True)
            
            # Buscar la reserva tanto en places regulares como en Google Places
            reservation = Reservation.objects.get(
                Q(id=reservation_id) &
                (Q(place__in=user_places) | Q(google_place_id__in=google_place_ids)) &
                Q(status='PENDING')  # Usando mayúsculas para ser consistente
            )
            
            reservation.status = 'REJECTED'
            reservation.rejection_reason = rejection_reason
            reservation.save()
            
            # TODO: Enviar notificación al cliente
            
            return Response({
                'message': 'Reserva rechazada',
                'reservation': BusinessReservationSerializer(reservation).data
            })
            
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reserva no encontrada o no tienes permisos'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def complete_reservation(self, request):
        """Marcar una reserva como completada"""
        reservation_id = request.data.get('reservation_id')
        business_notes = request.data.get('notes', '')
        
        try:
            # Obtener places reclamados y sus google_place_ids
            place_claims = PlaceClaim.objects.filter(
                claimant=request.user,
                status='approved'
            )
            user_places = Place.objects.filter(id__in=place_claims.values_list('place_id', flat=True))
            google_place_ids = place_claims.values_list('google_place_id', flat=True)
            
            # Buscar la reserva tanto en places regulares como en Google Places
            reservation = Reservation.objects.get(
                Q(id=reservation_id) &
                (Q(place__in=user_places) | Q(google_place_id__in=google_place_ids)) &
                Q(status='CONFIRMED')  # Solo se pueden completar reservas confirmadas
            )
            
            reservation.status = 'COMPLETED'
            reservation.business_notes = business_notes
            reservation.completed_at = timezone.now()
            reservation.save()
            
            # TODO: Enviar notificación al cliente y posible solicitud de reseña
            
            return Response({
                'message': 'Reserva marcada como completada',
                'reservation': BusinessReservationSerializer(reservation).data
            })
            
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reserva no encontrada, no tienes permisos o no está confirmada'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def no_show_reservation(self, request):
        """Marcar una reserva como no presentada"""
        reservation_id = request.data.get('reservation_id')
        business_notes = request.data.get('notes', '')
        
        try:
            # Obtener places reclamados y sus google_place_ids
            place_claims = PlaceClaim.objects.filter(
                claimant=request.user,
                status='approved'
            )
            user_places = Place.objects.filter(id__in=place_claims.values_list('place_id', flat=True))
            google_place_ids = place_claims.values_list('google_place_id', flat=True)
            
            # Buscar la reserva tanto en places regulares como en Google Places
            reservation = Reservation.objects.get(
                Q(id=reservation_id) &
                (Q(place__in=user_places) | Q(google_place_id__in=google_place_ids)) &
                Q(status='CONFIRMED')  # Solo se pueden marcar como no-show las confirmadas
            )
            
            reservation.status = 'NO_SHOW'
            reservation.business_notes = business_notes
            reservation.no_show_at = timezone.now()
            reservation.save()
            
            # TODO: Enviar notificación al cliente
            
            return Response({
                'message': 'Reserva marcada como no presentada',
                'reservation': BusinessReservationSerializer(reservation).data
            })
            
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reserva no encontrada, no tienes permisos o no está confirmada'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def reviews(self, request):
        """Obtener reseñas de los lugares del negocio"""
        user = request.user
        user_places = Place.objects.filter(claimed_by=user, is_claimed=True)
        
        unresponded_only = request.query_params.get('unresponded', 'false').lower() == 'true'
        
        reviews = Review.objects.filter(place__in=user_places)
        
        if unresponded_only:
            reviews = reviews.filter(business_response__isnull=True)
        
        reviews = reviews.order_by('-created_at')
        
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def respond_to_review(self, request):
        """Responder a una reseña"""
        review_id = request.data.get('review_id')
        response_text = request.data.get('response')
        
        if not response_text:
            return Response(
                {'error': 'La respuesta es requerida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            review = Review.objects.get(
                id=review_id,
                place__claimed_by=request.user
            )
            
            review.business_response = response_text
            review.business_response_date = timezone.now()
            review.save()
            
            return Response({
                'message': 'Respuesta enviada exitosamente',
                'review': ReviewSerializer(review).data
            })
            
        except Review.DoesNotExist:
            return Response(
                {'error': 'Reseña no encontrada o no tienes permisos'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def claim_google_place(self, request):
        """Reclamar un lugar de Google Places"""
        serializer = PlaceClaimCreateSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        google_place_id = serializer.validated_data.get('google_place_id')
        
        if not google_place_id:
            return Response(
                {'error': 'google_place_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si ya está reclamado
        existing_claim = PlaceClaim.objects.filter(
            google_place_id=google_place_id
        ).first()
        
        if existing_claim:
            if existing_claim.status == 'approved':
                return Response(
                    {'error': 'Este lugar ya ha sido reclamado y verificado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_claim.claimant == request.user:
                return Response({
                    'message': 'Ya tienes una reclamación pendiente para este lugar',
                    'claim': PlaceClaimSerializer(existing_claim).data
                })
            else:
                return Response(
                    {'error': 'Este lugar ya tiene una reclamación pendiente de otro usuario'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Crear nueva reclamación
        claim = serializer.save()
        
        return Response({
            'message': 'Reclamación enviada exitosamente',
            'claim': PlaceClaimSerializer(claim).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_claims(self, request):
        """Obtener las reclamaciones del usuario"""
        claims = PlaceClaim.objects.filter(claimant=request.user)
        serializer = PlaceClaimSerializer(claims, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def update_place_settings(self, request):
        """Actualizar configuraciones del lugar"""
        place_id = request.data.get('place_id')
        
        try:
            place = Place.objects.get(
                id=place_id,
                claimed_by=request.user,
                is_claimed=True
            )
            
            # Actualizar configuraciones de reservas
            if 'accepts_reservations' in request.data:
                place.accepts_reservations = request.data['accepts_reservations']
            
            if 'auto_approve_reservations' in request.data:
                place.auto_approve_reservations = request.data['auto_approve_reservations']
            
            if 'max_advance_days' in request.data:
                place.max_advance_days = request.data['max_advance_days']
            
            if 'max_capacity' in request.data:
                place.max_capacity = request.data['max_capacity']
            
            # Actualizar información de contacto
            if 'business_phone' in request.data:
                place.business_phone = request.data['business_phone']
            
            if 'business_email' in request.data:
                place.business_email = request.data['business_email']
            
            if 'business_website' in request.data:
                place.business_website = request.data['business_website']
            
            place.save()
            
            return Response({
                'message': 'Configuraciones actualizadas exitosamente',
                'place': PlaceSerializer(place).data
            })
            
        except Place.DoesNotExist:
            return Response(
                {'error': 'Lugar no encontrado o no tienes permisos'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Obtener analytics del negocio"""
        user = request.user
        user_places = Place.objects.filter(claimed_by=user, is_claimed=True)
        
        # Período de análisis (último mes por defecto)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Reservas por día
        reservations_by_day = []
        for i in range(days):
            day = start_date + timedelta(days=i)
            count = Reservation.objects.filter(
                place__in=user_places,
                date=day.date()
            ).count()
            reservations_by_day.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': count
            })
        
        # Reseñas por rating
        reviews_by_rating = []
        for rating in range(1, 6):
            count = Review.objects.filter(
                place__in=user_places,
                rating=rating
            ).count()
            reviews_by_rating.append({
                'rating': rating,
                'count': count
            })
        
        # Top lugares por reservas
        top_places = user_places.annotate(
            reservation_count=Count('reservation')
        ).order_by('-reservation_count')[:5]
        
        return Response({
            'period_days': days,
            'reservations_by_day': reservations_by_day,
            'reviews_by_rating': reviews_by_rating,
            'top_places': [{
                'name': place.name,
                'reservation_count': place.reservation_count,
                'average_rating': place.average_rating or 0
            } for place in top_places]
        })


class PlaceClaimViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar reclamaciones de lugares (solo para admins)"""
    queryset = PlaceClaim.objects.all()
    serializer_class = PlaceClaimSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo admins pueden ver todas las reclamaciones
        if self.request.user.is_staff:
            return PlaceClaim.objects.all()
        # Usuarios normales solo ven sus reclamaciones
        return PlaceClaim.objects.filter(claimant=self.request.user)
    
    def perform_create(self, serializer):
        """Establecer automáticamente el usuario como claimant"""
        serializer.save(claimant=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Aprobar una reclamación (solo admins)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'No tienes permisos para aprobar reclamaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        claim = self.get_object()
        google_place_data = request.data.get('place_data', {})
        
        # Obtener o crear categoría por defecto
        from .models import PlaceCategory
        default_category, _ = PlaceCategory.objects.get_or_create(
            name='Restaurante',
            defaults={
                'icon': 'restaurant-outline',
                'color': '#FF6B6B',
                'description': 'Lugares para comer'
            }
        )
        
        # Crear o actualizar el lugar en la BD
        place, created = Place.objects.get_or_create(
            google_place_id=claim.google_place_id,
            defaults={
                'name': google_place_data.get('name', claim.business_name or f'Lugar Google {claim.google_place_id}'),
                'description': google_place_data.get('description', ''),
                'category': default_category,  # Campo requerido
                'address': google_place_data.get('address', ''),
                'city': google_place_data.get('city', 'Quito'),
                'state': google_place_data.get('state', 'Pichincha'),
                'country': 'Ecuador',
                'latitude': google_place_data.get('latitude', '0'),
                'longitude': google_place_data.get('longitude', '0'),
                'owner': claim.claimant,  # Campo requerido
                'price_range': google_place_data.get('price_range', '$$'),  # Campo requerido
                'is_claimed': True,
                'claimed_by': claim.claimant,
                'claimed_at': timezone.now(),
                'verification_status': 'verified',
                'business_phone': claim.contact_phone,
                'accepts_reservations': True,
                'auto_approve_reservations': False,
                'max_advance_days': 30,
                'max_capacity': 50,
            }
        )
        
        if not created:
            # Si ya existía, actualizarlo
            place.is_claimed = True
            place.claimed_by = claim.claimant
            place.claimed_at = timezone.now()
            place.verification_status = 'verified'
            place.business_phone = claim.contact_phone
            place.save()
        
        # Actualizar la reclamación
        claim.status = 'approved'
        claim.approved_at = timezone.now()
        claim.save()
        
        return Response({
            'message': 'Reclamación aprobada exitosamente',
            'place': PlaceSerializer(place).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rechazar una reclamación (solo admins)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'No tienes permisos para rechazar reclamaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        claim = self.get_object()
        rejection_reason = request.data.get('reason', '')
        
        claim.status = 'rejected'
        claim.rejection_reason = rejection_reason
        claim.save()
        
        return Response({
            'message': 'Reclamación rechazada',
            'claim': PlaceClaimSerializer(claim).data
        })
