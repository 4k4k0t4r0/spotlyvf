from django.contrib.auth import get_user_model
from apps.place_service.models import Place, Review
from datetime import datetime, timedelta
import random

User = get_user_model()

# Google Place ID y nombre para El Imperio Lojano
GOOGLE_PLACE_ID = 'ChIJG3oPcxWi1ZERCgWw5lOKuHY'
GOOGLE_PLACE_NAME = 'El Imperio Lojano'

# Usuarios adicionales para las reseñas
USERS_FOR_REVIEWS = [
    {'username': 'pedro_jimenez', 'first_name': 'Pedro', 'last_name': 'Jimenez', 'email': 'pedro.jimenez@email.com'},
    {'username': 'laura_vargas', 'first_name': 'Laura', 'last_name': 'Vargas', 'email': 'laura.vargas@email.com'},
    {'username': 'miguel_ochoa', 'first_name': 'Miguel', 'last_name': 'Ochoa', 'email': 'miguel.ochoa@email.com'},
    {'username': 'elena_morales', 'first_name': 'Elena', 'last_name': 'Morales', 'email': 'elena.morales@email.com'},
    {'username': 'ricardo_vega', 'first_name': 'Ricardo', 'last_name': 'Vega', 'email': 'ricardo.vega@email.com'},
    {'username': 'patricia_silva', 'first_name': 'Patricia', 'last_name': 'Silva', 'email': 'patricia.silva@email.com'},
    {'username': 'javier_mendez', 'first_name': 'Javier', 'last_name': 'Mendez', 'email': 'javier.mendez@email.com'},
    {'username': 'veronica_ramos', 'first_name': 'Veronica', 'last_name': 'Ramos', 'email': 'veronica.ramos@email.com'},
    {'username': 'fernando_cruz', 'first_name': 'Fernando', 'last_name': 'Cruz', 'email': 'fernando.cruz@email.com'},
    {'username': 'gloria_herrera', 'first_name': 'Gloria', 'last_name': 'Herrera', 'email': 'gloria.herrera@email.com'},
    {'username': 'daniel_paredes', 'first_name': 'Daniel', 'last_name': 'Paredes', 'email': 'daniel.paredes@email.com'},
    {'username': 'monica_aguirre', 'first_name': 'Monica', 'last_name': 'Aguirre', 'email': 'monica.aguirre@email.com'},
    {'username': 'alberto_leon', 'first_name': 'Alberto', 'last_name': 'Leon', 'email': 'alberto.leon@email.com'},
    {'username': 'rosa_delgado', 'first_name': 'Rosa', 'last_name': 'Delgado', 'email': 'rosa.delgado@email.com'},
    {'username': 'andres_ruiz', 'first_name': 'Andres', 'last_name': 'Ruiz', 'email': 'andres.ruiz@email.com'},
]

# Reseñas específicas para El Imperio Lojano
IMPERIO_REVIEWS = [
    # 5 estrellas
    {'rating': 5, 'title': 'El mejor cafe de la ciudad!', 'content': 'Vengo aqui todas las mañanas por el cafe. Es increiblemente aromático y tienen un sabor unico. Las humitas estan deliciosas y el servicio es muy rapido.'},
    {'rating': 5, 'title': 'Humitas exquisitas!', 'content': 'Las humitas de El Imperio Lojano son las mejores que he probado. Perfectamente cocidas y con un sabor autentico. El morocho tambien esta buenisimo.'},
    {'rating': 5, 'title': 'Desayuno perfecto', 'content': 'Los bolones estan espectaculares! Bien doraditos por fuera y suaves por dentro. Acompañados de un cafe recien hecho, no hay mejor manera de empezar el dia.'},
    {'rating': 5, 'title': 'Jugos naturales increibles', 'content': 'Los batidos y jugos son fresquisimos! Se nota que usan frutas de calidad. El de mango con maracuya es mi favorito. Muy recomendado.'},
    {'rating': 5, 'title': 'Atencion de primera', 'content': 'El servicio es excelente, muy rapido y amable. Los alimentos llegan calientes y frescos. El morocho tiene un sabor tradicional que me encanta.'},
    {'rating': 5, 'title': 'Sabores autenticos', 'content': 'Todo lo que he probado aqui tiene sabor casero y autentico. Las humitas son como las hacia mi abuela. Definitivamente volvere.'},
    
    # 4 estrellas  
    {'rating': 4, 'title': 'Muy buena calidad', 'content': 'El cafe esta muy bueno aunque a veces tarda un poco en servir. Los bolones estan ricos y los jugos son naturales. Buen lugar para desayunar.'},
    {'rating': 4, 'title': 'Recomendable', 'content': 'Las humitas estan sabrosas y el morocho tiene buen sabor. El servicio es bueno aunque podria ser mas rapido en horas pico.'},
    {'rating': 4, 'title': 'Buenos sabores', 'content': 'Me gustan mucho los batidos, estan bien preparados y refrescantes. Los bolones tambien estan buenos aunque a veces un poco aceitosos.'},
    {'rating': 4, 'title': 'Lugar acogedor', 'content': 'Ambiente agradable y comida rica. El cafe es de buena calidad y las humitas estan bien hechas. Los precios son justos.'},
    {'rating': 4, 'title': 'Buen cafe', 'content': 'El cafe tiene buen sabor y esta bien caliente. Los jugos son frescos aunque podrian tener mas variedad. En general buena experiencia.'},
    {'rating': 4, 'title': 'Comida casera', 'content': 'Los bolones estan ricos y el morocho tiene sabor tradicional. El servicio es atento aunque a veces hay que esperar un poco.'},
    {'rating': 4, 'title': 'Desayuno satisfactorio', 'content': 'Las humitas estan bien preparadas y el cafe es aromático. Los batidos son refrescantes. Buena opcion para el desayuno.'},
    
    # 3 estrellas
    {'rating': 3, 'title': 'Esta bien', 'content': 'El cafe esta aceptable pero las humitas podrian estar mas calientes. El servicio es regular, nada excepcional pero cumple.'},
    {'rating': 3, 'title': 'Promedio', 'content': 'Los bolones estaban bien pero no extraordinarios. El morocho un poco dulce para mi gusto. Precios normales.'},
    {'rating': 3, 'title': 'Regular', 'content': 'Los jugos estan bien pero esperaba mas sabor. El cafe esta correcto aunque nada especial. El lugar esta limpio.'},
    {'rating': 3, 'title': 'Ni mal ni excelente', 'content': 'Las humitas estaban tibias y los batidos un poco aguados. El servicio fue lento pero el personal amable.'},
    {'rating': 3, 'title': 'Cumple lo basico', 'content': 'La comida esta bien para el precio. El cafe podria estar mas caliente y los bolones menos grasosos.'},
    
    # 2 estrellas
    {'rating': 2, 'title': 'Esperaba mas', 'content': 'El cafe estaba frio y las humitas un poco secas. El servicio fue lento y tuvimos que esperar mucho tiempo.'},
    {'rating': 2, 'title': 'Decepcionante', 'content': 'Los bolones estaban muy aceitosos y el morocho demasiado dulce. Los jugos no tenian buen sabor, parecian artificiales.'},
    {'rating': 2, 'title': 'Mala experiencia', 'content': 'La comida llego fria y el cafe estaba amargo. El servicio fue descuidado y poco atento a los clientes.'},
    {'rating': 2, 'title': 'Necesita mejorar', 'content': 'Las humitas estaban duras y los batidos muy diluidos. La atencion fue deficiente y tardaron mucho en atender.'},
    
    # 1 estrella
    {'rating': 1, 'title': 'Pesima experiencia', 'content': 'El cafe estaba horrible, muy amargo y frio. Las humitas parecian recalentadas y los bolones estaban quemados. No recomiendo para nada.'},
    {'rating': 1, 'title': 'No vuelvo', 'content': 'El morocho estaba cortado y los jugos tenian mal sabor. El servicio fue terrible, muy groseros. Una perdida total de tiempo y dinero.'},
    
    # Mas 5 estrellas
    {'rating': 5, 'title': 'Tradicion lojana autentica', 'content': 'Este lugar mantiene la tradicion lojana en cada plato. Las humitas son exactamente como deben ser y el cafe tiene ese sabor que te transporta.'},
    {'rating': 5, 'title': 'Mi lugar favorito', 'content': 'Vengo aqui desde hace años y nunca me decepciona. Los bolones siempre frescos, el morocho perfecto y los batidos deliciosos.'},
    {'rating': 5, 'title': 'Calidad constante', 'content': 'Lo que mas me gusta es que siempre mantienen la misma calidad. El cafe siempre esta en su punto y las humitas calientitas.'},
    
    # Mas 4 estrellas
    {'rating': 4, 'title': 'Buena opcion', 'content': 'Los jugos son naturales y estan bien preparados. Los bolones tienen buen sabor aunque podrian estar menos grasosos.'},
    {'rating': 4, 'title': 'Recomiendo los batidos', 'content': 'Los batidos de frutas estan muy buenos, cremosos y con buen sabor. El cafe tambien esta rico aunque a veces un poco fuerte.'},
    
    # Mas 3 estrellas
    {'rating': 3, 'title': 'Aceptable', 'content': 'La comida esta bien pero nada extraordinario. El morocho es dulce y las humitas estan correctas. Servicio lento en horas pico.'},
    {'rating': 3, 'title': 'Podria mejorar', 'content': 'Los bolones estaban un poco frios y el cafe no muy caliente. Los jugos estan bien pero podrian tener mas sabor.'},
]

print("🚀 Creando 30 reseñas para El Imperio Lojano")
print(f"Google Place ID: {GOOGLE_PLACE_ID}")
print(f"Google Place Name: {GOOGLE_PLACE_NAME}")

# Crear usuarios para las reseñas
all_users = []

# Obtener usuarios existentes
existing_users = list(User.objects.all()[:10])
all_users.extend(existing_users)

# Crear usuarios adicionales
for user_data in USERS_FOR_REVIEWS:
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
    all_users.append(user)

print(f"\nUsuarios disponibles: {len(all_users)}")

# Crear las 30 reseñas
reviews_created = 0
for i, review_data in enumerate(IMPERIO_REVIEWS):
    # Seleccionar usuario aleatorio
    user = random.choice(all_users)
    
    # Verificar si ya existe una reseña de este usuario para este lugar de Google
    existing_review = Review.objects.filter(
        user=user, 
        google_place_id=GOOGLE_PLACE_ID
    ).first()
    
    if existing_review:
        print(f"  ⏭️ {user.get_full_name()} ya tiene reseña para {GOOGLE_PLACE_NAME}")
        continue
    
    # Crear la reseña
    days_ago = random.randint(1, 90)  # Entre 1 y 90 días atrás
    visited_date = datetime.now().date() - timedelta(days=days_ago)
    
    review = Review.objects.create(
        user=user,
        place=None,  # No hay lugar en nuestra BD, es de Google Places
        google_place_id=GOOGLE_PLACE_ID,
        google_place_name=GOOGLE_PLACE_NAME,
        google_place_address='',  # Se puede agregar la dirección si se tiene
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

print(f"\n🎉 Total de reseñas creadas para El Imperio Lojano: {reviews_created}")

# Verificar el total
total_reviews = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID).count()
print(f"📊 Total de reseñas en BD para El Imperio Lojano: {total_reviews}")

# Mostrar distribución de ratings
for rating in range(1, 6):
    count = Review.objects.filter(google_place_id=GOOGLE_PLACE_ID, rating=rating).count()
    stars = '⭐' * rating
    print(f"  {stars}: {count} reseñas")

print("\n✅ Proceso completado exitosamente!")
