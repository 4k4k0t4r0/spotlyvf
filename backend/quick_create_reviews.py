from django.contrib.auth import get_user_model
from apps.place_service.models import Place, Review
from datetime import datetime, timedelta
import random

User = get_user_model()

# Crear usuario de prueba
user, created = User.objects.get_or_create(
    username='maria_garcia',
    defaults={
        'email': 'maria.garcia@email.com',
        'first_name': 'Maria',
        'last_name': 'Garcia',
        'is_active': True
    }
)
if created:
    user.set_password('password123')
    user.save()
    print(f"Usuario creado: {user.get_full_name()}")
else:
    print(f"Usuario ya existe: {user.get_full_name()}")

# Crear otro usuario
user2, created = User.objects.get_or_create(
    username='carlos_rodriguez',
    defaults={
        'email': 'carlos.rodriguez@email.com',
        'first_name': 'Carlos',
        'last_name': 'Rodriguez',
        'is_active': True
    }
)
if created:
    user2.set_password('password123')
    user2.save()
    print(f"Usuario creado: {user2.get_full_name()}")
else:
    print(f"Usuario ya existe: {user2.get_full_name()}")

# Obtener un lugar para crear reseñas
place = Place.objects.first()
if place:
    print(f"Lugar encontrado: {place.name}")
    
    # Crear reseña para user
    review1, created = Review.objects.get_or_create(
        user=user,
        place=place,
        defaults={
            'rating': 5,
            'title': 'Excelente experiencia!',
            'content': 'Este lugar es simplemente espectacular. La comida esta deliciosa y el servicio es excepcional.',
            'visited_date': datetime.now().date() - timedelta(days=5),
            'would_recommend': True,
            'is_approved': True
        }
    )
    if created:
        print(f"Reseña creada por {user.get_full_name()}: 5 estrellas")
    else:
        print(f"Reseña ya existe para {user.get_full_name()}")
    
    # Crear reseña para user2
    review2, created = Review.objects.get_or_create(
        user=user2,
        place=place,
        defaults={
            'rating': 4,
            'title': 'Muy buena experiencia',
            'content': 'En general una muy buena experiencia. La comida estuvo sabrosa y el servicio fue bueno.',
            'visited_date': datetime.now().date() - timedelta(days=10),
            'would_recommend': True,
            'is_approved': True
        }
    )
    if created:
        print(f"Reseña creada por {user2.get_full_name()}: 4 estrellas")
    else:
        print(f"Reseña ya existe para {user2.get_full_name()}")
    
    # Actualizar ratings del lugar
    reviews = Review.objects.filter(place=place, is_approved=True)
    if reviews.exists():
        total_rating = sum(review.rating for review in reviews)
        average_rating = total_rating / reviews.count()
        place.average_rating = f"{average_rating:.1f}"
        place.total_reviews = reviews.count()
        place.save()
        print(f"Lugar actualizado: {place.name} - {average_rating:.1f} estrellas ({reviews.count()} reseñas)")

print("Proceso completado!")
