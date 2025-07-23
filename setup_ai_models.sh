#!/bin/bash

# Script para descargar y configurar modelos de IA en el servidor
# Ejecutar después de clonar el repositorio

echo "🤖 Configurando modelos de IA para Spotlyvf..."

# Crear directorios necesarios
mkdir -p "MODELO PREDICTORIO V3/modelo_bert_sentimiento"
mkdir -p "backend/ai_models/modelo_bert_sentimiento"

# Función para descargar archivo si no existe
download_if_not_exists() {
    local url=$1
    local output_path=$2
    local file_name=$(basename "$output_path")
    
    if [ ! -f "$output_path" ]; then
        echo "📥 Descargando $file_name..."
        curl -L -o "$output_path" "$url"
        echo "✅ $file_name descargado"
    else
        echo "✅ $file_name ya existe"
    fi
}

# Descargar GloVe embeddings (si los necesitas)
echo "📦 Descargando GloVe embeddings..."
if [ ! -f "MODELO PREDICTORIO V3/glove.6B.300d.txt" ]; then
    echo "📥 Descargando GloVe 6B 300d..."
    wget -O "MODELO PREDICTORIO V3/glove.6B.300d.zip" http://nlp.stanford.edu/data/glove.6B.zip
    unzip -j "MODELO PREDICTORIO V3/glove.6B.300d.zip" "glove.6B.300d.txt" -d "MODELO PREDICTORIO V3/"
    rm "MODELO PREDICTORIO V3/glove.6B.300d.zip"
    echo "✅ GloVe embeddings configurados"
else
    echo "✅ GloVe embeddings ya existen"
fi

# Descargar modelo BERT preentrenado de Hugging Face
echo "🤗 Descargando modelo BERT en español..."
if [ ! -f "MODELO PREDICTORIO V3/modelo_bert_sentimiento/config.json" ]; then
    echo "📥 Descargando BERT español..."
    cd "MODELO PREDICTORIO V3/modelo_bert_sentimiento"
    
    # Usar modelo BERT en español de Hugging Face
    wget https://huggingface.co/dccuchile/bert-base-spanish-wwm-uncased/resolve/main/config.json
    wget https://huggingface.co/dccuchile/bert-base-spanish-wwm-uncased/resolve/main/pytorch_model.bin
    wget https://huggingface.co/dccuchile/bert-base-spanish-wwm-uncased/resolve/main/tokenizer_config.json
    wget https://huggingface.co/dccuchile/bert-base-spanish-wwm-uncased/resolve/main/vocab.txt
    wget https://huggingface.co/dccuchile/bert-base-spanish-wwm-uncased/resolve/main/special_tokens_map.json
    
    cd ../..
    echo "✅ Modelo BERT descargado"
else
    echo "✅ Modelo BERT ya existe"
fi

# Copiar modelos al backend si es necesario
echo "📋 Copiando modelos al backend..."
cp -r "MODELO PREDICTORIO V3/modelo_bert_sentimiento/"* "backend/ai_models/modelo_bert_sentimiento/" 2>/dev/null || :
cp "MODELO PREDICTORIO V3/tokenizer.json" "backend/ai_models/" 2>/dev/null || :

# Crear modelo de sentimiento básico si no existe
if [ ! -f "MODELO PREDICTORIO V3/modelo_sentimiento.keras" ]; then
    echo "🎯 Creando modelo de sentimiento básico..."
    python3 -c "
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Embedding, LSTM, Dropout
import os

# Crear modelo básico
model = Sequential([
    Embedding(10000, 100, input_length=100),
    LSTM(64, dropout=0.5, recurrent_dropout=0.5),
    Dense(32, activation='relu'),
    Dropout(0.5),
    Dense(3, activation='softmax')  # 3 clases: positivo, negativo, neutro
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Guardar modelo
model.save('MODELO PREDICTORIO V3/modelo_sentimiento.keras')
print('✅ Modelo de sentimiento básico creado')
" 2>/dev/null || echo "⚠️ No se pudo crear modelo Keras (TensorFlow no disponible)"
fi

echo "🎉 Configuración de modelos completada!"
echo ""
echo "📋 Modelos disponibles:"
echo "  - GloVe embeddings: MODELO PREDICTORIO V3/glove.6B.300d.txt"
echo "  - BERT modelo: MODELO PREDICTORIO V3/modelo_bert_sentimiento/"
echo "  - Modelo sentimiento: MODELO PREDICTORIO V3/modelo_sentimiento.keras"
echo ""
echo "🚀 Ahora puedes ejecutar el deploy.sh para continuar con el despliegue"
