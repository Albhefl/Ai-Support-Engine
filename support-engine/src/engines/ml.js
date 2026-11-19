'use strict';

/**
 * Motor de Machine Learning supervisado (mode: "ml").
 *
 * El modelo se entrena en Python con scikit-learn (ml/train.py) y sus
 * parámetros se exportan a ml/model.json. Aquí se reproduce la inferencia:
 *
 *   1. Tokenización igual a TfidfVectorizer: minúsculas y token_pattern (?u)\b\w\w+\b
 *   2. N-gramas de palabras (1 y 2) buscados en el vocabulario aprendido
 *   3. TF (conteo) × IDF y normalización L2
 *   4. Puntaje lineal por clase (coef · x + intercept) y softmax
 *
 * El modelo predice solo la CATEGORÍA. Para cumplir el mismo contrato, la
 * prioridad y la respuesta predeterminada se calculan con las reglas del
 * motor tradicional. test/ml.test.js comprueba que las probabilidades
 * coincidan con las de scikit-learn.
 */

const fs = require('fs');
const path = require('path');
const { normalize, detectManipulation } = require('../security');
const { computePriority, defaultResponse } = require('./rules');

const MODEL_PATH = path.join(__dirname, '..', '..', 'ml', 'model.json');
// Con 4 clases el azar es 0.25; por debajo de este valor el modelo no tiene
// una preferencia clara y el caso se envía a revisión humana.
const MIN_CONFIDENCE = 0.35;

// Equivalente a (?u)\b\w\w+\b de Python: 2 o más caracteres de palabra Unicode seguidos.
const TOKEN = /[\p{L}\p{N}\p{M}_]{2,}/gu;

let model = null;

function loadModel(file = MODEL_PATH) {
  if (model) return model;
  if (!fs.existsSync(file)) {
    throw Object.assign(new Error('ml/model.json no existe'), { code: 'ML_NOT_TRAINED' });
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { vectorizer: v, classifier: c } = data;
  const supported =
    v.tokenPattern === '(?u)\\b\\w\\w+\\b' && v.norm === 'l2' && v.lowercase === true &&
    c.coef.length === c.classes.length && c.intercept.length === c.classes.length;
  if (!supported) throw Object.assign(new Error('Formato de modelo no soportado'), { code: 'ML_INVALID_MODEL' });
  model = data;
  return model;
}

function vectorize(text, { vocabulary, idf, ngramRange: [minN, maxN] }) {
  const tokens = text.toLowerCase().match(TOKEN) || [];
  const counts = new Map();
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const index = vocabulary[tokens.slice(i, i + n).join(' ')];
      if (index !== undefined) counts.set(index, (counts.get(index) || 0) + 1);
    }
  }
  const weights = [...counts].map(([index, tf]) => [index, tf * idf[index]]);
  const norm = Math.hypot(...weights.map(([, w]) => w));
  return norm > 0 ? weights.map(([index, w]) => [index, w / norm]) : weights;
}

/** Probabilidad de cada clase, en el orden de model.classifier.classes. */
function predictProba(text) {
  const { vectorizer, classifier } = loadModel();
  const x = vectorize(String(text), vectorizer);
  const scores = classifier.coef.map((row, k) => x.reduce((sum, [i, w]) => sum + row[i] * w, classifier.intercept[k]));
  const max = Math.max(...scores);
  const exp = scores.map((s) => Math.exp(s - max));
  const total = exp.reduce((a, b) => a + b, 0);
  return exp.map((e) => e / total);
}

function analyzeML(message) {
  const { classifier } = loadModel();
  const proba = predictProba(message);
  const best = proba.indexOf(Math.max(...proba));
  const category = classifier.classes[best];
  const confidence = proba[best];
  const priority = computePriority(category, normalize(message));

  return {
    category,
    priority,
    response: defaultResponse(category, priority),
    requiresHumanReview: category === 'SECURITY' || confidence < MIN_CONFIDENCE || detectManipulation(message),
    mode: 'ml',
    confidence, // informativo; el contrato público lo descarta
  };
}

module.exports = { analyzeML, predictProba, loadModel, MIN_CONFIDENCE };
