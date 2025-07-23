from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet
from .views_demo import demo_dashboard, demo_analyze_business

router = DefaultRouter()
router.register(r'analytics', AnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Endpoints de demostración sin autenticación
    path('analytics/demo/dashboard/', demo_dashboard, name='demo-dashboard'),
    path('analytics/demo/analyze/', demo_analyze_business, name='demo-analyze'),
]
