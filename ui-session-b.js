let orderDrag={timer:null,row:null,handle:null,dragging:false,startY:0,touchId:null,mode:null};
function clearOrderDragTimer(){if(orderDrag.timer){clearTimeout(orderDrag.timer);orderDrag.timer=null}}
function persistDraggedOrder(){
 if(!activeRoutineId)return;const rid=activeRoutineId,arr=[...orderList.querySelectorAll('.orderrow')].map(r=>r.dataset.eid).filter(Boolean);
 if(!arr.length)return;data.orders[rid]=[...arr];data.drafts[rid].order=[...arr];save();
 [...orderList.querySelectorAll('.orderrow')].forEach((row,i)=>{const n=row.querySelector('[data-order-index]');if(n)n.textContent=(i+1)+'.'})
}
function beginOrderDrag(row,handle,y,id,mode){
 clearOrderDragTimer();orderDrag={timer:null,row,handle,dragging:false,startY:y,touchId:id,mode};
 orderDrag.timer=setTimeout(()=>{if(orderDrag.row!==row)return;orderDrag.dragging=true;row.classList.add('dragging');if(navigator.vibrate)try{navigator.vibrate(20)}catch{}},180)
}
function moveOrderDrag(x,y){
 if(!orderDrag.row)return;
 if(!orderDrag.dragging){if(Math.abs(y-orderDrag.startY)>10){clearOrderDragTimer();orderDrag.row=null}return}
 const row=orderDrag.row,hit=document.elementFromPoint(x,y)?.closest('.orderrow');
 if(hit&&hit!==row&&orderList.contains(hit)){const rect=hit.getBoundingClientRect(),before=y<rect.top+rect.height/2;orderList.insertBefore(row,before?hit:hit.nextSibling)}
 if(y<115)window.scrollBy(0,-8);else if(y>window.innerHeight-125)window.scrollBy(0,8)
}
function endOrderDrag(){
 clearOrderDragTimer();const row=orderDrag.row,wasDragging=orderDrag.dragging;
 if(row&&wasDragging){row.classList.remove('dragging');persistDraggedOrder();toast('Orden actualizado')}
 orderDrag={timer:null,row:null,handle:null,dragging:false,startY:0,touchId:null,mode:null}
}
function attachLongPressDrag(handle,row){
 handle.addEventListener('contextmenu',e=>e.preventDefault());
 handle.addEventListener('selectstart',e=>e.preventDefault());
 handle.addEventListener('touchstart',e=>{
  if(e.touches.length!==1)return;e.preventDefault();const t=e.touches[0];beginOrderDrag(row,handle,t.clientY,t.identifier,'touch')
 },{passive:false});
 handle.addEventListener('touchmove',e=>{
  if(orderDrag.row!==row||orderDrag.mode!=='touch')return;const t=[...e.touches].find(x=>x.identifier===orderDrag.touchId)||e.touches[0];if(!t)return;e.preventDefault();moveOrderDrag(t.clientX,t.clientY)
 },{passive:false});
 handle.addEventListener('touchend',e=>{if(orderDrag.row!==row||orderDrag.mode!=='touch')return;e.preventDefault();endOrderDrag()},{passive:false});
 handle.addEventListener('touchcancel',e=>{if(orderDrag.row!==row||orderDrag.mode!=='touch')return;e.preventDefault();endOrderDrag()},{passive:false});
 handle.addEventListener('mousedown',e=>{
  if(e.button!==0)return;e.preventDefault();beginOrderDrag(row,handle,e.clientY,'mouse','mouse');
  const move=ev=>{ev.preventDefault();moveOrderDrag(ev.clientX,ev.clientY)};
  const up=ev=>{ev.preventDefault();document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);endOrderDrag()};
  document.addEventListener('mousemove',move,{passive:false});document.addEventListener('mouseup',up,{passive:false})
 })
}
function renderOrder(){
 if(!activeRoutineId)return;const rid=activeRoutineId,arr=routineOrder(rid);orderList.innerHTML='';
 const hint=document.createElement('div');hint.className='drag-hint';hint.innerHTML='<b>⠿</b> Mantén pulsado el asa y arrastra para cambiar el orden.';orderList.appendChild(hint);
 arr.forEach((eid,i)=>{
  const ex=findExercise(rid,eid),row=document.createElement('div');row.className='orderrow';row.dataset.eid=eid;
  const handle=document.createElement('button');handle.type='button';handle.className='drag-handle';handle.textContent='⠿';handle.setAttribute('aria-label','Mantener pulsado y arrastrar '+ex.name);
  const info=document.createElement('div');info.innerHTML=`<b><span data-order-index>${i+1}.</span> ${ex.code} · ${ex.name}</b><div class="sub">${ex.sets}×${ex.min}–${ex.max}</div>`;
  row.append(handle,info);orderList.appendChild(row);attachLongPressDrag(handle,row)
 })
}
function moveExercise(eid,delta){const rid=activeRoutineId,arr=routineOrder(rid),i=arr.indexOf(eid),j=i+delta;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];data.orders[rid]=[...arr];data.drafts[rid].order=[...arr];save();renderSession()}

function toggleCurrentSessionPause(){
 if(!activeRoutineId||!data.drafts[activeRoutineId])return;const d=data.drafts[activeRoutineId];
 if(d.paused){resumeDraft(d);toast('Sesión retomada')}else{pauseDraft(d);toast('Sesión pausada')}
 renderSession()
}
function archiveCurrentSession(){
 if(!activeRoutineId||!data.drafts[activeRoutineId])return false;const rid=activeRoutineId,d=data.drafts[rid],has=Object.values(d.exercises).some(st=>completedSets(st).length);
 if(!has){toast('Todavía no hay series guardadas');return false}
 const archived=clone(d);archived.finishedAt=nowISO();archived.durationSec=elapsedSeconds(d);archived.routineName=ROUTINES[rid].name;data.history.push(archived);
 if(d.sourceScheduleId)data.schedules=data.schedules.filter(x=>x.id!==d.sourceScheduleId);
 delete data.drafts[rid];save();activeRoutineId=null;toast('Entrenamiento guardado');showChooser();renderProgress();renderHistory();if(typeof renderCalendar==='function')renderCalendar();return true
}
function discardCurrentSession(skipConfirm=false){
 if(!activeRoutineId||!data.drafts[activeRoutineId])return false;const rid=activeRoutineId,r=ROUTINES[rid];
 if(!skipConfirm&&!confirm(`¿Descartar la sesión de ${r.day} · ${r.name}?\n\nNo se guardará este entrenamiento en tu historial.`))return false;
 delete data.drafts[rid];save();activeRoutineId=null;toast('Sesión descartada');showChooser();if(typeof renderCalendar==='function')renderCalendar();return true
}

const finishPrompt=document.getElementById('finishPrompt'),finishSaveBtn=document.getElementById('finishSaveBtn'),finishDiscardBtn=document.getElementById('finishDiscardBtn'),finishCancelBtn=document.getElementById('finishCancelBtn');
function closeFinishPrompt(){finishPrompt.classList.add('hidden');document.body.classList.remove('modal-open')}
function openFinishPrompt(){
 if(!activeRoutineId||!data.drafts[activeRoutineId])return;const rid=activeRoutineId,d=data.drafts[rid],r=ROUTINES[rid],saved=Object.values(d.exercises).reduce((n,st)=>n+completedSets(st).length,0),done=Object.values(d.exercises).filter(st=>st.finished).length;
 document.getElementById('finishPromptText').textContent=`${r.day} · ${r.name} · ${fmtTimer(elapsedSeconds(d))} · ${saved} series guardadas · ${done}/${r.exercises.length} ejercicios finalizados. ¿Quieres guardar o descartar este entrenamiento?`;
 finishPrompt.classList.remove('hidden');document.body.classList.add('modal-open');requestAnimationFrame(()=>finishSaveBtn.focus())
}
finishSaveBtn.onclick=()=>{if(archiveCurrentSession())closeFinishPrompt()};
finishDiscardBtn.onclick=()=>{if(discardCurrentSession(false))closeFinishPrompt()};
finishCancelBtn.onclick=closeFinishPrompt;
finishPrompt.addEventListener('click',e=>{if(e.target===finishPrompt)closeFinishPrompt()});
finishPrompt.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeFinishPrompt()}else if(e.key==='Enter'&&e.target!==finishDiscardBtn&&e.target!==finishCancelBtn){e.preventDefault();finishSaveBtn.click()}});

document.getElementById('orderBtn').onclick=()=>{const opening=orderSection.classList.contains('hidden');orderSection.classList.toggle('hidden');if(opening)renderOrder();else renderSession()};
document.getElementById('pauseSession').onclick=toggleCurrentSessionPause;
document.getElementById('topPauseSession').onclick=toggleCurrentSessionPause;
document.getElementById('discardSession').onclick=()=>discardCurrentSession(false);
document.getElementById('finishSession').onclick=openFinishPrompt;
document.getElementById('topFinishSession').onclick=openFinishPrompt;
document.getElementById('backToRoutines').onclick=showChooser;
document.getElementById('homeBtn').onclick=()=>{show('train');showChooser()};