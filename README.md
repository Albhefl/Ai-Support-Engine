# AI Support Engine

**Autor:** José Alberto Herrera Flores

Repositorio de entregables. Cada tarea vive en su propia rama y se integra a `main` solo mediante Pull Request.

| Tarea | Carpeta | Rama |
|---|---|---|
| 1 · Laboratorio PWA semana 10: fallos, contratos y recuperación | [`tarea-1-laboratorio-pwa/`](tarea-1-laboratorio-pwa/) | `tarea-1/laboratorio-pwa` |
| 2 · Reto práctico AI Support Engine: motor de reglas + motor generativo + API | [`support-engine/`](support-engine/) | `tarea-2/support-engine` |
| 3 · Clasificador ML: TF-IDF + Regresión Logística | `support-engine/ml/` | `tarea-3/clasificador-ml` |

## Reglas de trabajo
- No hay commits ni pushes directos a `main`. El hook `.githooks/pre-push` los bloquea:
  ```bash
  git config core.hooksPath .githooks
  ```
- Commits convencionales (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- Los secretos van en `.env`, que git ignora. Solo se versiona `.env.example`.
