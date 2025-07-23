#!/usr/bin/env python3
"""
Script para actualizar el google_place_name en todas las reseñas de El Imperio Lojano
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from apps.place_service.models import Review

# Google Place ID y nombre para El Imperio Lojano
GOOGLE_PLACE_ID = "ChIJG3oPcxWi1ZERCgWw5lOKuHY"
GOOGLE_PLACE_NAME = "El Imperio Lojano"

def update_reviews_with_place_name():
    """Actualizar todas las reseñas de El Imperio Lojano con el google_place_name"""
    
    print(f"🔄 Actualizando reseñas de {GOOGLE_PLACE_NAME}...")
    
    # Buscar todas las reseñas de El Imperio Lojano
    reviews = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID)
    
    print(f"📊 Encontradas {reviews.count()} reseñas para actualizar")
    
    updated_count = 0
    for review in reviews:
        # Actualizar el google_place_name si no está establecido o es diferente
        if review.google_place_name != GOOGLE_PLACE_NAME:
            old_name = review.google_place_name
            review.google_place_name = GOOGLE_PLACE_NAME
            review.save()
            updated_count += 1
            
            print(f"✅ Reseña {review.id} actualizada:")
            print(f"   👤 Usuario: {review.user.get_full_name()}")
            print(f"   📝 Título: {review.title}")
            print(f"   🏪 Nombre anterior: {old_name or 'Sin nombre'}")
            print(f"   🏪 Nombre nuevo: {GOOGLE_PLACE_NAME}")
            print()
    
    print(f"\n📊 RESUMEN:")
    print(f"📝 Reseñas actualizadas: {updated_count}")
    print(f"📈 Total reseñas con nombre correcto: {reviews.count()}")
    
    # Verificar que todas tengan el nombre correcto
    reviews_with_correct_name = Review.objects.filter(
        google_place_id=GOOGLE_PLACE_ID,
        google_place_name=GOOGLE_PLACE_NAME
    ).count()
    
    print(f"✅ Reseñas con nombre correcto: {reviews_with_correct_name}")
    
    if reviews_with_correct_name == reviews.count():
        print(f"🎉 ¡Todas las reseñas de {GOOGLE_PLACE_NAME} tienen el nombre correcto!")
    else:
        print(f"⚠️ Algunas reseñas pueden no tener el nombre correcto")

if __name__ == "__main__":
    update_reviews_with_place_name()
