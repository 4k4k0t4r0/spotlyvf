import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf.settings')
django.setup()

from apps.place_service.models import Reservation, PlaceClaim

print("Verificando reservas...")
reservations = Reservation.objects.filter(google_place_id__isnull=False)
print(f"Total reservas Google Places: {reservations.count()}")

updated_count = 0
for r in reservations:
    if not r.google_place_name:
        claim = PlaceClaim.objects.filter(google_place_id=r.google_place_id).first()
        if claim:
            r.google_place_name = claim.place_name
            r.google_place_address = claim.place_address
        else:
            r.google_place_name = "Lugar de Google Places"
            r.google_place_address = "Dirección no disponible"
        r.save()
        print(f"Actualizada reserva {r.id} con lugar: {r.google_place_name}")
        updated_count += 1

print(f"Actualizadas {updated_count} reservas")
