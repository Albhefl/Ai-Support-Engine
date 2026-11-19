// Laboratorio semana 10. Versión corregida incidente por incidente (ver EVIDENCIA.md).

// ── Incidente C · Contrato del borrador ─────────────────────────────────────
// Un JSON "válido" no basta: cada hallazgo debe apuntar a una observación
// existente de la MISMA inspección y citar literalmente (subcadena no vacía) su texto.
// Esto demuestra trazabilidad, no la veracidad del resumen libre: sigue
// siendo necesaria la revisión humana antes de confirmar.
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export function validateDraft(raw, inspection) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('INVALID_SHAPE');
  if (typeof raw.resumen !== 'string') throw new Error('INVALID_SHAPE');
  if (!Array.isArray(raw.hallazgos) || !Array.isArray(raw.datosFaltantes)) throw new Error('INVALID_SHAPE');
  if (!raw.datosFaltantes.every((item) => typeof item === 'string')) throw new Error('INVALID_SHAPE');

  const observaciones = new Map(
    (inspection?.observaciones ?? []).map((obs) => [obs.id, obs.texto]),
  );
  for (const hallazgo of raw.hallazgos) {
    if (!hallazgo || typeof hallazgo !== 'object' || Array.isArray(hallazgo)) throw new Error('INVALID_SHAPE');
    if (!isNonEmptyString(hallazgo.observacionId) || !isNonEmptyString(hallazgo.cita)) throw new Error('INVALID_SHAPE');
    const texto = observaciones.get(hallazgo.observacionId);
    if (typeof texto !== 'string') throw new Error('UNKNOWN_OBSERVATION');
    if (!texto.includes(hallazgo.cita)) throw new Error('UNSUPPORTED_QUOTE');
  }

  // Solo se devuelven las llaves del contrato (copia profunda, sin campos extra).
  return structuredClone({
    resumen: raw.resumen,
    hallazgos: raw.hallazgos.map(({ observacionId, cita }) => ({ observacionId, cita })),
    datosFaltantes: raw.datosFaltantes,
  });
}

// ── Incidente D · Generar no destruye ni confirma ───────────────────────────
// La fuente (observaciones, notas manuales) y lo ya confirmado (savedReport)
// nunca se tocan al generar. El resultado solo vive en `draft`; guardarlo
// requiere la acción separada confirmDraft. Si el proveedor cae, solo cambia
// aiState a 'error' y el usuario puede seguir trabajando manualmente.
//
// ── Incidente R · Respuestas fuera de orden ─────────────────────────────────
// Una respuesta exitosa no es necesariamente aplicable: solo se aplica si
// corresponde a la revisión de entrada Y a la solicitud vigente. La
// comprobación y la escritura ocurren en una sola operación (commitDraft /
// failIfCurrent, compare-and-swap síncrono del store), sin esperas arbitrarias.
// Un error de una solicitud antigua tampoco puede degradar el estado actual.
export async function generateDraft(store, id, provider) {
  const snapshot = store.beginRequest(id);
  const expected = { expectedRevision: snapshot.revision, requestId: snapshot.requestId };
  try {
    const payload = validateDraft(await provider.generate(snapshot), snapshot);
    const applied = store.commitDraft(id, {
      ...expected,
      draft: { payload, sourceRevision: snapshot.revision, requestId: snapshot.requestId },
    });
    return applied ? { ok: true } : { ok: false, error: 'STALE_RESPONSE' };
  } catch (error) {
    const applied = store.failIfCurrent(id, expected);
    return { ok: false, error: applied ? error.message : 'STALE_RESPONSE' };
  }
}

export function confirmDraft(store, id) {
  return store.confirm(id);
}
export function recoverRelease(state,release) {
 state.serverVersion=release.id;
 state.records=[];
 return state;
}
