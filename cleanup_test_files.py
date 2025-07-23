#!/usr/bin/env python3
"""
Script para limpiar archivos de test/debug temporales del proyecto Spotlyvf
"""

import os
import shutil
from pathlib import Path

def get_project_root():
    """Obtener la ruta raíz del proyecto"""
    return Path(r"c:\Users\ASUS TUF A15\Desktop\SPOTLYVF")

def get_file_size_kb(file_path):
    """Obtener el tamaño del archivo en KB"""
    try:
        return round(os.path.getsize(file_path) / 1024, 2)
    except:
        return 0

def main():
    project_root = get_project_root()
    
    # Archivos que definitivamente se pueden eliminar (archivos de test temporales)
    files_to_delete = [
        # Tests de desarrollo temporal
        "test_access_and_flow.py",
        "test_reservation_complete_flow.py", 
        "test_complete_system.py",
        "test_adminpr_reservation.py",
        "test_reviews_fix.py",
        "test_business_reservations_display.py",
        "test_session_isolation.py",
        "test_user_problem_exact.py",
        "test_remote_access.py",
        "test_google_places_reservation_fix.py",
        "test_reservation_flow.py",
        "test_pizzasport_comprehensive.py",
        "test_pizzasport_access.py",
        "test_multiple_businesses.py",
        "test_login_formats.py",
        "test_hybrid_reviews_complete.py",
        "test_http_endpoint.py",
        "test_google_reviews_limitation.py",
        "test_google_reviews_display.py",
        "test_user_roles.py",
        "test_user_info.py",
        "test_specific_endpoint.py",
        "test_review_final.py",
        "test_profile_features.py",
        "test_navigation_roles.py",
        "test_frontend_google_reviews.py",
        "test_complete_reservation_flow.py",
        "test_business_dashboard.py",
        "test_analytics_api.py",
        "test_analytics_simple.py",
        "test_analytics_specific_business.py",
        "test_demo_analytics.py",
        "test_fixed_logic.py",
        "test_google_integration.py",
        "test_google_place_claim.py",
        "test_credentials.py",
        
        # Debug scripts temporales
        "debug_reservations.py",
        "debug_reservation_complete.py", 
        "debug_reservation_creation.py",
        "debug_reservation_flow.py",
        "debug_auth.py",
        "debug_logout.py",
        
        # Check scripts de diagnóstico temporal
        "check_all_adminpr_reservations.py",
        "check_specific_reservation.py",
        "check_reservation_flow.py", 
        "check_reservations_detailed.py",
        "check_database_structure.py",
        "check_google_mapping.py",
        "check_user_roles.py",
        "check_db_tables.py",
        "check_current_passwords.py",
        "check_google_place_names.py",
        "check_place_names.py",
        
        # Fix scripts que ya cumplieron su propósito
        "fix_reservation_flow.py",
        "fix_don_feliciano_reservations.py",
        "fix_user_claims_relationship.py", 
        "fix_business_claim.py",
        "fix_business_associations.py",
        "fix_user_roles.py",
        "fix_place_names.py",
        
        # Scripts de setup temporales
        "setup_pizza_sport.py",
        "setup_reservation_flow.py",
        "simple_reservation_check.py",
        "restructure_reservations.py",
        "reset_adminpr_password.py",
        "reset_imperiolojano.py", 
        "reset_pizzasport_password.py",
        "reset_user_passwords.py",
        "quick_fix_reservations.py",
        "final_fix_reservations.py",
        "final_fix_complete_flow.py",
        "create_proper_claim.py",
        "create_realistic_imperio_reviews.py",
        "complete_reservation_flow.py",
        "complete_verification.py",
        "associate_business_owner.py",
        "authenticated_reservation_test.py",
        "alternative_scraping_methods.py",
        
        # Scripts de análisis temporal
        "find_adminpr_user.py",
        "get_user_emails.py",
        "list_all_places.py",
        "hybrid_reviews_system.py",
        
        # Archivos de prueba específicos
        "GOOGLE_PLACES_FIX_SUMMARY.py",
        "ROLE_NAVIGATION_FIX_SUMMARY.py"
    ]
    
    # Archivos en el directorio backend que también se pueden eliminar
    backend_files_to_delete = [
        "backend/debug_review_error.py",
        "backend/debug_reservation_issue.py", 
        "backend/debug_reservations.py",
        "backend/debug_place_data.py",
        "backend/debug_places.py",
        "backend/debug_google_reviews.py",
        "backend/check_table_structure.py",
        "backend/check_reviews_users.py",
        "backend/check_reviews_endpoint.py",
        "backend/check_db_tables.py", 
        "backend/check_db.py",
        "backend/check_claims.py",
        "backend/fix_pizza_sport.py",
        "backend/fix_database.py",
        "backend/fix_pizza_sport_claim.py",
        "backend/fix_pizza_sport_business.py",
        "backend/fix_table_structure.py",
        "backend/fix_review_table.py",
        "backend/fix_reservation_id.py"
    ]
    
    total_size_freed = 0
    deleted_count = 0
    skipped_count = 0
    
    print("🧹 Limpiando archivos de test temporales del proyecto Spotlyvf")
    print("=" * 70)
    
    # Eliminar archivos en el directorio raíz
    for filename in files_to_delete:
        file_path = project_root / filename
        if file_path.exists():
            size_kb = get_file_size_kb(file_path)
            try:
                os.remove(file_path)
                print(f"✅ Eliminado: {filename} ({size_kb} KB)")
                total_size_freed += size_kb
                deleted_count += 1
            except Exception as e:
                print(f"❌ Error eliminando {filename}: {e}")
                skipped_count += 1
        else:
            # print(f"⚠️  No encontrado: {filename}")
            pass
    
    # Eliminar archivos en el directorio backend
    for filename in backend_files_to_delete:
        file_path = project_root / filename
        if file_path.exists():
            size_kb = get_file_size_kb(file_path)
            try:
                os.remove(file_path)
                print(f"✅ Eliminado: {filename} ({size_kb} KB)")
                total_size_freed += size_kb
                deleted_count += 1
            except Exception as e:
                print(f"❌ Error eliminando {filename}: {e}")
                skipped_count += 1
    
    print("\n" + "=" * 70)
    print(f"📊 Resumen de limpieza:")
    print(f"   • Archivos eliminados: {deleted_count}")
    print(f"   • Archivos con errores: {skipped_count}")
    print(f"   • Espacio liberado: {total_size_freed:.2f} KB ({total_size_freed/1024:.2f} MB)")
    
    # Mostrar archivos importantes que NO se eliminaron
    print(f"\n📁 Archivos importantes conservados:")
    important_files = [
        "README.md",
        "docker-compose.yml",
        "AI_INTEGRATION_COMPLETE.md",
        "AI_INTEGRATION_PLAN.md", 
        "BUSINESS_SYSTEM.md",
        "FLUJO_RECLAMACION_NEGOCIOS.md",
        "HYBRID_REVIEWS_SYSTEM_COMPLETE.md",
        "ROLES_USUARIO_NEGOCIO.md",
        "GOOGLE_REVIEWS_LIMITATION_EXPLANATION.md",
        "LOGOUT_FIX_SUMMARY.md",
        "IP_CHANGE_SUMMARY.md",
        "IP_CHANGE_TO_13_SUMMARY.md",
        "BUSINESS_RESERVATIONS_USER_DISPLAY_FIX.md"
    ]
    
    for filename in important_files:
        file_path = project_root / filename
        if file_path.exists():
            size_kb = get_file_size_kb(file_path)
            print(f"   📄 {filename} ({size_kb} KB)")
    
    print(f"\n✅ Limpieza completada. El proyecto ahora está más organizado.")

if __name__ == "__main__":
    main()
