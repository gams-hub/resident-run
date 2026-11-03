const C='resident-run-v5', FILES=['./','index.html','app.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','favicon.svg','favicon-32.png','favicon.ico','data.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// network first (so Claude's data.json / app updates show up), cache as offline fallback
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const c2=r.clone();caches.open(C).then(c=>c.put(e.request,c2));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('index.html')))) });
