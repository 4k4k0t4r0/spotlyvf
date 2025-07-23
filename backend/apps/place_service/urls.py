from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .business_views import BusinessViewSet, PlaceClaimViewSet

# Crear router para viewsets
router = DefaultRouter()
router.register(r'places', views.PlaceViewSet)
router.register(r'categories', views.PlaceCategoryViewSet)
router.register(r'place-reviews', views.PlaceReviewViewSet)
router.register(r'reviews', views.ReviewViewSet)
router.register(r'reservations', views.ReservationViewSet)
router.register(r'google-reviews', views.GoogleReviewViewSet)

# Router para funcionalidades de negocio
business_router = DefaultRouter()
business_router.register(r'business', BusinessViewSet, basename='business')
business_router.register(r'place-claims', PlaceClaimViewSet, basename='place-claims')

urlpatterns = [
    # URLs del router principal
    path('', include(router.urls)),
    
    # URLs del router de negocios
    path('', include(business_router.urls)),
]
