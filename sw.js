self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let message={};try{message=event.data?.json()||{};}catch(_){}
 const title=typeof message.title==='string'?message.title:'ใกล้ถึงเวลารับประทานยาของท่านแล้ว';
 event.waitUntil(self.registration.showNotification(title,{body:typeof message.body==='string'?message.body:'เปิดแอปเพื่อตรวจชื่อยา เวลา และขนาดตามแผน',icon:'pill-icon.svg',badge:'pill-icon.svg',tag:message.tag||'seizguard-'+Date.now(),data:{url:self.registration.scope}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const tab of tabs)if(tab.url.startsWith(self.registration.scope)){await tab.focus();return;}await self.clients.openWindow(self.registration.scope);})());
});
