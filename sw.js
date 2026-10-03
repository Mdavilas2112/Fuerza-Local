const CACHE='fuerza-tracker-v8';
const ASSETS=[
  './','./index.html','./styles.css','./manifest.webmanifest',
  './routines.js','./data.js','./ui-session-a.js','./ui-session-b.js',
  './ui-progress.js','./ui-calendar.js','./ui-data.js','./icon-192.png','./icon-512.png'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{
    const copy=r.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy));
    return r;
  }).catch(()=>caches.match(e.request)));
});