import os
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from dotenv import load_dotenv
import openai
import gradio as gr

# ---------------------------
# 1. Cargar variables de entorno
# ---------------------------
load_dotenv()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------------------------
# 2. Cargar modelo y tokenizer BERT
# ---------------------------
print("🔄 Cargando modelo BERT...")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = "modelo_bert_sentimiento"

tokenizer = BertTokenizer.from_pretrained(model_path)
model = BertForSequenceClassification.from_pretrained(model_path)
model.to(device)
model.eval()

# ---------------------------
# 3. Función de diagnóstico IA
# ---------------------------
def diagnostico_ia(nombre_negocio, resena, estrellas):
    inputs = tokenizer(resena, return_tensors="pt", truncation=True, padding=True, max_length=512)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        pred = torch.argmax(logits, dim=1).item()

    sentimiento = "Positiva" if pred == 1 else "Negativa"

    if pred == 0 and estrellas <= 3:
        estado = "Negocio en peligro de fracaso"
        prompt = (
            f"El negocio llamado '{nombre_negocio}' recibió una reseña negativa con baja calificación. "
            f"Texto de la reseña: {resena}\n\n"
            "Sugiere, máximo 4 estrategias para mejorar el negocio en áreas críticas como sabor, precios o atención."
        )
    elif pred == 1 and estrellas >= 4:
        estado = "Negocio exitoso"
        prompt = (
            f"El negocio llamado '{nombre_negocio}' fue bien valorado. "
            f"Texto de la reseña: {resena}\n\n"
            "Felicita al propietario del negocio y sugiere que continúe innovando."
        )
    elif pred == 1 and estrellas < 4:
        estado = "Negocio en recuperación"
        prompt = (
            f"El cliente expresó sentimientos positivos sobre el negocio '{nombre_negocio}' aunque la calificación no es alta. "
            f"Texto de la reseña: {resena}\n\n"
            "Sugiere, máximo 3 formas de seguir mejorando sin perder los aspectos ya valorados."
        )
    else:
        estado = "Incierto"
        prompt = (
            f"La reseña del negocio '{nombre_negocio}' no es concluyente. "
            f"Texto de la reseña: {resena}\n\n"
            "Sugiere, máximo 3 buenas prácticas generales para analizar más reseñas y mejorar la percepción del negocio."
        )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un experto en estrategia de negocios con enfoque en atención al cliente."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=300,
            temperature=0.7
        )
        recomendacion = response.choices[0].message.content.strip()
    except Exception as e:
        recomendacion = f"No se pudo generar recomendación con OpenAI: {e}"

    return f"Sentimiento: {sentimiento}\n\nEstado del negocio: {estado}\n\nRecomendación: {recomendacion}"

# ---------------------------
# 4. Interfaz Gradio
# ---------------------------
iface = gr.Interface(
    fn=diagnostico_ia,
    inputs=[
        gr.Textbox(lines=1, placeholder="Ej: Panadería La Delicia", label="Nombre del negocio"),
        gr.Textbox(lines=4, placeholder="Escribe aquí la reseña...", label="Reseña del cliente"),
        gr.Slider(minimum=1, maximum=5, step=1, label="Calificación en estrellas")
    ],
    outputs="text",
    title="Diagnóstico Inteligente de Reseñas con BERT",
    description="Ingresa el nombre del negocio, la reseña y la calificación. Recibe recomendaciones personalizadas por IA."
)

if __name__ == "__main__":
    iface.launch()
