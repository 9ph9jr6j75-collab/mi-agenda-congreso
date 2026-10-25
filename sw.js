const CACHE_PREFIX='cmn2026:'+self.registration.scope+':';
const CACHE=CACHE_PREFIX+'v7';
const ASSETS=['./','index.html','styles.css?v=6','personal.css?v=6','app.js?v=6','agenda.json','manifest.webmanifest','icon.svg','robot.svg','icon-192.png','icon-512.png','guia-cmn-2026.pdf'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.endsWith('programa-cmn-2026.pdf'))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('index.html')));return;}
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
