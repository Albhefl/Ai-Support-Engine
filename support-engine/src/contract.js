'use strict';

/**
 * Contrato único de entrada y salida de POST /api/analyze.
 * Todos los motores deben devolver exactamente esta forma:
 *   { category, priority, response, requiresHumanReview, mode }
 */

const CATEGORIES = Object.freeze(['ACCESS', 'BUG', 'FEATURE', 'SECURITY']);
const PRIORITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const MODES = Object.freeze(['traditional', 'generative']);

const MAX_MESSAGE_LENGTH = 2000;
const MAX_RESPONSE_LENGTH = 1200;

class ContractError extends Error {
  constructor(code, details) {
    super(code);
    this.name = 'ContractError';
    this.code = code;
    this.details = details;
  }
}

/** Valida el cuerpo de la petición. Devuelve { message, mode } o lanza ContractError. */
function parseAnalyzeRequest(body) {
  const problems = [];

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ContractError('INVALID_REQUEST', ['El cuerpo debe ser un objeto JSON']);
  }

  const allowed = new Set(['message', 'mode']);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length > 0) problems.push(`Campos no permitidos: ${unknown.join(', ')}`);

  const { message, mode } = body;
  if (typeof message !== 'string') {
    problems.push('"message" es obligatorio y debe ser una cadena de texto');
  } else if (message.trim() === '') {
    problems.push('"message" no puede estar vacío');
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    problems.push(`"message" admite como máximo ${MAX_MESSAGE_LENGTH} caracteres`);
  }

  if (!MODES.includes(mode)) {
    problems.push(`"mode" debe ser uno de: ${MODES.join(', ')}`);
  }

  if (problems.length > 0) throw new ContractError('INVALID_REQUEST', problems);
  return { message: message.trim(), mode };
}

/**
 * Comprueba que el resultado de un motor cumpla el contrato y aplica la
 * política de seguridad común a todos los motores:
 *   - SECURITY siempre requiere revisión humana.
 * Devuelve un objeto nuevo solo con las llaves del contrato.
 */
function finalizeResult(result, mode) {
  const problems = [];
  if (result === null || typeof result !== 'object' || Array.isArray(result)) {
    throw new ContractError('INVALID_ENGINE_OUTPUT', ['La salida no es un objeto']);
  }
  if (!CATEGORIES.includes(result.category)) problems.push('category inválida');
  if (!PRIORITIES.includes(result.priority)) problems.push('priority inválida');
  if (typeof result.response !== 'string' || result.response.trim() === '') {
    problems.push('response debe ser texto no vacío');
  } else if (result.response.length > MAX_RESPONSE_LENGTH) {
    problems.push('response demasiado larga');
  }
  if (typeof result.requiresHumanReview !== 'boolean') problems.push('requiresHumanReview debe ser booleano');
  if (problems.length > 0) throw new ContractError('INVALID_ENGINE_OUTPUT', problems);

  return {
    category: result.category,
    priority: result.priority,
    response: result.response.trim(),
    requiresHumanReview: result.category === 'SECURITY' ? true : result.requiresHumanReview,
    mode,
  };
}

module.exports = {
  CATEGORIES,
  PRIORITIES,
  MODES,
  MAX_MESSAGE_LENGTH,
  MAX_RESPONSE_LENGTH,
  ContractError,
  parseAnalyzeRequest,
  finalizeResult,
};
