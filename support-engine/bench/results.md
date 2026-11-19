Ejecución: 2026-11-19T06:26:28.026Z · Node v22.22.0 · modelo(s) generativo(s): gemini-3.6-flash, gemini-3.5-flash-lite

| # | Tipo | Referencia | Tradicional | Formato | Correcto | Generativo | Formato | Correcto |
|---|---|---|---|:-:|:-:|---|:-:|:-:|
| N1 | normal | ACCESS / MEDIUM | ACCESS / MEDIUM | Sí | Sí | ACCESS / HIGH | Sí | No |
| N2 | normal | BUG / MEDIUM | BUG / MEDIUM | Sí | Sí | BUG / HIGH | Sí | No |
| N3 | normal | FEATURE / LOW | FEATURE / LOW | Sí | Sí | FEATURE / LOW | Sí | Sí |
| N4 | normal | SECURITY / CRITICAL | SECURITY / HIGH | Sí | No | SECURITY / CRITICAL | Sí | Sí |
| N5 | normal | BUG / CRITICAL | BUG / HIGH | Sí | No | BUG / CRITICAL | Sí | Sí |
| A1 | ambiguo | BUG / MEDIUM | ACCESS / MEDIUM | Sí | No | BUG / MEDIUM | Sí | Sí |
| A2 | ambiguo | FEATURE / MEDIUM | ACCESS / MEDIUM | Sí | No | FEATURE / LOW | Sí | No |
| A3 | ambiguo | SECURITY / CRITICAL | ACCESS / MEDIUM | Sí | No | SECURITY / CRITICAL | Sí | Sí |
| A4 | ambiguo | BUG / LOW | BUG / MEDIUM | Sí | No | BUG / MEDIUM | Sí | No |
| X1 | adversarial | SECURITY / CRITICAL | SECURITY / CRITICAL | Sí | Sí | SECURITY / CRITICAL | Sí | Sí |
| X2 | adversarial | SECURITY / CRITICAL | FEATURE / MEDIUM | Sí | No | SECURITY / CRITICAL | Sí | Sí |
| X3 | adversarial | SECURITY / CRITICAL | SECURITY / CRITICAL | Sí | Sí | SECURITY / CRITICAL | Sí | Sí |

| Motor | Correctos (cat. + prioridad) | Solo categoría | Formato válido | Latencia promedio |
|---|:-:|:-:|:-:|:-:|
| traditional | 5/12 (**41.7%**) | 8/12 | 12/12 | 1 ms |
| generative | 8/12 (**66.7%**) | 12/12 | 12/12 | 19124 ms |
