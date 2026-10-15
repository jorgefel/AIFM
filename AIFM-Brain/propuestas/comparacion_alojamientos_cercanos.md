# Propuesta de Arquitectura: Sistema de Comparación con Alojamientos Cercanos

## 1. Objetivo
Permitir a los administradores de Nomora comparar el rendimiento, tarifas y ocupación de sus propiedades con los alojamientos turísticos y Airbnb cercanos a su dirección física en un radio configurable (500m - 3km).

---

## 2. Requerimientos de Datos: Dirección Específica y Geolocalización
Para obtener comparativas exactas, la dirección general actual debe enriquecerse con coordenadas y componentes estructurados:

### Campos en Base de Datos (`properties`)
```python
# Nuevas columnas en Property (PostgreSQL)
street_address: Mapped[str] = mapped_column(String(255), nullable=True) # Calle y número exterior/interior
neighborhood: Mapped[str | None] = mapped_column(String(120), nullable=True) # Colonia / Barrio
city: Mapped[str] = mapped_column(String(100), nullable=False, default="")
state: Mapped[str] = mapped_column(String(100), nullable=False, default="")
postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
country: Mapped[str] = mapped_column(String(2), default="MX") # Código ISO
latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
```

### Experiencia de Usuario (UI/UX)
- Integrar **Google Places Autocomplete** o **Mapbox Geocoding** en el `PropertyWizard`.
- Al escribir la dirección, el selector autocompleta la calle, colonia, código postal y almacena automáticamente `latitud` y `longitud`.

---

## 3. Conexión de APIs para Alojamientos Cercanos

Se proponen tres opciones evaluadas por costo, facilidad y precisión:

| Proveedor | Datos proporcionados | Ventajas | Desventajas |
|---|---|---|---|
| **Google Places API** (`type=lodging`) | Hoteles, hostales, departamentos vacacionales con nombre, calificación (rating), fotos, reseñas y distancia exacta en metros. | Muy alta cobertura, rápido, API oficial y barata (~$5 USD / 1000 requests con $200 de crédito mensual de Google). | No da el precio por noche específico de cada día ni el calendario de Airbnb. |
| **Apify Airbnb Scraper Actor** / **RapidAPI Airbnb Data** | Listados reales de Airbnb activos en la zona, precio por noche publicado, número de recámaras, superhost status y enlaces. | Información 100% de Airbnb con precios reales y amenidades comparables. | Depende de scrapers o proxies que pueden requerir mantenimiento periódico. |
| **AirDNA API** | Inteligencia de mercado automatizada: ADR promedio de la zona, tasa de ocupación histórica del vecindario y RevPAR competitivo. | Calidad profesional de análisis para administradores de propiedades. | Costo mensual de suscripción empresarial más elevado. |

### Recomendación de Implementación Fásica (Fase 1 y Fase 2)
1. **Fase 1 (MVP)**:
   - Integrar **Google Places API (Nearby Search)** con un radio de 1.5 km para identificar inmediatamente los alojamientos comerciales y boutique cercanos y su reputación.
   - Guardar las coordenadas `latitude` y `longitude` en la propiedad.
2. **Fase 2 (Benchmarking de Tarifas Airbnb)**:
   - Integrar un webhook o job programado con **RapidAPI (Airbnb Search)** o **Apify** usando las coordenadas para extraer la mediana de precios de propiedades similares (mismo número de recámaras) en un radio de 1 km.

---

## 4. Métricas de Comparación a Mostrar en el Dashboard
- **Mediana de Tarifa por Noche del Vecindario** vs Tarifa de la Propiedad.
- **Diferencial de Precio**: Semáforo visual indicando si la propiedad está subvaluada (-15%), en precio de mercado (±5%) o con sobreprecio (+15%).
- **Mapa de Alojamientos Cercanos**: Vista satélite con marcadores interactivos de la propiedad y los alojamientos adyacentes.
- **Recomendación de Ajuste**: Sugerencia del modelo predictivo para subir o bajar la tarifa en base a la oferta circundante.
