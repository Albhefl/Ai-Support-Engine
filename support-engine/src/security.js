'use strict';

/**
 * Utilidades de seguridad compartidas por los motores y la API.
 */

/** Minúsculas, sin acentos y con espacios simples, para comparar patrones. */
function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Frases típicas de manipulación (prompt injection) sobre el texto normalizado.
const MANIPULATION_PATTERNS = [
  /\b(ignora|olvida|omite|descarta|desobedece)\b.{0,40}\b(instrucciones|reglas|indicaciones|politicas|prompt)\b/,
  /\b(ignore|disregard|forget)\b.{0,40}\b(instructions|rules|prompt)\b/,
  /\b(clasifica|marca|pon|asigna|cataloga)(lo|la|le)?\b.{0,60}\b(prioridad )?(baja|low|minima|sin importancia)\b/,
  /\b(no|nunca)\b.{0,15}\b(lo )?(reportes|escales|notifiques|avises)\b/,
  /\b(actua|finge|haz de cuenta|eres ahora|a partir de ahora eres)\b.{0,40}\b(como|que eres|un|una)\b/,
  /\b(revela|muestra|imprime|dime)\b.{0,30}\b(prompt|instrucciones del sistema|system prompt|tus reglas)\b/,
  /\b(modo desarrollador|developer mode|jailbreak)\b/,
];

/** true si el mensaje intenta dar órdenes al clasificador en lugar de describir un problema. */
function detectManipulation(text) {
  const normalized = normalize(text);
  return MANIPULATION_PATTERNS.some((pattern) => pattern.test(normalized));
}

// Valores que parecen secretos: no deben enviarse al proveedor ni escribirse en logs.
const SECRET_PATTERNS = [
  [/\b(AIza[0-9A-Za-z_-]{20,})\b/g, '[CLAVE_REDACTADA]'],
  [/\b(sk-[A-Za-z0-9_-]{16,})\b/g, '[CLAVE_REDACTADA]'],
  [/\b(gh[pousr]_[A-Za-z0-9]{20,})\b/g, '[TOKEN_REDACTADO]'],
  [/\b(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, '[JWT_REDACTADO]'],
  [/((?:contrase[nñ]a|password|clave|pwd|token)\s*(?:es|:|=)\s*)(\S+)/gi, '$1[REDACTADO]'],
];

/** Reemplaza posibles credenciales del texto por marcadores. */
function redactSecrets(text) {
  return SECRET_PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), String(text));
}

module.exports = { normalize, detectManipulation, redactSecrets };
