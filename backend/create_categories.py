"""
Script para crear las categorías básicas de lugares
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from apps.place_service.models import PlaceCategory

def create_categories():
    """Crear las categorías básicas si no existen"""
    
    categories = [
        {
            'name': 'Restaurantes',
            'icon': 'restaurant',
            'color': '#FF6B6B',
            'description': 'Lugares para comer y disfrutar de buena comida'
        },
        {
            'name': 'Cafeterías',
            'icon': 'cafe',
            'color': '#8B4513',
            'description': 'Cafés y lugares para tomar bebidas calientes'
        },
        {
            'name': 'Bares',
            'icon': 'wine-bar',
            'color': '#9C27B0',
            'description': 'Bares y lugares para tomar bebidas'
        },
        {
            'name': 'Hoteles',
            'icon': 'hotel',
            'color': '#2196F3',
            'description': 'Hoteles y lugares de hospedaje'
        },
        {
            'name': 'Entretenimiento',
            'icon': 'movie',
            'color': '#FF9800',
            'description': 'Cines, teatros y lugares de entretenimiento'
        },
        {
            'name': 'Compras',
            'icon': 'shopping-bag',
            'color': '#4CAF50',
            'description': 'Centros comerciales y tiendas'
        },
        {
            'name': 'Turismo',
            'icon': 'camera',
            'color': '#00BCD4',
            'description': 'Lugares turísticos y puntos de interés'
        },
        {
            'name': 'Deportes',
            'icon': 'fitness',
            'color': '#E91E63',
            'description': 'Gimnasios, canchas y centros deportivos'
        }
    ]
    
    created_count = 0
    for cat_data in categories:
        category, created = PlaceCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'icon': cat_data['icon'],
                'color': cat_data['color'],
                'description': cat_data['description'],
                'is_active': True
            }
        )
        if created:
            created_count += 1
            print(f"✅ Categoría creada: {category.name}")
        else:
            print(f"ℹ️ Categoría ya existe: {category.name}")
    
    print(f"\n🎉 Proceso completado: {created_count} categorías nuevas creadas")
    print(f"📊 Total de categorías: {PlaceCategory.objects.count()}")

if __name__ == "__main__":
    create_categories()
