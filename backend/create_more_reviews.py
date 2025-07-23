from django.contrib.auth import get_user_model
from apps.place_service.models import Place, Review
from datetime import datetime, timedelta
import random

User = get_user_model()

# Datos de usuarios
USERS_DATA = [
    {'username': 'ana_martinez', 'email': 'ana.martinez@email.com', 'first_name': 'Ana', 'last_name': 'Martinez'},
    {'username': 'luis_hernandez', 'email': 'luis.hernandez@email.com', 'first_name': 'Luis', 'last_name': 'Hernandez'},
    {'username': 'sofia_lopez', 'email': 'sofia.lopez@email.com', 'first_name': 'Sofia', 'last_name': 'Lopez'},
    {'username': 'diego_sanchez', 'email': 'diego.sanchez@email.com', 'first_name': 'Diego', 'last_name': 'Sanchez'},
    {'username': 'carmen_torres', 'email': 'carmen.torres@email.com', 'first_name': 'Carmen', 'last_name': 'Torres'},
]

# Templates de reseñas
REVIEWS_DATA = [
    {'rating': 5, 'title': 'Excelente experiencia!', 'content': 'Todo perfecto, el servicio y la comida excepcionales. Definitivamente regresare.'},
    {'rating': 4, 'title': 'Muy recomendable', 'content': 'Buena comida y ambiente agradable. El servicio fue atento aunque un poco lento.'},
    {'rating': 3, 'title': 'Esta bien', 'content': 'Una experiencia promedio. La comida esta bien pero nada extraordinario.'},
    {'rating': 4, 'title': 'Buen lugar', 'content': 'Me gusto la visita. Buena calidad y precios razonables.'},
    {'rating': 5, 'title': 'Increible!', 'content': 'Supero mis expectativas. Cada detalle esta cuidado al maximo.'},
    {'rating': 2, 'title': 'Esperaba mas', 'content': 'Varios aspectos por mejorar. La comida no estaba muy bien preparada.'},
]

print("Creando usuarios adicionales...")

# Crear usuarios
created_users = []
for user_data in USERS_DATA:
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
        print(f"Usuario creado: {user.get_full_name()}")
    else:
        print(f"Usuario ya existe: {user.get_full_name()}")
    created_users.append(user)

# Obtener usuarios existentes tambien
existing_users = User.objects.filter(username__in=['maria_garcia', 'carlos_rodriguez'])
all_users = list(created_users) + list(existing_users)

print(f"\nTotal de usuarios disponibles: {len(all_users)}")

# Crear reseñas para lugares
places = Place.objects.all()[:5]  # Primeros 5 lugares
print(f"Creando reseñas para {len(places)} lugares...")

total_reviews = 0
for place in places:
    # Crear 2-4 reseñas por lugar
    num_reviews = random.randint(2, 4)
    selected_users = random.sample(all_users, min(num_reviews, len(all_users)))
    
    print(f"\nLugar: {place.name}")
    for user in selected_users:
        # Verificar si ya existe una reseña
        if Review.objects.filter(user=user, place=place).exists():
            print(f"  - {user.get_full_name()}: Ya tiene reseña")
            continue
        
        # Seleccionar reseña aleatoria
        review_data = random.choice(REVIEWS_DATA)
        
        # Crear reseña
        review = Review.objects.create(
            user=user,
            place=place,
            rating=review_data['rating'],
            title=review_data['title'],
            content=review_data['content'],
            visited_date=datetime.now().date() - timedelta(days=random.randint(1, 30)),
            would_recommend=review_data['rating'] >= 4,
            is_approved=True
        )
        
        print(f"  + {user.get_full_name()}: {review_data['rating']} estrellas - {review_data['title']}")
        total_reviews += 1

print(f"\nTotal de reseñas creadas: {total_reviews}")

# Actualizar ratings de lugares
print("\nActualizando ratings de lugares...")
for place in places:
    reviews = Review.objects.filter(place=place, is_approved=True)
    if reviews.exists():
        total_rating = sum(review.rating for review in reviews)
        average_rating = total_rating / reviews.count()
        place.average_rating = f"{average_rating:.1f}"
        place.total_reviews = reviews.count()
        place.save()
        print(f"  {place.name}: {average_rating:.1f} estrellas ({reviews.count()} reseñas)")

print("\nProceso completado exitosamente!")
print(f"Usuarios totales: {User.objects.count()}")
print(f"Reseñas totales: {Review.objects.count()}")
