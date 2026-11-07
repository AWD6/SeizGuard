self.addEventListener('push',event=>{
 event.waitUntil(self.registration.showNotification('SeizGuard · เตรียมรับประทานยา',{body:'ใกล้ถึงเวลาแล้ว เปิดแอปเพื่อตรวจรายการยาและเวลาที่กำหนด',icon:'pill-icon.svg',badge:'pill-icon.svg',tag:'seizguard-'+Date.now(),data:{url:self.registration.scope}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const tab of tabs)if(tab.url.startsWith(self.registration.scope)){await tab.focus();return;}await self.clients.openWindow(self.registration.scope);})());
});
