"""
Script para agregar la columna reservation_id faltante usando Django ORM
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from django.db import connection

def add_reservation_id_column():
    """Agregar columna reservation_id a la tabla place_service_review"""
    
    cursor = connection.cursor()
    
    try:
        print("🔧 Agregando columna reservation_id a place_service_review...")
        
        # Verificar si la columna ya existe
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'spotlyvf' 
            AND TABLE_NAME = 'place_service_review' 
            AND COLUMN_NAME = 'reservation_id'
        """)
        
        exists = cursor.fetchone()
        
        if exists:
            print("ℹ️ La columna reservation_id ya existe")
            return True
        
        # Agregar la columna
        cursor.execute("""
            ALTER TABLE place_service_review 
            ADD COLUMN reservation_id VARCHAR(36) NULL 
            COMMENT 'ID de reservación asociada a la reseña'
        """)
        
        print("✅ Columna reservation_id agregada exitosamente")
        
        # Verificar que se agregó
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'spotlyvf' 
            AND TABLE_NAME = 'place_service_review' 
            AND COLUMN_NAME = 'reservation_id'
        """)
        
        verification = cursor.fetchone()
        
        if verification:
            print("✅ Verificación exitosa: reservation_id existe en la tabla")
            return True
        else:
            print("❌ Error: No se pudo verificar la columna")
            return False
            
    except Exception as e:
        print(f"❌ Error al agregar columna: {e}")
        return False
    
    finally:
        cursor.close()

if __name__ == "__main__":
    print("🚀 AGREGANDO COLUMNA RESERVATION_ID")
    print("=" * 50)
    
    success = add_reservation_id_column()
    
    if success:
        print("\n🎉 ¡Columna agregada exitosamente!")
        print("👍 El endpoint de reseñas debería funcionar ahora")
    else:
        print("\n❌ Error al agregar la columna")
