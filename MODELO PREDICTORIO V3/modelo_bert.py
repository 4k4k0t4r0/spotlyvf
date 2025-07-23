from doctest import Example
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from transformers import BertTokenizer, BertForSequenceClassification, Trainer
from transformers import DataCollatorWithPadding
from datasets import Dataset
import torch
from transformers import TrainingArguments

print("✅ GPU disponible" if torch.cuda.is_available() else "⚠️ No se detectó GPU")
print("🖥️ Dispositivo usado:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")
#1. Cargar dataset balanceado

df = pd.read_csv("reseñas_balanceadas.csv")
df = df[["reseña", "sentimiento_bert"]]
df = df.rename(columns={"reseña": "text", "sentimiento_bert": "label"})

#2. Tokenización con BERT base español

model_name = "dccuchile/bert-base-spanish-wwm-cased"
tokenizer = BertTokenizer.from_pretrained(model_name)

#3. Tokenizar el dataset

def tokenize(example):
    return tokenizer(example["text"], truncation=True, padding=True, max_length=512)

dataset = Dataset.from_pandas(df)
dataset = dataset.map(tokenize, batched=True)
#4. Separar entrenamiento y test

train_test = dataset.train_test_split(test_size=0.2, seed=42)
train_dataset = train_test["train"]
eval_dataset = train_test["test"]
#5. Cargar modelo BERT para clasificación binaria

model = BertForSequenceClassification.from_pretrained(model_name, num_labels=2)

#6. Configuración del entrenamiento

training_args = TrainingArguments(
output_dir="./results",
evaluation_strategy="epoch",
save_strategy="epoch",
learning_rate=2e-5,
per_device_train_batch_size=8,
per_device_eval_batch_size=8,
num_train_epochs=4,
weight_decay=0.01,
load_best_model_at_end=True,
metric_for_best_model="eval_loss",
)

#7. Preparar Trainer

trainer = Trainer(
model=model,
args=training_args,
train_dataset=train_dataset,
eval_dataset=eval_dataset,
tokenizer=tokenizer,
data_collator=DataCollatorWithPadding(tokenizer),
)

#8. Entrenar modelo

trainer.train()
#9. Evaluación

predictions = trainer.predict(eval_dataset)
y_pred = np.argmax(predictions.predictions, axis=1)
y_true = predictions.label_ids

print("📊 Matriz de Confusión:")
print(confusion_matrix(y_true, y_pred))
print("📋 Reporte de Clasificación:")
print(classification_report(y_true, y_pred))

#10. Guardar modelo y tokenizer

model.save_pretrained("modelo_bert_sentimiento")
tokenizer.save_pretrained("modelo_bert_sentimiento")
print("✅ Modelo BERT guardado en carpeta 'modelo_bert_sentimiento'")