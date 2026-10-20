// VOWMERA Edition Five — offline static app. A service worker cannot schedule future alarms by itself.
const CACHE='vowmera-v5.0.0';
const APP_FILES=['./','./index.html','./styles.css','./vowmera.css','./edition-five.css','./app.js','./cloud-config.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('ninety-')||k.startsWith('vowen-')||k.startsWith('vowmera-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(event.request)).then(result=>result||Response.error()));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>clients.length?clients[0].focus():self.clients.openWindow('./')))});
