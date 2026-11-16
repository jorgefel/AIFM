"""
Módulo del Chatbot de dos capas de Nomora.
Capa 1: Motor financiero determinista.
Capa 2: Agente analítico contextualizado.
"""
from app.chatbot.registry import REGISTRY, Question, build, money, month_range, question
from app.chatbot.routing import get_fallback_question_id, match_question
from app.chatbot.context import build_context

__all__ = [
    "REGISTRY",
    "Question",
    "question",
    "month_range",
    "money",
    "build",
    "match_question",
    "get_fallback_question_id",
    "build_context",
]
