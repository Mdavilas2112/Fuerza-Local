const routineChooser=document.getElementById('routineChooser'),sessionView=document.getElementById('sessionView'),routineCards=document.getElementById('routineCards'),draftBanner=document.getElementById('draftBanner'),exerciseList=document.getElementById('exerciseList'),finishedSection=document.getElementById('finishedSection'),finishedList=document.getElementById('finishedList'),orderSection=document.getElementById('orderSection'),orderList=document.getElementById('orderList');
function showChooser(){activeRoutineId=null;sessionView.classList.add('hidden');routineChooser.classList.remove('hidden');orderSection.classList.add('hidden');document.getElementById('sessionTopActions')?.classList.add('hidden');renderChooser()}
function renderChooser(){
 routineCards.innerHTML='';draftBanner.innerHTML='';const drafts=Object.keys(data.drafts).filter(id=>ROUTINES[id]);
 if(drafts.length){const box=document.createElement('div');box.className='card summary active-banner';box.innerHTML='<div class="eyebrow">SESIONES EN CURSO</div><div class="sub" style="margin-top:5px">Tienes '+drafts.length+' borrador'+(drafts.length>1?'es':'')+'. Puedes continuar cuando quieras.</div>';draftBanner.appendChild(box)}
 ROUTINE_IDS.forEach(rid=>{
  const r=ROUTINES[rid],draft=data.drafts[rid],last=lastRoutineSession(rid),b=document.createElement('div');b.className='routine-card';const lastTxt=last?'Última: '+fmtDate(last.startedAt):'Sin sesiones previas';
  b.innerHTML='<div class="routine-top"><div><div class="day">'+r.day+'</div><div class="routine-name">'+r.name+'</div><div class="sub">'+r.exercises.length+' ejercicios · '+r.duration+'</div></div><span class="chip">'+(draft?(draft.paused?'PAUSADA':'EN CURSO'):lastTxt)+'</span></div><div class="routine-meta"><span class="chip">Calentamiento '+r.warmup+'</span><span class="chip">'+r.rir+'</span></div><div class="actions"><button class="cta" data-start>'+(draft?'Continuar':'Empezar')+'</button><button class="ghost" data-preview>Ver plan</button></div><div data-plan class="hidden plan-preview"></div>';
  const plan=b.querySelector('[data-plan]');b.querySelector('[data-start]').onclick=()=>openRoutine(rid);b.querySelector('[data-preview]').onclick=()=>{const opening=plan.classList.contains('hidden');plan.classList.toggle('hidden');if(opening)renderRoutinePlanPreview(rid,plan)};routineCards.appendChild(b)
 });
 routineCards.appendChild(customRoutineCard())
}
function openRoutine(rid){if(!data.drafts[rid]){data.drafts[rid]=createDraft(rid);save()}activeRoutineId=rid;routineChooser.classList.add('hidden');sessionView.classList.remove('hidden');renderSession()}
function renderSession(){
 const rid=activeRoutineId;if(!rid||!data.drafts[rid])return showChooser();const r=ROUTINES[rid],d=data.drafts[rid];document.getElementById('sessionTopActions')?.classList.remove('hidden');sessionView.classList.toggle('paused-session',!!d.paused);
 document.getElementById('sessionDay').textContent=r.day;document.getElementById('sessionName').textContent=r.name;
 const doneCount=Object.values(d.exercises).filter(x=>x.finished).length;
 document.getElementById('sessionMeta').innerHTML=r.mode==='linear'?(doneCount+'/'+r.exercises.length+' finalizados · '+r.rir+'<div style="margin-top:7px;line-height:1.45">Descanso entre series: '+d.linearSetRest+' s · entre ejercicios: '+d.linearExerciseRest+' s</div>'):(doneCount+'/'+r.exercises.length+' finalizados · '+r.rir+'<div style="margin-top:7px;line-height:1.45">'+r.flow+'<br>'+r.setup+'<br>Entre bloques: '+d.blockRest+' s</div>');
 document.getElementById('sessionProgress').style.width=(doneCount/r.exercises.length*100)+'%';
 const pb=document.getElementById('pauseBadge');pb.classList.toggle('hidden',!d.paused);
 document.getElementById('pauseSession').textContent=d.paused?'▶ Retomar sesión':'⏸ Pausar sesión';const tp=document.getElementById('topPauseSession');if(tp){tp.textContent=d.paused?'▶':'⏸';tp.setAttribute('aria-label',d.paused?'Retomar sesión':'Pausar sesión');tp.title=d.paused?'Retomar sesión':'Pausar sesión';tp.classList.toggle('paused-action',!!d.paused)};
 exerciseList.innerHTML='';finishedList.innerHTML='';
 routineOrder(rid).forEach(eid=>{const ex=findExercise(rid,eid),st=d.exercises[eid];if(st.finished){const p=document.createElement('button');p.className='done-pill';p.textContent=ex.name;p.onclick=()=>{st.finished=false;d.updatedAt=nowISO();save();renderSession()};finishedList.appendChild(p)}else exerciseList.appendChild(buildExercise(rid,ex,st))});
 finishedSection.classList.toggle('hidden',doneCount===0);renderOrder();updateTopStatus()
}
function exerciseRestLabel(rid,ex,d){
 const r=ROUTINES[rid];if(r.mode==='linear')return 'Series '+d.linearSetRest+' s · siguiente ejercicio '+d.linearExerciseRest+' s';
 const rest=draftExerciseRest(d,ex);if(String(ex.code).endsWith('1')){const partner=r.exercises.find(e=>e.pair===ex.pair&&String(e.code).endsWith('2'));return rest+' s'+(partner?' → '+partner.code:'')}
 return rest+' s entre rondas'
}
function buildExercise(rid,ex,st){
 const card=document.createElement('section');card.className='exercise';const r=ROUTINES[rid],d=data.drafts[rid],raise=shouldRaise(rid,ex.id),rir=ex.rir||r.rir.replace('RIR ',''),codeLine=r.mode==='linear'?(ex.code||''):(ex.code+' · BLOQUE '+ex.pair),restLabel=exerciseRestLabel(rid,ex,d);
 card.innerHTML='<div class="ex-head"><div><div class="excode">'+codeLine+'</div><div class="exname">'+ex.name+'</div><div class="exmeta">'+ex.sets+' × '+ex.min+'–'+ex.max+' · RIR '+rir+'</div></div><div class="range">Rango <b>'+ex.min+'–'+ex.max+'</b></div></div><div class="progress-note '+(raise?'raise':'')+'">'+(raise?'⬆️ Dos sesiones al máximo: sube la carga mínima disponible.':'Objetivo: igualar o superar la última vez que hiciste este ejercicio con buena técnica.')+'</div><div class="set-head"><span></span><span>CARGA</span><span>REPS</span><span>RIR</span><span></span></div><div class="sets"></div><div class="statusline"></div><div class="timerbox"><div><b>Descanso</b><div class="timerinfo">'+restLabel+'</div><div class="timerinfo" data-ts>Listo</div></div><div class="timer" data-timer>'+fmtTimer(timerRemaining(ex,st))+'</div></div><div class="actions"><button class="ghost" data-reset>Reiniciar</button><button class="ghost" data-stop>Detener</button></div><div class="pair-note">'+(ex.note||'')+'</div><button class="finish" data-finish>Finalizar ejercicio</button>';
 const setsBox=card.querySelector('.sets');st.sets.forEach((s,i)=>setsBox.appendChild(buildSetRow(rid,ex,st,s,i,card)));updateExerciseStatus(ex,st,card);
 card.querySelector('[data-reset]').onclick=()=>{const d=data.drafts[rid];if(d.paused)return toast('Retoma la sesión primero');const idx=Math.max(0,completedSets(st).length-1),pace=paceConfigForSave(rid,ex,idx);startTimer(ex,st,pace.seconds);if(pace.kind)startPaceTimer(d,pace.kind,pace.seconds,pace.label);refreshTimers();toast('Cronómetro reiniciado')};
 card.querySelector('[data-stop]').onclick=()=>{const d=data.drafts[rid];stopTimer(ex,st,draftExerciseRest(d,ex));clearPaceTimer(d);refreshTimers()};
 card.querySelector('[data-finish]').onclick=()=>{const d=data.drafts[rid];if(d.paused)return toast('Retoma la sesión primero');st.finished=true;st.timerEnd=null;st.timerActive=false;d.updatedAt=nowISO();save();renderSession()};
 return card
}
function buildSetRow(rid,ex,st,s,i,card){
 const row=document.createElement('div');row.className='setrow'+(s.completed?' saved-row':'');
 const label=document.createElement('div');label.className='setwrap';label.innerHTML=`<div class="setlabel">S${i+1}</div><div class="target">${Number.isFinite(s.targetReps)?`mín ${Number.isFinite(s.targetKg)?s.targetKg+'kg · ':''}${s.targetReps}`:'sin ref.'}</div>`;
 const kg=document.createElement('input');kg.type='number';kg.inputMode='decimal';kg.step='0.5';kg.min='0';kg.placeholder=ex.bodyweight?'opc.':'kg';if(Number.isFinite(s.kg))kg.value=s.kg;
 const reps=document.createElement('input');reps.type='number';reps.inputMode='numeric';reps.min='0';reps.max='100';reps.step='1';reps.placeholder='reps';if(Number.isFinite(s.reps))reps.value=s.reps;
 const rir=document.createElement('input');rir.type='number';rir.inputMode='numeric';rir.min='0';rir.max='10';rir.step='1';rir.placeholder='—';if(Number.isFinite(s.rir))rir.value=s.rir;
 const btn=document.createElement('button');btn.className='save'+(s.completed?' done':'');btn.textContent=s.completed?'✓ Guardado':'Guardar';
 function draft(){s.kg=numOrNull(kg.value);s.reps=numOrNull(reps.value);s.rir=numOrNull(rir.value);if(s.completed){s.completed=false;row.classList.remove('saved-row');btn.classList.remove('done');btn.textContent='Guardar'}data.drafts[rid].updatedAt=nowISO();save()}
 [kg,reps,rir].forEach(inp=>inp.addEventListener('input',draft));
 function commit(){const d=data.drafts[rid];if(d.paused)return toast('Retoma la sesión para guardar la serie');draft();if(!Number.isFinite(s.reps)){toast('Ingresa las reps');reps.focus({preventScroll:true});return}s.completed=true;row.classList.add('saved-row');btn.classList.add('done');btn.textContent='✓ Guardado';const pace=paceConfigForSave(rid,ex,i);startTimer(ex,st,pace.seconds);if(pace.kind)startPaceTimer(d,pace.kind,pace.seconds,pace.label);else clearPaceTimer(d);updateExerciseStatus(ex,st,card);refreshTimers();const txt=Number.isFinite(s.kg)?`${s.kg} kg × ${s.reps}`:`${s.reps} reps`;toast(`${ex.name} S${i+1}: ${txt}`);requestAnimationFrame(()=>reps.focus({preventScroll:true}))}
 btn.addEventListener('mousedown',e=>e.preventDefault());btn.onclick=commit;reps.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit()}});
 row.append(label,kg,reps,rir,btn);return row
}
function paceConfigForSave(rid,ex,setIndex){
 const d=data.drafts[rid],r=ROUTINES[rid];
 if(r.mode==='linear'){
  const order=d.order||r.exercises.map(e=>e.id),pos=order.indexOf(ex.id);
  if(setIndex<ex.sets-1)return{kind:'series',seconds:d.linearSetRest,label:'Siguiente serie'};
  const nextId=order.slice(pos+1).find(id=>d.exercises[id]&&!d.exercises[id].finished),next=nextId?findExercise(rid,nextId):null;
  return next?{kind:'exercise',seconds:d.linearExerciseRest,label:(next.code?next.code+' · ':'')+next.name}:{kind:null,seconds:d.linearExerciseRest,label:''}
 }
 const rest=draftExerciseRest(d,ex),isFirst=String(ex.code).endsWith('1');
 if(isFirst){const partner=r.exercises.find(e=>e.pair===ex.pair&&String(e.code).endsWith('2'));return{kind:'exercise',seconds:rest,label:partner?(partner.code+' · '+partner.name):'Siguiente ejercicio'}}
 if(setIndex<ex.sets-1){const first=r.exercises.find(e=>e.pair===ex.pair&&String(e.code).endsWith('1'));return{kind:'series',seconds:rest,label:first?('Ronda '+(setIndex+2)+' · '+first.code):'Siguiente serie'}}
 const order=d.order||r.exercises.map(e=>e.id),pos=order.indexOf(ex.id),nextId=order.slice(pos+1).find(id=>{const n=findExercise(rid,id);return n&&String(n.code).endsWith('1')}),next=nextId?findExercise(rid,nextId):null;
 return next?{kind:'exercise',seconds:d.blockRest,label:next.code+' · '+next.name}:{kind:null,seconds:d.blockRest,label:''}
}
function updateExerciseStatus(ex,st,card){
 const line=card.querySelector('.statusline'),sets=completedSets(st);line.className='statusline';if(!sets.length){line.textContent='Aún no has guardado series.';return}
 let met=0,progress=0;sets.forEach(s=>{if(Number.isFinite(s.targetReps)){const kgOK=!Number.isFinite(s.targetKg)||!Number.isFinite(s.kg)||s.kg>=s.targetKg,repsOK=s.reps>=s.targetReps;if(kgOK&&repsOK)met++;if((Number.isFinite(s.targetKg)&&Number.isFinite(s.kg)&&s.kg>s.targetKg&&s.reps>=ex.min)||(kgOK&&s.reps>s.targetReps))progress++}else if(s.reps>=ex.min)met++});
 if(progress){line.classList.add('good');line.textContent=`↑ Progreso en ${progress} serie${progress>1?'s':''}.`}else if(met===sets.length){line.classList.add('good');line.textContent='✓ Vas cumpliendo el mínimo de la última vez.'}else{line.classList.add('warn');line.textContent='Revisa las series: alguna quedó debajo de la referencia anterior.'}
}
function updateTopStatus(){
 if(!activeRoutineId||!data.drafts[activeRoutineId])return;const d=data.drafts[activeRoutineId],p=d.paceTimer||basePace(),rem=paceRemaining(d);
 document.getElementById('totalElapsed').textContent=fmtTimer(elapsedSeconds(d));
 document.getElementById('nextSetTimer').textContent=p.kind==='series'?fmtTimer(rem):'--:--';
 document.getElementById('nextExerciseTimer').textContent=p.kind==='exercise'?fmtTimer(rem):'--:--';
 document.getElementById('pauseBadge').classList.toggle('hidden',!d.paused)
}
function refreshTimers(){
 if(!activeRoutineId||!data.drafts[activeRoutineId])return;const d=data.drafts[activeRoutineId];
 routineOrder(activeRoutineId).forEach(eid=>{const ex=findExercise(activeRoutineId,eid),st=d.exercises[eid];if(!st||st.finished)return;const cards=[...document.querySelectorAll('.exercise')],card=cards.find(c=>c.querySelector('.exname')?.textContent===ex.name);if(!card)return;const el=card.querySelector('[data-timer]'),ts=card.querySelector('[data-ts]'),rem=timerRemaining(ex,st);el.textContent=fmtTimer(rem);ts.textContent=d.paused&&st.timerActive?'Pausado':st.timerActive?'Descansando…':rem===0?'✅ Listo':'Listo'});
 updateTopStatus()
}
setInterval(refreshTimers,500);