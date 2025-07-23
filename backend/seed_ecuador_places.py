#!/usr/bin/env python
"""
Script para poblar la base de datos con lugares reales de Ecuador
Incluye lugares de Quito, Guayaquil, Cuenca y otras ciudades
"""
import os
import sys
import django
import itertools
from decimal import Decimal
import itertools

# Configurar Django
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.place_service.models import PlaceCategory, Place, PlaceImage, PlaceReview
from apps.auth_service.models import User, UserProfile

User = get_user_model()


def create_categories():
    """Crear categorías de lugares"""
    categories_data = [
        {"name": "Restaurantes", "icon": "restaurant", "color": "#E74C3C", "description": "Restaurantes y comida"},
        {"name": "Cafeterías", "icon": "local_cafe", "color": "#8D6E63", "description": "Cafés y bebidas"},
        {"name": "Hoteles", "icon": "hotel", "color": "#3498DB", "description": "Hoteles y hospedajes"},
        {"name": "Entretenimiento", "icon": "local_play", "color": "#9B59B6", "description": "Entretenimiento y diversión"},
        {"name": "Cine", "icon": "local_movies", "color": "#FF5722", "description": "Cines y películas"},
        {"name": "Deportes", "icon": "fitness_center", "color": "#4CAF50", "description": "Gimnasios y deportes"},
        {"name": "Bibliotecas", "icon": "local_library", "color": "#607D8B", "description": "Bibliotecas y estudio"},
        {"name": "Vida Nocturna", "icon": "nightlife", "color": "#F39C12", "description": "Bares, discotecas y fiestas"},
        {"name": "Comida Rápida", "icon": "fastfood", "color": "#FF9800", "description": "Comida rápida y casual"},
        {"name": "Turismo", "icon": "place", "color": "#2ECC71", "description": "Lugares turísticos"},
        {"name": "Compras", "icon": "shopping_bag", "color": "#9C27B0", "description": "Centros comerciales y tiendas"},
        {"name": "Cultura", "icon": "museum", "color": "#1ABC9C", "description": "Museos y cultura"},
        {"name": "Parques", "icon": "park", "color": "#27AE60", "description": "Parques y recreación"},
        {"name": "Salud", "icon": "local_hospital", "color": "#E91E63", "description": "Clínicas y hospitales"},
        {"name": "Educación", "icon": "school", "color": "#3F51B5", "description": "Universidades y educación"},
    ]
    
    created_categories = {}
    for cat_data in categories_data:
        category, created = PlaceCategory.objects.get_or_create(
            name=cat_data["name"],
            defaults=cat_data
        )
        created_categories[cat_data["name"]] = category
        if created:
            print(f"✅ Categoría creada: {category.name}")
        else:
            print(f"ℹ️  Categoría existente: {category.name}")
    
    return created_categories


def create_business_users():
    """Crear usuarios propietarios de negocios"""
    business_users = []
    
    business_data = [
        {"username": "hotel_quito", "email": "admin@hotelquito.com", "first_name": "Hotel", "last_name": "Quito"},
        {"username": "restaurant_ec", "email": "admin@restaurant.ec", "first_name": "Restaurant", "last_name": "Owner"},
        {"username": "cafe_guayaquil", "email": "admin@cafeguayaquil.com", "first_name": "Café", "last_name": "Guayaquil"},
    ]
    
    for user_data in business_data:
        try:
            user = User.objects.get(email=user_data["email"])
            print(f"ℹ️  Usuario ya existe: {user.email}")
        except User.DoesNotExist:
            user = User.objects.create_user(
                username=user_data["username"],
                email=user_data["email"],
                password="business123",
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                phone="+593987654321",
                role="BUSINESS"
            )
            UserProfile.objects.create(user=user)
            print(f"✅ Usuario creado: {user.email}")
        
        business_users.append(user)
    
    return business_users


def create_ecuador_places(categories, business_users):
    """Crear lugares reales de Ecuador"""
    places_data = [
        # === QUITO ===
        {
            "name": "La Choza",
            "description": "Restaurante tradicional ecuatoriano con más de 40 años de tradición. Especializado en comida típica de la Sierra ecuatoriana.",
            "category": "Restaurantes",
            "latitude": Decimal("-0.1807"),
            "longitude": Decimal("-78.4678"),
            "address": "Av. 12 de Octubre 1821 y Cordero, Quito",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170143",
            "phone": "+593 2 223-0839",
            "email": "info@lachoza.com.ec",
            "website": "https://lachoza.com.ec",
            "price_range": "$$",
            "features": ["Comida tradicional", "Música en vivo", "Estacionamiento", "Terraza"],
            "cuisines": ["Ecuatoriana", "Tradicional", "Sierra"],
            "business_hours": {
                "monday": {"open": "12:00", "close": "22:00"},
                "tuesday": {"open": "12:00", "close": "22:00"},
                "wednesday": {"open": "12:00", "close": "22:00"},
                "thursday": {"open": "12:00", "close": "22:00"},
                "friday": {"open": "12:00", "close": "23:00"},
                "saturday": {"open": "12:00", "close": "23:00"},
                "sunday": {"open": "12:00", "close": "21:00"}
            }
        },
        {
            "name": "Centro Histórico de Quito",
            "description": "Primer Patrimonio Mundial de la Humanidad declarado por la UNESCO. El centro histórico mejor conservado de América Latina.",
            "category": "Turismo",
            "latitude": Decimal("-0.2201"),
            "longitude": Decimal("-78.5123"),
            "address": "Plaza de la Independencia, Quito",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170130",
            "phone": "+593 2 257-0786",
            "email": "info@patrimonio.quito.gob.ec",
            "website": "https://www.quito.com.ec",
            "price_range": "$",
            "features": ["Patrimonio UNESCO", "Tours guiados", "Arquitectura colonial", "Museos", "Iglesias"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "06:00", "close": "20:00"},
                "tuesday": {"open": "06:00", "close": "20:00"},
                "wednesday": {"open": "06:00", "close": "20:00"},
                "thursday": {"open": "06:00", "close": "20:00"},
                "friday": {"open": "06:00", "close": "20:00"},
                "saturday": {"open": "06:00", "close": "20:00"},
                "sunday": {"open": "06:00", "close": "20:00"}
            }
        },
        {
            "name": "TelefériQo",
            "description": "Sistema de teleférico que lleva a los visitantes a 4,050 metros sobre el nivel del mar en las faldas del Pichincha.",
            "category": "Turismo",
            "latitude": Decimal("-0.1842"),
            "longitude": Decimal("-78.5186"),
            "address": "Av. Occidental s/n y Av. La Gasca, Quito",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170135",
            "phone": "+593 2 222-2996",
            "email": "info@teleferico.com.ec",
            "website": "https://teleferico.com.ec",
            "price_range": "$$",
            "features": ["Vista panorámica", "Deportes extremos", "Restaurante", "Tienda de souvenirs"],
            "cuisines": [],
            "business_hours": {
                "tuesday": {"open": "09:00", "close": "20:00"},
                "wednesday": {"open": "09:00", "close": "20:00"},
                "thursday": {"open": "09:00", "close": "20:00"},
                "friday": {"open": "09:00", "close": "21:00"},
                "saturday": {"open": "08:00", "close": "21:00"},
                "sunday": {"open": "08:00", "close": "20:00"}
            }
        },
        {
            "name": "Café Galletti",
            "description": "Cafetería tradicional quiteña desde 1943, famosa por sus pasteles y ambiente acogedor en el centro histórico.",
            "category": "Cafeterías",
            "latitude": Decimal("-0.2197"),
            "longitude": Decimal("-78.5115"),
            "address": "Venezuela 1046 y Mejía, Quito",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170130",
            "phone": "+593 2 228-7893",
            "email": "info@galletti.com.ec",
            "website": "https://galletti.com.ec",
            "price_range": "$",
            "features": ["Tradición familiar", "Pasteles artesanales", "Centro histórico", "WiFi"],
            "cuisines": ["Café", "Repostería", "Desayunos"],
            "business_hours": {
                "monday": {"open": "07:00", "close": "19:00"},
                "tuesday": {"open": "07:00", "close": "19:00"},
                "wednesday": {"open": "07:00", "close": "19:00"},
                "thursday": {"open": "07:00", "close": "19:00"},
                "friday": {"open": "07:00", "close": "19:00"},
                "saturday": {"open": "08:00", "close": "18:00"},
                "sunday": {"open": "09:00", "close": "17:00"}
            }
        },
        
        # === GUAYAQUIL ===
        {
            "name": "Malecón 2000",
            "description": "Paseo ribereño regenerado que se extiende a lo largo del río Guayas, con jardines, museos, monumentos y entretenimiento.",
            "category": "Turismo",
            "latitude": Decimal("-2.1962"),
            "longitude": Decimal("-79.8862"),
            "address": "Malecón Simón Bolívar, Guayaquil",
            "city": "Guayaquil",
            "state": "Guayas",
            "country": "Ecuador",
            "zip_code": "090313",
            "phone": "+593 4 259-4100",
            "email": "info@malecon2000.com",
            "website": "https://www.guayaquil.gob.ec",
            "price_range": "$",
            "features": ["Paseo ribereño", "Museos", "Monumentos", "Jardines", "Cinema", "Restaurantes"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "05:00", "close": "24:00"},
                "tuesday": {"open": "05:00", "close": "24:00"},
                "wednesday": {"open": "05:00", "close": "24:00"},
                "thursday": {"open": "05:00", "close": "24:00"},
                "friday": {"open": "05:00", "close": "24:00"},
                "saturday": {"open": "05:00", "close": "24:00"},
                "sunday": {"open": "05:00", "close": "24:00"}
            }
        },
        {
            "name": "Lo Nuestro",
            "description": "Restaurante emblemático de Guayaquil especializado en mariscos y comida costeña ecuatoriana desde 1979.",
            "category": "Restaurantes",
            "latitude": Decimal("-2.1709"),
            "longitude": Decimal("-79.9218"),
            "address": "Estrada 903 y Higueras, Guayaquil",
            "city": "Guayaquil",
            "state": "Guayas",
            "country": "Ecuador",
            "zip_code": "090505",
            "phone": "+593 4 238-6398",
            "email": "reservas@lonuestro.com.ec",
            "website": "https://lonuestro.com.ec",
            "price_range": "$$$",
            "features": ["Mariscos frescos", "Aire acondicionado", "Estacionamiento", "Reservas"],
            "cuisines": ["Ecuatoriana", "Mariscos", "Costeña"],
            "business_hours": {
                "monday": {"open": "12:00", "close": "23:00"},
                "tuesday": {"open": "12:00", "close": "23:00"},
                "wednesday": {"open": "12:00", "close": "23:00"},
                "thursday": {"open": "12:00", "close": "23:00"},
                "friday": {"open": "12:00", "close": "24:00"},
                "saturday": {"open": "12:00", "close": "24:00"},
                "sunday": {"open": "12:00", "close": "22:00"}
            }
        },
        {
            "name": "Las Peñas",
            "description": "Barrio bohemio de Guayaquil con casas coloridas, galerías de arte, cafés y una hermosa vista de la ciudad.",
            "category": "Turismo",
            "latitude": Decimal("-2.1989"),
            "longitude": Decimal("-79.8719"),
            "address": "Barrio Las Peñas, Guayaquil",
            "city": "Guayaquil",
            "state": "Guayas",
            "country": "Ecuador",
            "zip_code": "090313",
            "phone": "+593 4 259-4100",
            "email": "turismo@guayaquil.gob.ec",
            "website": "https://www.guayaquil.gob.ec",
            "price_range": "$",
            "features": ["Barrio histórico", "Arte", "Cafés", "Vista panorámica", "Faro", "Escalinatas"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "06:00", "close": "22:00"},
                "tuesday": {"open": "06:00", "close": "22:00"},
                "wednesday": {"open": "06:00", "close": "22:00"},
                "thursday": {"open": "06:00", "close": "22:00"},
                "friday": {"open": "06:00", "close": "23:00"},
                "saturday": {"open": "06:00", "close": "23:00"},
                "sunday": {"open": "06:00", "close": "22:00"}
            }
        },
        
        # === CUENCA ===
        {
            "name": "Centro Histórico de Cuenca",
            "description": "Patrimonio Mundial de la UNESCO, conocido por su arquitectura colonial y republicana perfectamente conservada.",
            "category": "Turismo",
            "latitude": Decimal("-2.8997"),
            "longitude": Decimal("-79.0047"),
            "address": "Parque Calderón, Cuenca",
            "city": "Cuenca",
            "state": "Azuay",
            "country": "Ecuador",
            "zip_code": "010101",
            "phone": "+593 7 282-1035",
            "email": "turismo@cuenca.gob.ec",
            "website": "https://www.cuenca.gob.ec",
            "price_range": "$",
            "features": ["Patrimonio UNESCO", "Arquitectura colonial", "Museos", "Iglesias", "Artesanías"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "06:00", "close": "20:00"},
                "tuesday": {"open": "06:00", "close": "20:00"},
                "wednesday": {"open": "06:00", "close": "20:00"},
                "thursday": {"open": "06:00", "close": "20:00"},
                "friday": {"open": "06:00", "close": "20:00"},
                "saturday": {"open": "06:00", "close": "20:00"},
                "sunday": {"open": "06:00", "close": "20:00"}
            }
        },
        {
            "name": "Villa Rosa",
            "description": "Restaurante gourmet en Cuenca especializado en cocina ecuatoriana contemporánea con ingredientes locales.",
            "category": "Restaurantes",
            "latitude": Decimal("-2.9001"),
            "longitude": Decimal("-79.0059"),
            "address": "Gran Colombia 12-22 y Tarqui, Cuenca",
            "city": "Cuenca",
            "state": "Azuay",
            "country": "Ecuador",
            "zip_code": "010101",
            "phone": "+593 7 283-7944",
            "email": "reservas@villarosa.com.ec",
            "website": "https://villarosa.com.ec",
            "price_range": "$$$",
            "features": ["Cocina gourmet", "Ingredientes locales", "Ambiente elegante", "Cava de vinos"],
            "cuisines": ["Ecuatoriana", "Contemporánea", "Gourmet"],
            "business_hours": {
                "monday": {"open": "18:00", "close": "23:00"},
                "tuesday": {"open": "18:00", "close": "23:00"},
                "wednesday": {"open": "18:00", "close": "23:00"},
                "thursday": {"open": "18:00", "close": "23:00"},
                "friday": {"open": "18:00", "close": "24:00"},
                "saturday": {"open": "18:00", "close": "24:00"},
                "sunday": {"open": "12:00", "close": "22:00"}
            }
        },
        
        # === BAÑOS ===
        {
            "name": "Casa del Árbol",
            "description": "Columpio al final del mundo con vista espectacular al volcán Tungurahua, una de las atracciones más fotografiadas del Ecuador.",
            "category": "Turismo",
            "latitude": Decimal("-1.3963"),
            "longitude": Decimal("-78.4343"),
            "address": "Bellavista, Baños de Agua Santa",
            "city": "Baños",
            "state": "Tungurahua",
            "country": "Ecuador",
            "zip_code": "180250",
            "phone": "+593 3-274-0483",
            "email": "info@casadelarbol.ec",
            "website": "https://casadelarbol.ec",
            "price_range": "$",
            "features": ["Columpio extremo", "Vista al volcán", "Canopy", "Fotografía", "Adrenalina"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "08:00", "close": "17:00"},
                "tuesday": {"open": "08:00", "close": "17:00"},
                "wednesday": {"open": "08:00", "close": "17:00"},
                "thursday": {"open": "08:00", "close": "17:00"},
                "friday": {"open": "08:00", "close": "17:00"},
                "saturday": {"open": "08:00", "close": "17:00"},
                "sunday": {"open": "08:00", "close": "17:00"}
            }
        },
        
        # === GALÁPAGOS ===
        {
            "name": "Estación Científica Charles Darwin",
            "description": "Centro de investigación y conservación dedicado a preservar el ecosistema único de las Islas Galápagos.",
            "category": "Turismo",
            "latitude": Decimal("-0.7438"),
            "longitude": Decimal("-90.3021"),
            "address": "Puerto Ayora, Santa Cruz, Galápagos",
            "city": "Puerto Ayora",
            "state": "Galápagos",
            "country": "Ecuador",
            "zip_code": "200350",
            "phone": "+593 5-252-6146",
            "email": "info@darwinfoundation.org",
            "website": "https://www.darwinfoundation.org",
            "price_range": "$",
            "features": ["Conservación", "Tortugas gigantes", "Investigación", "Centro de interpretación"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "07:00", "close": "17:00"},
                "tuesday": {"open": "07:00", "close": "17:00"},
                "wednesday": {"open": "07:00", "close": "17:00"},
                "thursday": {"open": "07:00", "close": "17:00"},
                "friday": {"open": "07:00", "close": "17:00"},
                "saturday": {"open": "07:00", "close": "17:00"},
                "sunday": {"open": "07:00", "close": "17:00"}
            }
        }
    ]
    
    created_places = []
    for i, place_data in enumerate(places_data):
        category = categories[place_data.pop("category")]
        owner = business_users[i % len(business_users)]  # Asignar owners rotatorios
        
        place, created = Place.objects.get_or_create(
            name=place_data["name"],
            defaults={
                **place_data,
                "category": category,
                "owner": owner,
                "is_verified": True,
                "average_rating": Decimal(str(4.0 + (i % 10) * 0.1)),  # Ratings entre 4.0 y 4.9
                "total_reviews": 50 + (i * 10)
            }
        )
        
        if created:
            print(f"✅ Lugar creado: {place.name} - {place.city}")
        else:
            print(f"ℹ️  Lugar existente: {place.name} - {place.city}")
        
        # Agregar siempre el lugar a la lista, sin importar si fue creado o ya existía
        created_places.append(place)
    
    return created_places


def add_sample_images(places):
    """Agregar imágenes de ejemplo a los lugares"""
    print(f"🔍 Procesando {len(places)} lugares para agregar imágenes...")
    
    # URLs de imágenes específicas para cada lugar de Ecuador
    place_images = {
        "La Choza": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",  # Comida ecuatoriana
        "Centro Histórico de Quito": "https://images.unsplash.com/photo-1539650116574-75c0c6d77e15?w=400",  # Quito colonial
        "TelefériQo": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",  # Teleférico montaña
        "Café Galletti": "https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=400",  # Café tradicional
        "Malecón 2000": "https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=400",  # Malecón río
        "Lo Nuestro": "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400",  # Mariscos
        "Las Peñas": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",  # Casas coloridas
        "Centro Histórico de Cuenca": "https://images.unsplash.com/photo-1539650745994-5f5c217be988?w=400",  # Arquitectura colonial
        "Villa Rosa": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",  # Hotel boutique
        "Casa del Árbol": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",  # Columpio naturaleza
        "Estación Científica Charles Darwin": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",  # Galápagos
    }
    
    for place in places:
        print(f"🔧 Procesando lugar: {place.name}")
        image_url = place_images.get(place.name, "https://images.unsplash.com/photo-1539650116574-75c0c6d77e15?w=400")
        
        # Eliminar imágenes existentes para este lugar
        existing_images = PlaceImage.objects.filter(place=place)
        if existing_images.exists():
            print(f"🗑️  Eliminando {existing_images.count()} imágenes existentes")
            existing_images.delete()
        
        try:
            # Crear nueva imagen
            image_obj = PlaceImage.objects.create(
                place=place,
                image=image_url,
                caption=f"Vista de {place.name}",
                is_primary=True,
                order=1
            )
            print(f"✅ Imagen creada para: {place.name} - URL: {image_url}")
        except Exception as e:
            print(f"❌ Error creando imagen para {place.name}: {e}")
    
    total_images = PlaceImage.objects.count()
    print(f"📊 Total de imágenes en BD: {total_images}")


def create_sample_reviews(places):
    """Crear reseñas de ejemplo"""
    try:
        reviewer = User.objects.get(email="reviewer@spotlyvf.ec")
        print(f"ℹ️  Usuario reviewer existente: {reviewer.email}")
    except User.DoesNotExist:
        reviewer = User.objects.create_user(
            username="reviewer_ecuador",
            email="reviewer@spotlyvf.ec",
            password="reviewer123",
            first_name="Ana",
            last_name="Morales",
            phone="+593987654322",
            role="USER"
        )
        UserProfile.objects.create(user=reviewer)
        print(f"✅ Usuario reviewer creado: {reviewer.email}")
    
    sample_reviews = [
        {
            "rating": 5,
            "title": "¡Excelente experiencia!",
            "comment": "Un lugar increíble que recomiendo totalmente. La atención fue excepcional y superó mis expectativas."
        },
        {
            "rating": 4,
            "title": "Muy bueno",
            "comment": "Lugar muy agradable con buena calidad. Definitivamente volveré a visitarlo pronto."
        },
        {
            "rating": 5,
            "title": "Imperdible",
            "comment": "Una experiencia única que todo ecuatoriano y turista debería vivir. ¡Simplemente espectacular!"
        }
    ]
    
    for place in places[:5]:  # Solo para los primeros 5 lugares
        for i, review_data in enumerate(sample_reviews):
            try:
                review, created = PlaceReview.objects.get_or_create(
                    place=place,
                    user=reviewer,
                    defaults={
                        **review_data,
                        "is_verified": True
                    }
                )
                if created:
                    print(f"⭐ Review creada para {place.name}")
                break  # Solo una review por lugar
            except:
                continue


def create_quito_nearby_places(categories, business_users):
    """Crear lugares cercanos a la ubicación específica: Quito 170146 (-0.311655, -78.545162)"""
    # Tu ubicación específica
    user_lat = Decimal("-0.311655")
    user_lng = Decimal("-78.545162")
    
    # Lugares cercanos a tu ubicación (dentro de 30km)
    nearby_places_data = [
        {
            "name": "Cinemark El Jardín",
            "description": "Complejo de cines con las últimas películas, salas premium y snacks.",
            "category": "Cine",
            "latitude": Decimal("-0.3089"),
            "longitude": Decimal("-78.5441"),
            "address": "Av. Amazonas y Naciones Unidas, El Jardín Mall",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 226-7890",
            "price_range": "$$",
            "features": ["Salas premium", "3D", "Snacks", "Estacionamiento"],
        },
        {
            "name": "Supercines El Recreo",
            "description": "Moderno complejo de cines con tecnología de última generación.",
            "category": "Cine",
            "latitude": Decimal("-0.3156"),
            "longitude": Decimal("-78.5398"),
            "address": "El Recreo Shopping, Quito",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 266-1234",
            "price_range": "$$",
            "features": ["IMAX", "4DX", "VIP", "Comida"],
        },
        {
            "name": "Smart Fit Norte",
            "description": "Moderno gimnasio con equipos de última tecnología y clases grupales.",
            "category": "Deportes",
            "latitude": Decimal("-0.3078"),
            "longitude": Decimal("-78.5423"),
            "address": "Av. 6 de Diciembre y Portugal",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 245-6789",
            "price_range": "$$",
            "features": ["Pesas", "Cardio", "Clases grupales", "Ducha"],
        },
        {
            "name": "Biblioteca Nacional del Ecuador",
            "description": "Principal biblioteca del país con amplia colección y espacios de estudio.",
            "category": "Bibliotecas",
            "latitude": Decimal("-0.3123"),
            "longitude": Decimal("-78.5467"),
            "address": "Av. 6 de Diciembre N21-68 y Robles",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 254-4362",
            "price_range": "$",
            "features": ["WiFi gratis", "Salas de estudio", "Computadoras", "Silencio"],
        },
        {
            "name": "Starbucks El Jardín",
            "description": "Café internacional con ambiente acogedor y WiFi gratuito.",
            "category": "Cafeterías",
            "latitude": Decimal("-0.3091"),
            "longitude": Decimal("-78.5439"),
            "address": "El Jardín Mall, Local 142",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 333-4567",
            "price_range": "$$",
            "features": ["WiFi", "Café premium", "Ambiente", "Estudio"],
        },
        {
            "name": "KFC El Recreo",
            "description": "Restaurante de comida rápida especializado en pollo frito.",
            "category": "Comida Rápida",
            "latitude": Decimal("-0.3158"),
            "longitude": Decimal("-78.5395"),
            "address": "El Recreo Shopping, Food Court",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 266-5678",
            "price_range": "$",
            "features": ["Entrega rápida", "Combos", "Pollo frito", "Drive thru"],
        },
        {
            "name": "Hotel Dann Carlton Quito",
            "description": "Hotel de lujo en el sector financiero con todas las comodidades.",
            "category": "Hoteles",
            "latitude": Decimal("-0.3067"),
            "longitude": Decimal("-78.5456"),
            "address": "Av. República de El Salvador 34-349",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 244-9333",
            "price_range": "$$$",
            "features": ["Spa", "Gimnasio", "WiFi", "Business center"],
        },
        {
            "name": "Club Euphoria",
            "description": "Discoteca moderna con música electrónica y ambiente nocturno.",
            "category": "Vida Nocturna",
            "latitude": Decimal("-0.3045"),
            "longitude": Decimal("-78.5478"),
            "address": "Av. Naciones Unidas y América",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 245-7890",
            "price_range": "$$$",
            "features": ["DJ", "Pista de baile", "Bar", "VIP"],
        },
        {
            "name": "El Jardín Mall",
            "description": "Centro comercial con tiendas, restaurantes y entretenimiento.",
            "category": "Compras",
            "latitude": Decimal("-0.3089"),
            "longitude": Decimal("-78.5441"),
            "address": "Av. Amazonas y Naciones Unidas",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 226-7000",
            "price_range": "$$",
            "features": ["Tiendas", "Food court", "Cine", "Parqueadero"],
        },
        {
            "name": "Casa de la Cultura Ecuatoriana",
            "description": "Centro cultural con exposiciones, teatro y eventos artísticos.",
            "category": "Cultura",
            "latitude": Decimal("-0.3134"),
            "longitude": Decimal("-78.5423"),
            "address": "Av. 6 de Diciembre y Patria",
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "zip_code": "170146",
            "phone": "+593 2 252-3391",
            "price_range": "$",
            "features": ["Teatro", "Exposiciones", "Conferencias", "Arte"],
        }
    ]
    
    created_places = []
    owner_cycle = itertools.cycle(business_users)
    
    for place_data in nearby_places_data:
        try:
            owner = next(owner_cycle)
            category = categories[place_data["category"]]
            
            place, created = Place.objects.get_or_create(
                name=place_data["name"],
                city=place_data["city"],
                defaults={
                    "description": place_data["description"],
                    "category": category,
                    "latitude": place_data["latitude"],
                    "longitude": place_data["longitude"],
                    "address": place_data["address"],
                    "state": place_data["state"],
                    "country": place_data["country"],
                    "zip_code": place_data["zip_code"],
                    "phone": place_data.get("phone", ""),
                    "email": place_data.get("email", ""),
                    "website": place_data.get("website", ""),
                    "price_range": place_data["price_range"],
                    "features": place_data["features"],
                    "cuisines": place_data.get("cuisines", []),
                    "business_hours": place_data.get("business_hours", {}),
                    "owner": owner,
                    "average_rating": Decimal("4.2"),
                    "total_reviews": 45,
                }
            )
            
            if created:
                print(f"✅ Lugar creado: {place.name} - {place.city}")
            else:
                print(f"ℹ️  Lugar existente: {place.name} - {place.city}")
            
            created_places.append(place)
            
        except Exception as e:
            print(f"❌ Error creando lugar {place_data['name']}: {e}")
    
    return created_places


def main():
    """Función principal para poblar la base de datos"""
    print("🇪🇨 Iniciando población de base de datos con lugares de Ecuador...")
    
    # Crear categorías
    print("\n📂 Creando categorías...")
    categories = create_categories()
    
    # Crear usuarios propietarios
    print("\n👤 Creando usuarios propietarios...")
    business_users = create_business_users()
    
    # Crear lugares
    print("\n🏢 Creando lugares de Ecuador...")
    places = create_ecuador_places(categories, business_users)
    
    # Agregar imágenes
    print("\n📸 Agregando imágenes...")
    add_sample_images(places)
    
    # Crear reseñas de ejemplo
    print("\n⭐ Creando reseñas de ejemplo...")
    create_sample_reviews(places)
    
    # Crear lugares cercanos a Quito
    print("\n📍 Creando lugares cercanos a Quito...")
    quito_nearby_places = create_quito_nearby_places(categories, business_users)
    
    print("\n🎉 ¡Base de datos poblada exitosamente con lugares de Ecuador!")
    print(f"📊 Estadísticas finales:")
    print(f"   - Categorías: {PlaceCategory.objects.count()}")
    print(f"   - Lugares: {Place.objects.count()}")
    print(f"   - Usuarios: {User.objects.count()}")
    print(f"   - Reviews: {PlaceReview.objects.count()}")
    print(f"   - Imágenes: {PlaceImage.objects.count()}")
    
    print("\n🌟 Lugares destacados incluidos:")
    for place in Place.objects.all()[:5]:
        print(f"   • {place.name} - {place.city}, {place.state}")


if __name__ == "__main__":
    main()
