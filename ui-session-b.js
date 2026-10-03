let orderDrag={timer:null,row:null,handle:null,pointerId:null,dragging:false,startY:0};
function clearOrderDragTimer(){if(orderDrag.timer){clearTimeout(orderDrag.timer);orderDrag.timer=null}}
function persistDraggedOrder(){
 if(!activeRoutineId)return;const rid=activeRoutineId,arr=[...orderList.querySelectorAll('.orderrow')].map(r=>r.dataset.eid).filter(Boolean);
 if(!arr.length)return;data.orders[rid]=[...arr];data.drafts[rid].order=[...arr];save();
 [...orderList.querySelectorAll('.orderrow')].forEach((row,i)=>{const n=row.querySelector('[data-order-index]');if(n)n.textContent=(i+1)+'.'})
}
function attachLongPressDrag(handle,row){
 handle.onpointerdown=e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;clearOrderDragTimer();orderDrag={timer:null,row,handle,pointerId:e.pointerId,dragging:false,startY:e.clientY};
  orderDrag.timer=setTimeout(()=>{orderDrag.dragging=true;row.classList.add('dragging');try{handle.setPointerCapture(e.pointerId)}catch{}},260)
 };
 handle.onpointermove=e=>{
  if(orderDrag.row!==row)return;
  if(!orderDrag.dragging){if(Math.abs(e.clientY-orderDrag.startY)>8)clearOrderDragTimer();return}
  e.preventDefault();const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.orderrow');if(!hit||hit===row||!orderList.contains(hit))return;
  const rect=hit.getBoundingClientRect(),before=e.clientY<rect.top+rect.height/2;orderList.insertBefore(row,before?hit:hit.nextSibling)
 };
 const end=e=>{
  if(orderDrag.row!==row)return;clearOrderDragTimer();
  if(orderDrag.dragging){row.classList.remove('dragging');persistDraggedOrder();toast('Orden actualizado')}
  try{handle.releasePointerCapture(orderDrag.pointerId)}catch{}
  orderDrag={timer:null,row:null,handle:null,pointerId:null,dragging:false,startY:0}
 };
 handle.onpointerup=end;handle.onpointercancel=end;handle.onlostpointercapture=e=>{if(orderDrag.row===row&&orderDrag.dragging)end(e)}
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
finishDiscardBtn.onclick=()=>{closeFinishPrompt();discardCurrentSession(true)};
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