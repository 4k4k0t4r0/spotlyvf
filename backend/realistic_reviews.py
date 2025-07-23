#!/usr/bin/env python3
"""
Script para crear reseñas realistas para El Imperio Lojano
Ejecutar desde el directorio backend: python realistic_reviews.py
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
    {"username": "ana_rodriguez_real", "first_name": "Ana", "last_name": "Rodríguez"},
    {"username": "carlos_mendez_real", "first_name": "Carlos", "last_name": "Méndez"},
    {"username": "lucia_torres_real", "first_name": "Lucía", "last_name": "Torres"},
    {"username": "diego_vargas_real", "first_name": "Diego", "last_name": "Vargas"},
    {"username": "sofia_herrera_real", "first_name": "Sofía", "last_name": "Herrera"}
]

# Reseñas realistas con máximo 30 palabras
reviews_data = [
    # 5 estrellas
    {
        "title": "Excelente atención y rapidez",
        "content": "Llegué a las 8 AM y me atendieron inmediatamente. El café estuvo listo en cinco minutos, perfectamente preparado. Ambiente tranquilo, ideal para trabajar temprano.",
        "rating": 5
    },
    {
        "title": "Desayuno perfecto, ambiente familiar",
        "content": "Esperé diez minutos por mesa pero valió la pena. Los bolones recién hechos, jugo de naranja natural y servicio muy amable. Precios justos.",
        "rating": 5
    },
    {
        "title": "Servicio rápido y comida caliente",
        "content": "Pedí humitas y café. Todo llegó en ocho minutos, bien caliente y delicioso. Personal atento, lugar limpio y bien ventilado. Volveré pronto.",
        "rating": 5
    },
    {
        "title": "Ideal para reuniones de trabajo",
        "content": "Mesa disponible de inmediato, wifi estable y ambiente silencioso. El morocho estaba exquisito. Me dejaron trabajar dos horas sin problemas. Muy recomendado.",
        "rating": 5
    },
    
    # 4 estrellas
    {
        "title": "Buena comida, espera razonable",
        "content": "Esperé quince minutos por mesa en hora pico. La comida compensó la espera, jugos frescos y servicio cortés. Solo faltó más variedad.",
        "rating": 4
    },
    {
        "title": "Ambiente acogedor, servicio lento",
        "content": "Decoración agradable y música suave. El café tardó doce minutos pero estaba bien preparado. Los precios son accesibles para la calidad ofrecida.",
        "rating": 4
    },
    {
        "title": "Comida tradicional muy rica",
        "content": "Las humitas estaban deliciosas y bien condimentadas. Tardaron un poco en servir pero el sabor auténtico compensó. Ambiente familiar y acogedor.",
        "rating": 4
    },
    {
        "title": "Buen café, lugar se llena rápido",
        "content": "El café estaba excelente y el personal muy atento. Los fines de semana se llena mucho. Recomiendo llegar temprano para buena mesa.",
        "rating": 4
    },
    
    # 3 estrellas
    {
        "title": "Regular, sin destacar mucho",
        "content": "La comida estaba bien pero sin sobresalir. Esperé veinticinco minutos por mesa y el servicio fue básico. Precios normales para lo ofrecido.",
        "rating": 3
    },
    {
        "title": "Muy ruidoso en horas pico",
        "content": "El lugar estaba lleno y muy ruidoso. La comida llegó tibia después de veinte minutos. Personal apresurado y poco atento al cliente.",
        "rating": 3
    },
    
    # 2 estrellas
    {
        "title": "Servicio lento, comida fría",
        "content": "Esperé treinta minutos por bolones y llegaron fríos. Tuve que pedir que los calentaran. Personal desorganizado, necesitan mejorar coordinación entre meseros.",
        "rating": 2
    },
    
    # 1 estrella
    {
        "title": "Muy mala experiencia general",
        "content": "Esperé cuarenta minutos para ser atendido. Comida fría, jugo agrio y personal grosero. No resolvieron quejas. Definitivamente no regreso ni recomiendo.",
        "rating": 1
    }
]

def main():
    print("🚀 Creando reseñas realistas para El Imperio Lojano...")
    
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
    
    # Crear reseñas
    reviews_created = 0
    base_date = datetime.now() - timedelta(days=90)
    
    for i, review_data in enumerate(reviews_data):
        try:
            user = random.choice(created_users)
            
            # Fecha aleatoria en últimos 3 meses
            random_days = random.randint(0, 90)
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
    
    print("\n✅ ¡Reseñas realistas creadas exitosamente!")
    print("🎯 Incluyen experiencias sobre gestión del tiempo, ambiente, servicio y calidad")

if __name__ == "__main__":
    main()
