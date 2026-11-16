import uuid
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.chatbot.context import build_context
from app.chatbot.registry import REGISTRY, build, money, month_range
from app.chatbot.routing import get_fallback_question_id, match_question
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.redis import redis_client
from app.models.property import Property
from app.models.user import User
from main import app


@pytest.fixture(autouse=True)
def mock_rate_limiter_redis():
    """Evita timeouts de red en pruebas hacia Redis cuando no está corriendo localmente."""
    with patch.object(redis_client, "incr", AsyncMock(return_value=1)), \
         patch.object(redis_client, "expire", AsyncMock(return_value=True)):
        yield


# ─────────────────────────────────────────────────────────────
# 1. Tests de Enrutamiento (match_question)
# ─────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "text,expected_id,expected_month",
    [
        ("¿cuánto gané este mes?", "ingresos_mes", None),
        ("cuanto gane este mes", "ingresos_mes", None),
        ("ocupación de octubre", "ocupacion_mes", 10),
        ("próximas reservas", "proximas_reservas", None),
        ("¿en qué gasto más?", "gastos_categoria", None),
        ("en que gasto mas", "gastos_categoria", None),
        # Sprint 2 phrases
        ("¿cómo voy frente al mes pasado?", "comparar_mes_anterior", None),
        ("ingresos del mes pasado", "ingresos_mes", (date.today().month - 1 if date.today().month > 1 else 12)),
        ("¿cuál es mi utilidad?", "utilidad_mes", None),
        ("¿cuánto ingreos tuve este mes?", "ingresos_mes", None),  # Tolerancia a error de tipeo
    ],
)
def test_match_question_layer1(text, expected_id, expected_month):
    q, params = match_question(text)
    assert q is not None, f"Expected {expected_id} for '{text}' but got None"
    assert q.id == expected_id
    if expected_month is not None:
        assert params.get("month") == expected_month


@pytest.mark.parametrize(
    "text",
    [
        "¿por qué bajó mi ocupación?",
        "¿qué me recomiendas para subir mis ingresos?",
        "¿cuántas camas tiene mi propiedad?",
        "ingresos de enero y febrero",
        "esta es una frase larguisima que tiene mas de doce palabras para forzar que el sistema active la capa dos",
    ],
)
def test_match_question_layer2(text):
    q, params = match_question(text)
    assert q is None, f"Expected None (Layer 2) for '{text}' but got {q.id if q else None}"
    assert params == {}


def test_fallback_question_id():
    # Coincidencia parcial con gastos
    fallback = get_fallback_question_id("gastos imprevistos en plomería")
    assert fallback == "gastos_categoria"

    # Sin coincidencia -> resumen_mes (definitivo Sprint 2)
    fallback_unknown = get_fallback_question_id("xyz abcd 123")
    assert fallback_unknown == "resumen_mes"
    assert fallback_unknown in REGISTRY


# ─────────────────────────────────────────────────────────────
# 2. Tests de Handlers con datos sembrados (Sprint 1)
# ─────────────────────────────────────────────────────────────


@pytest.fixture
def mock_property():
    prop = MagicMock(spec=Property)
    prop.id = uuid.uuid4()
    prop.name = "Condo Vista Mar"
    prop.currency = "USD"
    prop.property_type = "apartment"
    prop.max_guests = 4
    prop.bedrooms = 2
    prop.bathrooms = 1
    prop.city = "Cancún"
    prop.country = "México"
    return prop


@pytest.mark.asyncio
async def test_handler_ingresos_mes_exact_figures(mock_property):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.first.return_value = (Decimal("1500.00"), Decimal("200.00"), Decimal("1300.00"), 3)
    db.execute.return_value = mock_result

    handler = REGISTRY["ingresos_mes"].handler
    result = await handler(db, mock_property, 2026, 8)

    assert result["summary"] == "Generaste USD 1,300.00 netos con 3 reservación(es)."
    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Ingreso bruto"] == 1500.0
    assert metrics["Comisiones"] == 200.0
    assert metrics["Ingreso neto"] == 1300.0
    assert metrics["Reservas"] == 3


@pytest.mark.asyncio
async def test_handler_ingresos_mes_empty(mock_property):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.first.return_value = (Decimal("0.00"), Decimal("0.00"), Decimal("0.00"), 0)
    db.execute.return_value = mock_result

    handler = REGISTRY["ingresos_mes"].handler
    result = await handler(db, mock_property, 2026, 8)

    assert "No registraste ingresos" in result["summary"]
    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Ingreso neto"] == 0.0
    assert metrics["Reservas"] == 0


@pytest.mark.asyncio
async def test_handler_gastos_categoria(mock_property):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("maintenance", Decimal("500.00")),
        ("cleaning", Decimal("300.00")),
        ("utilities", Decimal("200.00")),
    ]
    db.execute.return_value = mock_result

    handler = REGISTRY["gastos_categoria"].handler
    result = await handler(db, mock_property, 2026, 8)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Total gastos"] == 1000.0
    assert metrics["Mayor gasto (maintenance)"] == 500.0
    assert len(result["table"]["rows"]) == 3
    assert result["table"]["rows"][0] == ["maintenance", 500.0, "50.0%"]


@pytest.mark.asyncio
async def test_handler_gastos_empty(mock_property):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = []
    db.execute.return_value = mock_result

    handler = REGISTRY["gastos_categoria"].handler
    result = await handler(db, mock_property, 2026, 8)

    assert "No registraste gastos" in result["summary"]
    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Total gastos"] == 0.0
    assert result["table"]["rows"] == []


@pytest.mark.asyncio
async def test_handler_ingresos_plataforma(mock_property):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("airbnb", 4, Decimal("2000.00"), Decimal("1700.00")),
        ("booking", 2, Decimal("1000.00"), Decimal("850.00")),
    ]
    db.execute.return_value = mock_result

    handler = REGISTRY["ingresos_plataforma"].handler
    result = await handler(db, mock_property, 2026, 8)

    assert "Airbnb fue tu plataforma más rentable" in result["summary"]
    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Neto Airbnb"] == 1700.0
    assert metrics["Reservas Airbnb"] == 4
    assert len(result["table"]["rows"]) == 2


@pytest.mark.asyncio
async def test_handler_ocupacion_mes_and_crossing(mock_property):
    db = AsyncMock()
    r1 = MagicMock(status="confirmed", check_in=date(2026, 7, 28), check_out=date(2026, 8, 5))
    r2 = MagicMock(status="completed", check_in=date(2026, 8, 10), check_out=date(2026, 8, 15))
    r3 = MagicMock(status="cancelled", check_in=date(2026, 8, 20), check_out=date(2026, 8, 25))

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [r1, r2, r3]
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    db.execute.return_value = mock_result

    handler = REGISTRY["ocupacion_mes"].handler
    result = await handler(db, mock_property, 2026, 8)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Días ocupados"] == 9
    assert metrics["Días libres"] == 22
    expected_rate = round((9 / 31) * 100, 1)
    assert metrics["Ocupación"] == expected_rate


@pytest.mark.asyncio
async def test_handler_proximas_reservas(mock_property):
    db = AsyncMock()
    r1 = MagicMock(
        guest_name="Ana Gómez",
        check_in=date(2026, 12, 1),
        check_out=date(2026, 12, 5),
        net_amount=Decimal("400.00"),
        platform="airbnb",
    )
    r2 = MagicMock(
        guest_name="Carlos Ruiz",
        check_in=date(2026, 12, 10),
        check_out=date(2026, 12, 14),
        net_amount=Decimal("500.00"),
        platform="booking",
    )

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [r1, r2]
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    db.execute.return_value = mock_result

    handler = REGISTRY["proximas_reservas"].handler
    result = await handler(db, mock_property)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Próximas reservas"] == 2
    assert metrics["Total neto próximo"] == 900.0
    assert len(result["table"]["rows"]) == 2


# ─────────────────────────────────────────────────────────────
# 3. Tests de Handlers Nuevos (Sprint 2)
# ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_handler_resumen_mes(mock_property):
    db = AsyncMock()
    # 1. Ingresos: net=2000, count=4
    res1 = MagicMock()
    res1.first.return_value = (Decimal("2000.00"), 4)

    # 2. Gastos: 500
    res2 = MagicMock()
    res2.scalar.return_value = Decimal("500.00")

    # 3. Ocupación: 15 días ocupados de 30 (50%)
    r_occ = MagicMock(status="confirmed", check_in=date(2026, 9, 1), check_out=date(2026, 9, 16))
    res3 = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = [r_occ]
    res3.scalars.return_value = scalars_mock

    db.execute.side_effect = [res1, res2, res3]

    handler = REGISTRY["resumen_mes"].handler
    result = await handler(db, mock_property, 2026, 9)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Ingreso neto"] == 2000.0
    assert metrics["Gastos totales"] == 500.0
    assert metrics["Utilidad neta"] == 1500.0
    assert metrics["Ocupación"] == 50.0
    assert metrics["Reservas"] == 4


@pytest.mark.asyncio
async def test_handler_utilidad_mes(mock_property):
    db = AsyncMock()
    res_net = MagicMock()
    res_net.scalar.return_value = Decimal("3000.00")
    res_exp = MagicMock()
    res_exp.scalar.return_value = Decimal("1000.00")
    db.execute.side_effect = [res_net, res_exp]

    handler = REGISTRY["utilidad_mes"].handler
    result = await handler(db, mock_property, 2026, 8)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Ingreso neto"] == 3000.0
    assert metrics["Gastos totales"] == 1000.0
    assert metrics["Utilidad neta"] == 2000.0
    assert metrics["Margen neto"] == 66.7


@pytest.mark.asyncio
async def test_handler_comparar_mes_anterior(mock_property):
    db = AsyncMock()
    # Cur month: net=3000, exp=1000, occ=10 dias en 31
    res_cur_net = MagicMock()
    res_cur_net.scalar.return_value = Decimal("3000.00")
    res_cur_exp = MagicMock()
    res_cur_exp.scalar.return_value = Decimal("1000.00")
    res_cur_occ = MagicMock()
    cur_scalars = MagicMock()
    cur_scalars.all.return_value = [
        MagicMock(status="confirmed", check_in=date(2026, 8, 1), check_out=date(2026, 8, 11))
    ]
    res_cur_occ.scalars.return_value = cur_scalars

    # Prev month: net=2000, exp=800, occ=5 dias en 31
    res_prev_net = MagicMock()
    res_prev_net.scalar.return_value = Decimal("2000.00")
    res_prev_exp = MagicMock()
    res_prev_exp.scalar.return_value = Decimal("800.00")
    res_prev_occ = MagicMock()
    prev_scalars = MagicMock()
    prev_scalars.all.return_value = [
        MagicMock(status="confirmed", check_in=date(2026, 7, 1), check_out=date(2026, 7, 6))
    ]
    res_prev_occ.scalars.return_value = prev_scalars

    db.execute.side_effect = [
        res_cur_net, res_cur_exp, res_cur_occ,
        res_prev_net, res_prev_exp, res_prev_occ,
    ]

    handler = REGISTRY["comparar_mes_anterior"].handler
    result = await handler(db, mock_property, 2026, 8)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Variación ingreso neto"] == 1000.0
    assert metrics["Variación gastos"] == 200.0
    assert "rows" in result["table"]
    # Verificar delta % calculado
    rows = result["table"]["rows"]
    assert rows[0][0] == "Ingreso neto"
    assert rows[0][4] == "+50.0%"


@pytest.mark.asyncio
async def test_handler_tarifa_promedio(mock_property):
    db = AsyncMock()
    # 2 reservas: una de 3 noches ($600) y otra de 2 noches ($400) -> total 5 noches, $1000 -> tarifa 200/noche
    r1 = MagicMock(status="confirmed", check_in=date(2026, 8, 1), check_out=date(2026, 8, 4), total_amount=Decimal("600.00"))
    r2 = MagicMock(status="completed", check_in=date(2026, 8, 10), check_out=date(2026, 8, 12), total_amount=Decimal("400.00"))
    mock_result = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = [r1, r2]
    mock_result.scalars.return_value = scalars_mock
    db.execute.return_value = mock_result

    handler = REGISTRY["tarifa_promedio"].handler
    result = await handler(db, mock_property, 2026, 8)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Tarifa promedio / noche"] == 200.0
    assert metrics["Noches vendidas"] == 5


@pytest.mark.asyncio
async def test_handler_estancia_promedio(mock_property):
    db = AsyncMock()
    # 2 reservas: 4 noches y 2 noches -> total 6 noches / 2 reservas = 3.0 noches
    r1 = MagicMock(status="confirmed", check_in=date(2026, 8, 1), check_out=date(2026, 8, 5))
    r2 = MagicMock(status="completed", check_in=date(2026, 8, 10), check_out=date(2026, 8, 12))
    mock_result = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = [r1, r2]
    mock_result.scalars.return_value = scalars_mock
    db.execute.return_value = mock_result

    handler = REGISTRY["estancia_promedio"].handler
    result = await handler(db, mock_property, 2026, 8)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Estadía promedio"] == 3.0
    assert metrics["Reservas analizadas"] == 2


@pytest.mark.asyncio
async def test_handler_cancelaciones_mes(mock_property):
    db = AsyncMock()
    # 1 cancelada ($350)
    r_canc = MagicMock(
        status="cancelled",
        guest_name="Pedro Gómez",
        check_in=date(2026, 8, 15),
        check_out=date(2026, 8, 18),
        total_amount=Decimal("350.00"),
        platform="airbnb",
    )
    mock_result = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = [r_canc]
    mock_result.scalars.return_value = scalars_mock
    db.execute.return_value = mock_result

    handler = REGISTRY["cancelaciones_mes"].handler
    result = await handler(db, mock_property, 2026, 8)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Reservas canceladas"] == 1
    assert metrics["Monto cancelado"] == 350.0


@pytest.mark.asyncio
async def test_handler_llegadas_semana(mock_property):
    db = AsyncMock()
    today = date.today()
    in_res = MagicMock(guest_name="Huésped 1", check_in=today + timedelta(days=2), platform="airbnb")
    out_res = MagicMock(guest_name="Huésped 2", check_out=today + timedelta(days=3), platform="booking")

    res_in_mock = MagicMock()
    s_in = MagicMock()
    s_in.all.return_value = [in_res]
    res_in_mock.scalars.return_value = s_in

    res_out_mock = MagicMock()
    s_out = MagicMock()
    s_out.all.return_value = [out_res]
    res_out_mock.scalars.return_value = s_out

    db.execute.side_effect = [res_in_mock, res_out_mock]

    handler = REGISTRY["llegadas_semana"].handler
    result = await handler(db, mock_property)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Llegadas (7 días)"] == 1
    assert metrics["Salidas (7 días)"] == 1


@pytest.mark.asyncio
async def test_handler_dias_libres_proximos(mock_property):
    db = AsyncMock()
    mock_result = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = []
    mock_result.scalars.return_value = scalars_mock
    db.execute.return_value = mock_result

    handler = REGISTRY["dias_libres_proximos"].handler
    result = await handler(db, mock_property)

    assert "Días libres disponibles" in [m["label"] for m in result["metrics"]]


@pytest.mark.asyncio
async def test_handler_mejores_meses(mock_property):
    db = AsyncMock()
    r1 = MagicMock(status="confirmed", check_in=date(2026, 1, 10), net_amount=Decimal("1500.00"))
    r2 = MagicMock(status="confirmed", check_in=date(2026, 2, 10), net_amount=Decimal("2500.00"))
    r3 = MagicMock(status="confirmed", check_in=date(2026, 3, 10), net_amount=Decimal("1200.00"))

    mock_result = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = [r1, r2, r3]
    mock_result.scalars.return_value = scalars_mock
    db.execute.return_value = mock_result

    handler = REGISTRY["mejores_meses"].handler
    result = await handler(db, mock_property)

    metrics = {m["label"]: m["value"] for m in result["metrics"]}
    assert metrics["Mejor mes (2026-02)"] == 2500.0
    assert metrics["Meses analizados"] == 3


# ─────────────────────────────────────────────────────────────
# 4. Tests de Endpoints y Seguridad (/questions, /ask, /message)
# ─────────────────────────────────────────────────────────────


@pytest.fixture
def auth_user():
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.email = "testowner@nomora.com"
    user.tier = "free"
    user.is_active = True
    user.demo_expires_at = None
    return user


def test_get_questions_endpoint(auth_user):
    app.dependency_overrides[get_current_user] = lambda: auth_user
    client = TestClient(app)

    response = client.get("/api/v1/chatbot/questions")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 14, f"Se esperaban al menos 14 preguntas en el catálogo, se obtuvieron {len(data)}"
    ids = [q["id"] for q in data]
    expected_ids = [
        "ingresos_mes", "gastos_categoria", "ingresos_plataforma", "ocupacion_mes", "proximas_reservas",
        "resumen_mes", "utilidad_mes", "comparar_mes_anterior", "tarifa_promedio", "estancia_promedio",
        "cancelaciones_mes", "llegadas_semana", "dias_libres_proximos", "mejores_meses"
    ]
    for eid in expected_ids:
        assert eid in ids, f"Falta la pregunta {eid} en el catálogo"


def test_ask_endpoint_success(auth_user, mock_property):
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.first.return_value = (Decimal("1000.00"), Decimal("100.00"), Decimal("900.00"), 2)
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_current_user] = lambda: auth_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch("app.api.v1.chatbot.get_owned_property", return_value=mock_property):
        client = TestClient(app)
        payload = {
            "question_id": "ingresos_mes",
            "property_id": str(mock_property.id),
            "year": 2026,
            "month": 8,
        }
        response = client.post("/api/v1/chatbot/ask", json=payload)

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["question_id"] == "ingresos_mes"
    assert data["currency"] == "USD"
    assert "metrics" in data
    assert "table" in data


def test_ask_endpoint_invalid_question_id(auth_user, mock_property):
    app.dependency_overrides[get_current_user] = lambda: auth_user
    app.dependency_overrides[get_db] = lambda: AsyncMock()

    client = TestClient(app)
    payload = {
        "question_id": "pregunta_fantasma",
        "property_id": str(mock_property.id),
    }
    response = client.post("/api/v1/chatbot/ask", json=payload)
    app.dependency_overrides.clear()

    assert response.status_code == 404
    assert "no encontrada" in response.json()["detail"]


def test_unauthorized_endpoints():
    client = TestClient(app)
    r_questions = client.get("/api/v1/chatbot/questions")
    assert r_questions.status_code == 401

    r_ask = client.post("/api/v1/chatbot/ask", json={"question_id": "ingresos_mes", "property_id": str(uuid.uuid4())})
    assert r_ask.status_code == 401

    r_msg = client.post("/api/v1/chatbot/message", json={"text": "hola", "property_id": str(uuid.uuid4())})
    assert r_msg.status_code == 401


def test_foreign_property_returns_404(auth_user):
    mock_db = AsyncMock()
    mock_scalars = MagicMock()
    mock_scalars.first.return_value = None
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_current_user] = lambda: auth_user
    app.dependency_overrides[get_db] = lambda: mock_db

    client = TestClient(app)
    foreign_id = str(uuid.uuid4())

    r_ask = client.post("/api/v1/chatbot/ask", json={"question_id": "ingresos_mes", "property_id": foreign_id})
    assert r_ask.status_code == 404

    r_msg = client.post("/api/v1/chatbot/message", json={"text": "¿cuánto gané este mes?", "property_id": foreign_id})
    assert r_msg.status_code == 404

    app.dependency_overrides.clear()


def test_message_endpoint_layer1_and_layer2(auth_user, mock_property):
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.first.return_value = (Decimal("1000.00"), Decimal("100.00"), Decimal("900.00"), 2)
    mock_result.scalar.return_value = Decimal("500.00")
    mock_result.all.return_value = []
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_result.scalars.return_value = mock_scalars
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_current_user] = lambda: auth_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch("app.api.v1.chatbot.get_owned_property", return_value=mock_property):
        client = TestClient(app)

        # Capa 1: Coincide con "¿cuánto gané este mes?"
        r1 = client.post(
            "/api/v1/chatbot/message",
            json={"text": "¿cuánto gané este mes?", "property_id": str(mock_property.id)},
        )
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["layer"] == 1
        assert d1["question_id"] == "ingresos_mes"
        assert d1["currency"] == "USD"
        assert "summary" in d1

        # Capa 2: Pregunta abierta "¿por qué bajó mi ocupación?"
        r2 = client.post(
            "/api/v1/chatbot/message",
            json={"text": "¿por qué bajó mi ocupación?", "property_id": str(mock_property.id)},
        )
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["layer"] == 2
        assert "context" in d2
        assert d2["context"]["propiedad"]["nombre"] == "Condo Vista Mar"
        assert "mes_actual" in d2["context"]
        assert "mes_anterior" in d2["context"]
        assert d2["fallback_question_id"] == "ocupacion_mes"

    app.dependency_overrides.clear()


# ─────────────────────────────────────────────────────────────
# 5. Verificación de que el Chatbot NO escribe en Redis
# ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chatbot_never_writes_to_redis(auth_user, mock_property):
    """Regla 5: El chatbot no cachea respuestas en Redis ni realiza set/setex."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.first.return_value = (Decimal("1000.00"), Decimal("100.00"), Decimal("900.00"), 2)
    mock_result.scalar.return_value = Decimal("500.00")
    mock_result.all.return_value = []
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_result.scalars.return_value = mock_scalars
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_current_user] = lambda: auth_user
    app.dependency_overrides[get_db] = lambda: mock_db

    set_mock = AsyncMock()
    setex_mock = AsyncMock()

    with patch.object(redis_client, "set", set_mock), patch.object(redis_client, "setex", setex_mock):
        with patch("app.api.v1.chatbot.get_owned_property", return_value=mock_property):
            client = TestClient(app)

            client.post("/api/v1/chatbot/ask", json={"question_id": "ingresos_mes", "property_id": str(mock_property.id)})
            client.post("/api/v1/chatbot/message", json={"text": "¿cuánto gané este mes?", "property_id": str(mock_property.id)})
            client.post("/api/v1/chatbot/message", json={"text": "¿por qué bajó mi ocupación?", "property_id": str(mock_property.id)})

            for call in set_mock.call_args_list + setex_mock.call_args_list:
                key_arg = call[0][0] if call[0] else ""
                assert not key_arg.startswith("chatbot:"), f"Se detectó escritura en Redis con clave prohibida: {key_arg}"

    app.dependency_overrides.clear()
