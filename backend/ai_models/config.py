
# Configuración de modelos ligeros para Spotlyvf
# Usa modelos preentrenados de Hugging Face en lugar de archivos locales

SENTIMENT_MODEL_CONFIG = {
    "model_name": "nlptown/bert-base-multilingual-uncased-sentiment",
    "use_local": False,
    "fallback_model": "cardiffnlp/twitter-roberta-base-sentiment-latest"
}

BERT_MODEL_CONFIG = {
    "model_name": "dccuchile/bert-base-spanish-wwm-uncased",
    "use_local": False,
    "max_length": 512
}

# Para usar modelos locales cuando estén disponibles
LOCAL_MODELS = {
    "sentiment_model_path": "MODELO PREDICTORIO V3/modelo_sentimiento.keras",
    "bert_model_path": "MODELO PREDICTORIO V3/modelo_bert_sentimiento/",
    "glove_path": "MODELO PREDICTORIO V3/glove.6B.300d.txt"
}
