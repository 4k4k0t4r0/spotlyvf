from django.contrib.auth import get_user_model
from apps.place_service.models import Place, Review
from datetime import datetime, timedelta
import random

User = get_user_model()

# Google Place ID y nombre para El Imperio Lojano
GOOGLE_PLACE_ID = 'ChIJG3oPcxWi1ZERCgWw5lOKuHY'
GOOGLE_PLACE_NAME = 'El Imperio Lojano'

# Usuarios adicionales únicos
NEW_USERS = [
    {'username': 'cristina_moreno', 'first_name': 'Cristina', 'last_name': 'Moreno', 'email': 'cristina.moreno@email.com'},
    {'username': 'raul_torres', 'first_name': 'Raul', 'last_name': 'Torres', 'email': 'raul.torres@email.com'},
    {'username': 'beatriz_castro', 'first_name': 'Beatriz', 'last_name': 'Castro', 'email': 'beatriz.castro@email.com'},
    {'username': 'sergio_rivera', 'first_name': 'Sergio', 'last_name': 'Rivera', 'email': 'sergio.rivera@email.com'},
    {'username': 'maria_paz', 'first_name': 'Maria', 'last_name': 'Paz', 'email': 'maria.paz@email.com'},
    {'username': 'jorge_valdez', 'first_name': 'Jorge', 'last_name': 'Valdez', 'email': 'jorge.valdez@email.com'},
    {'username': 'claudia_pineda', 'first_name': 'Claudia', 'last_name': 'Pineda', 'email': 'claudia.pineda@email.com'},
    {'username': 'eduardo_soto', 'first_name': 'Eduardo', 'last_name': 'Soto', 'email': 'eduardo.soto@email.com'},
    {'username': 'isabella_mejia', 'first_name': 'Isabella', 'last_name': 'Mejia', 'email': 'isabella.mejia@email.com'},
    {'username': 'gabriel_ortiz', 'first_name': 'Gabriel', 'last_name': 'Ortiz', 'email': 'gabriel.ortiz@email.com'},
    {'username': 'alejandra_nunez', 'first_name': 'Alejandra', 'last_name': 'Nunez', 'email': 'alejandra.nunez@email.com'},
    {'username': 'antonio_cabrera', 'first_name': 'Antonio', 'last_name': 'Cabrera', 'email': 'antonio.cabrera@email.com'},
    {'username': 'valeria_guerra', 'first_name': 'Valeria', 'last_name': 'Guerra', 'email': 'valeria.guerra@email.com'},
    {'username': 'emilio_duran', 'first_name': 'Emilio', 'last_name': 'Duran', 'email': 'emilio.duran@email.com'},
    {'username': 'natalia_espinoza', 'first_name': 'Natalia', 'last_name': 'Espinoza', 'email': 'natalia.espinoza@email.com'},
]

# Más reseñas específicas
MORE_REVIEWS = [
    {'rating': 5, 'title': 'Morocho tradicional delicioso', 'content': 'El morocho aqui tiene ese sabor tradicional que tanto me gusta. Espeso, dulce en su punto y muy nutritivo. Perfecto para acompañar las humitas.'},
    {'rating': 5, 'title': 'Los mejores batidos de la zona', 'content': 'Los batidos de frutas tropicales estan increibles! Uso frutas frescas y se nota la calidad. El de guanabana es mi favorito absoluto.'},
    {'rating': 4, 'title': 'Cafe de excelente calidad', 'content': 'El cafe tiene un aroma espectacular y un sabor muy balanceado. Los bolones estan crujientes por fuera y bien condimentados.'},
    {'rating': 5, 'title': 'Humitas como en casa', 'content': 'Las humitas me recuerdan a las que hacia mi mama. Perfectamente cocidas, suaves y con ese sabor autentico que tanto extrañaba.'},
    {'rating': 4, 'title': 'Jugos naturales y frescos', 'content': 'Los jugos de frutas estan muy buenos, se nota que son naturales. El de naranja esta recien exprimido y el de papaya delicioso.'},
    {'rating': 3, 'title': 'Buena variedad de bebidas', 'content': 'Tienen buena variedad entre cafe, jugos y batidos. Los bolones estaban un poco frios pero el sabor estaba bien.'},
    {'rating': 5, 'title': 'Atencion rapida y amable', 'content': 'A pesar de estar lleno me atendieron rapidamente. El morocho estaba perfecto y las humitas calientitas. Muy satisfecho.'},
    {'rating': 4, 'title': 'Desayuno completo y sabroso', 'content': 'Pedí bolones con cafe y un batido de mango. Todo estaba muy rico, porciones generosas y precios accesibles.'},
    {'rating': 2, 'title': 'Servicio lento', 'content': 'La comida estaba bien pero tuvimos que esperar mucho tiempo. El cafe se enfrio mientras esperabamos los bolones.'},
    {'rating': 5, 'title': 'Sabores autenticos lojanos', 'content': 'Este lugar conserva los sabores tradicionales de Loja. El morocho es exactamente como debe ser y las humitas estan perfectas.'},
    {'rating': 4, 'title': 'Buen precio calidad', 'content': 'Los precios son muy razonables para la calidad que ofrecen. Los jugos estan frescos y el cafe bien preparado.'},
    {'rating': 3, 'title': 'Cumple expectativas', 'content': 'No es extraordinario pero cumple con lo que promete. Los batidos estan bien y los bolones tienen buen sabor.'},
]

print("🚀 Creando reseñas adicionales para El Imperio Lojano")

# Crear usuarios adicionales
new_users = []
for user_data in NEW_USERS:
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
    new_users.append(user)

# Contar reseñas existentes
existing_reviews = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID).count()
print(f"\nReseñas existentes: {existing_reviews}")

# Crear reseñas adicionales para llegar a 30
target_reviews = 30
reviews_to_create = target_reviews - existing_reviews
print(f"Reseñas a crear: {reviews_to_create}")

reviews_created = 0
for i in range(reviews_to_create):
    if i < len(MORE_REVIEWS):
        review_data = MORE_REVIEWS[i]
    else:
        # Repetir reseñas si necesitamos más
        review_data = MORE_REVIEWS[i % len(MORE_REVIEWS)]
    
    # Seleccionar usuario que no tenga reseña
    available_users = [u for u in new_users if not Review.objects.filter(user=u, google_place_id=GOOGLE_PLACE_ID).exists()]
    
    if not available_users:
        print("No hay más usuarios disponibles sin reseñas")
        break
    
    user = random.choice(available_users)
    
    # Crear la reseña
    days_ago = random.randint(1, 180)
    visited_date = datetime.now().date() - timedelta(days=days_ago)
    
    review = Review.objects.create(
        user=user,
        place=None,
        google_place_id=GOOGLE_PLACE_ID,
        google_place_name=GOOGLE_PLACE_NAME,
        google_place_address='',
        rating=review_data['rating'],
        title=review_data['title'],
        content=review_data['content'],
        visited_date=visited_date,
        would_recommend=review_data['rating'] >= 4,
        is_approved=True
    )
    
    stars = '⭐' * review_data['rating']
    print(f"  ✅ {user.get_full_name()}: {stars} - {review_data['title']}")
    reviews_created += 1

print(f"\n🎉 Reseñas adicionales creadas: {reviews_created}")

# Mostrar estadísticas finales
total_reviews = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID).count()
print(f"📊 Total final de reseñas para El Imperio Lojano: {total_reviews}")

# Distribución de ratings
print("\n📈 Distribución de ratings:")
for rating in range(1, 6):
    count = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID, rating=rating).count()
    stars = '⭐' * rating
    print(f"  {stars}: {count} reseñas")

# Calcular promedio
all_ratings = [r.rating for r in Review.objects.filter(google_place_id=GOOGLE_PLACE_ID)]
if all_ratings:
    average = sum(all_ratings) / len(all_ratings)
    print(f"\n⭐ Rating promedio: {average:.1f}/5.0")

print("\n✅ Proceso completado!")
