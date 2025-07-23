#!/usr/bin/env python
"""
Script to populate the database with real places data for Lima, Peru
"""
import os
import sys
import django
from decimal import Decimal

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.place_service.models import PlaceCategory, Place, PlaceImage, PlaceReview
from apps.auth_service.models import User, UserProfile

User = get_user_model()


def create_categories():
    """Create place categories"""
    categories_data = [
        {"name": "Restaurantes", "icon": "restaurant", "color": "#FF5722", "description": "Restaurantes y comida"},
        {"name": "Cafeterías", "icon": "coffee", "color": "#795548", "description": "Cafés y bebidas"},
        {"name": "Bares", "icon": "wine-bar", "color": "#9C27B0", "description": "Bares y vida nocturna"},
        {"name": "Hoteles", "icon": "hotel", "color": "#2196F3", "description": "Hoteles y hospedajes"},
        {"name": "Turismo", "icon": "place", "color": "#4CAF50", "description": "Lugares turísticos"},
        {"name": "Entretenimiento", "icon": "movie", "color": "#FF9800", "description": "Cines y entretenimiento"},
        {"name": "Compras", "icon": "shopping-bag", "color": "#E91E63", "description": "Centros comerciales y tiendas"},
        {"name": "Salud", "icon": "local-hospital", "color": "#F44336", "description": "Hospitales y clínicas"},
        {"name": "Deportes", "icon": "fitness-center", "color": "#00BCD4", "description": "Gimnasios y deportes"},
        {"name": "Parques", "icon": "park", "color": "#8BC34A", "description": "Parques y recreación"},
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
            print(f"ℹ️  Categoría ya existe: {category.name}")
    
    return created_categories


def create_business_owner():
    """Create a business owner user"""
    try:
        owner = User.objects.get(email="business@spotlyvf.com")
        print(f"ℹ️  Usuario propietario ya existe: {owner.email}")
    except User.DoesNotExist:
        owner = User.objects.create_user(
            username="business_owner",
            email="business@spotlyvf.com",
            password="business123",
            first_name="Business",
            last_name="Owner",
            phone="+51987654321",
            role="BUSINESS"
        )
        UserProfile.objects.create(user=owner)
        print(f"✅ Usuario propietario creado: {owner.email}")
    
    return owner


def create_places(categories, owner):
    """Create real places in Lima, Peru"""
    places_data = [
        # Restaurantes
        {
            "name": "Central Restaurante",
            "description": "Restaurante de alta cocina peruana, reconocido mundialmente por su propuesta gastronómica innovadora que destaca ingredientes nativos del Perú.",
            "category": "Restaurantes",
            "latitude": Decimal("-12.1266"),
            "longitude": Decimal("-77.0301"),
            "address": "Av. Pedro de Osma 301, Barranco",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15063",
            "phone": "+51 1 242-8515",
            "email": "reservas@centralrestaurante.com.pe",
            "website": "https://centralrestaurante.com.pe",
            "price_range": "$$$$",
            "features": ["Reservas requeridas", "Estacionamiento", "Menú degustación", "Bar"],
            "cuisines": ["Peruana", "Alta cocina", "Fusion"],
            "business_hours": {
                "tuesday": {"open": "12:30", "close": "15:00"},
                "wednesday": {"open": "12:30", "close": "15:00"},
                "thursday": {"open": "12:30", "close": "15:00"},
                "friday": {"open": "12:30", "close": "15:00"},
                "saturday": {"open": "12:30", "close": "15:00"}
            }
        },
        {
            "name": "Maido Restaurante",
            "description": "Restaurante nikkei que fusiona la cocina japonesa con ingredientes peruanos, dirigido por el chef Mitsuharu Tsumura.",
            "category": "Restaurantes",
            "latitude": Decimal("-12.1187"),
            "longitude": Decimal("-77.0298"),
            "address": "Calle San Martín 399, Miraflores",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15074",
            "phone": "+51 1 446-2512",
            "email": "reservas@maido.pe",
            "website": "https://maido.pe",
            "price_range": "$$$$",
            "features": ["Reservas requeridas", "Aire acondicionado", "Menú degustación"],
            "cuisines": ["Nikkei", "Japonesa", "Peruana"],
            "business_hours": {
                "tuesday": {"open": "19:00", "close": "23:00"},
                "wednesday": {"open": "19:00", "close": "23:00"},
                "thursday": {"open": "19:00", "close": "23:00"},
                "friday": {"open": "19:00", "close": "23:00"},
                "saturday": {"open": "19:00", "close": "23:00"}
            }
        },
        {
            "name": "La Mar Cebichería",
            "description": "Cebichería tradicional peruana con los mejores pescados y mariscos frescos del día, ambiente casual y familiar.",
            "category": "Restaurantes",
            "latitude": Decimal("-12.1189"),
            "longitude": Decimal("-77.0315"),
            "address": "Av. La Mar 770, Miraflores",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15074",
            "phone": "+51 1 421-3365",
            "email": "info@lamarcebicheria.com",
            "website": "https://lamarcebicheria.com",
            "price_range": "$$$",
            "features": ["Terraza", "Mariscos frescos", "Pisco bar", "Almuerzo familiar"],
            "cuisines": ["Peruana", "Mariscos", "Ceviche"],
            "business_hours": {
                "monday": {"open": "12:00", "close": "17:00"},
                "tuesday": {"open": "12:00", "close": "17:00"},
                "wednesday": {"open": "12:00", "close": "17:00"},
                "thursday": {"open": "12:00", "close": "17:00"},
                "friday": {"open": "12:00", "close": "17:00"},
                "saturday": {"open": "12:00", "close": "17:00"},
                "sunday": {"open": "12:00", "close": "16:00"}
            }
        },
        
        # Cafeterías
        {
            "name": "Tostaduria Bisetti",
            "description": "Tostadora de café especializada en granos peruanos, con ambiente acogedor y métodos de preparación artesanales.",
            "category": "Cafeterías",
            "latitude": Decimal("-12.1198"),
            "longitude": Decimal("-77.0289"),
            "address": "Calle Alcanfores 472, Miraflores",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15074",
            "phone": "+51 1 447-4710",
            "email": "info@bisetti.com.pe",
            "website": "https://bisetti.com.pe",
            "price_range": "$$",
            "features": ["WiFi gratuito", "Café de especialidad", "Pasteles artesanales", "Terraza"],
            "cuisines": ["Café", "Repostería", "Desayunos"],
            "business_hours": {
                "monday": {"open": "07:00", "close": "22:00"},
                "tuesday": {"open": "07:00", "close": "22:00"},
                "wednesday": {"open": "07:00", "close": "22:00"},
                "thursday": {"open": "07:00", "close": "22:00"},
                "friday": {"open": "07:00", "close": "22:00"},
                "saturday": {"open": "08:00", "close": "22:00"},
                "sunday": {"open": "08:00", "close": "21:00"}
            }
        },
        {
            "name": "Coffee Town",
            "description": "Cadena de cafeterías con ambiente moderno y cómodo, ideal para trabajar o reunirse con amigos.",
            "category": "Cafeterías",
            "latitude": Decimal("-12.1185"),
            "longitude": Decimal("-77.0307"),
            "address": "Av. Larco 345, Miraflores",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15074",
            "phone": "+51 1 242-5678",
            "email": "info@coffeetown.pe",
            "website": "https://coffeetown.pe",
            "price_range": "$$",
            "features": ["WiFi gratuito", "Enchufes", "Aire acondicionado", "Delivery"],
            "cuisines": ["Café", "Sándwiches", "Postres"],
            "business_hours": {
                "monday": {"open": "07:00", "close": "23:00"},
                "tuesday": {"open": "07:00", "close": "23:00"},
                "wednesday": {"open": "07:00", "close": "23:00"},
                "thursday": {"open": "07:00", "close": "23:00"},
                "friday": {"open": "07:00", "close": "23:00"},
                "saturday": {"open": "08:00", "close": "23:00"},
                "sunday": {"open": "08:00", "close": "22:00"}
            }
        },
        
        # Hoteles
        {
            "name": "Hotel Belmond Miraflores Park",
            "description": "Hotel de lujo frente al mar con vistas espectaculares del océano Pacífico y servicio de primera clase.",
            "category": "Hoteles",
            "latitude": Decimal("-12.1196"),
            "longitude": Decimal("-77.0326"),
            "address": "Av. Malecón de la Reserva 1035, Miraflores",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15074",
            "phone": "+51 1 610-4000",
            "email": "reservations@belmond.com",
            "website": "https://www.belmond.com/miraflores-park-lima",
            "price_range": "$$$$",
            "features": ["Vista al mar", "Spa", "Piscina", "Restaurante", "Room service", "Gimnasio"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "00:00", "close": "23:59"},
                "tuesday": {"open": "00:00", "close": "23:59"},
                "wednesday": {"open": "00:00", "close": "23:59"},
                "thursday": {"open": "00:00", "close": "23:59"},
                "friday": {"open": "00:00", "close": "23:59"},
                "saturday": {"open": "00:00", "close": "23:59"},
                "sunday": {"open": "00:00", "close": "23:59"}
            }
        },
        
        # Turismo
        {
            "name": "Centro Histórico de Lima",
            "description": "Patrimonio Mundial de la UNESCO, corazón histórico de Lima con arquitectura colonial y republicana.",
            "category": "Turismo",
            "latitude": Decimal("-12.0464"),
            "longitude": Decimal("-77.0428"),
            "address": "Plaza Mayor, Cercado de Lima",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15001",
            "phone": "+51 1 427-6080",
            "email": "info@munlima.gob.pe",
            "website": "https://www.munlima.gob.pe",
            "price_range": "$",
            "features": ["Patrimonio UNESCO", "Tours guiados", "Arquitectura colonial", "Museos"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "06:00", "close": "22:00"},
                "tuesday": {"open": "06:00", "close": "22:00"},
                "wednesday": {"open": "06:00", "close": "22:00"},
                "thursday": {"open": "06:00", "close": "22:00"},
                "friday": {"open": "06:00", "close": "22:00"},
                "saturday": {"open": "06:00", "close": "22:00"},
                "sunday": {"open": "06:00", "close": "22:00"}
            }
        },
        {
            "name": "Circuito Mágico del Agua",
            "description": "Parque de fuentes con espectáculo de agua, luces y música. Atracción turística familiar única en Lima.",
            "category": "Turismo",
            "latitude": Decimal("-12.0701"),
            "longitude": Decimal("-77.0365"),
            "address": "Parque de la Reserva, Cercado de Lima",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15046",
            "phone": "+51 1 330-1000",
            "email": "info@serpar.gob.pe",
            "website": "https://www.serpar.gob.pe",
            "price_range": "$",
            "features": ["Fuentes danzantes", "Show nocturno", "Familiar", "Estacionamiento"],
            "cuisines": [],
            "business_hours": {
                "tuesday": {"open": "15:00", "close": "22:30"},
                "wednesday": {"open": "15:00", "close": "22:30"},
                "thursday": {"open": "15:00", "close": "22:30"},
                "friday": {"open": "15:00", "close": "22:30"},
                "saturday": {"open": "15:00", "close": "22:30"},
                "sunday": {"open": "15:00", "close": "22:30"}
            }
        },
        
        # Compras
        {
            "name": "Larcomar",
            "description": "Centro comercial al aire libre con vista al mar, ubicado en los acantilados de Miraflores.",
            "category": "Compras",
            "latitude": Decimal("-12.1342"),
            "longitude": Decimal("-77.0319"),
            "address": "Av. Malecón de la Reserva 610, Miraflores",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15074",
            "phone": "+51 1 625-9400",
            "email": "info@larcomar.com",
            "website": "https://www.larcomar.com",
            "price_range": "$$$",
            "features": ["Vista al mar", "Restaurantes", "Cines", "Estacionamiento", "Tiendas de marca"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "10:00", "close": "22:00"},
                "tuesday": {"open": "10:00", "close": "22:00"},
                "wednesday": {"open": "10:00", "close": "22:00"},
                "thursday": {"open": "10:00", "close": "22:00"},
                "friday": {"open": "10:00", "close": "22:00"},
                "saturday": {"open": "10:00", "close": "22:00"},
                "sunday": {"open": "11:00", "close": "21:00"}
            }
        },
        
        # Parques
        {
            "name": "Parque Kennedy",
            "description": "Parque central de Miraflores, famoso por sus gatos y actividades culturales, rodeado de cafés y restaurantes.",
            "category": "Parques",
            "latitude": Decimal("-12.1211"),
            "longitude": Decimal("-77.0297"),
            "address": "Av. Larco cuadra 3, Miraflores",
            "city": "Lima",
            "state": "Lima",
            "country": "Peru",
            "zip_code": "15074",
            "phone": "+51 1 617-7272",
            "email": "info@miraflores.gob.pe",
            "website": "https://www.miraflores.gob.pe",
            "price_range": "$",
            "features": ["Gatos", "Eventos culturales", "Área de juegos", "WiFi gratuito"],
            "cuisines": [],
            "business_hours": {
                "monday": {"open": "05:00", "close": "23:00"},
                "tuesday": {"open": "05:00", "close": "23:00"},
                "wednesday": {"open": "05:00", "close": "23:00"},
                "thursday": {"open": "05:00", "close": "23:00"},
                "friday": {"open": "05:00", "close": "23:00"},
                "saturday": {"open": "05:00", "close": "23:00"},
                "sunday": {"open": "05:00", "close": "23:00"}
            }
        }
    ]
    
    created_places = []
    for place_data in places_data:
        category = categories[place_data.pop("category")]
        
        place, created = Place.objects.get_or_create(
            name=place_data["name"],
            defaults={
                **place_data,
                "category": category,
                "owner": owner,
                "is_verified": True,
                "average_rating": Decimal("4.5"),
                "total_reviews": 150
            }
        )
        
        if created:
            print(f"✅ Lugar creado: {place.name}")
            created_places.append(place)
        else:
            print(f"ℹ️  Lugar ya existe: {place.name}")
    
    return created_places


def create_sample_reviews(places):
    """Create sample reviews for places"""
    try:
        reviewer = User.objects.get(email="reviewer@spotlyvf.com")
    except User.DoesNotExist:
        reviewer = User.objects.create_user(
            username="sample_reviewer",
            email="reviewer@spotlyvf.com",
            password="reviewer123",
            first_name="Maria",
            last_name="Rodriguez",
            phone="+51987654322",
            role="USER"
        )
        UserProfile.objects.create(user=reviewer)
        print(f"✅ Usuario reviewer creado: {reviewer.email}")
    
    sample_reviews = [
        {
            "rating": 5,
            "title": "Experiencia excepcional",
            "comment": "El servicio fue impecable y la comida deliciosa. Definitivamente recomendado para ocasiones especiales."
        },
        {
            "rating": 4,
            "title": "Muy bueno",
            "comment": "Excelente calidad y ambiente agradable. Los precios son un poco altos pero vale la pena."
        },
        {
            "rating": 5,
            "title": "¡Increíble!",
            "comment": "Una experiencia única que superó todas mis expectativas. El personal muy atento y profesional."
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
                    print(f"✅ Review creado para {place.name}")
                break  # Solo crear una review por lugar para evitar constraint violation
            except:
                continue


def main():
    """Main function to populate the database"""
    print("🚀 Iniciando población de base de datos con lugares reales de Lima...")
    
    # Create categories
    print("\n📂 Creando categorías...")
    categories = create_categories()
    
    # Create business owner
    print("\n👤 Creando usuario propietario...")
    owner = create_business_owner()
    
    # Create places
    print("\n🏢 Creando lugares...")
    places = create_places(categories, owner)
    
    # Create sample reviews
    print("\n⭐ Creando reviews de ejemplo...")
    create_sample_reviews(places)
    
    print("\n🎉 ¡Base de datos poblada exitosamente!")
    print(f"📊 Estadísticas finales:")
    print(f"   - Categorías: {PlaceCategory.objects.count()}")
    print(f"   - Lugares: {Place.objects.count()}")
    print(f"   - Usuarios: {User.objects.count()}")
    print(f"   - Reviews: {PlaceReview.objects.count()}")


if __name__ == "__main__":
    main()
