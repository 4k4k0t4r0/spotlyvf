from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    """
    ROLE_CHOICES = [
        ('USER', 'User'),
        ('BUSINESS', 'Business'),
    ]
    
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'auth_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.role})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class UserProfile(models.Model):
    """
    Extended profile information for users
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    privacy_settings = models.JSONField(default=dict, blank=True)
    notification_settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile of {self.user.email}"


class RefreshToken(models.Model):
    """
    Custom refresh token model for JWT authentication
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token = models.CharField(max_length=255, unique=True)  # MySQL limit for unique fields
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_blacklisted = models.BooleanField(default=False)
    device_info = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'auth_refresh_tokens'
        verbose_name = 'Refresh Token'
        verbose_name_plural = 'Refresh Tokens'
        indexes = [
            models.Index(fields=['user', 'is_blacklisted']),
        ]
    
    def __str__(self):
        return f"Token for {self.user.email}"
