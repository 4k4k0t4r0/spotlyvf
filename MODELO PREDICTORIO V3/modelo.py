import pandas as pd
import numpy as np
import json
import os
import time
import tensorflow as tf
from keras.models import Sequential
from keras.layers import Embedding, LSTM, Dense, Dropout, Bidirectional, BatchNormalization
from keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from keras.metrics import AUC, Precision, Recall
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix
import gradio as gr

# ---------------------------
# 0. Configuración de GPU
# ---------------------------
print("📦 Dispositivos disponibles:", tf.config.list_physical_devices('GPU'))

gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print("✅ Memoria GPU configurada para crecimiento dinámico")
    except RuntimeError as e:
        print("❌ Error al configurar GPU:", e)
else:
    print("⚠️ No se detectó GPU, se usará CPU")

# ---------------------------
# PARÁMETROS
# ---------------------------
EMBEDDING_DIM = 300
MAX_LEN = 500
VOCAB_SIZE = 20000
GLOVE_PATH = "glove.6B.300d.txt"

# ---------------------------
# 1. Cargar y procesar dataset
# ---------------------------
df = pd.read_csv("reseñas.csv")
df.columns = df.columns.str.lower()
df = df.dropna()
df.columns = ["nombre", "reseña", "calificacion"]
df["sentimiento"] = df["calificacion"].apply(lambda x: 1 if x >= 4 else 0)

# ---------------------------
# 2. Tokenización
# ---------------------------
tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token="<OOV>")
tokenizer.fit_on_texts(df["reseña"])
sequences = tokenizer.texts_to_sequences(df["reseña"])
padded = pad_sequences(sequences, maxlen=MAX_LEN, padding='post', truncating='post')
X_train, X_test, y_train, y_test = train_test_split(padded, df["sentimiento"], test_size=0.2, random_state=42)

# ---------------------------
# 3. Cargar GloVe embeddings
# ---------------------------
print("📥 Cargando vectores GloVe...")
embeddings_index = {}
with open(GLOVE_PATH, encoding='utf8') as f:
    for line in f:
        values = line.split()
        word = values[0]
        vector = np.asarray(values[1:], dtype='float32')
        embeddings_index[word] = vector

# ---------------------------
# 4. Crear matriz de embeddings
# ---------------------------
embedding_matrix = np.zeros((VOCAB_SIZE, EMBEDDING_DIM))
for word, i in tokenizer.word_index.items():
    if i < VOCAB_SIZE:
        embedding_vector = embeddings_index.get(word)
        if embedding_vector is not None:
            embedding_matrix[i] = embedding_vector

# ---------------------------
# 5. Definir modelo mejorado
# ---------------------------
print("🧠 Definiendo modelo avanzado...")
model = Sequential()
model.add(Embedding(input_dim=VOCAB_SIZE, output_dim=EMBEDDING_DIM, weights=[embedding_matrix],
                    input_length=MAX_LEN, trainable=True))
model.add(Bidirectional(LSTM(64, recurrent_dropout=0.2)))
model.add(BatchNormalization())
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(BatchNormalization())
model.add(Dropout(0.2))
model.add(Dense(1, activation='sigmoid'))

model.compile(
    loss='binary_crossentropy',
    optimizer='adam',
    metrics=['accuracy', AUC(name='auc'), Precision(name='precision'), Recall(name='recall')]
)

# ---------------------------
# 6. Balanceo de clases
# ---------------------------
class_weights = compute_class_weight(class_weight='balanced',
                                    classes=np.unique(y_train),
                                    y=y_train)
class_weights = dict(enumerate(class_weights))

# ---------------------------
# 7. Entrenar modelo
# ---------------------------
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

print("🚀 Entrenando modelo...")
start = time.time()

model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=16,
    validation_data=(X_test, y_test),
    callbacks=[early_stop],
    class_weight=class_weights,
    verbose=1
)

end = time.time()
print(f"⏱ Tiempo total de entrenamiento: {(end - start)/60:.2f} minutos")

# ---------------------------
# 8. Evaluación
# ---------------------------
y_pred = (model.predict(X_test) >= 0.5).astype(int)
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))

# ---------------------------
# 9. Guardar modelo y tokenizer
# ---------------------------
model.save("modelo_sentimiento.keras")
with open("tokenizer.json", "w", encoding="utf-8") as f:
    f.write(tokenizer.to_json())
print("✅ Modelo y tokenizer guardados")

# ---------------------------
# 10. Función de diagnóstico inteligente
# ---------------------------
def diagnostico_ia(reseña, estrellas, modelo, tokenizer):
    secuencia = tokenizer.texts_to_sequences([reseña])
    entrada = pad_sequences(secuencia, maxlen=MAX_LEN, padding='post', truncating='post')
    pred = model.predict(entrada)[0][0]
    sentimiento = "Positiva" if pred >= 0.5 else "Negativa"

    if pred < 0.5 and estrellas <= 3:
        estado = "Negocio en peligro de fracaso"
        recomendacion = (
            "Tu negocio necesita mejorar en áreas críticas como sabor, precios o atención. "
            "Considera lanzar promociones anunciando mejoras."
        )
    elif pred >= 0.5 and estrellas >= 4:
        estado = "Negocio exitoso"
        recomendacion = "Sigue así, tu negocio va por buen camino."
    elif pred >= 0.5 and estrellas < 4:
        estado = "Negocio en recuperación"
        recomendacion = "Vas por buen camino. Refuerza los aspectos positivos y sigue mejorando."
    else:
        estado = "Incierto"
        recomendacion = "Revisa más reseñas para obtener un diagnóstico más claro."

    return {
        "reseña": reseña,
        "calificación": estrellas,
        "sentimiento": sentimiento,
        "estado": estado,
        "recomendación": recomendacion
    }




