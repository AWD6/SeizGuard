import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';

const TABLES=['Admins','Patients','Medications','Events','Subscriptions','Audit','Sent'];
const fail=(message='ไม่ได้รับอนุญาต')=>{throw new Error(message);};
const props=()=>PropertiesService.getScriptProperties();
let cachedBook,recordCache={};
const book=()=>cachedBook||(cachedBook=SpreadsheetApp.openById(props().getProperty('REGISTRY_ID')));
function table(name){if(!TABLES.includes(name))fail();return book().getSheetByName('SG_'+name);}
function records(name){if(recordCache[name])return recordCache[name];const s=table(name);recordCache[name]=s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,2).getValues().filter(r=>r[0]).map(r=>JSON.parse(r[1]));return recordCache[name];}
function comparable(r){return JSON.stringify(Object.keys(r).filter(k=>!['updatedAt','receivedAt'].includes(k)).sort().map(k=>[k,r[k]]));}
function put(name,id,value){const list=records(name),at=list.findIndex(r=>r.id===id),record={...value,id};if(at>=0&&comparable(list[at])===comparable(record))return;table(name).getRange(at<0?list.length+2:at+2,1,1,2).setValues([[id,JSON.stringify(record)]]);if(at<0)list.push(record);else list[at]=record;}
function find(name,id){return records(name).find(r=>r.id===id);}
function hmac(value){return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value,props().getProperty('PEPPER'))).replace(/=+$/,'');}
function token(){return hmac(Utilities.getUuid()+Utilities.getUuid()+Date.now());}
function constantEqual(a,b){if(typeof a!=='string'||typeof b!=='string')return false;let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
function text(value,max=200){if(typeof value!=='string'||value.length>max)fail('รูปแบบข้อมูลไม่ถูกต้อง');return value.trim();}
function safeRecordId(value){const id=text(value,80);if(!/^[A-Za-z0-9_-]{1,80}$/.test(id))fail('รหัสรายการไม่ถูกต้อง');return id;}
function patientId(value){const v=text(value,40);if(!/^SG-[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/.test(v))fail('รหัส SeizGuard ไม่ถูกต้อง');return v;}
function audit(actor,action,id){const key=Utilities.getUuid();put('Audit',key,{actor,action,patientId:id||'',at:new Date().toISOString()});}
function admin(session,owner=false){const raw=CacheService.getScriptCache().get('session:'+hmac(text(session,100)));if(!raw)fail('กรุณาเข้าสู่ระบบอีกครั้ง');let saved;try{saved=JSON.parse(raw);}catch(_){fail('กรุณาเข้าสู่ระบบอีกครั้ง');}const a=find('Admins',saved.id);if(!a||!a.approved||!constantEqual(a.keyHash,saved.keyHash)||owner&&a.role!=='owner')fail('สิทธิ์หรือรหัสเปลี่ยนแล้ว กรุณาเข้าสู่ระบบใหม่');return a;}
function authenticateAdmin(code,ownerOnly=false){
 const now=Date.now(),p=props();let guard;try{guard=JSON.parse(p.getProperty('ADMIN_LOGIN_GUARD')||'{}');}catch(_){guard={};}
 if(now<(guard.lockUntil||0))fail('ลองรหัสผิดหลายครั้ง กรุณารอ 15 นาที');
 const a=records('Admins').find(a=>a.approved&&constantEqual(a.keyHash,hmac(text(code,100))));
 if(!a||ownerOnly&&a.role!=='owner'){
   if(!guard.start||now-guard.start>900000)guard={start:now,count:0};guard.count=(guard.count||0)+1;if(guard.count>=5)guard.lockUntil=now+900000;p.setProperties({ADMIN_LOGIN_GUARD:JSON.stringify(guard)});fail('รหัส admin ไม่ถูกต้อง หรือยังไม่ได้รับอนุมัติ');
 }
 p.setProperties({ADMIN_LOGIN_GUARD:'{}'});return a;
}
function patient(body){const id=patientId(body.patientId);const p=find('Patients',id);if(!p||!constantEqual(p.tokenHash,hmac(text(body.patientToken,120))))fail();return p;}
function identity(id){const sheet=book().getSheetByName('ทะเบียนผู้ป่วย');const rows=sheet.getDataRange().getDisplayValues().slice(1).filter(r=>r[0]===id);if(rows.length>1)fail('พบรหัสซ้ำในทะเบียน กรุณาแก้ก่อนเข้าถึงข้อมูล');return rows[0]?{name:rows[0][2],hn:rows[0][1]}:null;}
function cleanMedication(m){const name=text(m.name,120),dosage=text(m.dosage,120);if(!name||!dosage)fail('ระบุชื่อและขนาดยาตามคำสั่งการรักษา');if(!Array.isArray(m.times)||!m.times.length||m.times.length>12||m.times.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)))fail('เวลาไม่ถูกต้อง');return {id:m.id?safeRecordId(m.id):Utilities.getUuid(),name,dosage,times:[...new Set(m.times)].sort(),active:m.active!==false,source:'clinician',updatedAt:new Date().toISOString()};}
export function calculateAdherence(meds,events,now=Date.now()){
 const date=Utilities.formatDate(new Date(now),'Asia/Bangkok','yyyy-MM-dd'),midnight=Date.parse(date+'T00:00:00+07:00'),expected=new Set();
 for(const med of meds){const start=Date.parse(med.startedAt||new Date(now).toISOString()),stop=med.stoppedAt?Date.parse(med.stoppedAt):Infinity;for(let day=0;day<7;day++)for(const time of med.times){const [h,m]=time.split(':').map(Number),at=midnight-day*86400000+(h*60+m)*60000;if(at>=start&&at<stop&&at<=now){const d=Utilities.formatDate(new Date(at),'Asia/Bangkok','yyyy-MM-dd');expected.add(med.id+':'+d+':'+time);}}}
 const taken=new Set(),outcomes=new Set();for(const e of events.filter(e=>e.type==='dose')){const key=e.medicationId+':'+e.date+':'+e.time;if(expected.has(key)){if(e.status==='taken')taken.add(key);if(['taken','missed'].includes(e.status))outcomes.add(key);}}
 return {taken:taken.size,recorded:outcomes.size,expected:expected.size,missing:expected.size-outcomes.size,percent:expected.size?Math.round(taken.size/expected.size*100):null};
}
function summary(id){const p=find('Patients',id);const who=identity(id);if(!who)fail('ยังไม่จับคู่รหัสในทะเบียนผู้ป่วย');const meds=records('Medications').filter(m=>m.patientId===id);const events=records('Events').filter(e=>e.patientId===id).sort((a,b)=>b.date.localeCompare(a.date));const cutoff=new Date(Date.now()-7*86400000).toISOString().slice(0,10);const recent=events.filter(e=>e.type==='dose'&&e.date>=cutoff&&Date.parse(e.date+'T'+(e.time||'00:00')+':00+07:00')<=Date.now());const taken=recent.filter(e=>e.status==='taken').length;return {patientId:id,...who,connected:!!p,medications:meds,events:events.slice(0,300),nextAppointment:p?.nextAppointment||'',adherence:{...calculateAdherence(meds,events),target:p?.target??null},allergies:p?.allergies||[],notice:'อาการข้างเคียงที่รายงานไม่ใช่การยืนยันแพ้ยาโดยแพทย์'};}

export function install(config){
 if(props().getProperty('REGISTRY_ID'))fail('ติดตั้งแล้ว ไม่เขียนทับการตั้งค่าเดิม');
 for(const key of ['registryId','pepper','vapidPrivate','vapidPublic','ownerCode'])if(!config[key])fail('การตั้งค่าไม่ครบ');
 props().setProperties({REGISTRY_ID:config.registryId,PEPPER:config.pepper,VAPID_PRIVATE:config.vapidPrivate,VAPID_PUBLIC:config.vapidPublic});
 const b=book();for(const name of TABLES){const s=b.getSheetByName('SG_'+name)||b.insertSheet('SG_'+name);s.getRange(1,1,1,2).setValues([['id','record']]);s.setFrozenRows(1);}
 put('Admins','owner',{label:'เจ้าของระบบ',keyHash:hmac(config.ownerCode),approved:true,role:'owner'});
 ScriptApp.newTrigger('sendMedicationReminders').timeBased().everyMinutes(1).create();
 return 'ติดตั้งสำเร็จ';
}

export function dispatch(b){
 if(!b||typeof b.action!=='string')fail('คำขอไม่ถูกต้อง');
 if(b.action==='health')return {ready:!!props().getProperty('REGISTRY_ID'),vapidPublic:props().getProperty('VAPID_PUBLIC')};
 if(b.action==='admin.owner.rotate'){
   const a=authenticateAdmin(b.currentCode,true),newCode=text(b.newCode,100);if(newCode.length<5||/\s/.test(newCode))fail('รหัสใหม่ต้องมีอย่างน้อย 5 ตัว และไม่มีช่องว่าง');put('Admins',a.id,{...a,keyHash:hmac(newCode)});audit(a.id,'admin-key-rotated','');return {rotated:true};
 }
 if(b.action==='admin.login'){
   const a=authenticateAdmin(b.adminCode),cache=CacheService.getScriptCache();
   const id=patientId(b.patientId),view=summary(id),session=token();cache.put('session:'+hmac(session),JSON.stringify({id:a.id,keyHash:a.keyHash}),1800);audit(a.id,'view',id);return {session,role:a.role,label:a.label,patient:view};
 }
 if(b.action.startsWith('admin.')){
   const a=admin(b.session,b.action.startsWith('admin.access.'));
   if(b.action==='admin.logout'){CacheService.getScriptCache().remove('session:'+hmac(b.session));return {};}
   if(b.action==='admin.patient'){const id=patientId(b.patientId);audit(a.id,'view',id);return summary(id);}
   if(b.action==='admin.medication'){
     const id=patientId(b.patientId);if(!identity(id))fail('ยังไม่จับคู่ผู้ป่วย');const med=cleanMedication(b.medication);const prior=find('Medications',med.id);if(prior&&prior.patientId!==id)fail();put('Medications',med.id,{...med,patientId:id,actor:a.id,startedAt:prior?.startedAt||new Date().toISOString(),stoppedAt:med.active?null:(prior?.stoppedAt||new Date().toISOString())});audit(a.id,'medication-change',id);return summary(id);
   }
   if(b.action==='admin.appointment'){
     const id=patientId(b.patientId);const date=text(b.date,10);if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))fail('วันที่ไม่ถูกต้อง');const p=find('Patients',id);if(!p)fail('ผู้ป่วยยังไม่ได้เชื่อมแอป');put('Patients',id,{...p,nextAppointment:date});audit(a.id,'appointment-change',id);return summary(id);
   }
   if(b.action==='admin.allergies'){
     const id=patientId(b.patientId),p=find('Patients',id);if(!p)fail('ผู้ป่วยยังไม่ได้เชื่อมแอป');if(!Array.isArray(b.allergies)||b.allergies.length>20)fail();put('Patients',id,{...p,allergies:b.allergies.map(x=>text(x,120))});audit(a.id,'allergies-change',id);return summary(id);
   }
   if(b.action==='admin.target'){
     const id=patientId(b.patientId),p=find('Patients',id),target=Number(b.target);if(!p)fail('ผู้ป่วยยังไม่ได้เชื่อมแอป');if(!Number.isFinite(target)||target<1||target>100)fail('เป้าหมายต้องอยู่ระหว่าง 1 ถึง 100');put('Patients',id,{...p,target});audit(a.id,'target-change',id);return summary(id);
   }
   if(b.action==='admin.access.list')return records('Admins').map(({id,label,role,approved})=>({id,label,role,approved}));
   if(b.action==='admin.access.create'){
     const id=Utilities.getUuid(),code='SGA-'+token();put('Admins',id,{label:text(b.label,100),role:'clinician',approved:false,keyHash:hmac(code)});audit(a.id,'admin-created',id);return {id,code,approved:false};
   }
   if(b.action==='admin.access.approve'){
     const target=find('Admins',text(b.id,80));if(!target||target.role==='owner')fail();put('Admins',target.id,{...target,approved:b.approved===true});audit(a.id,b.approved?'admin-approved':'admin-revoked',target.id);return {};
   }
   fail();
 }
 if(b.action==='patient.enroll'){
   const id=patientId(b.patientId),secret=text(b.patientToken,120);if(!identity(id))fail('รอพยาบาลจับคู่รหัสในทะเบียนก่อน แล้วกดเชื่อมข้อมูลอีกครั้ง');if(!/^[a-f0-9]{64}$/.test(secret))fail('โทเคนไม่ถูกต้อง');const prior=find('Patients',id);if(prior&&!constantEqual(prior.tokenHash,hmac(secret)))fail();if(!prior)put('Patients',id,{tokenHash:hmac(secret),leadMinutes:30,createdAt:new Date().toISOString(),target:null,allergies:[]});return {enrolled:true};
 }
 const p=patient(b);
 if(b.action==='patient.sync'){
   if(!Array.isArray(b.events)||b.events.length>500||!Array.isArray(b.medications)||b.medications.length>100)fail('ข้อมูลมากเกินไป');
   for(const m of b.medications){const med=cleanMedication(m),prior=find('Medications',med.id);if(prior&&(prior.patientId!==p.id||prior.source==='clinician'))continue;put('Medications',med.id,{...med,patientId:p.id,source:'patient',startedAt:prior?.startedAt||new Date().toISOString(),stoppedAt:null});}
   for(const old of records('Medications').filter(m=>m.patientId===p.id&&m.source==='patient'))if(!b.medications.some(m=>m.id===old.id))put('Medications',old.id,{...old,active:false,stoppedAt:old.stoppedAt||new Date().toISOString()});
   for(const event of b.events){if(!['dose','seizure','side_effect'].includes(event.type))fail('ประเภทบันทึกไม่ถูกต้อง');const id=p.id+':'+text(event.id,80);const e={patientId:p.id,id,type:event.type,date:text(event.date,10),time:text(event.time||'',8),medicationId:text(event.medicationId||'',80),status:text(event.status||'',20),duration:text(event.duration||'',50),symptoms:Array.isArray(event.symptoms)?event.symptoms.slice(0,30).map(x=>text(x,120)):[],severity:Math.max(0,Math.min(5,Number(event.severity)||0)),receivedAt:new Date().toISOString()};if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date))fail('วันที่ไม่ถูกต้อง');put('Events',id,e);}
   const meds=records('Medications').filter(m=>m.patientId===p.id);return {medications:meds,nextAppointment:p.nextAppointment||'',allergies:p.allergies||[]};
 }
 if(b.action==='patient.subscribe'){
   const endpoint=text(b.subscription?.endpoint,2000);if(!validPushEndpoint(endpoint))fail('ปลายทาง Push ไม่ถูกต้อง');const lead=Number(b.leadMinutes);if(![0,5,10,15,30,60].includes(lead))fail('เวลาเตือนไม่ถูกต้อง');put('Patients',p.id,{...p,leadMinutes:lead});const id=hmac(endpoint);put('Subscriptions',id,{patientId:p.id,endpoint,active:true,updatedAt:new Date().toISOString()});return {subscribed:true};
 }
 if(b.action==='patient.unsubscribe'){const endpoint=text(b.endpoint,2000),s=find('Subscriptions',hmac(endpoint));if(s&&s.patientId===p.id)put('Subscriptions',s.id,{...s,active:false});return {};}
 if(b.action==='patient.testPush'){
   const endpoint=text(b.endpoint,2000),s=find('Subscriptions',hmac(endpoint));if(!s||!s.active||s.patientId!==p.id)fail('เปิดแจ้งเตือนเครื่องนี้ก่อนทดสอบ');
   const cache=CacheService.getScriptCache(),limit='push-test:'+p.id;if(cache.get(limit))fail('รอหนึ่งนาทีก่อนทดสอบซ้ำ');cache.put(limit,'1',60);
   const r=UrlFetchApp.fetch(endpoint,{method:'post',headers:{Authorization:vapidAuthorization(endpoint),TTL:'120',Urgency:'high'},muteHttpExceptions:true});const status=r.getResponseCode();if(status<200||status>=300)fail('บริการ Push ยังไม่รับคำขอ ('+status+')');return {accepted:true};
 }
 fail('ไม่พบคำสั่ง');
}
function validPushEndpoint(endpoint){const host=/^https:\/\/([^/:]+)(?::443)?\//.exec(endpoint)?.[1]?.toLowerCase();return !!host&&(host==='fcm.googleapis.com'||host==='updates.push.services.mozilla.com'||host==='web.push.apple.com'||host.endsWith('.push.apple.com')||host.endsWith('.notify.windows.com'));}
const b64=bytes=>Utilities.base64EncodeWebSafe(Array.from(bytes,x=>x>127?x-256:x)).replace(/=+$/,'');
const utf8=s=>new Uint8Array(Utilities.newBlob(s).getBytes().map(x=>(x+256)%256));
export function vapidAuthorization(endpoint,now=Date.now()){
 if(!validPushEndpoint(endpoint))fail('ปลายทาง Push ไม่ถูกต้อง');const aud=/^https:\/\/[^/]+/.exec(endpoint)[0];
 const head=b64(utf8(JSON.stringify({typ:'JWT',alg:'ES256'}))),body=b64(utf8(JSON.stringify({aud,exp:Math.floor(now/1000)+3600,sub:'https://awd6.github.io/SeizGuard/'})));
 const data=head+'.'+body;const sig=p256.sign(sha256(utf8(data)),props().getProperty('VAPID_PRIVATE')).toCompactRawBytes();return 'vapid t='+data+'.'+b64(sig)+', k='+props().getProperty('VAPID_PUBLIC');
}
export function dueSlots(med,lead,now){
 const date=Utilities.formatDate(new Date(now),'Asia/Bangkok','yyyy-MM-dd');const start=Date.parse(date+'T00:00:00+07:00');const out=[];
 for(const offset of [0,1])for(const t of med.times){const [h,m]=t.split(':').map(Number),dose=start+offset*86400000+(h*60+m)*60000,at=dose-lead*60000;if(now>=at&&now<at+5*60000)out.push({date:Utilities.formatDate(new Date(dose),'Asia/Bangkok','yyyy-MM-dd'),time:t});}
 return out;
}
export function sendReminders(){
 recordCache={};cachedBook=null;
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
 try{const now=Date.now(),patients=records('Patients'),meds=records('Medications').filter(m=>m.active),events=records('Events'),sent=new Set(records('Sent').filter(s=>now-s.at<7*86400000).map(s=>s.id));
 for(const sub of records('Subscriptions').filter(s=>s.active)){const p=patients.find(p=>p.id===sub.patientId);if(!p)continue;for(const med of meds.filter(m=>m.patientId===p.id))for(const slot of dueSlots(med,p.leadMinutes??30,now)){
 const key=sub.id+':'+med.id+':'+slot.date+':'+slot.time;if(sent.has(key)||events.some(e=>e.patientId===p.id&&e.medicationId===med.id&&e.type==='dose'&&e.date===slot.date&&e.time===slot.time&&e.status==='taken'))continue;
 const r=UrlFetchApp.fetch(sub.endpoint,{method:'post',headers:{Authorization:vapidAuthorization(sub.endpoint),TTL:'120',Urgency:'high'},muteHttpExceptions:true});const status=r.getResponseCode();if(status>=200&&status<300){put('Sent',key,{at:now});sent.add(key);}else if([404,410].includes(status))put('Subscriptions',sub.id,{...sub,active:false});
 }} }finally{lock.releaseLock();}
}
export function handle(body){recordCache={};cachedBook=null;const lock=LockService.getScriptLock();if(!lock.tryLock(20000))return {ok:false,error:'ระบบกำลังใช้งาน กรุณาลองใหม่'};try{return {ok:true,data:dispatch(body)};}catch(e){return {ok:false,error:e.message};}finally{lock.releaseLock();}}
