import pandas as pd
from pysentimiento import create_analyzer
from tqdm import tqdm
#Cargar dataset

df = pd.read_csv("reseñas.csv")
df = df.dropna(subset=["reseña"])
df = df[df["reseña"].str.strip() != ""].reset_index(drop=True)
#Inicializar analizador BERT en español

print("⏳ Cargando modelo BERT preentrenado...")
analyzer = create_analyzer(task="sentiment", lang="es")
#Etiquetar reseñas

etiquetas = []
print("🚀 Etiquetando reseñas con BERT...")

for texto in tqdm(df["reseña"].tolist()):
    try:
        resultado = analyzer.predict(texto)
        if resultado.output == "POS":
            etiquetas.append(1)
        elif resultado.output == "NEG":
            etiquetas.append(0)
        else:
            etiquetas.append(-1)
    except Exception as e:
    
            print(f"❌ Error con texto: {texto[:60]}... → {e}")
            etiquetas.append(-1)

#Verificar longitud antes de asignar

if len(etiquetas) == len(df):
    df["sentimiento_bert"] = etiquetas
    df = df[df["sentimiento_bert"].isin([0, 1])].reset_index(drop=True)
    df.to_csv("reseñas_etiquetadas.csv", index=False, encoding="utf-8")
    print(f"✅ Reseñas etiquetadas guardadas correctamente: {len(df)} filas.")
else:
    print(f"❌ Error: etiquetas ({len(etiquetas)}) no coincide con reseñas ({len(df)})")