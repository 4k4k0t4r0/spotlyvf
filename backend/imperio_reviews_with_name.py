#!/usr/bin/env python3
"""
Script para crear reseñas realistas para El Imperio Lojano
con mención específica del nombre del lugar
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.place_service.models import Review

User = get_user_model()

# Google Place ID para El Imperio Lojano
GOOGLE_PLACE_ID = "ChIJG3oPcxWi1ZERCgWw5lOKuHY"

# Usuarios adicionales
users_data = [
    {"username": "patricia_morales_real", "first_name": "Patricia", "last_name": "Morales"},
    {"username": "ricardo_silva_real", "first_name": "Ricardo", "last_name": "Silva"},
    {"username": "carmen_lopez_real", "first_name": "Carmen", "last_name": "López"},
    {"username": "eduardo_ruiz_real", "first_name": "Eduardo", "last_name": "Ruiz"},
    {"username": "veronica_castro_real", "first_name": "Verónica", "last_name": "Castro"}
]

# Reseñas realistas con mención del nombre del lugar
reviews_data = [
    # 5 estrellas
    {
        "title": "El Imperio Lojano - Excelente servicio",
        "content": "Llegué temprano a El Imperio Lojano y la atención fue inmediata. El café estuvo listo en cinco minutos, perfectamente preparado. Ambiente muy tranquilo para trabajar.",
        "rating": 5
    },
    {
        "title": "Desayuno perfecto en El Imperio Lojano",
        "content": "El Imperio Lojano tiene el mejor desayuno tradicional. Esperé solo diez minutos y los bolones estaban recién hechos. Jugo de naranja natural y excelente servicio.",
        "rating": 5
    },
    {
        "title": "Imperio Lojano - Comida caliente y rápida",
        "content": "Pedí humitas en El Imperio Lojano y llegaron en ocho minutos, bien calientes. Personal muy atento, lugar limpio y bien ventilado. Definitivamente regreso pronto.",
        "rating": 5
    },
    {
        "title": "Ideal para trabajar - El Imperio Lojano",
        "content": "El Imperio Lojano es perfecto para reuniones. Mesa disponible inmediatamente, wifi estable y ambiente silencioso. El morocho estaba exquisito. Me dejaron trabajar dos horas.",
        "rating": 5
    },
    
    # 4 estrellas
    {
        "title": "El Imperio Lojano - Buena comida, espera normal",
        "content": "En El Imperio Lojano esperé quince minutos por mesa en hora pico. La comida compensó la espera, jugos frescos y servicio cortés. Falta más variedad.",
        "rating": 4
    },
    {
        "title": "Ambiente acogedor en Imperio Lojano",
        "content": "El Imperio Lojano tiene decoración agradable y música suave. El café tardó doce minutos pero estaba bien preparado. Precios accesibles para la calidad que ofrecen.",
        "rating": 4
    },
    {
        "title": "Comida tradicional rica - Imperio Lojano",
        "content": "Las humitas de El Imperio Lojano estaban deliciosas y bien condimentadas. Tardaron un poco pero el sabor auténtico compensó. Ambiente familiar muy acogedor.",
        "rating": 4
    },
    {
        "title": "El Imperio Lojano - Café excelente",
        "content": "El café de El Imperio Lojano es excelente y el personal muy atento. Los fines de semana se llena mucho. Recomiendo llegar temprano.",
        "rating": 4
    },
    
    # 3 estrellas
    {
        "title": "El Imperio Lojano - Regular, sin destacar",
        "content": "La comida en El Imperio Lojano estaba bien pero sin sobresalir. Esperé veinticinco minutos por mesa y el servicio fue básico. Precios normales.",
        "rating": 3
    },
    {
        "title": "Imperio Lojano muy ruidoso en horas pico",
        "content": "El Imperio Lojano estaba lleno y muy ruidoso cuando fui. La comida llegó tibia después de veinte minutos. Personal apresurado y poco atento.",
        "rating": 3
    },
    
    # 2 estrellas
    {
        "title": "El Imperio Lojano - Servicio lento",
        "content": "En El Imperio Lojano esperé treinta minutos por bolones y llegaron fríos. Tuve que pedir que los calentaran. Personal desorganizado, necesitan mejorar coordinación.",
        "rating": 2
    },
    
    # 1 estrella
    {
        "title": "Muy mala experiencia en El Imperio Lojano",
        "content": "En El Imperio Lojano esperé cuarenta minutos para ser atendido. Comida fría, jugo agrio y personal grosero. No resolvieron quejas. Definitivamente no regreso.",
        "rating": 1
    }
]

def main():
    print("🚀 Creando reseñas realistas para El Imperio Lojano con nombre del lugar...")
    
    # Crear usuarios
    created_users = []
    for user_data in users_data:
        try:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'email': f"{user_data['username']}@gmail.com",
                    'is_active': True
                }
            )
            created_users.append(user)
            print(f"✅ Usuario: {user.get_full_name()}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Verificar reseñas existentes
    existing = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID).count()
    print(f"📊 Reseñas existentes: {existing}")
    
    # Crear reseñas con nombre del lugar
    reviews_created = 0
    base_date = datetime.now() - timedelta(days=60)
    
    for i, review_data in enumerate(reviews_data):
        try:
            user = random.choice(created_users)
            
            # Fecha aleatoria en últimos 2 meses
            random_days = random.randint(0, 60)
            review_date = base_date + timedelta(days=random_days)
            
            review = Review.objects.create(
                user=user,
                google_place_id=GOOGLE_PLACE_ID,
                title=review_data['title'],
                content=review_data['content'],
                rating=review_data['rating'],
                would_recommend=review_data['rating'] >= 4,
                created_at=review_date
            )
            
            reviews_created += 1
            print(f"✅ Reseña {reviews_created}: {review_data['rating']}⭐ - {user.get_full_name()}")
            print(f"   📝 \"{review_data['title']}\"")
            print(f"   💬 \"{review_data['content'][:60]}...\"")
            print()
            
        except Exception as e:
            print(f"❌ Error creando reseña: {e}")
    
    # Estadísticas finales
    total = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID).count()
    print(f"\n📊 RESUMEN:")
    print(f"📝 Nuevas reseñas: {reviews_created}")
    print(f"📈 Total reseñas: {total}")
    
    # Distribución por rating
    for rating in [1, 2, 3, 4, 5]:
        count = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID, rating=rating).count()
        stars = "⭐" * rating
        print(f"   {stars}: {count} reseñas")
    
    print("\n✅ ¡Reseñas con nombre del lugar creadas exitosamente!")
    print("🎯 Todas las reseñas mencionan específicamente 'El Imperio Lojano'")

if __name__ == "__main__":
    main()
