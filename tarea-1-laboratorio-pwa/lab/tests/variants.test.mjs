// Variantes breves agregadas por el equipo dentro de los incidentes explicados.
// No reemplazan ni debilitan los escenarios publicados en tests/scenarios.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createStore} from '../lib/store.mjs';
import {inspection,validDraft,releaseState,stableRelease,deferred,provider} from '../lib/fixtures.mjs';
const m=await import(pathToFileURL(resolve(process.env.LAB_TARGET||'src/implementation.mjs')).href);

test('C-V1 cita vacía o de otra observación se rechaza', () => {
 const vacia=validDraft();vacia.hallazgos[0].cita='';
 assert.throws(()=>m.validateDraft(vacia,inspection()));
 const cruzada=validDraft();cruzada.hallazgos[0]={observacionId:'O-2',cita:'La lámpara parpadea.'};
 assert.throws(()=>m.validateDraft(cruzada,inspection()));
});

test('D-V1 proveedor con cita inventada no crea borrador ni toca lo confirmado', async () => {
 const original={...inspection(),savedReport:{resumen:'Confirmado'}};const s=createStore([original]);
 assert.equal((await m.generateDraft(s,'I-10',provider('invented'))).ok,false);
 const after=s.read('I-10');assert.equal(after.draft,null);assert.deepEqual(after.savedReport,original.savedReport);assert.equal(after.aiState,'error');
});

test('R-V1 confirmar un borrador vuelto obsoleto por una edición falla sin guardar', async () => {
 const s=createStore([inspection()]);await m.generateDraft(s,'I-10',provider());
 s.edit('I-10',{manualNotes:'Cambio posterior'});
 assert.throws(()=>m.confirmDraft(s,'I-10'));assert.equal(s.read('I-10').savedReport,null);
});

test('R-V2 error de la solicitud vigente sí marca error tras una antigua exitosa', async () => {
 const s=createStore([inspection()]);const a=deferred(),b=deferred();
 const first=m.generateDraft(s,'I-10',{generate:()=>a.promise});const second=m.generateDraft(s,'I-10',{generate:()=>b.promise});
 a.resolve(validDraft());assert.equal((await first).ok,false);
 b.reject(new Error('PROVIDER_UNAVAILABLE'));assert.equal((await second).ok,false);
 assert.equal(s.read('I-10').aiState,'error');assert.equal(s.read('I-10').draft,null);
});

test('L-V1 release destino sin metadatos se rechaza sin mutar el estado', () => {
 const state=releaseState();const before=structuredClone(state);
 assert.throws(()=>m.recoverRelease(state,{id:'A'}));assert.deepEqual(state,before);
 assert.ok(stableRelease.supportedSchemas.includes(state.schemaVersion));
});
