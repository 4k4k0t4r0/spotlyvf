#!/usr/bin/env python3
"""
Script simple para crear usuarios y reseñas de prueba
Ejecutar con: python manage.py shell -c "exec(open('create_simple_reviews.py').read())"
"""

from datetime import datetime, timedelta
import random
from django.contrib.auth.models import User
from apps.place_service.models import Place, Review

print("🚀 CREANDO DATOS DE PRUEBA PARA RESEÑAS")

# Datos de usuarios de prueba
SAMPLE_USERS = [
    {'username': 'maria_garcia', 'email': 'maria.garcia@email.com', 'first_name': 'María', 'last_name': 'García'},
    {'username': 'carlos_rodriguez', 'email': 'carlos.rodriguez@email.com', 'first_name': 'Carlos', 'last_name': 'Rodríguez'},
    {'username': 'ana_martinez', 'email': 'ana.martinez@email.com', 'first_name': 'Ana', 'last_name': 'Martínez'},
    {'username': 'luis_hernandez', 'email': 'luis.hernandez@email.com', 'first_name': 'Luis', 'last_name': 'Hernández'},
    {'username': 'sofia_lopez', 'email': 'sofia.lopez@email.com', 'first_name': 'Sofía', 'last_name': 'López'}
]

# Templates de reseñas
REVIEW_TEMPLATES = {
    5: {'title': '¡Excelente experiencia!', 'content': 'Este lugar es simplemente espectacular. La comida está deliciosa y el servicio es excepcional.'},
    4: {'title': 'Muy buena experiencia', 'content': 'En general una muy buena experiencia. La comida estuvo sabrosa y el servicio fue bueno.'},
    3: {'title': 'Experiencia promedio', 'content': 'Una experiencia promedio. No estuvo mal pero tampoco destacó mucho.'},
    2: {'title': 'Esperaba más', 'content': 'Lamentablemente no fue la experiencia que esperaba. Varios aspectos por mejorar.'},
    1: {'title': 'No lo recomiendo', 'content': 'Una experiencia terrible. Definitivamente no lo recomiendo.'}
}

# Crear usuarios
print("🔧 Creando usuarios de prueba...")
created_users = []

for user_data in SAMPLE_USERS:
    user, created = User.objects.get_or_create(
        username=user_data['username'],
        defaults={
            'email': user_data['email'],
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'is_active': True
        }
    )
    
    if created:
        user.set_password('password123')
        user.save()
        print(f"✅ Usuario creado: {user.get_full_name()}")
    else:
        print(f"ℹ️ Usuario ya existe: {user.get_full_name()}")
    
    created_users.append(user)

# Crear reseñas
print("\n🔧 Creando reseñas de prueba...")
places = list(Place.objects.all()[:5])  # Primeros 5 lugares

if not places:
    print("❌ No hay lugares en la base de datos")
else:
    reviews_created = 0
    
    for place in places:
        num_reviews = random.randint(2, 4)
        selected_users = random.sample(created_users, min(num_reviews, len(created_users)))
        
        print(f"\n📝 Creando reseñas para: {place.name}")
        
        for user in selected_users:
            # Verificar si ya existe una reseña
            existing_review = Review.objects.filter(user=user, place=place).first()
            if existing_review:
                continue
            
            # Generar rating
            rating = random.choices(range(1, 6), weights=[5, 10, 15, 30, 40])[0]
            template = REVIEW_TEMPLATES[rating]
            
            # Fecha de visita
            days_ago = random.randint(1, 30)
            visited_date = datetime.now().date() - timedelta(days=days_ago)
            
            # Crear reseña
            review = Review.objects.create(
                user=user,
                place=place,
                rating=rating,
                title=template['title'],
                content=template['content'],
                visited_date=visited_date,
                would_recommend=rating >= 4,
                is_approved=True
            )
            
            print(f"  ✅ {user.get_full_name()}: {rating}⭐")
            reviews_created += 1

    print(f"\n🎉 Total de reseñas creadas: {reviews_created}")

    # Actualizar ratings de lugares
    print("\n🔧 Actualizando ratings promedio...")
    for place in places:
        reviews = Review.objects.filter(place=place, is_approved=True)
        if reviews.exists():
            total_rating = sum(review.rating for review in reviews)
            average_rating = total_rating / reviews.count()
            place.average_rating = f"{average_rating:.1f}"
            place.total_reviews = reviews.count()
            place.save()
            print(f"  ✅ {place.name}: {average_rating:.1f}⭐ ({reviews.count()} reseñas)")

print("\n✅ PROCESO COMPLETADO")
