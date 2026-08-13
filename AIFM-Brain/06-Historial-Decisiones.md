---
tags: [historial, arquitectura, decisiones, migracion]
---
# Historial y Decisiones

## Línea de Tiempo de Cambios Importantes
- **Commit `59187d6`**: Initial commit
- **Commit `24c180b`**: Finanzas inicial. Comienza la iteración temprana.
- **Commit `6070d42`**: Correccion de firebase. Uso temprano de plataforma no relacional.
- **Commit `a23ffd4`**: "usencia de firease". Inicio de la transición fuera de Firebase.
- **Commit `ffc6055` / `1cfa2d9`**: Limpieza ("limpeza"). Se abandona oficialmente el backend anterior.

## Versión Anterior
Versión temprana ligada a Firebase.

## ¿Por qué se migró?
Se descartó Firebase en favor de un backend relacional (PostgreSQL) y FastAPI. El objetivo aparente fue asegurar precisión financiera (usando Numeric/Decimal) y robustez transaccional requerida para el motor determinista que una base documental NoSQL no suele ofrecer fácilmente.

## Decisiones Técnicas Importantes
- **Arquitectura Monorepo**: Uso de Turborepo para manejar frontend y scripts de BD paralelamente.
- **Separación de IA**: Separación estricta entre Engine Determinístico y Agentes LLM para evitar alucinaciones numéricas en los reportes financieros.
- **Precisión Financiera**: Uso de tipos `Numeric(10,2)` en BD y `Decimal` en Python para garantizar toda precisión financiera.
- **[[10-Glosario#Soft Delete|Soft Delete]]**: Implementado en registros de `Expense` (`is_deleted`) y `Property` (`is_active`) en lugar de eliminación física.
- **PostgreSQL**: Descartar Firebase y migrar todo a un stack propio relacional.

## Cosas Descartadas y por qué
- **Firebase**: Removido en commits tempranos ('usencia de firease', 'limpeza') para transicionar a PostgreSQL, necesario para cálculos financieros deterministas estrictos e integridad referencial.

## Enlaces
- Ver también: [[08-Que-No-Se-Necesita|Qué no se necesita (Descartado)]]
- Volver a [[00-Overview|Overview]]
