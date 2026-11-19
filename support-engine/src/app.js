'use strict';

const express = require('express');
const { parseAnalyzeRequest, finalizeResult, ContractError } = require('./contract');
const { createEngines } = require('./engines');

// Mensajes públicos por código de error del proveedor. Nunca se expone el detalle técnico.
const PROVIDER_ERRORS = {
  NOT_CONFIGURED: [503, 'El motor generativo no está configurado en el servidor.'],
  TIMEOUT: [504, 'El proveedor de IA tardó demasiado en responder. Intente de nuevo.'],
  HTTP_429: [503, 'El proveedor de IA está saturado. Intente de nuevo en unos momentos.'],
  ML_NOT_TRAINED: [503, 'El modelo de Machine Learning no está entrenado. Ejecute python ml/train.py.'],
};
const DEFAULT_PROVIDER_ERROR = [502, 'No fue posible obtener una respuesta válida del proveedor de IA.'];

function createApp({ engines = createEngines(), logger = console } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/analyze', async (req, res) => {
    let input;
    try {
      input = parseAnalyzeRequest(req.body);
    } catch (err) {
      return res.status(400).json({ error: 'Solicitud inválida', details: err.details });
    }

    const started = Date.now();
    try {
      const raw = await engines[input.mode](input.message);
      const result = finalizeResult(raw, input.mode);
      logger.info?.(`[analyze] mode=${input.mode} category=${result.category} priority=${result.priority} ms=${Date.now() - started}`);
      return res.json(result);
    } catch (err) {
      // Solo se registra el código del error; nunca el mensaje del usuario ni la API key.
      logger.error?.(`[analyze] mode=${input.mode} error=${err.code || err.name}`);
      if (err instanceof ContractError) {
        return res.status(502).json({ error: 'El motor devolvió una respuesta con formato inválido.' });
      }
      const [status, message] = PROVIDER_ERRORS[err.code] || DEFAULT_PROVIDER_ERROR;
      return res.status(status).json({ error: message });
    }
  });

  app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo no es un JSON válido' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande' });
    logger.error?.(`[server] ${err.name}`);
    return res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { createApp };
