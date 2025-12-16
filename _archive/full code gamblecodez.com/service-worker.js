self.addEventListener('install', e => { console.log('Service worker installed'); });
self.addEventListener('fetch', e => { /* Optionally cache fetches here */ });