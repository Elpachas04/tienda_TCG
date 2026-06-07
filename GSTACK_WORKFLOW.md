# gstack Workflow — Tienda TCG LayerVault

Orden óptimo para sacar el máximo partido a los skills de gstack en este proyecto.
Cada fase se apoya en la anterior: primero diagnosticamos, luego mejoramos, luego enviamos.

---

## FASE 1 — Diagnóstico (solo lectura, sin tocar código)

| # | Skill | Qué hace | Output |
|---|---|---|---|
| 1 | `/health` | Dashboard de calidad de código: complejidad, deuda técnica, archivos problemáticos | Lista priorizada de problemas |
| 2 | `/design-review` | Detecta problemas visuales: spacing, jerarquía, inconsistencias, "AI slop" | Issues de diseño con fixes |
| 3 | `/qa-only` | Abre la web real en navegador headless y reporta bugs funcionales (sin arreglar nada) | Informe de bugs |
| 4 | `/cso` | Auditoría de seguridad OWASP + STRIDE: XSS, inyecciones, secrets expuestos | Informe de vulnerabilidades |

---

## FASE 2 — Mejoras de diseño

| # | Skill | Qué hace | Output |
|---|---|---|---|
| 5 | `/design-consultation` | Analiza el producto, investiga el mercado, propone sistema de diseño completo | Propuesta: colores, tipografía, layout, motion |
| 6 | `/design-shotgun` | Genera varias variantes visuales, abre board de comparación, recoge feedback | Variantes renderizadas para elegir |
| 7 | `/design-html` | Convierte la dirección elegida en HTML/CSS de producción con Pretext | Código listo para integrar |

---

## FASE 3 — Implementación y revisión

| # | Skill | Qué hace | Output |
|---|---|---|---|
| 8 | `/plan-design-review` | Revisa el plan de cambios con "ojo de diseñador" antes de implementar | Findings + ajustes al plan |
| 9 | `/plan-eng-review` | Revisa el plan con "ojo de eng manager": arquitectura, deuda, riesgos | Findings técnicos |
| 10 | `/qa` | QA completo en navegador real + arregla los bugs encontrados | Fixes aplicados |
| 11 | `/review` | Code review del diff completo antes de mergear | Lista de problemas con severidad |

---

## FASE 4 — Ship

| # | Skill | Qué hace | Output |
|---|---|---|---|
| 12 | `/ship` | Detecta rama base, corre tests, bump VERSION, actualiza CHANGELOG, crea PR | PR listo para merge |

---

## Orden rápido para una sesión típica

```
/health → /design-review → /qa-only → /design-consultation → /qa → /review → /ship
```

## Notas

- **Siempre en rama `develop`**, nunca en `main` directamente.
- `/qa` y `/browse` necesitan la URL de staging o `localhost:4200` levantado.
- `/design-shotgun` es interactivo: pide feedback antes de continuar.
- `/cso` puede generar issues sensibles — revisar antes de publicar.
