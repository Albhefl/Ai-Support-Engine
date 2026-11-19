'use strict';

/**
 * Motor tradicional (IA simbólica). Sin modelos generativos ni servicios externos.
 *
 * 1. Normaliza el texto (minúsculas, sin acentos).
 * 2. Si detecta un intento de manipulación, lo trata como incidente de seguridad.
 * 3. Suma la evidencia de cada categoría con un léxico ponderado.
 * 4. Elige la categoría con más puntaje (en empate gana la de mayor riesgo).
 * 5. Calcula la prioridad partiendo de una base por categoría y aplicando
 *    reglas de escalamiento por impacto y urgencia.
 * 6. Devuelve una respuesta predeterminada según categoría y prioridad.
 */

const { normalize, detectManipulation } = require('../security');

// [expresión sobre texto normalizado, peso]
const LEXICON = {
  SECURITY: [
    [/\b(hack\w*|vulnerab\w*|exploit\w*|malware|ransomware|virus|troyano|phishing)\b/, 6],
    [/\b(fuga|filtracion|filtrad[oa]s?|robo|robad[oa]s?|expuest[oa]s?|exposicion)\b/, 5],
    [/\b(sin (mi )?autorizacion|no autorizad[oa]s?|accesos? sospechos[oa]s?|intrus\w*|suplant\w*)\b/, 6],
    [/\b(inyeccion sql|sql injection|xss|csrf|fuerza bruta|ddos)\b/, 6],
    [/\b(datos personales|datos de (los )?clientes|tarjetas?|informacion confidencial)\b/, 2],
    [/\b(seguridad|incidente|ataque|brecha)\b/, 3],
  ],
  ACCESS: [
    [/\b(iniciar sesion|inicio de sesion|login|log in|autentica\w*|2fa|doble factor|codigo de verificacion)\b/, 5],
    [/\b(contrasena|password|credenciales?|usuario)\b/, 3],
    [/\b(no puedo|no me deja|imposible) (entrar|acceder|ingresar)\b/, 5],
    [/\b(bloquead[oa]|bloqueo|acceso denegado|sin acceso|permisos?|restablecer|recuperar (mi )?cuenta)\b/, 3],
    [/\b(cuenta)\b/, 1],
  ],
  BUG: [
    [/\b(error|falla|fallo|bug|excepcion|crash)\b/, 4],
    [/\b(no funciona|dejo de funcionar|se cierra|se congela|se traba|no carga|no responde|pantalla en blanco)\b/, 5],
    [/\b(caid[oa]|lent[oa]|lentitud|intermitente|timeout|error \d{3})\b/, 3],
    [/\b(incorrect[oa]s?|duplicad[oa]s?|no se guarda|se borro|desaparec\w*)\b/, 3],
  ],
  FEATURE: [
    [/\b(me gustaria|seria (bueno|util|genial)|quisiera|propongo|sugiero|sugerencia|podrian)\b/, 5],
    [/\b(agregar|anadir|incluir|implementar|nueva? (funcion\w*|opcion|modulo|pantalla|reporte))\b/, 4],
    [/\b(mejora\w*|integracion|integrar|exportar|modo oscuro|personalizar)\b/, 3],
  ],
};

// En empate gana la categoría de mayor riesgo.
const TIE_BREAK = ['SECURITY', 'ACCESS', 'BUG', 'FEATURE'];

const BASE_PRIORITY = { SECURITY: 'HIGH', ACCESS: 'MEDIUM', BUG: 'MEDIUM', FEATURE: 'LOW' };

// Señales de impacto: elevan la prioridad.
const CRITICAL_SIGNALS = /\b(todos los usuarios|toda la empresa|produccion|sistema (completo )?caido|servicio caido|perdida de datos|cobros?|pagos?|ransomware|fuga|filtracion|robo|expuest[oa]s?|activamente|en curso)\b/;
const HIGH_SIGNALS = /\b(urgente|inmediato|varios usuarios|todo el equipo|clientes|no puedo trabajar|bloquea(do)? (mi|el) trabajo|desde hace (horas|dias)|nadie puede)\b/;
const LOW_SIGNALS = /\b(cuando puedan|no es urgente|detalle|cosmetic\w*|color|icono|tipografia|alineacion)\b/;

const ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const bump = (priority, steps) => ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(priority) + steps))];

const RESPONSES = {
  ACCESS: 'Lamentamos el inconveniente con su acceso. Verifique que su usuario esté escrito correctamente y utilice la opción "¿Olvidó su contraseña?". Por seguridad, nunca comparta su contraseña por este medio.',
  BUG: 'Gracias por reportar la falla. Registramos el caso para que el equipo técnico lo reproduzca; si es posible, indíquenos los pasos, la hora aproximada y el mensaje de error que aparece.',
  FEATURE: 'Gracias por su propuesta. La registramos como solicitud de mejora para que el equipo de producto evalúe su viabilidad y la considere en la planificación.',
  SECURITY: 'Hemos registrado su reporte como posible incidente de seguridad y lo escalamos a revisión humana. No comparta contraseñas ni datos sensibles por este canal; el equipo de seguridad le contactará.',
  UNKNOWN: 'Recibimos su mensaje, pero no pudimos identificar el tipo de solicitud. Un agente lo revisará para darle seguimiento.',
};

const TIMEFRAME = {
  LOW: 'Tiempo estimado de atención: hasta 5 días hábiles.',
  MEDIUM: 'Tiempo estimado de atención: 1 a 2 días hábiles.',
  HIGH: 'Su caso tiene prioridad alta y se atenderá el mismo día.',
  CRITICAL: 'Su caso es crítico y se atiende de inmediato.',
};

function scoreCategories(text) {
  const scores = {};
  for (const [category, rules] of Object.entries(LEXICON)) {
    scores[category] = rules.reduce((sum, [pattern, weight]) => sum + (pattern.test(text) ? weight : 0), 0);
  }
  return scores;
}

function pickCategory(scores) {
  const best = Math.max(...Object.values(scores));
  if (best === 0) return null;
  return TIE_BREAK.find((category) => scores[category] === best);
}

function computePriority(category, text) {
  let priority = BASE_PRIORITY[category];
  if (CRITICAL_SIGNALS.test(text)) priority = category === 'FEATURE' ? bump(priority, 1) : 'CRITICAL';
  else if (HIGH_SIGNALS.test(text)) priority = bump(priority, 1);
  else if (LOW_SIGNALS.test(text) && category !== 'SECURITY') priority = bump(priority, -1);

  // Una nueva funcionalidad no es un incidente: como máximo MEDIUM.
  if (category === 'FEATURE' && ORDER.indexOf(priority) > ORDER.indexOf('MEDIUM')) priority = 'MEDIUM';
  return priority;
}

function analyzeRules(message) {
  const text = normalize(message);

  if (detectManipulation(message)) {
    return {
      category: 'SECURITY',
      priority: 'CRITICAL',
      response: `${RESPONSES.SECURITY} ${TIMEFRAME.CRITICAL}`,
      requiresHumanReview: true,
      mode: 'traditional',
    };
  }

  const scores = scoreCategories(text);
  const category = pickCategory(scores);

  if (!category) {
    // Sin evidencia suficiente: se clasifica de forma conservadora y se envía a un humano.
    return {
      category: 'BUG',
      priority: 'LOW',
      response: RESPONSES.UNKNOWN,
      requiresHumanReview: true,
      mode: 'traditional',
    };
  }

  const priority = computePriority(category, text);
  const sorted = Object.values(scores).sort((a, b) => b - a);
  const ambiguous = sorted[0] - sorted[1] <= 1; // dos categorías casi empatadas

  return {
    category,
    priority,
    response: `${RESPONSES[category]} ${TIMEFRAME[priority]}`,
    requiresHumanReview: category === 'SECURITY' || priority === 'CRITICAL' || ambiguous,
    mode: 'traditional',
  };
}

/** Respuesta predeterminada para una categoría y prioridad (también la usa el motor ML). */
function defaultResponse(category, priority) {
  return `${RESPONSES[category]} ${TIMEFRAME[priority]}`;
}

module.exports = { analyzeRules, scoreCategories, computePriority, defaultResponse };
