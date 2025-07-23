from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, RefreshToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin configuration
    """
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'is_verified', 'is_active', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('phone', 'role', 'avatar', 'is_verified', 'date_of_birth')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {
            'fields': ('email', 'phone', 'role', 'first_name', 'last_name')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    UserProfile admin configuration
    """
    list_display = ['user', 'location', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__email', 'user__username', 'location']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    """
    RefreshToken admin configuration
    """
    list_display = ['user', 'created_at', 'expires_at', 'is_blacklisted']
    list_filter = ['is_blacklisted', 'created_at', 'expires_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['token', 'created_at']
    
    def has_add_permission(self, request):
        return False
