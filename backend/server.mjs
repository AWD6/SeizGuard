import { gcm } from '@noble/ciphers/aes';
import { hkdf } from '@noble/hashes/hkdf';
import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';

const TABLES=['Admins','Patients','Medications','Events','Subscriptions','Audit','Sent','Accounts','PatientSessions'];
const fail=(message='ไม่ได้รับอนุญาต')=>{throw new Error(message);};
const props=()=>PropertiesService.getScriptProperties();
let cachedBook,recordCache={};
const book=()=>cachedBook||(cachedBook=SpreadsheetApp.openById(props().getProperty('REGISTRY_ID')));
function table(name){if(!TABLES.includes(name))fail();let s=book().getSheetByName('SG_'+name);if(!s&&['Accounts','PatientSessions'].includes(name)){s=book().insertSheet('SG_'+name);s.getRange(1,1,1,2).setValues([['id','record']]);s.setFrozenRows(1);s.hideSheet?.();}return s;}
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
function patient(body){
 const id=patientId(body.patientId),p=find('Patients',id),secret=text(body.patientToken,120);if(!p)fail();
 if(p.accountId){const s=find('PatientSessions',hmac(secret));if(!s||s.patientId!==id||s.accountId!==p.accountId||s.revoked||s.expiresAt<=Date.now())fail('กรุณาเข้าสู่ระบบผู้ป่วยอีกครั้ง');}
 else if(!constantEqual(p.tokenHash,hmac(secret)))fail();return p;
}
function accountError(code,message){const e=new Error(message);e.code=code;throw e;}
function username(value){const v=text(value,100).normalize('NFKC').toLowerCase();if(!/^[\p{L}\p{M}\p{N}._-]{3,40}$/u.test(v))accountError('USERNAME_INVALID','ชื่อผู้ใช้ต้องมี 3–40 ตัว ใช้ตัวอักษร ตัวเลข จุด ขีดกลาง หรือขีดล่าง โดยไม่มีช่องว่าง');return v;}
function accountKey(name){return hmac('patient-account:'+name);}
function pinSalt(name){return Array.from(sha256(utf8(hmac('patient-pin-salt:'+name))).slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');}
function pinProof(value){const v=text(value,64);if(!/^[a-f0-9]{64}$/.test(v))fail('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');return v;}
function newPatientId(){for(let n=0;n<10;n++){const hex=Utilities.getUuid().replace(/-/g,'').slice(0,16).toUpperCase(),id='SG-'+hex.match(/.{4}/g).join('-');if(!find('Patients',id)&&!identity(id))return id;}fail('สร้างรหัสไม่สำเร็จ กรุณาลองใหม่');}
function issuePatientSession(a){const secret=token(),expiresAt=Date.now()+30*86400000;put('PatientSessions',hmac(secret),{accountId:a.id,patientId:a.patientId,expiresAt,revoked:false});return {username:a.username,patientId:a.patientId,patientToken:secret,expiresAt};}
function patientState(p){return {patientId:p.id,clinicMatched:!!identity(p.id),medications:records('Medications').filter(m=>m.patientId===p.id),events:records('Events').filter(e=>e.patientId===p.id),nextAppointment:p.nextAppointment||'',allergies:p.allergies||[]};}
function patientAuth(b){
 const name=username(b.username),key=accountKey(name);
 // Return the same deterministic salt for known and unknown names; never reveal a PIN verifier.
 if(b.action==='patient.auth.parameters')return {salt:pinSalt(name),iterations:120000};
 const proof=pinProof(b.proof),a=find('Accounts',key);
 if(b.action==='patient.auth.login'){
   if(a&&Date.now()<(a.lockUntil||0))fail('ลอง PIN ผิดหลายครั้ง กรุณารอ 15 นาที');
   if(!a||!constantEqual(a.pinHash,hmac('patient-pin:'+proof))){
     if(a){const count=Date.now()-(a.failureStart||0)<900000?(a.failures||0)+1:1;put('Accounts',key,{...a,failures:count,failureStart:count===1?Date.now():a.failureStart,lockUntil:count>=5?Date.now()+900000:0});}
     fail('ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');
   }
   put('Accounts',key,{...a,failures:0,lockUntil:0});return issuePatientSession(a);
 }
 if(!['patient.auth.register','patient.auth.migrate'].includes(b.action))fail('ไม่พบคำสั่ง');
 if(a){
   // A network retry after a successful migration keeps the same account and ID.
   if(b.action==='patient.auth.migrate'&&a.patientId===b.patientId&&constantEqual(a.migrationHash,hmac(text(b.patientToken,120)))&&constantEqual(a.pinHash,hmac('patient-pin:'+proof)))return issuePatientSession(a);
   accountError('USERNAME_TAKEN','ชื่อผู้ใช้นี้มีบัญชีกลางแล้ว กรุณาใช้ชื่อผู้ใช้อื่น');
 }
 let id,prior;
 if(b.action==='patient.auth.migrate'){
   id=patientId(b.patientId);prior=find('Patients',id);if(prior?.accountId)fail('บัญชีนี้ย้ายเข้าส่วนกลางแล้ว กรุณาเข้าสู่ระบบด้วยบัญชีเดิม');
   const legacy=text(b.patientToken,120);if(!/^[a-f0-9]{64}$/.test(legacy)||prior&&!constantEqual(prior.tokenHash,hmac(legacy)))fail('ยืนยันบัญชีเดิมไม่สำเร็จ กรุณาใช้เครื่องเดิมที่ลงทะเบียน');
 }else id=newPatientId();
 const account={username:name,patientId:id,pinHash:hmac('patient-pin:'+proof),...(b.action==='patient.auth.migrate'?{migrationHash:hmac(b.patientToken)}:{}),createdAt:new Date().toISOString(),failures:0,lockUntil:0};
 put('Accounts',key,account);put('Patients',id,{...(prior||{leadMinutes:30,createdAt:new Date().toISOString(),target:null,allergies:[]}),accountId:key,tokenHash:null});
 recordNewPatientId(id,name,account.createdAt);
 audit(id,b.action==='patient.auth.migrate'?'patient-account-migrated':'patient-account-created',id);return issuePatientSession({...account,id:key});
}
function recordNewPatientId(id){
 const s=book().getSheetByName('SeizGuard_IDs')||book().insertSheet('SeizGuard_IDs');
 if(s.getLastRow()<1){s.getRange(1,1,1,1).setValues([['SeizGuard ID']]);s.setFrozenRows(1);}
 const rows=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,1).getValues():[];
 if(!rows.some(r=>r[0]===id))s.getRange(s.getLastRow()+1,1,1,1).setValues([[id]]);
}
function linkPatientIdentity(id,hnValue,nameValue){
 const cleanId=patientId(id),cleanHn=text(hnValue,50),cleanName=text(nameValue,120);
 if(!cleanHn||!cleanName)fail('ระบุ HN และชื่อ-นามสกุล');if(/^[=+@]/.test(cleanHn)||/^[=+@]/.test(cleanName))fail('รูปแบบชื่อหรือ HN ไม่ถูกต้อง');if(!find('Patients',cleanId))fail('ไม่พบ ID ผู้ลงทะเบียน');
 const s=book().getSheetByName('ทะเบียนผู้ป่วย')||book().insertSheet('ทะเบียนผู้ป่วย');
 if(s.getLastRow()<1){
   s.getRange(1,1,1,3).setValues([['SeizGuard ID','HN','ชื่อ-นามสกุล']]);
   s.setFrozenRows?.(1);
 }
 const rows=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,3).getValues():[];
 const idx=rows.findIndex(r=>r[0]===cleanId);
 if(rows.filter(r=>r[0]===cleanId).length>1)fail('พบรหัสซ้ำในทะเบียน');if(idx>=0){const range=s.getRange(idx+2,1,1,3);range.setNumberFormat?.('@');range.setValues([[cleanId,cleanHn,cleanName]]);}
 else {const range=s.getRange(s.getLastRow()+1,1,1,3);range.setNumberFormat?.('@');range.setValues([[cleanId,cleanHn,cleanName]]);}
 const prior=find('Patients',cleanId);
 if(!prior)put('Patients',cleanId,{leadMinutes:30,createdAt:new Date().toISOString(),target:null,allergies:[]});
 recordNewPatientId(cleanId,find('Accounts',prior?.accountId)?.username||'',prior?.createdAt);
 return {patientId:cleanId,hn:cleanHn,name:cleanName};
}
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
 if(b.action.startsWith('patient.auth.'))return patientAuth(b);
 if(b.action==='admin.owner.rotate'){
   const a=authenticateAdmin(b.currentCode,true),newCode=text(b.newCode,100);if(newCode.length<5||/\s/.test(newCode))fail('รหัสใหม่ต้องมีอย่างน้อย 5 ตัว และไม่มีช่องว่าง');put('Admins',a.id,{...a,keyHash:hmac(newCode)});audit(a.id,'admin-key-rotated','');return {rotated:true};
 }
 if(b.action==='admin.login'){
   const a=authenticateAdmin(b.adminCode),cache=CacheService.getScriptCache();
   const session=token();cache.put('session:'+hmac(session),JSON.stringify({id:a.id,keyHash:a.keyHash}),1800);audit(a.id,'login',b.patientId||'');
   let view=null;
   if(b.patientId&&b.patientId.trim()){
     const id=patientId(b.patientId);
     view=summary(id);
     audit(a.id,'view',id);
   }
   return {session,role:a.role,label:a.label,patient:view};
 }
 if(b.action.startsWith('admin.')){
   const a=admin(b.session,b.action.startsWith('admin.access.'));
   if(b.action==='admin.logout'){CacheService.getScriptCache().remove('session:'+hmac(b.session));return {};}
   if(b.action==='admin.patients.all'){
     const sheet=book().getSheetByName('ทะเบียนผู้ป่วย');
     const regRows=sheet&&sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,3).getValues().filter(r=>r[0]):[];
     const regMap=new Map(regRows.map(r=>[r[0],{hn:r[1],name:r[2]}]));
     const pList=records('Patients'),aList=records('Accounts');
     const allIds=new Set([...pList.map(p=>p.id),...regRows.map(r=>r[0])]);
     const result=[];
     for(const id of allIds){
       const p=pList.find(x=>x.id===id),acc=aList.find(x=>x.patientId===id),reg=regMap.get(id);
       result.push({patientId:id,username:acc?.username||'',linked:!!reg,hn:reg?.hn||'',name:reg?.name||'',createdAt:p?.createdAt||acc?.createdAt||''});
     }
     return result.sort((x,y)=>(y.createdAt||'').localeCompare(x.createdAt||''));
   }
   if(b.action==='admin.patient.link'){
     const res=linkPatientIdentity(b.patientId,b.hn,b.name||((b.firstName||'')+' '+(b.lastName||'')).trim());
     audit(a.id,'patient-linked',res.patientId);
     let pSummary=null;try{pSummary=summary(res.patientId);}catch(_){}
     return {linked:true,...res,patient:pSummary};
   }
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
   const id=patientId(b.patientId),secret=text(b.patientToken,120);if(!identity(id))fail('รอพยาบาลจับคู่รหัสในทะเบียนก่อน แล้วกดเชื่อมข้อมูลอีกครั้ง');if(!/^[a-f0-9]{64}$/.test(secret))fail('โทเคนไม่ถูกต้อง');const prior=find('Patients',id);if(prior&&(prior.accountId||!constantEqual(prior.tokenHash,hmac(secret))))fail();if(!prior)put('Patients',id,{tokenHash:hmac(secret),leadMinutes:30,createdAt:new Date().toISOString(),target:null,allergies:[]});return {enrolled:true};
 }
 const p=patient(b);
 if(b.action==='patient.state')return patientState(p);
 if(b.action==='patient.logout'){
   const key=hmac(b.patientToken),s=find('PatientSessions',key);if(s)put('PatientSessions',key,{...s,revoked:true});
   for(const sub of records('Subscriptions').filter(s=>s.patientId===p.id&&s.sessionId===key))put('Subscriptions',sub.id,{...sub,active:false});return {};
 }
 if(b.action==='patient.sync'){
   if(!Array.isArray(b.events)||b.events.length>500||!Array.isArray(b.medications)||b.medications.length>100)fail('ข้อมูลมากเกินไป');
   if(p.accountId&&b.syncVersion!==2)fail('กรุณารีเฟรชแอปเพื่อใช้ระบบบัญชีใหม่');
   for(const m of b.medications){const med=cleanMedication(m),prior=find('Medications',med.id);if(prior&&(prior.patientId!==p.id||prior.source==='clinician'||!prior.active))continue;put('Medications',med.id,{...med,pillCount:Math.max(0,Math.min(100000,Number(m.pillCount)||0)),notes:text(m.notes||'',500),patientId:p.id,source:'patient',startedAt:prior?.startedAt||new Date().toISOString(),stoppedAt:med.active?null:new Date().toISOString()});}
   if(b.syncVersion!==2)for(const old of records('Medications').filter(m=>m.patientId===p.id&&m.source==='patient'))if(!b.medications.some(m=>m.id===old.id))put('Medications',old.id,{...old,active:false,stoppedAt:old.stoppedAt||new Date().toISOString()});
   for(const event of b.events){
     if(!['dose','seizure','side_effect'].includes(event.type))fail('ประเภทบันทึกไม่ถูกต้อง');const clientId=safeRecordId(event.id),e={patientId:p.id,clientId,type:event.type,date:text(event.date,10),time:text(event.time||'',8),medicationId:text(event.medicationId||'',80),status:text(event.status||'',20),takenTime:text(event.takenTime||'',8),duration:text(event.duration||'',50),symptoms:Array.isArray(event.symptoms)?event.symptoms.slice(0,30).map(x=>text(x,120)):[],severity:Math.max(0,Math.min(5,Number(event.severity)||0)),receivedAt:new Date().toISOString()};
     e.notes=text(event.notes||'',1000);if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date))fail('วันที่ไม่ถูกต้อง');if(e.type==='dose'&&!['taken','missed'].includes(e.status))continue;
     const id=e.type==='dose'?p.id+':dose:'+e.medicationId+':'+e.date+':'+e.time:p.id+':'+clientId;
     const existing=e.type==='dose'?records('Events').find(x=>x.patientId===p.id&&x.type==='dose'&&x.medicationId===e.medicationId&&x.date===e.date&&x.time===e.time):find('Events',id);
     if(existing?.status==='taken'&&e.status!=='taken')continue;put('Events',existing?.id||id,{...e,id:existing?.id||id});
   }
   return patientState(p);
 }
 if(b.action==='patient.subscribe'){
   const endpoint=text(b.subscription?.endpoint,2000);if(!validPushEndpoint(endpoint))fail('ปลายทาง Push ไม่ถูกต้อง');const lead=Number(b.leadMinutes);if(![0,5,10,15,30,60].includes(lead))fail('เวลาเตือนไม่ถูกต้อง');put('Patients',p.id,{...p,leadMinutes:lead});const id=hmac(endpoint);const keys=pushKeys(b.subscription?.keys);put('Subscriptions',id,{keys,patientId:p.id,sessionId:hmac(b.patientToken),endpoint,active:true,updatedAt:new Date().toISOString()});return {subscribed:true};
 }
 if(b.action==='patient.unsubscribe'){const endpoint=text(b.endpoint,2000),s=find('Subscriptions',hmac(endpoint));if(s&&s.patientId===p.id)put('Subscriptions',s.id,{...s,active:false});return {};}
 if(b.action==='patient.testPush'){
   const endpoint=text(b.endpoint,2000),s=find('Subscriptions',hmac(endpoint));if(!s||!s.active||s.patientId!==p.id)fail('เปิดแจ้งเตือนเครื่องนี้ก่อนทดสอบ');
   const cache=CacheService.getScriptCache(),limit='push-test:'+p.id;if(cache.get(limit))fail('รอหนึ่งนาทีก่อนทดสอบซ้ำ');cache.put(limit,'1',60);
   const med=records('Medications').find(m=>m.patientId===p.id&&m.active);const r=sendPush(s,med?reminderMessage(med,med.times[0],true):{title:'SeizGuard · ทดสอบการแจ้งเตือน',body:'ยังไม่มีแผนยาในบัญชีนี้'});const status=r.getResponseCode();if(status<200||status>=300)fail('บริการ Push ยังไม่รับคำขอ ('+status+')');return {accepted:true};
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
const concat=(...parts)=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
function decode64(s){if(typeof s!=='string'||s.length>200)fail('กุญแจ Push ไม่ถูกต้อง');return new Uint8Array(Utilities.base64DecodeWebSafe(s).map(b=>(b+256)%256));}
function pushKeys(keys){if(!keys)return null;const pub=decode64(keys.p256dh),auth=decode64(keys.auth);if(pub.length!==65||pub[0]!==4||auth.length!==16)fail('กุญแจ Push ไม่ถูกต้อง');p256.ProjectivePoint.fromHex(pub);return {p256dh:keys.p256dh,auth:keys.auth};}
export function reminderMessage(med,time,test=false){return {title:'ใกล้ถึงเวลารับประทานยาของท่านแล้ว',body:(test?'[ทดสอบ]\n':'')+'ชื่อยา: '+med.name+'\nเวลา: '+time+' น.\nขนาด/วิธีรับประทาน: '+med.dosage,tag:'seizguard-'+med.id+'-'+time};}
export function encryptPush(keys,message){
 const ua=decode64(keys.p256dh),auth=decode64(keys.auth);let secret;do{secret=sha256(utf8(token()));}while(!p256.utils.isValidPrivateKey(secret));
 const pub=p256.getPublicKey(secret,false),shared=p256.getSharedSecret(secret,ua,true).slice(1),salt=sha256(utf8(token())).slice(0,16);
 const ikm=hkdf(sha256,shared,auth,concat(utf8('WebPush: info\0'),ua,pub),32);
 const key=hkdf(sha256,ikm,salt,utf8('Content-Encoding: aes128gcm\0'),16),nonce=hkdf(sha256,ikm,salt,utf8('Content-Encoding: nonce\0'),12);
 const plain=concat(utf8(JSON.stringify(message)),new Uint8Array([2]));if(plain.length>3900)fail('ข้อความแจ้งเตือนยาวเกินไป');
 return concat(salt,new Uint8Array([0,0,16,0,65]),pub,gcm(key,nonce).encrypt(plain));
}
function sendPush(sub,message){
 const headers={Authorization:vapidAuthorization(sub.endpoint),TTL:'120',Urgency:'high'};const options={method:'post',headers,muteHttpExceptions:true};
 if(sub.keys){headers['Content-Encoding']='aes128gcm';options.contentType='application/octet-stream';options.payload=Array.from(encryptPush(sub.keys,message),b=>b>127?b-256:b);}
 return UrlFetchApp.fetch(sub.endpoint,options);
}
export function dueSlots(med,lead,now){
 const date=Utilities.formatDate(new Date(now),'Asia/Bangkok','yyyy-MM-dd');const start=Date.parse(date+'T00:00:00+07:00');const out=[];
 for(const offset of [0,1])for(const t of med.times){const [h,m]=t.split(':').map(Number),dose=start+offset*86400000+(h*60+m)*60000,at=dose-lead*60000;if(now>=at&&now<at+5*60000)out.push({date:Utilities.formatDate(new Date(dose),'Asia/Bangkok','yyyy-MM-dd'),time:t});}
 return out;
}
export function sendReminders(){
 recordCache={};cachedBook=null;
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
 const tasks=[],now=Date.now();
 try{
  const patients=records('Patients'),meds=records('Medications').filter(m=>m.active),events=records('Events');
  const sent=new Set(records('Sent').filter(s=>now-Number(s.at)<7*86400000&&s.status!=='failed'&&(s.status!=='pending'||now-Number(s.at)<4*60000)).map(s=>s.id));
  for(const sub of records('Subscriptions').filter(s=>s.active)){
   const p=patients.find(p=>p.id===sub.patientId);if(!p)continue;
   for(const med of meds.filter(m=>m.patientId===p.id))for(const slot of dueSlots(med,p.leadMinutes??30,now)){
    const key=sub.id+':'+med.id+':'+slot.date+':'+slot.time;
    if(sent.has(key)||events.some(e=>e.patientId===p.id&&e.medicationId===med.id&&e.type==='dose'&&e.date===slot.date&&e.time===slot.time&&e.status==='taken'))continue;
    put('Sent',key,{at:now,status:'pending'});sent.add(key);tasks.push({key,sub,med,time:slot.time});
   }
  }
 }finally{lock.releaseLock();}
 // Network requests can take seconds. Keep them outside the lock used by patient login.
 const results=tasks.map(task=>{
  try{return {...task,status:sendPush(task.sub,reminderMessage(task.med,task.time)).getResponseCode()};}
  catch(e){console.error('SeizGuard Push failed: '+e.message);return {...task,status:0};}
 });
 if(!results.length)return;
 if(!lock.tryLock(2000))return; // A pending claim expires while the five-minute reminder window is still open.
 try{
  recordCache={};cachedBook=null;
  for(const result of results){
   put('Sent',result.key,{at:now,status:result.status>=200&&result.status<300?'sent':'failed'});
   if([404,410].includes(result.status))put('Subscriptions',result.sub.id,{...result.sub,active:false});
  }
 }finally{lock.releaseLock();}
}
export function handle(body){
 recordCache={};cachedBook=null;
 // These requests use script properties only and do not need the Sheets write lock.
 if(body?.action==='health'||body?.action==='patient.auth.parameters'){
  try{return {ok:true,data:dispatch(body)};}catch(e){return {ok:false,error:e.message,...(e.code?{code:e.code}:{})};}
 }
 const lock=LockService.getScriptLock();if(!lock.tryLock(8000))return {ok:false,error:'ระบบกำลังใช้งาน กรุณาลองใหม่',code:'BUSY'};
 try{return {ok:true,data:dispatch(body)};}catch(e){return {ok:false,error:e.message,...(e.code?{code:e.code}:{})};}finally{lock.releaseLock();}
}
