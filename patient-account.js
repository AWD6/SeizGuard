/* Central patient accounts. Each device receives its own revocable token. */
window.SeizGuardCloud=(()=>{
 let applying=false,timer=null,debounce=null,connected=false,health=null,inflight=null,generation=0;
 const normalize=value=>value.trim().normalize('NFKC').toLowerCase();
 async function publicRequest(action,data={}){
   const endpoint=window.SEIZGUARD_CLOUD?.endpoint;if(!endpoint)throw new Error('ยังไม่ได้เชื่อมส่วนกลาง');
   const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...data}),credentials:'omit',cache:'no-store',signal:typeof AbortSignal.timeout==='function'?AbortSignal.timeout(25000):undefined});
   const result=await r.json();if(!result.ok){const e=new Error(result.error||'เชื่อมต่อไม่สำเร็จ');e.code=result.code;throw e;}return result.data;
 }
 function request(action,data={}){const a=loadUsers()[currentUser];if(!a?.cloudAccount||!a.cloudToken)throw new Error('กรุณาเข้าสู่ระบบผู้ป่วยอีกครั้ง');return publicRequest(action,{patientId:a.seizguardId,patientToken:a.cloudToken,...data});}
 function setStatus(message){const el=document.getElementById('cloudStatus');if(el)el.textContent=message;}
 function pending(){return getObj('cloudPending')||{medications:{},events:{}};}
 function doseKey(e){return 'dose:'+e.medicationId+':'+e.date+':'+(e.scheduledTime||e.time);}
 function eventKey(e){return e.type==='dose'?doseKey(e):e.type+':'+e.id;}
 function wireEvent(key,e){return {id:e.id,type:{medLogs:'dose',seizureLogs:'seizure',sideEffectLogs:'side_effect'}[key],date:e.date,time:key==='medLogs'?e.scheduledTime:e.time,medicationId:e.medicationId||'',status:e.status||'',takenTime:e.takenTime||'',duration:e.duration||'',symptoms:e.symptoms||e.effects||[],severity:e.severity||0,notes:e.notes||''};}
 function queueItem(q,kind,key,value){q[kind][key]={...value,_change:crypto.randomUUID()};}
 function recordChange(key,before,after){
   if(applying||!currentUser)return;const q=pending();
   if(key==='medications'){
     const previous=new Map(before.map(m=>[m.id,m]));
     for(const m of after){const old=previous.get(m.id);if(m.source!=='clinician'&&JSON.stringify(m)!==JSON.stringify(old))queueItem(q,'medications',m.id,{...m,active:true});previous.delete(m.id);}
     for(const m of previous.values())if(m.source!=='clinician')queueItem(q,'medications',m.id,{...m,active:false});
   }else if(['medLogs','seizureLogs','sideEffectLogs'].includes(key)){
     const previous=new Map(before.map(e=>[e.id,JSON.stringify(e)]));
     for(const e of after){if(previous.get(e.id)===JSON.stringify(e)||key==='medLogs'&&!['taken','missed'].includes(e.status))continue;const value=wireEvent(key,e);queueItem(q,'events',eventKey(value),value);}
   }else return;
   setObj('cloudPending',q);
 }
 function seedLegacy(){const q=pending();for(const m of getData('medications'))if(m.source!=='clinician')queueItem(q,'medications',m.id,{...m,active:true});for(const key of ['medLogs','seizureLogs','sideEffectLogs'])for(const e of getData(key)){if(key==='medLogs'&&!['taken','missed'].includes(e.status))continue;const value=wireEvent(key,e);queueItem(q,'events',eventKey(value),value);}setObj('cloudPending',q);}
 function applyState(data){
   applying=true;
   try{
     const q=pending(),meds=new Map(data.medications.filter(m=>m.active).map(m=>[m.id,m]));
     for(const m of Object.values(q.medications)){const remote=data.medications.find(x=>x.id===m.id);if(remote?.source==='clinician'||remote?.active===false)continue;if(m.active)meds.set(m.id,m);else meds.delete(m.id);}
     setData('medications',[...meds.values()].map(m=>({...m,frequency:m.times.length})));
     const map=new Map(),localDoses=new Map(getData('medLogs').map(e=>[doseKey(e),e]));
     for(const e of data.events||[]){const value={...e,id:e.clientId||e.id.slice(data.patientId.length+1)},key=eventKey(value);if(map.get(key)?.status==='taken'&&value.status!=='taken')continue;map.set(key,value);}
     for(const e of Object.values(q.events)){const key=eventKey(e);if(map.get(key)?.status==='taken'&&e.status!=='taken')continue;map.set(key,e);}
     const doses=[],seizures=[],effects=[];
     for(const e of map.values()){
       if(e.type==='dose')doses.push({id:localDoses.get(doseKey(e))?.id||e.id,medicationId:e.medicationId,date:e.date,scheduledTime:e.time,status:e.status,takenTime:e.takenTime||null});
       if(e.type==='seizure')seizures.push({id:e.id,date:e.date,time:e.time,duration:e.duration,symptoms:e.symptoms,severity:e.severity,notes:e.notes||''});
       if(e.type==='side_effect')effects.push({id:e.id,date:e.date,time:e.time,medicationId:e.medicationId,effects:e.symptoms,severity:e.severity,notes:e.notes||''});
     }
     for(const e of localDoses.values())if(e.status==='pending'&&!map.has(doseKey(e)))doses.push(e);
     setData('medLogs',doses);setData('seizureLogs',seizures);setData('sideEffectLogs',effects);
     const profile=getObj('profile')||{};profile.nextAppointment=data.nextAppointment;setObj('profile',profile);setObj('confirmedAllergies',data.allergies||[]);
   }finally{applying=false;}
 }
 function moveLocalData(from,id){for(const key of ['medications','medLogs','seizureLogs','sideEffectLogs','profile','reminderPrefs','confirmedAllergies','cloudPending']){const old='seizguard_'+from+'_'+key,value=localStorage.getItem(old);if(value!==null){localStorage.setItem('seizguard_patient_'+id+'_'+key,value);localStorage.removeItem(old);}}}
 async function authenticate(rawName,pin,register=false,legacyName=null){
   const name=normalize(rawName),users=loadUsers(),localKey=legacyName||Object.keys(users).find(k=>normalize(k)===name&&!users[k].cloudAccount),legacy=localKey&&users[localKey];
   if(!/^[\p{L}\p{M}\p{N}._-]{3,40}$/u.test(name)){const e=new Error('ชื่อผู้ใช้ต้องมี 3–40 ตัว ใช้ตัวอักษร ตัวเลข จุด ขีดกลาง หรือขีดล่าง โดยไม่มีช่องว่าง');e.code='USERNAME_INVALID';if(legacy)e.legacyName=localKey;throw e;}
   if(!/^\d{6}$/.test(pin))throw new Error('PIN ต้องเป็นตัวเลข 6 หลัก');
   if(legacy){if(!legacy.pinSalt||!legacy.pinHash)throw new Error('บัญชีเก่านี้ยังไม่มี PIN ที่ตรวจสอบได้ กรุณาติดต่อผู้ดูแล');if(await hashPin(pin,legacy.pinSalt)!==legacy.pinHash)throw new Error('ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');}
   const params=await publicRequest('patient.auth.parameters',{username:name}),proof=await hashPin(pin,params.salt);let auth;
   if(legacy&&!legacy.cloudToken){legacy.cloudToken=bytesToHex(crypto.getRandomValues(new Uint8Array(32)));saveUsers(users);}
   try{auth=await publicRequest(legacy?'patient.auth.migrate':register?'patient.auth.register':'patient.auth.login',{username:name,proof,...(legacy?{patientId:legacy.seizguardId,patientToken:legacy.cloudToken}:{})});}
   catch(e){if(legacy&&e.code==='USERNAME_TAKEN')e.legacyName=localKey;throw e;}
   stop();if(legacy)moveLocalData(localKey,auth.patientId);if(localKey&&localKey!==auth.username)delete users[localKey];
   users[auth.username]={seizguardId:auth.patientId,cloudToken:auth.patientToken,cloudAccount:true,expiresAt:auth.expiresAt};saveUsers(users);
   currentUser=auth.username;localStorage.setItem('seizguard_currentUser',currentUser);if(legacy)seedLegacy();
   // Hydrate before rendering. A blank new device must never replace the existing plan.
   await sync();return {migrated:!!legacy};
 }
 async function sync(){
   if(!currentUser)return;if(inflight)return inflight;const activeUser=currentUser,runGeneration=generation;
   const work=async()=>{
     const sent=pending(),meds=Object.values(sent.medications),events=Object.values(sent.events),batches=Math.max(1,Math.ceil(meds.length/100),Math.ceil(events.length/400));let data;
     for(let i=0;i<batches;i++){
       const batchMeds=meds.slice(i*100,(i+1)*100),batchEvents=events.slice(i*400,(i+1)*400);
       data=await request('patient.sync',{syncVersion:2,medications:batchMeds,events:batchEvents});if(currentUser!==activeUser||generation!==runGeneration)return;
       const q=pending();for(const [kind,values] of [['medications',batchMeds],['events',batchEvents]])for(const value of values){const key=kind==='medications'?value.id:eventKey(value);if(q[kind][key]?._change===value._change)delete q[kind][key];}setObj('cloudPending',q);
     }
     if(currentUser!==activeUser||generation!==runGeneration)return;applyState(data);connected=true;
     setStatus((data.clinicMatched?'เชื่อมผู้ดูแลแล้ว':'บันทึกกับบัญชีแล้ว · รอพยาบาลจับคู่ SeizGuard ID')+' · อัปเดตล่าสุด '+getTimeStr());
     if(document.getElementById('tabHome')?.classList.contains('active'))renderHome();if(document.getElementById('tabAssess')?.classList.contains('active'))renderAssess();
   };
   let succeeded=false;inflight=work();try{await inflight;succeeded=true;}catch(e){setStatus(e.message);throw e;}finally{inflight=null;if(succeeded&&currentUser===activeUser&&generation===runGeneration)changed();}
 }
 function card(){
   const container=document.querySelector('#tabProfile .content-scroll');if(!container)return;
   if(document.getElementById('cloudCard')){document.getElementById('reminderLead').value=(getObj('reminderPrefs')||{lead:30}).lead;return;}
   const el=document.createElement('section');el.className='detail-card';el.id='cloudCard';el.innerHTML='<h4>บัญชีและการแจ้งเตือนยา</h4><p>ใช้ชื่อผู้ใช้และ PIN เดิมบนเครื่องอื่น เพื่อดูแผนยาและบันทึกที่ซิงก์แล้ว</p><p id="cloudStatus"></p><button type="button" class="btn-primary" id="retryCloud">เชื่อมข้อมูลอีกครั้ง</button><label class="field-label" for="reminderLead">แจ้งล่วงหน้าก่อนรับประทานยา</label><select class="field-input" id="reminderLead"><option value="0">เมื่อถึงเวลา</option><option value="5">5 นาที</option><option value="10">10 นาที</option><option value="15">15 นาที</option><option value="30">30 นาที</option><option value="60">60 นาที</option></select><button type="button" class="btn-primary btn-large" id="enableReminders">เปิดแจ้งเตือนแม้ปิดแอป</button><button type="button" class="btn-primary" id="testReminder" style="margin-top:10px">ทดสอบการแจ้งเตือน</button><button type="button" class="btn-primary" id="disableReminders" style="margin-top:10px">ปิดแจ้งเตือนเครื่องนี้</button><p style="font-size:12px;color:var(--text3)">เปิดแจ้งเตือนแยกในแต่ละเครื่อง · iPhone/iPad ต้องเพิ่มแอปไปยังหน้าจอโฮมก่อน การส่งขึ้นกับอินเทอร์เน็ตและการตั้งค่าเครื่อง การแจ้งเตือนแสดงชื่อยา เวลา และขนาดตามแผน ซึ่งอาจมองเห็นบนหน้าจอล็อก</p>';
   container.append(el);document.getElementById('retryCloud').onclick=start;document.getElementById('reminderLead').value=(getObj('reminderPrefs')||{lead:30}).lead;document.getElementById('enableReminders').onclick=enable;document.getElementById('testReminder').onclick=test;document.getElementById('disableReminders').onclick=disable;
 }
 function urlBytes(value){const s=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(s,c=>c.charCodeAt(0));}
 async function registration(){if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw new Error('เบราว์เซอร์นี้ยังไม่รองรับ Push; บน iPhone ให้เปิดจากไอคอนที่เพิ่มบนหน้าจอโฮม');await navigator.serviceWorker.register('sw.js');return navigator.serviceWorker.ready;}
 async function enable(){try{if(!connected)throw new Error('ต้องเชื่อมส่วนกลางให้สำเร็จก่อนเปิดแจ้งเตือน');const allowed=await Notification.requestPermission();if(allowed!=='granted')throw new Error('ยังไม่ได้อนุญาตแจ้งเตือน โปรดตรวจการตั้งค่าเบราว์เซอร์');const reg=await registration(),sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBytes(health.vapidPublic)}),lead=Number(document.getElementById('reminderLead').value);await request('patient.subscribe',{subscription:sub.toJSON(),leadMinutes:lead});setObj('reminderPrefs',{lead,enabled:true});setStatus('เปิดแจ้งเตือนเครื่องนี้แล้ว · ล่วงหน้า '+lead+' นาที');}catch(e){setStatus(e.message);}}
 async function disable(){try{const reg=await registration(),sub=await reg.pushManager.getSubscription();if(sub){await request('patient.unsubscribe',{endpoint:sub.endpoint});await sub.unsubscribe();}setObj('reminderPrefs',{lead:30,enabled:false});setStatus('ปิดแจ้งเตือนเครื่องนี้แล้ว');}catch(e){setStatus(e.message);}}
 async function test(){try{if(!('Notification' in window))throw new Error('เบราว์เซอร์ยังไม่รองรับ');const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('ยังไม่ได้อนุญาตแจ้งเตือน');const reg=await registration(),sub=await reg.pushManager.getSubscription();if(connected&&sub){await request('patient.testPush',{endpoint:sub.endpoint});setStatus('ส่ง Push ทดสอบจากส่วนกลางแล้ว ตรวจข้อความบนเครื่องนี้');}else{await reg.showNotification('SeizGuard · ทดสอบแจ้งเตือน',{body:'นี่คือข้อความทดสอบในเครื่อง ยังไม่ได้ทดสอบ Push จากส่วนกลาง',icon:'pill-icon.svg'});setStatus('ทดสอบแจ้งเตือนในเครื่องแล้ว');}}catch(e){setStatus(e.message);}}
 async function start(){clearInterval(timer);card();try{health=await publicRequest('health');await sync();if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.getRegistration(),sub=await reg?.pushManager.getSubscription();if(sub)await request('patient.subscribe',{subscription:sub.toJSON(),leadMinutes:Number(document.getElementById('reminderLead')?.value||30)});}timer=setInterval(()=>sync().catch(()=>{}),60000);}catch(e){setStatus(e.message);}}
 function changed(){if(applying||!currentUser||!Object.values(pending()).some(items=>Object.keys(items).length))return;clearTimeout(debounce);debounce=setTimeout(()=>sync().catch(()=>{}),2000);}
 function stop(){generation++;clearInterval(timer);clearTimeout(debounce);connected=false;}
 async function logout(){
   if(inflight)await inflight;if(Object.values(pending()).some(items=>Object.keys(items).length))await sync();
   if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.getRegistration(),sub=await reg?.pushManager.getSubscription();if(sub){await request('patient.unsubscribe',{endpoint:sub.endpoint}).catch(()=>{});await sub.unsubscribe();}}
   await request('patient.logout');stop();const users=loadUsers();if(users[currentUser]){delete users[currentUser].cloudToken;saveUsers(users);}
 }
 async function resume(){const a=loadUsers()[currentUser];if(!a?.cloudAccount||!a.cloudToken||a.expiresAt<=Date.now())return false;try{await sync();return true;}catch(_){return false;}}
 window.addEventListener('online',()=>{if(currentUser)start();});
 return {authenticate,resume,start,stop,recordChange,changed,sync,logout};
})();
