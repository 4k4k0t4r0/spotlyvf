"""
Script para crear un lugar de prueba (Pizza Sport) con las categorías existentes
"""

import os
import django
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from apps.place_service.models import PlaceCategory, Place
from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_place():
    """Crear un lugar de prueba para testing"""
    
    # Verificar si ya existe el lugar
    existing_place = Place.objects.filter(name="Pizza Sport").first()
    if existing_place:
        print(f"ℹ️ El lugar ya existe: {existing_place.name} (ID: {existing_place.id})")
        return existing_place
    
    # Obtener usuario existente o crear uno nuevo con username único
    try:
        user = User.objects.get(username='admin')
        print(f"ℹ️ Usando usuario existente: {user.username}")
    except User.DoesNotExist:
        try:
            user = User.objects.create_user(
                username='admin_test',
                email='admin_test@spotlyvf.com',
                password='admin123',
                first_name='Admin',
                last_name='Test',
                role='BUSINESS',
                is_staff=True,
                is_superuser=True
            )
            print(f"✅ Usuario admin_test creado: {user.email}")
        except Exception as e:
            print(f"❌ Error creando usuario: {e}")
            return None
    
    # Obtener la categoría de restaurantes
    try:
        restaurant_category = PlaceCategory.objects.get(name='Restaurantes')
        print(f"✅ Categoría encontrada: {restaurant_category.name}")
    except PlaceCategory.DoesNotExist:
        # Crear la categoría si no existe
        restaurant_category = PlaceCategory.objects.create(
            name='Restaurantes',
            icon='restaurant',
            color='#E74C3C',
            description='Restaurantes y lugares para comer',
            is_active=True
        )
        print(f"✅ Categoría creada: {restaurant_category.name}")
    
    # Crear el lugar Pizza Sport
    place, created = Place.objects.get_or_create(
        name='Pizza Sport',
        defaults={
            'description': 'Restaurante especializado en pizzas y comida italiana',
            'category': restaurant_category,
            'latitude': Decimal('-2.1894'),
            'longitude': Decimal('-79.8890'),
            'address': 'Av. Juan Tanca Marengo, Guayaquil',
            'city': 'Guayaquil',
            'state': 'Guayas',
            'country': 'Ecuador',
            'zip_code': '090505',
            'phone': '+593-4-555-0123',
            'email': 'info@pizzasport.com',
            'price_range': '$$',
            'owner': user,
            'is_active': True,
            'is_verified': True,
            'google_place_id': 'ChIJtWxC4tGj1ZERojjfo6AmbzY',
            'business_name': 'Pizza Sport Restaurant',
            'accepts_reservations': True,
            'average_rating': Decimal('4.5'),
            'total_reviews': 111
        }
    )
    
    if created:
        print(f"✅ Lugar creado: {place.name}")
        print(f"   - Google Place ID: {place.google_place_id}")
        print(f"   - Categoría: {place.category.name}")
        print(f"   - Ubicación: {place.city}, {place.country}")
    else:
        print(f"ℹ️ Lugar ya existe: {place.name}")
    
    return place

def test_endpoints():
    """Mostrar información de los endpoints para testing"""
    
    print("\n🔗 ENDPOINTS PARA TESTING:")
    print("   - Categorías: GET http://192.168.100.13:8000/api/v1/categories/")
    print("   - Lugares: GET http://192.168.100.13:8000/api/v1/places/")
    print("   - Pizza Sport: GET http://192.168.100.13:8000/api/v1/places/?search=pizza")
    print("   - Google Reviews: GET http://192.168.100.13:8000/api/v1/google-reviews/by_place/?place_id=ChIJtWxC4tGj1ZERojjfo6AmbzY")

if __name__ == "__main__":
    place = create_test_place()
    test_endpoints()
    
    print(f"\n🎉 Setup completado!")
    print(f"📊 Total categorías: {PlaceCategory.objects.count()}")
    print(f"📍 Total lugares: {Place.objects.count()}")
