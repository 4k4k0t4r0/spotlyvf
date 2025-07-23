import pandas as pd
from sklearn.utils import resample
#Cargar dataset etiquetado

df = pd.read_csv("reseñas_etiquetadas.csv")
df = df[df["sentimiento_bert"].isin([0, 1])]
#Separar por clases

positivas = df[df["sentimiento_bert"] == 1]
negativas = df[df["sentimiento_bert"] == 0]
#Determinar tamaño mínimo

min_count = min(len(positivas), len(negativas))
#Submuestreo para balancear

positivas_bal = resample(positivas, replace=False, n_samples=min_count, random_state=42)
negativas_bal = resample(negativas, replace=False, n_samples=min_count, random_state=42)
#Unir y barajar

df_balanced = pd.concat([positivas_bal, negativas_bal]).sample(frac=1, random_state=42).reset_index(drop=True)
#Guardar dataset balanceado

df_balanced.to_csv("reseñas_balanceadas.csv", index=False, encoding="utf-8")
print(f"✅ Dataset balanceado guardado como 'reseñas_balanceadas.csv' con {min_count} reseñas positivas y {min_count} negativas.")