"""
URL configuration for spotlyvf_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 endpoints
    path('api/v1/auth/', include('apps.auth_service.urls')),
    path('api/v1/', include('apps.place_service.urls')),
    path('api/v1/', include('apps.analytics_service.urls')),  # Analytics con IA
    # Add other microservice URLs here as they are created
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
