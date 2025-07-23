from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from .models import User, UserProfile
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view with additional user data
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    User registration endpoint
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create user profile
            UserProfile.objects.create(user=user)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User created successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile management
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint to blacklist refresh token
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_info_view(request):
    """
    Get current user information
    """
    user_serializer = UserSerializer(request.user)
    
    try:
        profile_serializer = UserProfileSerializer(request.user.profile)
        profile_data = profile_serializer.data
    except UserProfile.DoesNotExist:
        profile_data = None
    
    return Response({
        'user': user_serializer.data,
        'profile': profile_data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    Change user password
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'error': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'error': 'New passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    if not user.check_password(current_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    
    except ValidationError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
