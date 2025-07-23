#!/usr/bin/env python3
"""
Script para actualizar las reservas de Google Places con el nombre y dirección del lugar
"""

import os
import sys
import django

# Configurar Django
sys.path.append('c:\\Users\\ASUS TUF A15\\Desktop\\SPOTLYVF\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf.settings')
django.setup()

from apps.place_service.models import Reservation, PlaceClaim

def update_google_places_reservations():
    """Actualizar reservas de Google Places con nombre y dirección"""
    print("🔄 Actualizando reservas de Google Places...")
    
    # Encontrar reservas con google_place_id pero sin google_place_name
    reservations_to_update = Reservation.objects.filter(
        google_place_id__isnull=False,
        google_place_name__isnull=True
    )
    
    print(f"📋 Encontradas {reservations_to_update.count()} reservas para actualizar")
    
    updated_count = 0
    
    for reservation in reservations_to_update:
        try:
            # Buscar el PlaceClaim correspondiente para obtener nombre y dirección
            place_claim = PlaceClaim.objects.filter(
                google_place_id=reservation.google_place_id
            ).first()
            
            if place_claim:
                # Actualizar con datos del PlaceClaim
                reservation.google_place_name = place_claim.place_name
                reservation.google_place_address = place_claim.place_address
                reservation.save()
                
                print(f"✅ Actualizada reserva {reservation.id} con lugar: {place_claim.place_name}")
                updated_count += 1
            else:
                # Si no hay PlaceClaim, usar datos genéricos
                reservation.google_place_name = f"Lugar Google Places {reservation.google_place_id[:8]}..."
                reservation.google_place_address = "Dirección no disponible"
                reservation.save()
                
                print(f"⚠️ Actualizada reserva {reservation.id} con datos genéricos")
                updated_count += 1
                
        except Exception as e:
            print(f"❌ Error actualizando reserva {reservation.id}: {e}")
    
    print(f"\n✅ Actualizadas {updated_count} reservas de Google Places")

def verify_reservations():
    """Verificar el estado de las reservas"""
    print("\n🔍 Verificando estado de las reservas...")
    
    total_reservations = Reservation.objects.count()
    google_places_reservations = Reservation.objects.filter(google_place_id__isnull=False).count()
    reservations_with_names = Reservation.objects.filter(
        google_place_id__isnull=False,
        google_place_name__isnull=False
    ).count()
    
    print(f"📊 Estadísticas:")
    print(f"  - Total reservas: {total_reservations}")
    print(f"  - Reservas Google Places: {google_places_reservations}")
    print(f"  - Con nombre asignado: {reservations_with_names}")
    
    # Mostrar ejemplos
    print(f"\n📋 Ejemplos de reservas Google Places:")
    examples = Reservation.objects.filter(google_place_id__isnull=False)[:5]
    
    for reservation in examples:
        print(f"  - ID: {reservation.id}")
        print(f"    Usuario: {reservation.user.get_full_name() or reservation.user.username}")
        print(f"    Lugar: {reservation.google_place_name or 'Sin nombre'}")
        print(f"    Dirección: {reservation.google_place_address or 'Sin dirección'}")
        print(f"    Estado: {reservation.status}")
        print(f"    Fecha: {reservation.reservation_date}")
        print()

if __name__ == "__main__":
    print("🚀 ACTUALIZACIÓN DE RESERVAS GOOGLE PLACES")
    print("="*50)
    
    verify_reservations()
    update_google_places_reservations()
    verify_reservations()
    
    print("\n✅ Proceso completado")
