function exerciseLibrary(){
 const m=new Map();
 BUILTIN_ROUTINE_IDS.forEach(rid=>ROUTINES[rid].exercises.forEach(ex=>{if(!m.has(ex.id))m.set(ex.id,clone(ex))}));
 return [...m.values()]
}
function persistentRestState(rid){
 const r=ROUTINES[rid],cfg=data.restSettings[rid]||{};
 return{
  restMap:{...defaultRestMap(r),...(cfg.restMap||{})},
  blockRest:Number(cfg.blockRest??r.blockRest??120),
  linearSetRest:Number(cfg.linearSetRest??r.setRest??90),
  linearExerciseRest:Number(cfg.linearExerciseRest??r.exerciseRest??90)
 }
}
function applyPlanState(rid,state,scope){
 const r=ROUTINES[rid],payload={
  order:[...state.order],
  restMap:{...state.restMap},
  blockRest:Number(state.blockRest),
  linearSetRest:Number(state.linearSetRest),
  linearExerciseRest:Number(state.linearExerciseRest)
 };
 if(scope==='future'){
  data.orders[rid]=[...payload.order];
  data.restSettings[rid]={restMap:{...payload.restMap},blockRest:payload.blockRest,linearSetRest:payload.linearSetRest,linearExerciseRest:payload.linearExerciseRest}
 }
 const d=data.drafts[rid];
 if(d){
  d.order=[...payload.order];d.restMap={...payload.restMap};d.blockRest=payload.blockRest;d.linearSetRest=payload.linearSetRest;d.linearExerciseRest=payload.linearExerciseRest;
  r.exercises.forEach(ex=>{const st=d.exercises[ex.id];if(st&&!st.timerActive)st.remaining=payload.restMap[ex.id]??ex.rest??90})
 }else if(scope==='once'){
  data.nextOverrides[rid]=payload
 }
 save();renderChooser();if(activeRoutineId===rid&&data.drafts[rid])renderSession();if(typeof refreshScheduleRoutineOptions==='function')refreshScheduleRoutineOptions()
}
function askPlanScope(rid,state){
 const old=document.getElementById('planScopeOverlay');if(old)old.remove();
 const overlay=document.createElement('div');overlay.id='planScopeOverlay';overlay.className='editor-overlay';
 const box=document.createElement('div');box.className='scope-card';
 const targetText=data.drafts[rid]?'esta sesión':'el próximo entrenamiento';box.innerHTML='<div class="eyebrow">GUARDAR CAMBIOS</div><div class="title">¿Cómo quieres aplicar este plan?</div><div class="sub scope-copy">Puedes usar este orden y estos descansos solo en '+targetText+', o dejarlos como configuración habitual de esta rutina.</div><button class="scope-future">Guardar también para futuros entrenamientos</button><button class="scope-once">Solo para este entrenamiento</button><button class="scope-cancel">Cancelar</button>';
 overlay.appendChild(box);document.body.appendChild(overlay);document.body.classList.add('modal-open');
 const close=()=>{overlay.remove();document.body.classList.remove('modal-open')};
 box.querySelector('.scope-future').onclick=()=>{applyPlanState(rid,state,'future');close();toast('Plan guardado para futuras sesiones')};
 box.querySelector('.scope-once').onclick=()=>{applyPlanState(rid,state,'once');close();toast(data.drafts[rid]?'Cambios aplicados a esta sesión':'Cambios listos para el próximo entrenamiento')};
 box.querySelector('.scope-cancel').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()}
}
function attachPlanDrag(handle,row,list,onChange){
 let timer=null,drag=false,startY=0,touchId=null;
 const clear=()=>{if(timer){clearTimeout(timer);timer=null}};
 function begin(y,id){clear();startY=y;touchId=id;timer=setTimeout(()=>{drag=true;row.classList.add('dragging')},180)}
 function move(x,y){
  if(!drag){if(Math.abs(y-startY)>10)clear();return}
  const hit=document.elementFromPoint(x,y)?.closest('.plan-edit-row');if(!hit||hit===row||!list.contains(hit))return;
  const rect=hit.getBoundingClientRect();list.insertBefore(row,y<rect.top+rect.height/2?hit:hit.nextSibling)
 }
 function end(){clear();if(drag){row.classList.remove('dragging');drag=false;onChange()}}
 handle.addEventListener('contextmenu',e=>e.preventDefault());
 handle.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;e.preventDefault();const t=e.touches[0];begin(t.clientY,t.identifier)},{passive:false});
 handle.addEventListener('touchmove',e=>{const t=[...e.touches].find(x=>x.identifier===touchId)||e.touches[0];if(!t)return;e.preventDefault();move(t.clientX,t.clientY)},{passive:false});
 handle.addEventListener('touchend',e=>{e.preventDefault();end()},{passive:false});handle.addEventListener('touchcancel',end,{passive:false});
 handle.addEventListener('mousedown',e=>{if(e.button!==0)return;e.preventDefault();begin(e.clientY,'mouse');const mm=ev=>{ev.preventDefault();move(ev.clientX,ev.clientY)},mu=ev=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);end()};document.addEventListener('mousemove',mm,{passive:false});document.addEventListener('mouseup',mu)})
}
function renderRoutinePlanPreview(rid,container){
 const r=ROUTINES[rid],rest=persistentRestState(rid),draft=data.drafts[rid],next=data.nextOverrides[rid],state={order:[...(draft?.order||next?.order||data.orders[rid]||r.exercises.map(e=>e.id))],restMap:{...rest.restMap,...(next?.restMap||{}),...(draft?.restMap||{})},blockRest:Number(draft?.blockRest??next?.blockRest??rest.blockRest),linearSetRest:Number(draft?.linearSetRest??next?.linearSetRest??rest.linearSetRest),linearExerciseRest:Number(draft?.linearExerciseRest??next?.linearExerciseRest??rest.linearExerciseRest)};
 container.innerHTML='';
 const intro=document.createElement('div');intro.className='plan-summary';
 intro.innerHTML='<div><b>Flujo:</b> '+(r.mode==='linear'?'Ejercicio por ejercicio':r.flow)+'</div>'+(r.setup?'<div><b>Setup:</b> '+r.setup+'</div>':'')+'<div class="drag-hint"><b>⠿</b> Mantén pulsado y arrastra para cambiar el orden.</div>';
 if(next&&!draft){const note=document.createElement('div');note.className='next-plan-note';note.textContent='Este orden/descanso se usará solo en el próximo entrenamiento.';container.appendChild(note)}container.appendChild(intro);
 if(r.mode==='linear'){
  const rests=document.createElement('div');rests.className='plan-rest-grid';
  rests.innerHTML='<label><span>Entre series</span><input type="number" min="0" step="5" data-set-rest value="'+state.linearSetRest+'"></label><label><span>Entre ejercicios</span><input type="number" min="0" step="5" data-ex-rest value="'+state.linearExerciseRest+'"></label>';
  rests.querySelector('[data-set-rest]').oninput=e=>state.linearSetRest=Math.max(0,Number(e.target.value)||0);
  rests.querySelector('[data-ex-rest]').oninput=e=>state.linearExerciseRest=Math.max(0,Number(e.target.value)||0);
  container.appendChild(rests)
 }
 const list=document.createElement('div');list.className='plan-edit-list';container.appendChild(list);
 function syncOrder(){state.order=[...list.querySelectorAll('.plan-edit-row')].map(x=>x.dataset.eid)}
 state.order.forEach((eid,i)=>{
  const ex=findExercise(rid,eid);if(!ex)return;const row=document.createElement('div');row.className='plan-edit-row';row.dataset.eid=eid;
  const handle=document.createElement('button');handle.className='plan-drag';handle.type='button';handle.textContent='⠿';
  const info=document.createElement('div');info.className='plan-edit-info';info.innerHTML='<b>'+(ex.code||i+1)+' · '+ex.name+'</b><span>'+ex.sets+'×'+ex.min+'–'+ex.max+'</span>';
  row.append(handle,info);
  if(r.mode!=='linear'){
   const field=document.createElement('label');field.className='plan-rest-field';const between=String(ex.code).endsWith('1')?'Entre ejercicios':'Entre series/rondas';
   field.innerHTML='<span>'+between+'</span><input type="number" min="0" step="5" value="'+(state.restMap[eid]??ex.rest??90)+'">';
   field.querySelector('input').oninput=e=>state.restMap[eid]=Math.max(0,Number(e.target.value)||0);row.appendChild(field)
  }
  list.appendChild(row);attachPlanDrag(handle,row,list,syncOrder)
 });
 if(r.mode!=='linear'){
  const block=document.createElement('label');block.className='plan-block-rest';block.innerHTML='<span>Descanso entre bloques</span><input type="number" min="0" step="5" value="'+state.blockRest+'"><em>seg</em>';
  block.querySelector('input').oninput=e=>state.blockRest=Math.max(0,Number(e.target.value)||0);container.appendChild(block)
 }
 const saveBtn=document.createElement('button');saveBtn.className='plan-save';saveBtn.textContent='Guardar orden y descansos';saveBtn.onclick=()=>{syncOrder();askPlanScope(rid,state)};container.appendChild(saveBtn)
}
function customRoutineCard(){
 const card=document.createElement('button');card.type='button';card.className='routine-card create-routine-card';
 card.innerHTML='<div class="create-plus">＋</div><div><div class="routine-name">Crear nueva rutina</div><div class="sub">Combina los ejercicios de tu plan y define tus descansos.</div></div>';
 card.onclick=openRoutineBuilder;return card
}
function openRoutineBuilder(){
 const old=document.getElementById('routineBuilderOverlay');if(old)old.remove();
 const overlay=document.createElement('div');overlay.id='routineBuilderOverlay';overlay.className='editor-overlay';
 const sheet=document.createElement('div');sheet.className='editor-sheet routine-builder-sheet';
 sheet.innerHTML='<div class="editor-head"><div><div class="eyebrow">NUEVA RUTINA</div><div class="title">Creador de rutinas</div></div><button class="editor-close">×</button></div><div class="editor-body"><label class="builder-field"><span>Nombre</span><input id="builderName" type="text" placeholder="Ej. Torso corto"></label><div class="plan-rest-grid"><label><span>Descanso entre series</span><input id="builderSetRest" type="number" min="0" step="5" value="90"></label><label><span>Descanso entre ejercicios</span><input id="builderExRest" type="number" min="0" step="5" value="90"></label></div><div class="section">ELIGE LOS EJERCICIOS</div><div id="builderExercises" class="builder-exercises"></div><div class="editor-footer"><button class="editor-cancel">Cancelar</button><button class="editor-save">Crear rutina</button></div></div>';
 overlay.appendChild(sheet);document.body.appendChild(overlay);document.body.classList.add('modal-open');
 const lib=exerciseLibrary(),holder=sheet.querySelector('#builderExercises');
 lib.forEach(ex=>{const label=document.createElement('label');label.className='builder-exercise';label.innerHTML='<input type="checkbox" value="'+ex.id+'"><span><b>'+ex.name+'</b><small>'+ex.sets+'×'+ex.min+'–'+ex.max+'</small></span>';holder.appendChild(label)});
 const close=()=>{overlay.remove();document.body.classList.remove('modal-open')};sheet.querySelector('.editor-close').onclick=close;sheet.querySelector('.editor-cancel').onclick=close;
 sheet.querySelector('.editor-save').onclick=()=>{
  const name=sheet.querySelector('#builderName').value.trim(),ids=[...holder.querySelectorAll('input:checked')].map(x=>x.value),setRest=Math.max(0,Number(sheet.querySelector('#builderSetRest').value)||0),exerciseRest=Math.max(0,Number(sheet.querySelector('#builderExRest').value)||0);
  if(!name)return toast('Ponle un nombre a la rutina');if(!ids.length)return toast('Elige al menos un ejercicio');
  const id='custom_'+Date.now(),library=new Map(lib.map(x=>[x.id,x])),exercises=ids.map((eid,i)=>{const b=clone(library.get(eid));return{...b,code:String(i+1),pair:'',rest:setRest,restLabel:setRest+' s entre series'}});
  const routine={id,day:'PERSONALIZADA',name,duration:'Personalizada',warmup:'6–8 min',rir:'RIR 1–2',mode:'linear',custom:true,setRest,exerciseRest,blockRest:exerciseRest,flow:'Ejercicio por ejercicio',setup:'',between:'',exercises};
  data.customRoutines[id]=routine;registerCustomRoutine(routine);data.orders[id]=exercises.map(e=>e.id);data.restSettings[id]={restMap:defaultRestMap(routine),blockRest:exerciseRest,linearSetRest:setRest,linearExerciseRest:exerciseRest};save();close();renderChooser();if(typeof refreshScheduleRoutineOptions==='function')refreshScheduleRoutineOptions();toast('Rutina creada')
 }
}