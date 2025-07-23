# 🧠 CONFIGURACIÓN DE MODELOS IA - Spotlyvf

## 📁 Archivos mantenidos (TU LÓGICA):
✅ modelo.py - Tu implementación del modelo
✅ modelo_bert.py - Tu código BERT personalizado  
✅ balancer.py - Tu lógica de balanceado de datos
✅ reetiquetar.py - Tu script de etiquetado
✅ prueba_ia.py - Tus pruebas y validaciones
✅ requirements.txt - Dependencias específicas
✅ backend/apps/analytics_service/ - Toda tu lógica de analytics

## 🗑️ Archivos removidos (SOLO BINARIOS GRANDES):
❌ glove.6B.300d.txt (990MB) - Se descarga automáticamente
❌ optimizer.pt (838MB c/u) - Checkpoints de entrenamiento
❌ model.safetensors (419MB c/u) - Estados intermedios
❌ results/checkpoint-*/ - Checkpoints temporales
❌ .venv/ - Entorno virtual (se recrea)

## 🔄 CÓMO RECUPERAR EN EL SERVIDOR:

### 1. Los modelos se descargan automáticamente:
```bash
# Script incluido: setup_lightweight_ai.py
python setup_lightweight_ai.py
```

### 2. O usar modelos preentrenados de Hugging Face:
```python
# En tu código ya tienes esta lógica
from transformers import AutoModel, AutoTokenizer
model = AutoModel.from_pretrained("dccuchile/bert-base-spanish-wwm-uncased")
```

### 3. Para embeddings GloVe:
```bash
# Se descarga automáticamente cuando sea necesario
wget https://nlp.stanford.edu/data/glove.6B.zip
```

## 🎯 RESULTADO:
- ✅ Tu lógica de IA funciona igual
- ✅ Repositorio limpio y rápido  
- ✅ Modelos se descargan automáticamente en producción
- ✅ GitHub no se satura con archivos grandes

## 🔧 SCRIPTS DE RECUPERACIÓN:
- `setup_lightweight_ai.py` - Configura modelos ligeros
- `download_models.sh` - Descarga modelos pesados si es necesario
- Tu código original mantiene toda la funcionalidad
