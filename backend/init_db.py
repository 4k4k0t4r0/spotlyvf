#!/usr/bin/env python
"""
Django management command to initialize the Spotlyvf database with sample data
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
    django.setup()
    
    from django.core.management import call_command
    from django.contrib.auth import get_user_model
    from apps.auth_service.models import UserProfile
    
    User = get_user_model()
    
    print("🚀 Initializing Spotlyvf Database...")
    
    # Create migrations
    print("📦 Creating migrations...")
    call_command('makemigrations')
    
    # Apply migrations
    print("⚡ Applying migrations...")
    call_command('migrate')
    
    # Create superuser if it doesn't exist
    if not User.objects.filter(username='admin').exists():
        print("👤 Creating superuser...")
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@spotlyvf.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        UserProfile.objects.create(user=admin_user)
        print("✅ Superuser created: admin@spotlyvf.com / admin123")
    
    # Create sample data
    print("📊 Creating sample data...")
    
    # Sample categories
    from apps.category_service.models import Category
    if not Category.objects.exists():
        categories = [
            {'name': 'Restaurants', 'icon': '🍽️', 'color': '#E53E3E'},
            {'name': 'Cafes', 'icon': '☕', 'color': '#D69E2E'},
            {'name': 'Entertainment', 'icon': '🎯', 'color': '#38A169'},
            {'name': 'Shopping', 'icon': '🛍️', 'color': '#3182CE'},
            {'name': 'Culture', 'icon': '🎭', 'color': '#805AD5'},
        ]
        for cat_data in categories:
            Category.objects.create(**cat_data)
        print("✅ Sample categories created")
    
    print("🎉 Database initialization completed!")
    print("\n📱 Frontend: cd frontend && npx expo start")
    print("🐍 Backend: cd backend && python manage.py runserver")
    print("🐳 Docker: docker-compose up -d")
    print("\n🌐 Admin Panel: http://localhost:8000/admin")
    print("📱 API Base: http://localhost:8000/api/v1/")
