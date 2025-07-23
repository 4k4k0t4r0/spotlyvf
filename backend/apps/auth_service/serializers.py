from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone', 'role', 'avatar', 'is_verified', 'full_name',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_verified']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(write_only=True, min_length=3)  # Reducido para desarrollo
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'role'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Password fields didn\'t match.'
            })
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for UserProfile model
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'user', 'bio', 'location', 'website', 'preferences',
            'privacy_settings', 'notification_settings', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with additional user data
    """
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom user data to the response
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        
        try:
            profile_serializer = UserProfileSerializer(self.user.profile)
            data['profile'] = profile_serializer.data
        except UserProfile.DoesNotExist:
            data['profile'] = None
        
        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        
        return token


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.'
            })
        
        # Validate password strength
        try:
            validate_password(attrs['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({
                'new_password': list(e.messages)
            })
        
        return attrs
