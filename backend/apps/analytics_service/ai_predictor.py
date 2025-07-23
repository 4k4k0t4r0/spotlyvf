import os
import torch
import logging
from typing import Dict, List, Tuple, Optional
from transformers import BertTokenizer, BertForSequenceClassification
from openai import OpenAI
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import numpy as np

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    Analizador de sentimientos usando BERT pre-entrenado
    """
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        
    def load_model(self, model_path: str = None):
        """Cargar modelo BERT desde archivo"""
        try:
            if not model_path:
                # Buscar en la carpeta del modelo predictivo
                base_path = getattr(settings, 'AI_MODELS_PATH', 
                                   os.path.join(settings.BASE_DIR.parent, 'MODELO PREDICTORIO V3'))
                model_path = os.path.join(base_path, 'modelo_bert_sentimiento')
            
            if not os.path.exists(model_path):
                logger.error(f"Modelo BERT no encontrado en: {model_path}")
                return False
                
            logger.info(f"Cargando modelo BERT desde: {model_path}")
            
            self.tokenizer = BertTokenizer.from_pretrained(model_path)
            self.model = BertForSequenceClassification.from_pretrained(model_path)
            self.model.to(self.device)
            self.model.eval()
            
            self.is_loaded = True
            logger.info("✅ Modelo BERT cargado exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error cargando modelo BERT: {str(e)}")
            return False
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analizar sentimiento de un texto
        
        Returns:
            Dict con 'label', 'score', 'confidence'
        """
        if not self.is_loaded:
            if not self.load_model():
                return {
                    'label': 'neutral',
                    'score': 0.5,
                    'confidence': 0.0,
                    'error': 'Modelo no disponible'
                }
        
        try:
            # Tokenizar texto
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=512
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Predicción
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=1)
                prediction = torch.argmax(logits, dim=1).item()
                confidence = torch.max(probabilities).item()
            
            # Mapear resultado
            label = 'positive' if prediction == 1 else 'negative'
            score = probabilities[0][1].item()  # Probabilidad de ser positivo
            
            return {
                'label': label,
                'score': score,
                'confidence': confidence,
                'raw_logits': logits.cpu().numpy().tolist()
            }
            
        except Exception as e:
            logger.error(f"Error en análisis de sentimiento: {str(e)}")
            return {
                'label': 'neutral',
                'score': 0.5,
                'confidence': 0.0,
                'error': str(e)
            }


class BusinessPredictor:
    """
    Predictor de éxito del negocio basado en reseñas y sentimientos
    """
    
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
    
    def predict_business_status(self, reviews_data: List[Dict]) -> Dict:
        """
        Predecir estado del negocio basado en reseñas
        
        Args:
            reviews_data: Lista de dicts con 'content', 'rating', 'created_at'
            
        Returns:
            Dict con predicción y métricas
        """
        if not reviews_data:
            return {
                'status': 'uncertain',
                'confidence': 0.0,
                'metrics': {},
                'message': 'Sin reseñas para analizar'
            }
        
        # Análisis de sentimientos
        sentiments = []
        ratings = []
        recent_reviews = []
        
        # Filtrar reseñas recientes (últimos 3 meses)
        three_months_ago = timezone.now() - timedelta(days=90)
        
        for review in reviews_data:
            # Analizar sentimiento
            sentiment_result = self.sentiment_analyzer.analyze_sentiment(review['content'])
            sentiments.append(sentiment_result)
            ratings.append(review['rating'])
            
            # Marcar si es reciente
            if review.get('created_at') and review['created_at'] >= three_months_ago:
                recent_reviews.append(review)
        
        # Calcular métricas
        metrics = self._calculate_metrics(sentiments, ratings, recent_reviews)
        
        # Determinar estado del negocio
        status_result = self._determine_business_status(metrics)
        
        return {
            'status': status_result['status'],
            'confidence': status_result['confidence'],
            'metrics': metrics,
            'recommendations_needed': status_result['needs_recommendations'],
            'analysis_summary': status_result['summary']
        }
    
    def _calculate_metrics(self, sentiments: List[Dict], ratings: List[float], recent_reviews: List[Dict]) -> Dict:
        """Calcular métricas de análisis"""
        total_reviews = len(sentiments)
        positive_sentiments = sum(1 for s in sentiments if s['label'] == 'positive')
        avg_rating = np.mean(ratings) if ratings else 0
        avg_sentiment_score = np.mean([s['score'] for s in sentiments]) if sentiments else 0.5
        
        # Métricas recientes
        recent_count = len(recent_reviews)
        recent_avg_rating = np.mean([r['rating'] for r in recent_reviews]) if recent_reviews else avg_rating
        
        # Tendencia (comparar últimas vs anteriores)
        trend = self._calculate_trend(ratings, recent_reviews)
        
        return {
            'total_reviews': total_reviews,
            'positive_sentiment_ratio': positive_sentiments / total_reviews if total_reviews > 0 else 0,
            'average_rating': avg_rating,
            'average_sentiment_score': avg_sentiment_score,
            'recent_reviews_count': recent_count,
            'recent_average_rating': recent_avg_rating,
            'trend': trend,
            'confidence_level': min(total_reviews / 10, 1.0)  # Más reviews = más confianza
        }
    
    def _calculate_trend(self, all_ratings: List[float], recent_reviews: List[Dict]) -> str:
        """Calcular tendencia del negocio"""
        if len(recent_reviews) < 3:
            return 'insufficient_data'
        
        recent_ratings = [r['rating'] for r in recent_reviews[-5:]]  # Últimas 5
        older_ratings = all_ratings[:-len(recent_ratings)] if len(all_ratings) > len(recent_ratings) else []
        
        if not older_ratings:
            return 'insufficient_data'
        
        recent_avg = np.mean(recent_ratings)
        older_avg = np.mean(older_ratings)
        
        diff = recent_avg - older_avg
        
        if diff > 0.3:
            return 'improving'
        elif diff < -0.3:
            return 'declining'
        else:
            return 'stable'
    
    def _determine_business_status(self, metrics: Dict) -> Dict:
        """Determinar estado del negocio"""
        sentiment_ratio = metrics['positive_sentiment_ratio']
        avg_rating = metrics['average_rating']
        trend = metrics['trend']
        confidence = metrics['confidence_level']
        
        # Lógica de decisión
        if sentiment_ratio >= 0.7 and avg_rating >= 4.0:
            return {
                'status': 'successful',
                'confidence': confidence * 0.9,
                'needs_recommendations': False,
                'summary': 'Negocio con excelente rendimiento y buenas perspectivas'
            }
        elif sentiment_ratio >= 0.6 and avg_rating >= 3.5 and trend in ['improving', 'stable']:
            return {
                'status': 'recovering',
                'confidence': confidence * 0.8,
                'needs_recommendations': True,
                'summary': 'Negocio en buena dirección, con oportunidades de mejora'
            }
        elif sentiment_ratio < 0.4 or avg_rating < 3.0 or trend == 'declining':
            return {
                'status': 'at_risk',
                'confidence': confidence * 0.85,
                'needs_recommendations': True,
                'summary': 'Negocio requiere atención inmediata para evitar problemas'
            }
        else:
            return {
                'status': 'uncertain',
                'confidence': confidence * 0.6,
                'needs_recommendations': True,
                'summary': 'Análisis no concluyente, se requiere más información'
            }


class AIRecommendationGenerator:
    """
    Generador de recomendaciones usando OpenAI GPT
    """
    
    def __init__(self):
        self.client = None
        self._initialize_openai()
    
    def _initialize_openai(self):
        """Inicializar cliente OpenAI"""
        try:
            api_key = getattr(settings, 'OPENAI_API_KEY', os.getenv('OPENAI_API_KEY'))
            if api_key:
                self.client = OpenAI(api_key=api_key)
                logger.info("✅ Cliente OpenAI inicializado")
            else:
                logger.warning("⚠️ API Key de OpenAI no encontrada")
        except Exception as e:
            logger.error(f"❌ Error inicializando OpenAI: {str(e)}")
    
    def generate_recommendations(self, business_name: str, analysis_data: Dict, recent_reviews: List[str]) -> List[Dict]:
        """
        Generar recomendaciones personalizadas
        
        Args:
            business_name: Nombre del negocio
            analysis_data: Datos del análisis de predicción
            recent_reviews: Lista de reseñas recientes (texto)
            
        Returns:
            Lista de recomendaciones con título, descripción, prioridad y categoría
        """
        if not self.client:
            return self._get_fallback_recommendations(analysis_data['status'])
        
        try:
            # Preparar contexto para GPT
            context = self._prepare_context(business_name, analysis_data, recent_reviews)
            
            # Generar recomendaciones
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """Eres un experto consultor de negocios especializado en restaurantes y servicios.
                        Analiza la información del negocio y proporciona recomendaciones específicas y accionables.
                        Responde SIEMPRE en formato JSON con un array de recomendaciones, cada una con:
                        - title: Título corto y claro
                        - description: Descripción detallada y específica
                        - priority: 'high', 'medium' o 'low'
                        - category: Una de ['service', 'food_quality', 'pricing', 'ambiance', 'cleanliness', 'marketing', 'operations']"""
                    },
                    {
                        "role": "user",
                        "content": context
                    }
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            # Parsear respuesta
            recommendations_text = response.choices[0].message.content.strip()
            recommendations = self._parse_recommendations(recommendations_text)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generando recomendaciones con OpenAI: {str(e)}")
            return self._get_fallback_recommendations(analysis_data['status'])
    
    def _prepare_context(self, business_name: str, analysis_data: Dict, recent_reviews: List[str]) -> str:
        """Preparar contexto para OpenAI"""
        status = analysis_data['status']
        metrics = analysis_data['metrics']
        
        # Tomar solo algunas reseñas recientes para no exceder límites
        review_sample = recent_reviews[:5] if recent_reviews else []
        
        context = f"""
        Negocio: {business_name}
        Estado actual: {status}
        
        Métricas:
        - Total de reseñas: {metrics.get('total_reviews', 0)}
        - Calificación promedio: {metrics.get('average_rating', 0):.1f}/5
        - Sentimiento positivo: {metrics.get('positive_sentiment_ratio', 0)*100:.1f}%
        - Tendencia: {metrics.get('trend', 'desconocida')}
        
        Reseñas recientes:
        {chr(10).join([f'- "{review[:200]}..."' for review in review_sample])}
        
        Proporciona 3-5 recomendaciones específicas para mejorar este negocio.
        """
        
        return context
    
    def _parse_recommendations(self, text: str) -> List[Dict]:
        """Parsear recomendaciones de la respuesta de GPT"""
        try:
            import json
            # Intentar parsear como JSON
            if text.startswith('[') or text.startswith('{'):
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict) and 'recommendations' in parsed:
                    return parsed['recommendations']
            
            # Si no es JSON válido, crear recomendaciones básicas
            return self._extract_text_recommendations(text)
            
        except json.JSONDecodeError:
            return self._extract_text_recommendations(text)
    
    def _extract_text_recommendations(self, text: str) -> List[Dict]:
        """Extraer recomendaciones de texto libre"""
        # Implementación simple para extraer recomendaciones de texto
        lines = text.split('\n')
        recommendations = []
        
        current_rec = {}
        for line in lines:
            line = line.strip()
            if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•')):
                if current_rec:
                    recommendations.append(current_rec)
                current_rec = {
                    'title': line[:50],
                    'description': line,
                    'priority': 'medium',
                    'category': 'operations'
                }
            elif current_rec and line:
                current_rec['description'] += ' ' + line
        
        if current_rec:
            recommendations.append(current_rec)
        
        return recommendations[:5]  # Máximo 5 recomendaciones
    
    def _get_fallback_recommendations(self, status: str) -> List[Dict]:
        """Recomendaciones predeterminadas cuando OpenAI no está disponible"""
        fallback_recs = {
            'at_risk': [
                {
                    'title': 'Mejora inmediata del servicio',
                    'description': 'Capacita al personal en atención al cliente y reduce los tiempos de espera',
                    'priority': 'high',
                    'category': 'service'
                },
                {
                    'title': 'Revisión de calidad de productos',
                    'description': 'Evalúa la calidad de los alimentos y realiza mejoras en la cocina',
                    'priority': 'high',
                    'category': 'food_quality'
                }
            ],
            'recovering': [
                {
                    'title': 'Mantén la calidad actual',
                    'description': 'Continúa con las prácticas que están funcionando bien',
                    'priority': 'medium',
                    'category': 'operations'
                },
                {
                    'title': 'Incrementa la promoción',
                    'description': 'Aumenta la visibilidad del negocio en redes sociales',
                    'priority': 'medium',
                    'category': 'marketing'
                }
            ],
            'successful': [
                {
                    'title': 'Expande tu oferta',
                    'description': 'Considera agregar nuevos productos o servicios',
                    'priority': 'low',
                    'category': 'operations'
                }
            ]
        }
        
        return fallback_recs.get(status, [])


# Instancia global del predictor
business_predictor = BusinessPredictor()
recommendation_generator = AIRecommendationGenerator()
