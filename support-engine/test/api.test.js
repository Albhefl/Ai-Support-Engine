'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app');
const { createEngines } = require('../src/engines');
const { ProviderError } = require('../src/engines/generative');

const silent = { info() {}, error() {} };

async function withServer(engines, fn) {
  const server = createApp({ engines: createEngines(engines), logger: silent }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

const post = (base, body, raw) =>
  fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ?? JSON.stringify(body),
  });

test('modo traditional responde con el contrato completo', async () => {
  await withServer({}, async (base) => {
    const res = await post(base, { message: 'No puedo iniciar sesión', mode: 'traditional' });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(Object.keys(body).sort(), ['category', 'mode', 'priority', 'requiresHumanReview', 'response']);
    assert.equal(body.mode, 'traditional');
  });
});

test('validaciones: 400 para JSON mal formado, mensaje vacío y modo inválido; 413 para cuerpo grande', async () => {
  await withServer({}, async (base) => {
    assert.equal((await post(base, null, '{mal json')).status, 400);
    assert.equal((await post(base, { message: '', mode: 'traditional' })).status, 400);
    assert.equal((await post(base, { message: 'hola', mode: 'otro' })).status, 400);
    assert.equal((await post(base, { message: 'x'.repeat(20000), mode: 'traditional' })).status, 413);
  });
});

test('errores del proveedor se traducen a mensajes genéricos sin filtrar detalles', async () => {
  const cases = [
    ['NOT_CONFIGURED', 503],
    ['TIMEOUT', 504],
    ['HTTP_403', 502],
    ['INVALID_JSON', 502],
  ];
  for (const [code, status] of cases) {
    await withServer({ generative: async () => { throw new ProviderError(code, 'detalle-interno'); } }, async (base) => {
      const res = await post(base, { message: 'hola', mode: 'generative' });
      assert.equal(res.status, status, code);
      const text = await res.text();
      assert.ok(!text.includes('detalle-interno'));
    });
  }
});

test('salida de motor fuera de contrato => 502', async () => {
  await withServer({ generative: async () => ({ category: 'OTRA' }) }, async (base) => {
    assert.equal((await post(base, { message: 'hola', mode: 'generative' })).status, 502);
  });
});

test('SECURITY siempre llega con requiresHumanReview=true aunque el motor diga false', async () => {
  const engine = async () => ({ category: 'SECURITY', priority: 'HIGH', response: 'Revisaremos el caso.', requiresHumanReview: false });
  await withServer({ generative: engine }, async (base) => {
    const body = await (await post(base, { message: 'me hackearon', mode: 'generative' })).json();
    assert.equal(body.requiresHumanReview, true);
  });
});
