const calendarGrid=document.getElementById('calendarGrid'),monthTitle=document.getElementById('monthTitle'),dayDetails=document.getElementById('dayDetails'),selectedDateTitle=document.getElementById('selectedDateTitle'),scheduleTime=document.getElementById('scheduleTime'),scheduleRoutine=document.getElementById('scheduleRoutine'),scheduleAdd=document.getElementById('scheduleAdd'),scheduleHint=document.getElementById('scheduleHint');
const calNow=new Date(),calendarState={year:calNow.getFullYear(),month:calNow.getMonth(),selected:localYMD(calNow)};
function refreshScheduleRoutineOptions(){const current=scheduleRoutine.value;scheduleRoutine.innerHTML='';ROUTINE_IDS.forEach(rid=>{const r=ROUTINES[rid],o=document.createElement('option');o.value=rid;o.textContent=r.day+' · '+r.name;scheduleRoutine.appendChild(o)});if(ROUTINES[current])scheduleRoutine.value=current}
refreshScheduleRoutineOptions();
function parseYMD(ymd){const [y,m,d]=ymd.split('-').map(Number);return new Date(y,m-1,d)}
function ymdFromParts(y,m,d){return [y,String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-')}
function dateTitle(ymd){return new Intl.DateTimeFormat('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(parseYMD(ymd))}
function sessionsForDay(ymd){
 const a=data.history.filter(s=>localYMD(s.startedAt)===ymd).map(s=>({...s,_sourceKind:'history',_sourceKey:s.id||s.startedAt,legacyCalendar:false}));
 data.legacy.filter(s=>localYMD(s.startedAt)===ymd).forEach(s=>a.push({...s,_sourceKind:'legacy',_sourceKey:s.id||s.startedAt,legacyCalendar:true}));
 return a.sort((x,y)=>new Date(x.startedAt)-new Date(y.startedAt))
}
function schedulesForDay(ymd){return data.schedules.filter(s=>s.date===ymd).sort((a,b)=>a.time.localeCompare(b.time))}
function anyExerciseName(eid){for(const rid of ROUTINE_IDS){const ex=findExercise(rid,eid);if(ex)return ex.name}return eid}
function findStoredSession(kind,key){
 const arr=kind==='legacy'?data.legacy:data.history;
 let index=arr.findIndex(s=>(s.id||s.startedAt)===key);if(index<0&&key)index=arr.findIndex(s=>s.startedAt===key);
 return index>=0?{arr,index,session:arr[index]}:null
}
function refreshAfterSessionMutation(){save();renderProgress();renderHistory();renderCalendar();renderChooser()}
function deleteCompletedSession(kind,key){
 const found=findStoredSession(kind,key);if(!found)return toast('No encontré esa sesión');
 const s=found.session,r=s.routineId?ROUTINES[s.routineId]:null,label=r?`${r.day} · ${r.name}`:(s.name||'esta sesión');
 if(!confirm(`¿Eliminar ${label}?\n\nSe borrarán sus pesos, reps y RIR. Tus récords y la referencia para próximas sesiones se recalcularán automáticamente.`))return;
 found.arr.splice(found.index,1);refreshAfterSessionMutation();toast('Sesión eliminada')
}
function editCompletedSession(kind,key){
 const found=findStoredSession(kind,key);if(!found)return toast('No encontré esa sesión');const draft=clone(found.session),r=draft.routineId?ROUTINES[draft.routineId]:null;
 const overlay=document.createElement('div');overlay.className='editor-overlay';
 const sheet=document.createElement('div');sheet.className='editor-sheet';
 sheet.innerHTML=`<div class="editor-head"><div><div class="eyebrow">EDITAR SESIÓN</div><div class="title">${r?`${r.day} · ${r.name}`:(draft.name||'Sesión')}</div><div class="sub">${fmtDateTime(draft.startedAt)}</div></div><button class="editor-close" aria-label="Cerrar">×</button></div><div class="editor-body"><div data-editor-list></div><div class="editor-footer"><button class="editor-cancel">Cancelar</button><button class="editor-save">Guardar cambios</button></div></div>`;
 overlay.appendChild(sheet);document.body.appendChild(overlay);
 const list=sheet.querySelector('[data-editor-list]'),order=draft.order||Object.keys(draft.exercises||{});
 order.forEach(eid=>{
  const st=draft.exercises?.[eid];if(!st||!Array.isArray(st.sets))return;const ex=r?findExercise(draft.routineId,eid):null,box=document.createElement('div');box.className='editor-exercise';
  box.innerHTML=`<div class="editor-exercise-name">${ex?.name||anyExerciseName(eid)}</div><div class="edit-set-head"><span></span><span>KG</span><span>REPS</span><span>RIR</span></div><div data-edit-sets></div>`;
  const setsBox=box.querySelector('[data-edit-sets]');
  st.sets.forEach((q,i)=>{
   const row=document.createElement('div');row.className='edit-set-row';const lab=document.createElement('span');lab.textContent='S'+(i+1);
   const kg=document.createElement('input');kg.type='number';kg.inputMode='decimal';kg.step='0.5';kg.min='0';if(Number.isFinite(q.kg))kg.value=q.kg;
   const reps=document.createElement('input');reps.type='number';reps.inputMode='numeric';reps.step='1';reps.min='0';if(Number.isFinite(q.reps))reps.value=q.reps;
   const rir=document.createElement('input');rir.type='number';rir.inputMode='numeric';rir.step='1';rir.min='0';rir.max='10';if(Number.isFinite(q.rir))rir.value=q.rir;
   function sync(){q.kg=numOrNull(kg.value);q.reps=numOrNull(reps.value);q.rir=numOrNull(rir.value);q.completed=Number.isFinite(q.reps)}
   [kg,reps,rir].forEach(inp=>inp.addEventListener('input',sync));row.append(lab,kg,reps,rir);setsBox.appendChild(row)
  });
  list.appendChild(box)
 });
 function close(){overlay.remove()}
 sheet.querySelector('.editor-close').onclick=close;sheet.querySelector('.editor-cancel').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 sheet.querySelector('.editor-save').onclick=()=>{found.arr[found.index]=draft;refreshAfterSessionMutation();close();toast('Sesión actualizada')}
}
function renderCalendar(){
 const first=new Date(calendarState.year,calendarState.month,1),days=new Date(calendarState.year,calendarState.month+1,0).getDate(),offset=(first.getDay()+6)%7;
 monthTitle.textContent=new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric'}).format(first);calendarGrid.innerHTML='';
 for(let cell=0;cell<42;cell++){
  const dayNum=cell-offset+1,date=new Date(calendarState.year,calendarState.month,dayNum),ymd=localYMD(date),inMonth=dayNum>=1&&dayNum<=days;
  const b=document.createElement('button');b.className='calendar-day'+(inMonth?'':' out')+(ymd===localYMD(new Date())?' today':'')+(ymd===calendarState.selected?' selected':'');
  b.innerHTML=`<span>${date.getDate()}</span><span class="day-dots"></span>`;
  const dots=b.querySelector('.day-dots');if(sessionsForDay(ymd).length){const d=document.createElement('i');d.className='dot trained-dot';dots.appendChild(d)}if(schedulesForDay(ymd).length){const d=document.createElement('i');d.className='dot planned-dot';dots.appendChild(d)}
  b.onclick=()=>{calendarState.selected=ymd;calendarState.year=date.getFullYear();calendarState.month=date.getMonth();renderCalendar()};calendarGrid.appendChild(b)
 }
 renderSelectedDay()
}
function renderSelectedDay(){
 const ymd=calendarState.selected,done=sessionsForDay(ymd),planned=schedulesForDay(ymd);selectedDateTitle.textContent=dateTitle(ymd).toUpperCase();dayDetails.innerHTML='';
 if(!done.length&&!planned.length){const e=document.createElement('div');e.className='empty';e.textContent='No hay entrenamientos en este día.';dayDetails.appendChild(e)}
 done.forEach(s=>dayDetails.appendChild(buildCompletedDayCard(s)));planned.forEach(s=>dayDetails.appendChild(buildPlannedCard(s)));
 const today=localYMD(new Date()),past=ymd<today;scheduleAdd.disabled=past;scheduleAdd.style.opacity=past?'.45':'1';setScheduleDefaultTime();scheduleHint.textContent=past?'No puedes programar una sesión en una fecha pasada.':'Se guarda en el calendario de Fuerza de este iPhone; no crea una alarma del sistema.'
}
function buildCompletedDayCard(s){
 const details=document.createElement('details');details.className='card day-session';let label='Sesión migrada';if(!s.legacyCalendar){const r=ROUTINES[s.routineId];label=`${r?.day||''} · ${r?.name||s.routineName||'Rutina'}`}
 const dur=Number.isFinite(s.durationSec)?` · ${fmtTimer(s.durationSec)}`:'';
 details.innerHTML=`<summary>✓ ${label}<div class="sub">${new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(new Date(s.startedAt))}${dur}</div></summary><div class="day-session-body"></div>`;
 const body=details.querySelector('.day-session-body'),order=s.order||Object.keys(s.exercises||{});
 order.forEach(eid=>{const st=s.exercises?.[eid];if(!st||!completedSets(st).length)return;const row=document.createElement('div');row.className='calendar-ex';const ex=s.legacyCalendar?null:findExercise(s.routineId,eid),name=ex?.name||anyExerciseName(eid),sets=completedSets(st).map(q=>`${Number.isFinite(q.kg)?q.kg+' kg × ':''}${q.reps}${Number.isFinite(q.rir)?' · RIR '+q.rir:''}`).join(' | ');row.innerHTML=`<b>${name}</b><div class="sub">${sets}</div>`;body.appendChild(row)});
 const actions=document.createElement('div');actions.className='session-actions-inline';const edit=document.createElement('button');edit.textContent='Editar sesión';edit.onclick=e=>{e.preventDefault();editCompletedSession(s._sourceKind,s._sourceKey)};const del=document.createElement('button');del.className='delete';del.textContent='Eliminar sesión';del.onclick=e=>{e.preventDefault();deleteCompletedSession(s._sourceKind,s._sourceKey)};actions.append(edit,del);body.appendChild(actions);
 return details
}
function buildPlannedCard(s){
 const r=ROUTINES[s.routineId],c=document.createElement('div');c.className='card planned-card';c.innerHTML=`<div><div class="eyebrow">PROGRAMADO · ${s.time}</div><div style="font-weight:900;margin-top:3px">${r.day} · ${r.name}</div></div><div class="planned-actions"></div>`;
 const acts=c.querySelector('.planned-actions'),start=document.createElement('button');start.textContent='Empezar';start.onclick=()=>{show('train');openRoutine(s.routineId);data.drafts[s.routineId].sourceScheduleId=s.id;save();toast('Entrenamiento programado iniciado')};
 const del=document.createElement('button');del.textContent='Eliminar';del.onclick=()=>{if(confirm('¿Eliminar este entrenamiento programado?')){data.schedules=data.schedules.filter(x=>x.id!==s.id);save();renderCalendar()}};
 acts.append(start,del);return c
}
function setScheduleDefaultTime(){
 const ymd=calendarState.selected,today=localYMD(new Date());if(ymd!==today){if(!scheduleTime.value)scheduleTime.value='08:00';return}
 const d=new Date(Date.now()+30*60000);if(localYMD(d)===today)scheduleTime.value=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;else scheduleTime.value='23:59'
}
scheduleAdd.onclick=()=>{
 const date=calendarState.selected,time=scheduleTime.value,rid=scheduleRoutine.value;if(!time||!ROUTINES[rid])return toast('Elige hora y rutina');
 const when=new Date(`${date}T${time}:00`);if(!Number.isFinite(when.getTime())||when.getTime()<=Date.now())return toast('Elige una fecha y hora futuras');
 const duplicate=data.schedules.some(s=>s.date===date&&s.time===time&&s.routineId===rid);if(duplicate)return toast('Ese entrenamiento ya está programado');
 data.schedules.push({id:'p_'+Date.now(),date,time,routineId:rid,createdAt:nowISO()});save();toast('Entrenamiento programado');renderCalendar()
};
document.getElementById('prevMonth').onclick=()=>{calendarState.month--;if(calendarState.month<0){calendarState.month=11;calendarState.year--}calendarState.selected=ymdFromParts(calendarState.year,calendarState.month,1);renderCalendar()};
document.getElementById('nextMonth').onclick=()=>{calendarState.month++;if(calendarState.month>11){calendarState.month=0;calendarState.year++}calendarState.selected=ymdFromParts(calendarState.year,calendarState.month,1);renderCalendar()};
renderCalendar();