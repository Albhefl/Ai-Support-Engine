// VERSIÓN CON DEFECTOS DELIBERADOS. Modifique este archivo, no borre casos del evaluador.
export function validateDraft(raw, inspection) {
 if(!raw||typeof raw.resumen!=='string'||!Array.isArray(raw.hallazgos)||!Array.isArray(raw.datosFaltantes))throw new Error('INVALID_SHAPE');
 return structuredClone(raw);
}
export async function generateDraft(store,id,provider) {
 const snapshot=store.beginRequest(id);
 store.update(id,{observaciones:[],manualNotes:'',savedReport:null});
 try {
  const payload=validateDraft(await provider.generate(snapshot),snapshot);
  store.update(id,{draft:{payload,sourceRevision:snapshot.revision,requestId:snapshot.requestId},savedReport:payload,aiState:'ready'});
  return {ok:true};
 }catch(error){store.update(id,{aiState:'error'});return {ok:false,error:error.message};}
}
export function confirmDraft(store,id){return store.confirm(id);}
export function recoverRelease(state,release) {
 state.serverVersion=release.id;
 state.records=[];
 return state;
}
