from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    logout_view,
    user_info_view,
    change_password_view
)

app_name = 'auth_service'

urlpatterns = [
    # Authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management endpoints
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('user-info/', user_info_view, name='user_info'),
    path('change-password/', change_password_view, name='change_password'),
]
