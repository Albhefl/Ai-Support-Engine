'use strict';

require('dotenv').config();
const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;
const app = createApp();

app.listen(port, () => {
  const generative = process.env.GEMINI_API_KEY ? 'configurado' : 'SIN CONFIGURAR (falta GEMINI_API_KEY)';
  console.log(`Support Engine en http://localhost:${port} · motor generativo: ${generative}`);
});
