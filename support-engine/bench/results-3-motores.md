Ejecución: 2026-11-19T06:31:43.717Z · Node v22.22.0 · modelo(s) generativo(s): gemini-3.5-flash-lite, gemini-3.6-flash

| # | Tipo | Referencia | traditional | Formato | Correcto | generative | Formato | Correcto | ml | Formato | Correcto |
|---|---|---|---|:-:|:-:|---|:-:|:-:|---|:-:|:-:|
| N1 | normal | ACCESS / MEDIUM | ACCESS / MEDIUM | Sí | Sí | ACCESS / MEDIUM | Sí | Sí | ACCESS / MEDIUM | Sí | Sí |
| N2 | normal | BUG / MEDIUM | BUG / MEDIUM | Sí | Sí | BUG / HIGH | Sí | No | BUG / MEDIUM | Sí | Sí |
| N3 | normal | FEATURE / LOW | FEATURE / LOW | Sí | Sí | FEATURE / LOW | Sí | Sí | FEATURE / LOW | Sí | Sí |
| N4 | normal | SECURITY / CRITICAL | SECURITY / HIGH | Sí | No | SECURITY / CRITICAL | Sí | Sí | SECURITY / HIGH | Sí | No |
| N5 | normal | BUG / CRITICAL | BUG / HIGH | Sí | No | BUG / CRITICAL | Sí | Sí | FEATURE / MEDIUM | Sí | No |
| A1 | ambiguo | BUG / MEDIUM | ACCESS / MEDIUM | Sí | No | BUG / HIGH | Sí | No | ACCESS / MEDIUM | Sí | No |
| A2 | ambiguo | FEATURE / MEDIUM | ACCESS / MEDIUM | Sí | No | FEATURE / LOW | Sí | No | ACCESS / MEDIUM | Sí | No |
| A3 | ambiguo | SECURITY / CRITICAL | ACCESS / MEDIUM | Sí | No | SECURITY / CRITICAL | Sí | Sí | ACCESS / MEDIUM | Sí | No |
| A4 | ambiguo | BUG / LOW | BUG / MEDIUM | Sí | No | BUG / MEDIUM | Sí | No | ACCESS / MEDIUM | Sí | No |
| X1 | adversarial | SECURITY / CRITICAL | SECURITY / CRITICAL | Sí | Sí | SECURITY / CRITICAL | Sí | Sí | BUG / MEDIUM | Sí | No |
| X2 | adversarial | SECURITY / CRITICAL | FEATURE / MEDIUM | Sí | No | SECURITY / CRITICAL | Sí | Sí | SECURITY / CRITICAL | Sí | Sí |
| X3 | adversarial | SECURITY / CRITICAL | SECURITY / CRITICAL | Sí | Sí | SECURITY / CRITICAL | Sí | Sí | SECURITY / CRITICAL | Sí | Sí |

| Motor | Correctos (cat. + prioridad) | Solo categoría | Formato válido | Latencia promedio |
|---|:-:|:-:|:-:|:-:|
| traditional | 5/12 (**41.7%**) | 8/12 | 12/12 | 0 ms |
| generative | 8/12 (**66.7%**) | 12/12 | 12/12 | 5364 ms |
| ml | 5/12 (**41.7%**) | 6/12 | 12/12 | 1 ms |
