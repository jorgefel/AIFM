from __future__ import annotations

from datetime import date
from difflib import SequenceMatcher
import re
import unicodedata

from app.chatbot.registry import REGISTRY, Question

FORCE_AI_STEMS = (
    "porque",
    "recomien",
    "debo",
    "deberia",
    "sugier",
    "sugerenc",
    "aconsej",
    "estrateg",
    "tendenc",
    "aument",
    "subir",
    "baj",
    "mejora",
    "ano",
    "anio",
    "trimestre",
    "semestre",
)

MONTH_NAMES: dict[str, int] = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}


def normalize_words(text: str) -> list[str]:
    """
    Normaliza el texto:
    1. minúsculas.
    2. quita tildes vía NFD descartando 'Mn' (la ñ se convierte en n).
    3. extrae palabras con [a-z0-9]+.
    """
    text_lower = text.lower()
    nfd = unicodedata.normalize("NFD", text_lower)
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-z0-9]+", stripped)


def has_consecutive_words(words: list[str], w1: str, w2: str) -> bool:
    for i in range(len(words) - 1):
        if words[i] == w1 and words[i + 1] == w2:
            return True
    return False


def stem_matches_word(stem: str, word: str, threshold: float = 0.8) -> bool:
    """
    Coincidencia por prefijo exacto o aproximado (Sprint 2):
    - Si la palabra empieza con la raíz -> True (coincidencia exacta).
    - Tolerancia a errores (solo estándar difflib): una palabra de 5+ letras
      sin coincidencia exacta puede emparejarse si la similitud supera 0.8.
    """
    if word.startswith(stem):
        return True
    if len(word) >= 5 and len(stem) >= 4:
        # Comparar prefijo de la palabra del largo de la raíz
        prefix = word[: len(stem)]
        if SequenceMatcher(None, prefix, stem).ratio() >= threshold:
            return True
        # Comparar palabra entera si la diferencia de longitud es mínima
        if abs(len(word) - len(stem)) <= 2:
            if SequenceMatcher(None, word, stem).ratio() >= threshold:
                return True
    return False


def match_question(text: str) -> tuple[Question | None, dict]:
    """
    Enrutador determinista:
    1. Normaliza texto a lista de palabras.
    2. Fuerza capa 2 (None, {}) si:
       - Más de 12 palabras.
       - Contiene "por que".
       - Alguna palabra empieza con FORCE_AI_STEMS.
    3. Detecta meses en español (1 mes -> params={'month': n, 'year': y}; >1 meses -> capa 2).
       Detecta 'mes pasado' / 'mes anterior' -> mes previo (salvo para comparar_mes_anterior).
    4. Evalúa Question en REGISTRY:
       - Coincide si TODOS los grupos tienen al menos una palabra que empiece con una de sus raíces.
       - score = número de raíces distintas acertadas.
       - Gana mayor score (y priority); empate -> capa 2.
    """
    words = normalize_words(text)
    if not words:
        return None, {}

    # 1. Longitud > 12 palabras
    if len(words) > 12:
        return None, {}

    # 2. "por que" consecutivo o "porque"
    if has_consecutive_words(words, "por", "que"):
        return None, {}

    # Caso especial Sprint 6: comando determinista "ver/mostrar recomendaciones"
    if ("ver" in words or "mostrar" in words) and any(w.startswith("recomend") or w.startswith("sugerenc") for w in words):
        return REGISTRY.get("recomendaciones"), {}

    # 3. Raíces de forzado a IA
    for w in words:
        for stem in FORCE_AI_STEMS:
            if w.startswith(stem):
                return None, {}

    # 4. Detección de meses
    found_months = [MONTH_NAMES[w] for w in words if w in MONTH_NAMES]
    if len(found_months) > 1:
        # Más de un mes mencionado -> análisis comparativo o abierto -> capa 2
        return None, {}

    has_mes_pasado = ("mes" in words and ("pasado" in words or "anterior" in words)) or (
        has_consecutive_words(words, "mes", "pasado") or has_consecutive_words(words, "mes", "anterior")
    )

    params: dict = {}
    today = date.today()

    if len(found_months) == 1:
        m = found_months[0]
        # Si el mes nombrado aún no ha llegado en el año actual, usa el año anterior
        y = today.year - 1 if m > today.month else today.year
        params = {"month": m, "year": y}
    elif has_mes_pasado:
        prev_m = today.month - 1 if today.month > 1 else 12
        prev_y = today.year if today.month > 1 else today.year - 1
        params = {"month": prev_m, "year": prev_y}

    # 5. Puntuación de preguntas
    candidates: list[tuple[int, int, Question]] = []

    for q in REGISTRY.values():
        all_groups_matched = True
        matched_stems: set[str] = set()

        for group in q.match:
            group_matched = False
            for stem in group:
                for w in words:
                    if stem_matches_word(stem, w):
                        group_matched = True
                        matched_stems.add(stem)
            if not group_matched:
                all_groups_matched = False
                break

        if all_groups_matched and matched_stems:
            score = len(matched_stems)
            candidates.append((score, q.priority, q))

    if not candidates:
        return None, {}

    # Ordenar por (score desc, priority desc)
    candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)

    top_score, top_priority, top_q = candidates[0]
    # Comprobar empates en la primera posición
    tied = [c for c in candidates if c[0] == top_score and c[1] == top_priority]
    if len(tied) > 1:
        # Empate no resuelto por prioridad -> Capa 2
        return None, {}

    # Regla: "mes pasado / mes anterior" -> mes previo (salvo para comparar_mes_anterior, que lo maneja ella misma)
    if top_q.id == "comparar_mes_anterior" and has_mes_pasado and len(found_months) == 0:
        params = {}

    return top_q, params


def get_fallback_question_id(text: str) -> str:
    """
    Calcula fallback_question_id definitivo (Sprint 2):
    La pregunta con mejor coincidencia parcial (al menos un grupo acertado),
    o 'resumen_mes' si no hay ninguna.
    """
    words = normalize_words(text)
    if not words:
        return "resumen_mes"

    best_id: str | None = None
    best_groups_count = 0
    best_stems_count = 0
    best_priority = -1

    for q in REGISTRY.values():
        groups_matched = 0
        matched_stems: set[str] = set()

        for group in q.match:
            group_hit = False
            for stem in group:
                for w in words:
                    if stem_matches_word(stem, w):
                        group_hit = True
                        matched_stems.add(stem)
            if group_hit:
                groups_matched += 1

        if groups_matched > 0:
            stems_count = len(matched_stems)
            ranking = (groups_matched, stems_count, q.priority)
            current_best = (best_groups_count, best_stems_count, best_priority)
            if ranking > current_best:
                best_groups_count = groups_matched
                best_stems_count = stems_count
                best_priority = q.priority
                best_id = q.id

    return best_id or "resumen_mes"
