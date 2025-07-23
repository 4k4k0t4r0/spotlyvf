"""
Script para simular la llamada del frontend al lugar específico
"""
import requests
import json

def test_frontend_flow():
    """Simular el flujo del frontend"""
    
    print("🎯 SIMULANDO FLUJO DEL FRONTEND")
    print("=" * 50)
    
    # 1. Buscar lugares (como haría el frontend desde PlacesList)
    print("1️⃣ Buscando lugares (PlaceListSerializer)...")
    
    response = requests.get(
        'http://192.168.100.13:8000/api/v1/places/?search=Pizza Sport',
        timeout=10
    )
    
    if response.status_code == 200:
        places_data = response.json()
        print(f"✅ Encontrados {places_data['count']} lugares")
        
        if places_data['results']:
            place = places_data['results'][0]
            print(f"📍 Lugar: {place['name']}")
            print(f"🆔 ID: {place['id']}")
            print(f"🌐 isGooglePlace: {place.get('isGooglePlace')}")
            print(f"📧 google_place_id: {place.get('google_place_id')}")
            
            # 2. Obtener detalle del lugar (como haría PlaceDetailsScreen)
            print(f"\n2️⃣ Obteniendo detalle del lugar...")
            
            detail_response = requests.get(
                f'http://192.168.100.13:8000/api/v1/places/{place["id"]}/',
                timeout=10
            )
            
            if detail_response.status_code == 200:
                detail_data = detail_response.json()
                print(f"✅ Detalle obtenido")
                print(f"🆔 ID: {detail_data['id']}")
                print(f"🌐 isGooglePlace: {detail_data.get('isGooglePlace')}")
                print(f"📧 google_place_id: {detail_data.get('google_place_id')}")
                
                # 3. Verificar si puede cargar reseñas de Google
                if detail_data.get('isGooglePlace') and detail_data.get('google_place_id'):
                    print(f"\n3️⃣ ✅ PUEDE cargar reseñas de Google!")
                    
                    # 4. Probar carga de reseñas de Google
                    google_reviews_response = requests.get(
                        f'http://192.168.100.13:8000/api/v1/google-reviews/by_place/?place_id={detail_data["google_place_id"]}',
                        timeout=10
                    )
                    
                    if google_reviews_response.status_code == 200:
                        google_data = google_reviews_response.json()
                        print(f"✅ Reseñas de Google: {len(google_data.get('reviews', []))}")
                        print(f"📊 Total en BD: {google_data.get('reviews_in_database', 0)}")
                    else:
                        print(f"❌ Error cargando reseñas de Google: {google_reviews_response.status_code}")
                else:
                    print(f"\n3️⃣ ❌ NO puede cargar reseñas de Google")
                    print(f"   - isGooglePlace: {detail_data.get('isGooglePlace')}")
                    print(f"   - google_place_id: {detail_data.get('google_place_id')}")
            else:
                print(f"❌ Error obteniendo detalle: {detail_response.status_code}")
        else:
            print("❌ No se encontraron lugares")
    else:
        print(f"❌ Error buscando lugares: {response.status_code}")

if __name__ == "__main__":
    test_frontend_flow()
