'use strict';

const { analyzeRules } = require('./rules');
const { createGenerativeEngine } = require('./generative');
const { analyzeML } = require('./ml');

/** Registro de motores disponibles por modo. Todos son async (message) => resultado. */
function createEngines(overrides = {}) {
  return {
    traditional: async (message) => analyzeRules(message),
    generative: createGenerativeEngine(),
    ml: async (message) => analyzeML(message),
    ...overrides,
  };
}

module.exports = { createEngines };
