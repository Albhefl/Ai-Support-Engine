#!/usr/bin/env node
'use strict';

/**
 * Requerimiento 5: ejecuta los casos de bench/cases.json con ambos motores y registra,
 * por motor: categoría, prioridad, si cumplió el formato del contrato y si fue correcto
 * (categoría y prioridad iguales a la referencia). Calcula el porcentaje de aciertos.
 *
 * Salidas: bench/results.json (respuestas completas) y bench/results.md (tabla).
 * Uso: npm run compare   (el motor generativo requiere GEMINI_API_KEY en .env)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createEngines } = require('../src/engines');
const { finalizeResult } = require('../src/contract');

const { cases } = require('./cases.json');
const engines = createEngines();
const MODES = ['traditional', 'generative'];
const PAUSE_MS = Number(process.env.BENCH_PAUSE_MS) || 1500; // evita el límite de peticiones del proveedor

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runCase(mode, testCase) {
  const started = Date.now();
  try {
    const raw = await engines[mode](testCase.message);
    const result = finalizeResult(raw, mode);
    const categoryOk = result.category === testCase.expected.category;
    return {
      ...result,
      ...(raw.model ? { model: raw.model } : {}),
      formatOk: true,
      categoryOk,
      correct: categoryOk && result.priority === testCase.expected.priority,
      ms: Date.now() - started,
    };
  } catch (err) {
    return { error: err.code || err.name, formatOk: false, categoryOk: false, correct: false, ms: Date.now() - started };
  }
}

async function main() {
  const rows = [];
  for (const testCase of cases) {
    const row = { ...testCase, results: {} };
    for (const mode of MODES) {
      row.results[mode] = await runCase(mode, testCase);
      if (mode === 'generative') await sleep(PAUSE_MS);
    }
    rows.push(row);
    const t = row.results.traditional;
    const g = row.results.generative;
    console.log(
      `${testCase.id.padEnd(3)} ref=${testCase.expected.category}/${testCase.expected.priority} | ` +
        `trad=${t.category || t.error}/${t.priority || '-'} ${t.correct ? '✔' : '✘'} | ` +
        `gen=${g.category || g.error}/${g.priority || '-'} ${g.correct ? '✔' : '✘'}`,
    );
  }

  const summary = {};
  for (const mode of MODES) {
    const results = rows.map((r) => r.results[mode]);
    const count = (key) => results.filter((r) => r[key]).length;
    summary[mode] = {
      correct: count('correct'),
      categoryOk: count('categoryOk'),
      formatOk: count('formatOk'),
      total: results.length,
      accuracy: +((count('correct') / results.length) * 100).toFixed(1),
      avgMs: Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length),
    };
  }

  const meta = {
    executedAt: new Date().toISOString(),
    node: process.version,
    generativeModels: process.env.GEMINI_API_KEY
      ? [...new Set(rows.map((r) => r.results.generative.model).filter(Boolean))]
      : null,
  };
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ meta, summary, rows }, null, 2) + '\n');

  const mark = (ok) => (ok ? 'Sí' : 'No');
  const cell = (r) => (r.error ? `error: ${r.error}` : `${r.category} / ${r.priority}`);
  const lines = [
    `Ejecución: ${meta.executedAt} · Node ${meta.node} · modelo(s) generativo(s): ${meta.generativeModels ? meta.generativeModels.join(', ') || 'ninguno respondió' : 'no configurado'}`,
    '',
    '| # | Tipo | Referencia | Tradicional | Formato | Correcto | Generativo | Formato | Correcto |',
    '|---|---|---|---|:-:|:-:|---|:-:|:-:|',
    ...rows.map((r) => {
      const t = r.results.traditional;
      const g = r.results.generative;
      return `| ${r.id} | ${r.type} | ${r.expected.category} / ${r.expected.priority} | ${cell(t)} | ${mark(t.formatOk)} | ${mark(t.correct)} | ${cell(g)} | ${mark(g.formatOk)} | ${mark(g.correct)} |`;
    }),
    '',
    '| Motor | Correctos (cat. + prioridad) | Solo categoría | Formato válido | Latencia promedio |',
    '|---|:-:|:-:|:-:|:-:|',
    ...MODES.map((m) => {
      const s = summary[m];
      return `| ${m} | ${s.correct}/${s.total} (**${s.accuracy}%**) | ${s.categoryOk}/${s.total} | ${s.formatOk}/${s.total} | ${s.avgMs} ms |`;
    }),
  ];
  fs.writeFileSync(path.join(__dirname, 'results.md'), lines.join('\n') + '\n');

  console.log('\n' + lines.slice(-4).join('\n'));
}

main().catch((err) => {
  console.error('Fallo en el benchmark:', err.code || err.name);
  process.exitCode = 1;
});
