const CACHE_NAME="2024-01-30 09:30",urlsToCache=["/number-kanji/","/number-kanji/ja/","/number-kanji/index.js","/number-kanji/mp3/boyon1.mp3","/number-kanji/mp3/pa1.mp3","/number-kanji/mp3/papa1.mp3","/number-kanji/mp3/levelup1.mp3","/number-kanji/favicon/favicon.svg"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})