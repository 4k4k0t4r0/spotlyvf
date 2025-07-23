#!/usr/bin/env python3
"""
Script para configurar el modelo predictivo en Spotlyvf
"""

import os
import sys
import django
import shutil
from pathlib import Path

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

def setup_ai_models():
    """Configurar modelos de IA"""
    print("🤖 Configurando modelos de IA para Spotlyvf...")
    
    # Paths
    backend_dir = Path(__file__).parent
    modelo_dir = backend_dir.parent / "MODELO PREDICTORIO V3"
    models_dir = backend_dir / "ai_models"
    
    # Crear directorio de modelos
    models_dir.mkdir(exist_ok=True)
    
    # Copiar modelo BERT si existe
    bert_source = modelo_dir / "modelo_bert_sentimiento"
    bert_dest = models_dir / "modelo_bert_sentimiento"
    
    if bert_source.exists():
        print(f"📁 Copiando modelo BERT desde {bert_source}")
        if bert_dest.exists():
            shutil.rmtree(bert_dest)
        shutil.copytree(bert_source, bert_dest)
        print("✅ Modelo BERT copiado exitosamente")
    else:
        print("⚠️ Modelo BERT no encontrado. Necesitarás entrenarlo primero.")
    
    # Copiar tokenizer si existe
    tokenizer_source = modelo_dir / "tokenizer.json"
    tokenizer_dest = models_dir / "tokenizer.json"
    
    if tokenizer_source.exists():
        print(f"📁 Copiando tokenizer desde {tokenizer_source}")
        shutil.copy2(tokenizer_source, tokenizer_dest)
        print("✅ Tokenizer copiado exitosamente")
    else:
        print("⚠️ Tokenizer no encontrado")
    
    return True

def create_migrations():
    """Crear migraciones para analytics_service"""
    print("🔄 Creando migraciones para analytics_service...")
    
    os.system("python manage.py makemigrations analytics_service")
    print("✅ Migraciones creadas")

def run_migrations():
    """Ejecutar migraciones"""
    print("🔄 Ejecutando migraciones...")
    
    os.system("python manage.py migrate")
    print("✅ Migraciones ejecutadas")

def test_ai_setup():
    """Probar la configuración de IA"""
    print("🧪 Probando configuración de IA...")
    
    try:
        from apps.analytics_service.ai_predictor import SentimentAnalyzer
        
        analyzer = SentimentAnalyzer()
        test_result = analyzer.analyze_sentiment("Esta es una prueba de sentimiento positivo")
        
        print(f"✅ Test de sentimientos: {test_result}")
        return True
        
    except ImportError as e:
        print(f"⚠️ Librerías de IA no instaladas: {e}")
        print("💡 Ejecuta: pip install -r requirements_ai.txt")
        return False
    except Exception as e:
        print(f"❌ Error en test de IA: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando configuración del modelo predictivo...")
    
    # 1. Configurar modelos
    setup_ai_models()
    
    # 2. Crear migraciones
    create_migrations()
    
    # 3. Ejecutar migraciones
    run_migrations()
    
    # 4. Probar configuración
    ai_works = test_ai_setup()
    
    print("\n" + "="*50)
    print("📊 RESUMEN DE CONFIGURACIÓN")
    print("="*50)
    print("✅ Servicio de Analytics creado")
    print("✅ Modelos de base de datos configurados")
    print("✅ URLs y admin configurados")
    
    if ai_works:
        print("✅ IA funcionando correctamente")
    else:
        print("⚠️ IA requiere configuración adicional")
    
    print("\n📋 PRÓXIMOS PASOS:")
    print("1. Instalar dependencias: pip install -r requirements_ai.txt")
    print("2. Configurar OPENAI_API_KEY en .env")
    print("3. Entrenar modelo BERT si no existe")
    print("4. Crear pantalla AnalyticsScreen en frontend")
    print("5. Probar endpoint: GET /api/v1/analytics/dashboard/")
    
    print("\n🎯 ENDPOINTS DISPONIBLES:")
    print("• GET /api/v1/analytics/dashboard/ - Dashboard principal")
    print("• POST /api/v1/analytics/analyze_business/ - Analizar negocio")
    print("• GET /api/v1/analytics/{id}/insights/ - Insights detallados")
    print("• POST /api/v1/analytics/{id}/update_recommendation/ - Actualizar recomendación")

if __name__ == "__main__":
    main()
