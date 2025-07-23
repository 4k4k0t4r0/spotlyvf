#!/usr/bin/env python3
"""
Script para crear usuarios y reseñas de prueba en Spotlyvf
Ejecutar con: python manage.py shell < create_sample_reviews.py
"""

from datetime import datetime, timedelta
import random
from django.contrib.auth.models import User
from apps.place_service.models import Place, Review

# Datos de usuarios de prueba
SAMPLE_USERS = [
    {'username': 'maria_garcia', 'email': 'maria.garcia@email.com', 'first_name': 'María', 'last_name': 'García'},
    {'username': 'carlos_rodriguez', 'email': 'carlos.rodriguez@email.com', 'first_name': 'Carlos', 'last_name': 'Rodríguez'},
    {'username': 'ana_martinez', 'email': 'ana.martinez@email.com', 'first_name': 'Ana', 'last_name': 'Martínez'},
    {'username': 'luis_hernandez', 'email': 'luis.hernandez@email.com', 'first_name': 'Luis', 'last_name': 'Hernández'},
    {'username': 'sofia_lopez', 'email': 'sofia.lopez@email.com', 'first_name': 'Sofía', 'last_name': 'López'},
    {'username': 'diego_sanchez', 'email': 'diego.sanchez@email.com', 'first_name': 'Diego', 'last_name': 'Sánchez'},
    {'username': 'carmen_torres', 'email': 'carmen.torres@email.com', 'first_name': 'Carmen', 'last_name': 'Torres'},
    {'username': 'pablo_ramirez', 'email': 'pablo.ramirez@email.com', 'first_name': 'Pablo', 'last_name': 'Ramírez'},
    {'username': 'lucia_flores', 'email': 'lucia.flores@email.com', 'first_name': 'Lucía', 'last_name': 'Flores'},
    {'username': 'andres_castro', 'email': 'andres.castro@email.com', 'first_name': 'Andrés', 'last_name': 'Castro'}
]

# Templates de reseñas por rating
REVIEW_TEMPLATES = {
    5: {
        'titles': [
            '¡Excelente experiencia!',
            '¡Increíble lugar!',
            '¡Perfecto en todo!',
            '¡Altamente recomendado!',
            '¡Superó mis expectativas!'
        ],
        'contents': [
            'Este lugar es simplemente espectacular. La comida está deliciosa, el servicio es excepcional y el ambiente es perfecto. Definitivamente volveré muy pronto.',
            'Una experiencia inolvidable desde que llegamos hasta que nos fuimos. Todo el personal fue muy amable y atento. La calidad de la comida es excepcional.',
            'Sin duda alguna uno de los mejores lugares que he visitado. La atención al cliente es de primera, y cada detalle está cuidado al máximo.',
            'Quedé completamente satisfecho con mi visita. El lugar está muy bien cuidado, la comida es exquisita y el precio es muy justo para la calidad que ofrecen.',
            'Una experiencia que superó todas mis expectativas. Desde la recepción hasta el último detalle, todo fue perfecto. Lo recomiendo ampliamente.'
        ]
    },
    4: {
        'titles': [
            'Muy buena experiencia',
            'Recomendable',
            'Buen lugar para visitar',
            'Satisfecho con la visita',
            'Cumplió las expectativas'
        ],
        'contents': [
            'En general una muy buena experiencia. La comida estuvo sabrosa y el servicio fue bueno, aunque hubo algunos detalles menores que se podrían mejorar.',
            'Un lugar agradable con buena comida y ambiente. El servicio fue atento aunque un poco lento en algunos momentos. Lo recomiendo.',
            'Buena opción para pasar un rato agradable. La calidad de la comida es buena y los precios son razonables. Regresaría sin dudarlo.',
            'Cumplió con mis expectativas. El lugar está bien ubicado, la comida tiene buen sabor y el personal es amable. Una experiencia positiva en general.',
            'Me gustó la visita. El ambiente es acogedor y la comida está bien preparada. Algunas cosas se podrían mejorar pero en general está bien.'
        ]
    },
    3: {
        'titles': [
            'Experiencia promedio',
            'Está bien',
            'Ni mal ni excelente',
            'Cumple lo básico',
            'Regular'
        ],
        'contents': [
            'Una experiencia promedio. No estuvo mal pero tampoco destacó mucho. La comida está bien pero nada extraordinario. El servicio fue regular.',
            'El lugar está bien para una visita ocasional. La comida es aceptable aunque podría mejorar en sabor. El servicio fue básico pero correcto.',
            'Cumple con lo básico. No hay nada que destacar especialmente pero tampoco hubo problemas graves. Una opción más del montón.',
            'Una experiencia normal. El lugar está limpio y ordenado, la comida es comestible pero sin mayor distinción. El precio está bien.',
            'Regular en general. Hay aspectos que se pueden mejorar tanto en el servicio como en la calidad de la comida. No está mal pero tampoco genial.'
        ]
    },
    2: {
        'titles': [
            'Experiencia decepcionante',
            'Esperaba más',
            'Varios aspectos por mejorar',
            'No cumplió expectativas',
            'Dejó que desear'
        ],
        'contents': [
            'Lamentablemente no fue la experiencia que esperaba. La comida tardó mucho en llegar y cuando lo hizo estaba tibia. El servicio fue lento y poco atento.',
            'Varias cosas por mejorar. El lugar necesita más atención en la limpieza y el servicio al cliente. La comida no tenía buen sabor.',
            'No cumplió mis expectativas. El precio no se justifica con la calidad ofrecida. El personal parecía poco capacitado y desorganizado.',
            'Una experiencia que dejó mucho que desear. Problemas con el pedido, demoras excesivas y la comida no estaba bien preparada.',
            'Esperaba mucho más de este lugar. La atención fue deficiente y la comida no estaba a la altura. Necesita mejoras urgentes.'
        ]
    },
    1: {
        'titles': [
            'Pésima experiencia',
            'No lo recomiendo',
            'Muy mal servicio',
            'Decepcionante total',
            'Eviten este lugar'
        ],
        'contents': [
            'Una experiencia terrible de principio a fin. La comida estaba fría y sin sabor, el servicio fue grosero y el lugar estaba sucio. No regreso nunca.',
            'Definitivamente no lo recomiendo. Tuvimos que esperar más de una hora para que nos atendieran y cuando llegó la comida estaba en mal estado.',
            'Pésimo en todos los aspectos. El personal fue muy descortés, la comida estaba mal preparada y el lugar necesita una limpieza profunda.',
            'Una decepción total. El peor servicio que he recibido. La comida parecía recalentada y el ambiente era muy desagradable.',
            'Eviten este lugar a toda costa. Problemas graves de higiene, servicio terrible y comida de muy mala calidad. Una pérdida de tiempo y dinero.'
        ]
    }
}

def create_sample_users():
    """Crear usuarios de prueba"""
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
            user.set_password('password123')  # Contraseña por defecto
            user.save()
            print(f"✅ Usuario creado: {user.get_full_name()} ({user.username})")
        else:
            print(f"ℹ️ Usuario ya existe: {user.get_full_name()} ({user.username})")
        
        created_users.append(user)
    
    return created_users

def create_sample_reviews(users):
    """Crear reseñas de prueba para los lugares existentes"""
    print("\n🔧 Creando reseñas de prueba...")
    
    # Obtener algunos lugares existentes
    places = list(Place.objects.all()[:10])  # Primeros 10 lugares
    
    if not places:
        print("❌ No hay lugares en la base de datos. Crea algunos lugares primero.")
        return
    
    print(f"📍 Encontrados {len(places)} lugares para agregar reseñas")
    
    reviews_created = 0
    
    for place in places:
        # Crear entre 2 y 5 reseñas por lugar
        num_reviews = random.randint(2, 5)
        selected_users = random.sample(users, min(num_reviews, len(users)))
        
        print(f"\n📝 Creando {num_reviews} reseñas para: {place.name}")
        
        for user in selected_users:
            # Verificar si ya existe una reseña de este usuario para este lugar
            existing_review = Review.objects.filter(user=user, place=place).first()
            if existing_review:
                print(f"  ⏭️ {user.get_full_name()} ya tiene reseña para {place.name}")
                continue
            
            # Generar rating con distribución realista (más 4 y 5 estrellas)
            rating_weights = [5, 10, 15, 30, 40]  # 1, 2, 3, 4, 5 estrellas
            rating = random.choices(range(1, 6), weights=rating_weights)[0]
            
            # Obtener template de reseña según el rating
            template = REVIEW_TEMPLATES[rating]
            title = random.choice(template['titles'])
            content = random.choice(template['contents'])
            
            # Fecha de visita entre 1 y 60 días atrás
            days_ago = random.randint(1, 60)
            visited_date = datetime.now().date() - timedelta(days=days_ago)
            
            # Crear la reseña
            review = Review.objects.create(
                user=user,
                place=place,
                rating=rating,
                title=title,
                content=content,
                visited_date=visited_date,
                would_recommend=rating >= 4,  # Recomienda si rating es 4 o 5
                is_approved=True
            )
            
            print(f"  ✅ {user.get_full_name()}: {rating}⭐ - {title}")
            reviews_created += 1
    
    print(f"\n🎉 Total de reseñas creadas: {reviews_created}")

def update_place_ratings():
    """Actualizar los ratings promedio de los lugares"""
    print("\n🔧 Actualizando ratings promedio de lugares...")
    
    places_updated = 0
    
    for place in Place.objects.all():
        reviews = Review.objects.filter(place=place, is_approved=True)
        
        if reviews.exists():
            # Calcular promedio
            total_rating = sum(review.rating for review in reviews)
            average_rating = total_rating / reviews.count()
            
            # Actualizar el lugar
            place.average_rating = f"{average_rating:.1f}"
            place.total_reviews = reviews.count()
            place.save()
            
            print(f"  ✅ {place.name}: {average_rating:.1f}⭐ ({reviews.count()} reseñas)")
            places_updated += 1
    
    print(f"\n🎉 Lugares actualizados: {places_updated}")

def main():
    """Función principal"""
    print("🚀 CREANDO DATOS DE PRUEBA PARA RESEÑAS")
    print("="*50)
    
    try:
        # Crear usuarios
        users = create_sample_users()
        
        # Crear reseñas
        create_sample_reviews(users)
        
        # Actualizar ratings de lugares
        update_place_ratings()
        
        print("\n" + "="*50)
        print("✅ PROCESO COMPLETADO EXITOSAMENTE")
        print("\nResumen:")
        print(f"👥 Usuarios totales: {User.objects.count()}")
        print(f"📝 Reseñas totales: {Review.objects.count()}")
        print(f"📍 Lugares con reseñas: {Place.objects.filter(total_reviews__gt=0).count()}")
        
    except Exception as e:
        print(f"\n❌ Error durante el proceso: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
