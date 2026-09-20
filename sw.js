const CACHE="my-upi-pay-pwa-v2";
const APP=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./icons/icon-192.svg","./icons/icon-512.svg",
"https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
"https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
  }).catch(()=>caches.match("./index.html"))));
});
