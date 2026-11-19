'use strict';

const { analyzeRules } = require('./rules');
const { createGenerativeEngine } = require('./generative');

/** Registro de motores disponibles por modo. Todos son async (message) => resultado. */
function createEngines(overrides = {}) {
  return {
    traditional: async (message) => analyzeRules(message),
    generative: createGenerativeEngine(),
    ...overrides,
  };
}

module.exports = { createEngines };
