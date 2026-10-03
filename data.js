const KEY='fuerza_tracker_v3',OLD_KEY='fuerza_tracker_v1';
const nowISO=()=>new Date().toISOString();
const clone=o=>JSON.parse(JSON.stringify(o));
const numOrNull=v=>{const n=Number(v);return v===null||v===''||!Number.isFinite(n)?null:n};
const fmtDate=iso=>new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'2-digit'}).format(new Date(iso));
const fmtDateTime=iso=>new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));
const localYMD=value=>{const d=value instanceof Date?value:new Date(value);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};

function resetRoutineRegistry(){
 Object.keys(ROUTINES).forEach(id=>{if(!BUILTIN_ROUTINE_IDS.includes(id))delete ROUTINES[id]});
 ROUTINE_IDS.splice(0,ROUTINE_IDS.length,...BUILTIN_ROUTINE_IDS)
}
function registerCustomRoutine(r){
 if(!r?.id||!Array.isArray(r.exercises))return;
 ROUTINES[r.id]=r;if(!ROUTINE_IDS.includes(r.id))ROUTINE_IDS.push(r.id)
}
function registerCustomRoutines(map){Object.values(map||{}).forEach(registerCustomRoutine)}
function defaultOrder(){const o={};ROUTINE_IDS.forEach(id=>o[id]=ROUTINES[id].exercises.map(e=>e.id));return o}
function blankData(){return{version:5,orders:defaultOrder(),drafts:{},history:[],legacy:[],schedules:[],customRoutines:{},restSettings:{},nextOverrides:{}}}
function blankSet(target){return{kg:target?.kg??null,reps:target?.reps??null,rir:null,completed:false,targetKg:target?.kg??null,targetReps:target?.reps??null}}
function completedSets(st){return(st?.sets||[]).filter(s=>s.completed&&Number.isFinite(s.reps))}
function findExercise(routineId,exerciseId){return ROUTINES[routineId]?.exercises.find(e=>e.id===exerciseId)}
function lastRoutineSession(routineId){for(let i=data.history.length-1;i>=0;i--)if(data.history[i].routineId===routineId)return data.history[i];return null}
function lastExerciseInRoutine(routineId,exerciseId){for(let i=data.history.length-1;i>=0;i--){const s=data.history[i];if(s.routineId===routineId&&s.exercises?.[exerciseId]&&completedSets(s.exercises[exerciseId]).length)return s.exercises[exerciseId]}return null}
function lastAnyExercise(exerciseId){for(let i=data.history.length-1;i>=0;i--){const st=data.history[i].exercises?.[exerciseId];if(st&&completedSets(st).length)return st}for(let i=data.legacy.length-1;i>=0;i--){const st=data.legacy[i].exercises?.[exerciseId];if(st&&completedSets(st).length)return st}return null}
function basePace(){return{kind:null,active:false,endAt:null,remaining:0,label:''}}

function defaultRestMap(r){const m={};r.exercises.forEach(ex=>m[ex.id]=Number.isFinite(ex.rest)?ex.rest:90);return m}
function normalizeExerciseState(st,ex){
 const out=st&&typeof st==='object'?st:{};
 out.sets=Array.isArray(out.sets)?out.sets:[];
 while(out.sets.length<ex.sets)out.sets.push(blankSet(null));
 out.sets=out.sets.map(s=>({kg:numOrNull(s?.kg),reps:numOrNull(s?.reps),rir:numOrNull(s?.rir),completed:!!s?.completed,targetKg:numOrNull(s?.targetKg),targetReps:numOrNull(s?.targetReps)}));
 out.finished=!!out.finished;
 out.remaining=Number.isFinite(out.remaining)?out.remaining:(Number.isFinite(ex.rest)?ex.rest:90);
 out.timerEnd=out.timerEnd||null;
 out.timerActive=out.timerActive===true||!!out.timerEnd;
 return out
}
function normalizeDraft(d,rid){
 const r=ROUTINES[rid];if(!r)return d;
 const out=d&&typeof d==='object'?d:{};
 out.id=out.id||'d_'+Date.now();out.routineId=rid;out.startedAt=out.startedAt||nowISO();out.updatedAt=out.updatedAt||out.startedAt;
 out.order=Array.isArray(out.order)?out.order:[...r.exercises.map(e=>e.id)];
 out.paused=!!out.paused;out.pausedAt=out.pausedAt||null;out.pausedMs=Number.isFinite(out.pausedMs)?out.pausedMs:0;
 out.paceTimer={...basePace(),...(out.paceTimer||{})};
 out.restMap={...defaultRestMap(r),...(out.restMap||{})};
 out.blockRest=Number.isFinite(out.blockRest)?out.blockRest:(Number.isFinite(r.blockRest)?r.blockRest:120);
 out.linearSetRest=Number.isFinite(out.linearSetRest)?out.linearSetRest:(Number.isFinite(r.setRest)?r.setRest:90);
 out.linearExerciseRest=Number.isFinite(out.linearExerciseRest)?out.linearExerciseRest:(Number.isFinite(r.exerciseRest)?r.exerciseRest:90);
 out.exercises=out.exercises&&typeof out.exercises==='object'?out.exercises:{};
 r.exercises.forEach(ex=>out.exercises[ex.id]=normalizeExerciseState(out.exercises[ex.id],ex));
 return out
}
function createDraft(routineId){
 const r=ROUTINES[routineId],exercises={},next=data.nextOverrides[routineId]||null,persist=data.restSettings[routineId]||{};
 const restMap={...defaultRestMap(r),...(persist.restMap||{}),...(next?.restMap||{})};
 const order=[...(next?.order||data.orders[routineId]||r.exercises.map(e=>e.id))];
 const blockRest=Number(next?.blockRest??persist.blockRest??r.blockRest??120);
 const linearSetRest=Number(next?.linearSetRest??persist.linearSetRest??r.setRest??90);
 const linearExerciseRest=Number(next?.linearExerciseRest??persist.linearExerciseRest??r.exerciseRest??90);
 r.exercises.forEach(ex=>{const p=lastAnyExercise(ex.id),sets=[];for(let i=0;i<ex.sets;i++){const ps=p?.sets?.[i];sets.push(blankSet(ps&&ps.completed?ps:null))}exercises[ex.id]={sets,finished:false,remaining:restMap[ex.id]??ex.rest??90,timerEnd:null,timerActive:false}});
 const draft={id:'d_'+Date.now(),routineId,startedAt:nowISO(),updatedAt:nowISO(),order,paused:false,pausedAt:null,pausedMs:0,paceTimer:basePace(),restMap,blockRest,linearSetRest,linearExerciseRest,exercises};
 if(next)delete data.nextOverrides[routineId];
 return draft
}
function normalizeV3(d){
 resetRoutineRegistry();
 const out=blankData();if(!d||typeof d!=='object')return out;
 out.customRoutines=d.customRoutines&&typeof d.customRoutines==='object'?d.customRoutines:{};
 registerCustomRoutines(out.customRoutines);
 out.orders={...defaultOrder(),...(d.orders||{})};
 ROUTINE_IDS.forEach(rid=>{if(!Array.isArray(out.orders[rid]))out.orders[rid]=ROUTINES[rid].exercises.map(e=>e.id)});
 out.restSettings=d.restSettings&&typeof d.restSettings==='object'?d.restSettings:{};
 out.nextOverrides=d.nextOverrides&&typeof d.nextOverrides==='object'?d.nextOverrides:{};
 out.history=Array.isArray(d.history)?d.history:[];out.legacy=Array.isArray(d.legacy)?d.legacy:[];out.schedules=Array.isArray(d.schedules)?d.schedules:[];
 out.drafts=d.drafts&&typeof d.drafts==='object'?d.drafts:{};
 Object.keys(out.drafts).forEach(rid=>{if(ROUTINES[rid])out.drafts[rid]=normalizeDraft(out.drafts[rid],rid);else delete out.drafts[rid]});
 out.version=5;return out
}
function migrateOld(){
 resetRoutineRegistry();
 let old=null;try{old=JSON.parse(localStorage.getItem(OLD_KEY)||'null')}catch{}
 if(!old)return blankData();
 const out=blankData(),map={flat:'flat_press',row:'row_low',incline:'incline_press',pulldown:'pulldown',biceps:'curl_supinated',lateral:'lateral_raise'};
 const sessions=[...(Array.isArray(old.history)?old.history:[])];if(old.current)sessions.push({...old.current,legacyDraft:true});
 sessions.forEach(s=>{const exs={};Object.entries(map).forEach(([oldId,newId])=>{const os=s.exercises?.[oldId];if(!os)return;const sets=(os.sets||[]).map(v=>{if(v&&typeof v==='object')return{kg:numOrNull(v.kg),reps:numOrNull(v.reps),rir:numOrNull(v.rir),completed:Number.isFinite(numOrNull(v.reps))};const reps=numOrNull(v);return{kg:null,reps,rir:null,completed:Number.isFinite(reps)}});if(sets.some(x=>x.completed))exs[newId]={sets,finished:!!os.finished}});if(Object.keys(exs).length)out.legacy.push({startedAt:s.startedAt||nowISO(),finishedAt:s.finishedAt||s.updatedAt||nowISO(),name:'Sesión anterior (migrada)',exercises:exs})});
 return out
}
function load(){try{const raw=localStorage.getItem(KEY);if(raw)return normalizeV3(JSON.parse(raw))}catch{}return migrateOld()}
let data=load();let activeRoutineId=null;function save(){localStorage.setItem(KEY,JSON.stringify(data))}save();

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}
function routineOrder(rid){const base=data.drafts[rid]?.order||data.orders[rid]||ROUTINES[rid].exercises.map(e=>e.id);const clean=base.filter(id=>findExercise(rid,id));ROUTINES[rid].exercises.forEach(e=>{if(!clean.includes(e.id))clean.push(e.id)});return clean}
function draftExerciseRest(d,ex){return Number(d?.restMap?.[ex.id]??ex.rest??90)}
function allMax(st,ex){const sets=completedSets(st);return sets.length>=ex.sets&&sets.slice(0,ex.sets).every(s=>s.reps>=ex.max)}
function shouldRaise(rid,eid){const ex=findExercise(rid,eid),relevant=[];for(let i=data.history.length-1;i>=0&&relevant.length<2;i--){const st=data.history[i].exercises?.[eid];if(st&&completedSets(st).length)relevant.push(st)}return relevant.length===2&&relevant.every(st=>allMax(st,ex))}
function bestReps(st){const a=completedSets(st).map(s=>s.reps);return a.length?Math.max(...a):null}
function maxKg(st){const a=completedSets(st).map(s=>s.kg).filter(Number.isFinite);return a.length?Math.max(...a):null}
function volume(st){const a=completedSets(st).filter(s=>Number.isFinite(s.kg));return a.length?a.reduce((z,s)=>z+s.kg*s.reps,0):null}
function bestE1RM(st){const a=completedSets(st).filter(s=>Number.isFinite(s.kg)&&s.reps>0).map(s=>s.kg*(1+s.reps/30));return a.length?Math.max(...a):null}
function f1(n){return Number.isFinite(n)?Number(n.toFixed(1)):null}
function fmtTimer(sec){sec=Math.max(0,Math.floor(sec||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h>0?String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function elapsedSeconds(d){const stop=d.paused&&d.pausedAt?new Date(d.pausedAt).getTime():Date.now();return Math.max(0,Math.floor((stop-new Date(d.startedAt).getTime()-(d.pausedMs||0))/1000))}
function timerRemaining(ex,st){
 if(st.timerActive&&st.timerEnd){const sec=Math.max(0,Math.ceil((new Date(st.timerEnd).getTime()-Date.now())/1000));if(sec<=0){st.timerEnd=null;st.remaining=0;st.timerActive=false;save()}return sec}
 if(st.timerActive)return Math.max(0,st.remaining||0);
 return Number.isFinite(st.remaining)?st.remaining:(Number.isFinite(ex.rest)?ex.rest:90)
}
function startTimer(ex,st,seconds){const sec=Number.isFinite(seconds)?seconds:(Number.isFinite(ex.rest)?ex.rest:90);st.remaining=sec;st.timerActive=true;st.timerEnd=new Date(Date.now()+sec*1000).toISOString();save()}
function stopTimer(ex,st,seconds){const sec=Number.isFinite(seconds)?seconds:(Number.isFinite(ex.rest)?ex.rest:90);st.timerEnd=null;st.timerActive=false;st.remaining=sec;save()}
function paceRemaining(d){
 const p=d.paceTimer||basePace();
 if(p.active&&p.endAt){const sec=Math.max(0,Math.ceil((new Date(p.endAt).getTime()-Date.now())/1000));if(sec<=0){p.endAt=null;p.remaining=0;p.active=false;save()}return sec}
 return Math.max(0,p.remaining||0)
}
function startPaceTimer(d,kind,seconds,label){d.paceTimer={kind,active:true,endAt:new Date(Date.now()+seconds*1000).toISOString(),remaining:seconds,label:label||''};save()}
function clearPaceTimer(d){d.paceTimer=basePace();save()}
function pauseDraft(d){
 if(d.paused)return;const now=Date.now();d.paused=true;d.pausedAt=new Date(now).toISOString();
 const p=d.paceTimer;if(p?.active&&p.endAt){p.remaining=Math.max(0,Math.ceil((new Date(p.endAt).getTime()-now)/1000));p.endAt=null;if(p.remaining<=0)p.active=false}
 const r=ROUTINES[d.routineId];r.exercises.forEach(ex=>{const st=d.exercises[ex.id];if(st?.timerActive&&st.timerEnd){st.remaining=Math.max(0,Math.ceil((new Date(st.timerEnd).getTime()-now)/1000));st.timerEnd=null;if(st.remaining<=0)st.timerActive=false}});
 save()
}
function resumeDraft(d){
 if(!d.paused)return;const now=Date.now(),pausedAt=new Date(d.pausedAt).getTime();d.pausedMs=(d.pausedMs||0)+Math.max(0,now-pausedAt);d.paused=false;d.pausedAt=null;
 const p=d.paceTimer;if(p?.active&&p.remaining>0)p.endAt=new Date(now+p.remaining*1000).toISOString();
 const r=ROUTINES[d.routineId];r.exercises.forEach(ex=>{const st=d.exercises[ex.id];if(st?.timerActive&&st.remaining>0)st.timerEnd=new Date(now+st.remaining*1000).toISOString()});
 save()
}