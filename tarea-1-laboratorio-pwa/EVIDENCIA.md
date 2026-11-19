# Registro de diagnóstico · clase de semana 10

Material formativo dentro de actividad 10. No añade puntos ni otra entrega. Enlazar o incorporar en la evidencia personal existente del equipo.

## Equipo

- Grupo y equipo vigente: trabajo individual — José Alberto Herrera Flores
- Repositorio común y carpeta auxiliar del laboratorio: este repositorio, carpeta `tarea-1-laboratorio-pwa/lab/` (workflow en `.github/workflows/lab-feedback.yml` con `working-directory` ajustado).
- Baseline (reporte real y hash del módulo): [`lab/evidence/before.json`](lab/evidence/before.json) — **1/11** escenarios, código de salida 1, `moduleSha256 = 121c15c6f47ac155ceb189d9df95ec4ce0ded400f8e44a23f5477aa5dbd06e76`.
- Resultado posterior (reporte real y hash del módulo): [`lab/evidence/after.json`](lab/evidence/after.json) — **11/11** escenarios, código de salida 0, `moduleSha256 = 7252976c2931aa3d986b65ffb3b296202465c362cbe6f421465a0356d81595f9`. Suite `node --test tests/*.test.mjs`: **17/17** (11 escenarios + smoke HTTP + 5 variantes), salida en [`lab/evidence/test-output.txt`](lab/evidence/test-output.txt).
- Casos pendientes y razón: ninguno en el sandbox. Queda pendiente la comprobación en navegador de la PWA real (ver abajo).
- Qué se transfirió a la PWA y referencia: pendiente; los invariantes (cita literal + referencia existente, borrador separado de confirmación, CAS por revisión/requestId, rollback con precondiciones) son los que se deben aplicar a la PWA del equipo.
- Recuperación real de navegador: **pendiente**. El modelo L es una simulación en memoria; no se registró service worker ni se probó IndexedDB, por lo que no se marca como aprobada.

| Incidente | Hipótesis inicial | Invariante | Cambio y enlace | Caso ejecutado | Resultado observado | Límite |
|---|---|---|---|---|---|---|
| C | `validateDraft` solo valida tipos de primer nivel; acepta citas inventadas y referencias a observaciones que no existen. | 1 | Valida tipos de cada hallazgo y de `datosFaltantes`, que `observacionId` exista en la inspección y que `cita` sea subcadena literal no vacía de su texto ([`src/implementation.mjs`](lab/src/implementation.mjs), commit `fix(tarea-1): incidente C`). | C-01, C-02, C-03, C-V1 | Antes: C-02/C-03 FAIL. Después: PASS. | Prueba trazabilidad, no verdad: el `resumen` libre puede seguir siendo incorrecto; requiere revisión humana. |
| D | `generateDraft` vacía observaciones/notas/`savedReport` antes de llamar al proveedor y copia el borrador a `savedReport` sin confirmación. | 2 | Se eliminó el borrado; el resultado solo vive en `draft`; `savedReport` cambia únicamente con `confirmDraft` (commit `fix(tarea-1): incidente D`). | D-01, D-02, D-V1 | Antes: FAIL (datos perdidos). Después: PASS; con proveedor caído solo `aiState='error'`. | El store es un `Map` en memoria; no prueba persistencia real ni sincronización offline. |
| R | El resultado se escribe con `update` sin verificar revisión ni `requestId`: gana quien termina al final y un error viejo degrada el estado. | 3 | Escritura con `store.commitDraft` (compare-and-swap de revisión + requestId) y errores con `store.failIfCurrent`; respuesta no aplicable → `STALE_RESPONSE` (commit `fix(tarea-1): incidente R`). | R-01, R-02, R-03, R-V1, R-V2 | Antes: FAIL. Después: PASS, sin esperas arbitrarias (orden fijado con promesas diferidas). | CAS síncrono de un solo proceso; en producción requiere transacción/versionado real (semana 12). |
| L | `recoverRelease` solo cambia `serverVersion` y vacía `records`; no revisa assets ni esquema. | 4 | Verifica caché del destino y esquema soportado **antes** de mutar (lanza `MISSING_ASSETS` / `INCOMPATIBLE_SCHEMA`); mueve servidor, worker y shell juntos; conserva `records` y cachés ajenas (commit `fix(tarea-1): incidente L`). | L-01, L-02, L-03, L-V1 | Antes: FAIL. Después: PASS; el rechazo deja el estado idéntico. | Simulación con objeto; no demuestra actualización ni rollback de una PWA publicada. |

## Integrante: José Alberto Herrera Flores

- Contribución técnica y enlace a código, prueba, depuración o revisión sustantiva: corrección de los cuatro incidentes en [`lab/src/implementation.mjs`](lab/src/implementation.mjs) y variantes en [`lab/tests/variants.test.mjs`](lab/tests/variants.test.mjs); un commit por incidente en la rama `tarea-1/laboratorio-pwa` del repositorio [Albhefl/Ai-Support-Engine](https://github.com/Albhefl/Ai-Support-Engine).
- Responsabilidad inicial y rotación: trabajo individual; se recorrieron las tres responsabilidades en orden: diagnóstico (before.json) → implementación (C, D, R, L) → verificación (after.json, suite completa, variantes contra el módulo original).
- Incidente y decisión propia: R. Decidí usar las primitivas `commitDraft`/`failIfCurrent` del store en lugar de comparar después de un `read`, porque comprobar y escribir en operaciones separadas deja una ventana en la que la revisión puede cambiar.
- Predicción antes de ejecutar: R-01 y R-02 fallan porque la respuesta tardía sobrescribe; R-03 falla porque el error viejo pone `aiState='error'`. Tras el cambio, la respuesta obsoleta devuelve `ok:false` y el estado vigente queda intacto.
- Preparación y comando exacto (desde `tarea-1-laboratorio-pwa/lab`, Node v22.22.0):
  ```sh
  node scripts/evaluate.mjs --out evidence/before.json   # 1/11, exit 1
  node scripts/evaluate.mjs --out evidence/after.json    # 11/11, exit 0
  node --test tests/*.test.mjs                           # 17/17
  ```
- Resultado observado y enlace a prueba/reporte: [`before.json`](lab/evidence/before.json), [`after.json`](lab/evidence/after.json), [`test-output.txt`](lab/evidence/test-output.txt).
- Variante breve ejecutada y resultado, dentro del mismo incidente: R-V2 (la solicitud antigua termina con éxito y la vigente falla → se rechaza la antigua y sí se marca `error` por la vigente). Las 5 variantes fallan con el módulo original (`LAB_TARGET=<original> node --test tests/variants.test.mjs` → 0/5) y pasan con el corregido (5/5).
- Qué demuestra y qué no demuestra: demuestra que, en el modelo en memoria, ninguna respuesta obsoleta o error antiguo altera el estado vigente. No demuestra el comportamiento con varias pestañas, IndexedDB ni un backend distribuido.
- ¿Se comprobó modelo/simulación, HTTP real o navegador? Modelo/simulación: sí (escenarios y variantes). HTTP real: sí, smoke en localhost (`tests/http.test.mjs`). Navegador: **no** (pendiente).
- Limitación y siguiente verificación: repetir el caso R y el rollback L en la PWA real con dos pestañas abiertas, en el mismo origen, siguiendo la "Comprobación de navegador" de PRACTICA.md.
- IA de desarrollo: Claude Code (asistente de código) para analizar los escenarios y proponer los parches. Validación propia: ejecución de before/after, lectura de las aserciones de `tests/scenarios.mjs` y ejecución de las variantes contra el módulo original y el corregido.

El evaluador no convierte este documento en puntos adicionales. El SHA final común se registra en Classroom después del último commit; no se intenta incluir dentro de ese mismo commit. La evidencia ambigua genera aclaración personal, no sanción automática al equipo.
