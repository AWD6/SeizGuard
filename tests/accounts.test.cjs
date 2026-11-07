const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),fs=require('node:fs');
const {runtime}=require('./helpers/backend-runtime.cjs');
function auth(r,action,name='patient-test',pin='482619',extra={}){
 const salt=r.api.handle({action:'patient.auth.parameters',username:name}).data.salt;
 return r.api.handle({action:'patient.auth.'+action,username:name,proof:crypto.pbkdf2Sync(pin,Buffer.from(salt,'hex'),120000,32,'sha256').toString('hex'),...extra});
}
const request=(r,a,action,data={})=>r.api.handle({action,patientId:a.patientId,patientToken:a.patientToken,...data});
const medication={id:'test-med-1',name:'Synthetic medicine A',dosage:'TEST DATA ONLY',times:['08:00','20:00'],active:true};
const dose={id:'dose-device-a',type:'dose',date:'2026-11-07',time:'08:00',medicationId:medication.id,status:'taken',takenTime:'08:05'};
test('new registrations enter an ID-only sheet; only authenticated admins can link an identity',()=>{
 const r=runtime(),a=auth(r,'register').data,rows=r.book.getSheetByName('SeizGuard_IDs').data;
 assert.equal(rows[0].length,1);assert.equal(rows[1][0],a.patientId);
 assert.equal(r.api.handle({action:'admin.patient.link',patientId:a.patientId,hn:'TEST-001',name:'SYNTHETIC ONLY'}).ok,false);
 const session=r.api.handle({action:'admin.login',adminCode:r.key}).data.session;
 assert.equal(r.api.handle({action:'admin.patients.all',session}).data.find(p=>p.patientId===a.patientId).linked,false);
 assert.equal(r.api.handle({action:'admin.patient.link',session,patientId:a.patientId,hn:'TEST-001',name:'SYNTHETIC ONLY'}).ok,true);
 assert.equal(r.api.handle({action:'admin.patient',session,patientId:a.patientId}).data.hn,'TEST-001');
 assert(!JSON.stringify(request(r,a,'patient.state')).includes('TEST-001'));
 assert.equal(rows.length,2);assert.equal(rows[1].length,1);
});
test('global username uniqueness, own state only, separate revocable device sessions and expiry',()=>{
 const r=runtime(),a=auth(r,'register').data,b=auth(r,'login','PATIENT-TEST').data;
 assert.equal(a.patientId,b.patientId);assert.notEqual(a.patientToken,b.patientToken);
 assert.equal(auth(r,'register','Patient-Test').code,'USERNAME_TAKEN');
 assert.equal(request(r,a,'patient.sync',{syncVersion:2,medications:[medication],events:[dose]}).ok,true);
 const state=request(r,b,'patient.state').data;assert.equal(state.medications.length,1);assert.equal(state.events[0].takenTime,'08:05');assert.equal(state.clinicMatched,false);
 assert(!JSON.stringify(state).includes('TEST-HN'));assert(!JSON.stringify(state).includes('pinHash'));assert(!JSON.stringify(state).includes('patientToken'));
 const other=auth(r,'register','other-patient').data;
 assert.equal(request(r,{...other,patientId:a.patientId},'patient.state').ok,false);
 assert.equal(request(r,a,'patient.logout').ok,true);assert.equal(request(r,a,'patient.state').ok,false);assert.equal(request(r,b,'patient.state').ok,true);
 const sessions=r.book.getSheetByName('SG_PatientSessions').data;const at=sessions.findIndex((row,index)=>index>0&&row[1]&&JSON.parse(row[1]).patientId===b.patientId&&!JSON.parse(row[1]).revoked);
 const record=JSON.parse(sessions[at][1]);record.expiresAt=Date.now()-1;sessions[at][1]=JSON.stringify(record);assert.equal(request(r,b,'patient.state').ok,false);
 const stored=JSON.stringify(r.book.getSheetByName('SG_Accounts').data);assert(!stored.includes('482619'));assert(!stored.includes(a.patientToken));
});
test('PIN failures persist per account and do not lock a different patient',()=>{
 const r=runtime();auth(r,'register');auth(r,'register','other-patient');
 for(let i=0;i<5;i++)assert.equal(auth(r,'login','patient-test','111111').ok,false);
 const blocked=auth(r,'login');assert.equal(blocked.ok,false);assert.match(blocked.error,/15/);assert.equal(auth(r,'login','other-patient').ok,true);
});
test('migration proves the legacy token, preserves clinic ID, survives retries and rejects legacy access afterward',()=>{
 const r=runtime(),pid='SG-AAAA-BBBB-CCCC-DDDD',patientToken='a'.repeat(64);
 r.api.handle({action:'patient.enroll',patientId:pid,patientToken});
 assert.equal(auth(r,'migrate','old-patient','482619',{patientId:pid,patientToken:'b'.repeat(64)}).ok,false);
 const result=auth(r,'migrate','old-patient','482619',{patientId:pid,patientToken});assert.equal(result.ok,true);assert.equal(result.data.patientId,pid);
 assert.equal(request(r,result.data,'patient.state').data.clinicMatched,true);
 assert.equal(auth(r,'migrate','old-patient','482619',{patientId:pid,patientToken}).data.patientId,pid);
 assert.equal(r.api.handle({action:'patient.enroll',patientId:pid,patientToken}).ok,false);
 assert.equal(r.api.handle({action:'patient.state',patientId:pid,patientToken}).ok,false);
 assert.equal(auth(r,'login','old-patient').data.patientId,pid);
});
test('patch sync never deletes another device plan, revives stopped medicines, overwrites clinician plans or duplicates a dose',()=>{
 const r=runtime(),a=auth(r,'register').data,b=auth(r,'login').data;
 request(r,a,'patient.sync',{syncVersion:2,medications:[medication],events:[dose]});
 assert.equal(request(r,b,'patient.sync',{syncVersion:2,medications:[],events:[]}).data.medications[0].active,true);
 request(r,b,'patient.sync',{syncVersion:2,medications:[],events:[{...dose,id:'another-device-id'}]});
 assert.equal(request(r,a,'patient.state').data.events.length,1);
 request(r,b,'patient.sync',{syncVersion:2,medications:[],events:[{...dose,status:'pending'}]});
 assert.equal(request(r,a,'patient.state').data.events[0].status,'taken');
 request(r,b,'patient.sync',{syncVersion:2,medications:[{...medication,active:false}],events:[]});
 request(r,a,'patient.sync',{syncVersion:2,medications:[medication],events:[]});assert.equal(request(r,b,'patient.state').data.medications[0].active,false);
 const registry=r.book.getSheetByName('ทะเบียนผู้ป่วย');registry.data.push([a.patientId,'SYNTHETIC-HN','SYNTHETIC ONLY']);
 const session=r.api.handle({action:'admin.login',adminCode:r.key,patientId:a.patientId}).data.session;
 r.api.handle({action:'admin.medication',session,patientId:a.patientId,medication:{...medication,id:'clinician-plan'}});
 const state=request(r,b,'patient.sync',{syncVersion:2,medications:[{...medication,id:'clinician-plan',active:false}],events:[]}).data;
 assert.equal(state.medications.find(m=>m.id==='clinician-plan').active,true);assert.equal(request(r,a,'patient.sync',{medications:[],events:[]}).ok,false);
});
function client(r){
 const storage=new Map(),localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),key:i=>[...storage.keys()][i],get length(){return storage.size;}};
 const context={console,crypto:crypto.webcrypto,Uint8Array,TextEncoder,AbortSignal,localStorage,navigator:{},currentUser:null,getTimeStr:()=> '12:00',renderHome(){},renderAssess(){},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},document:{getElementById:()=>null,querySelector:()=>null}};
 context.window={SEIZGUARD_CLOUD:{endpoint:'test'},addEventListener(){}};
 context.loadUsers=()=>Object.assign(Object.create(null),JSON.parse(localStorage.getItem('seizguard_users')||'{}'));
 context.saveUsers=users=>localStorage.setItem('seizguard_users',JSON.stringify(users));
 const key=k=>{const a=context.loadUsers()[context.currentUser];return a?.cloudAccount?'seizguard_patient_'+a.seizguardId+'_'+k:'seizguard_'+context.currentUser+'_'+k;};
 context.getData=k=>JSON.parse(localStorage.getItem(key(k))||'[]');context.getObj=k=>JSON.parse(localStorage.getItem(key(k))||'null');
 context.setObj=(k,v)=>localStorage.setItem(key(k),JSON.stringify(v));
 context.setData=(k,v)=>{context.window.SeizGuardCloud?.recordChange(k,context.getData(k),v);localStorage.setItem(key(k),JSON.stringify(v));};
 context.hashPin=async(pin,salt)=>crypto.pbkdf2Sync(pin,Buffer.from(salt,'hex'),120000,32,'sha256').toString('hex');context.bytesToHex=bytes=>Buffer.from(bytes).toString('hex');
 context.fetch=async(_url,options)=>({json:async()=>JSON.parse(JSON.stringify(r.api.handle(JSON.parse(options.body))))});
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../patient-account.js','utf8'),context);return {...context,c:context,cloud:context.window.SeizGuardCloud,storage};
}
test('two independent client stores restore plans, dose history and assessments; stale devices keep newer data',async()=>{
 const r=runtime(),a=client(r),b=client(r);
 await a.cloud.authenticate('patient-test','482619',true);const pid=a.c.loadUsers()['patient-test'].seizguardId;
 a.c.setData('medications',[medication]);a.c.setData('medLogs',[{id:'local-a',date:dose.date,scheduledTime:'08:00',status:'taken',medicationId:medication.id,takenTime:'08:05'}]);
 a.c.setData('seizureLogs',[{id:'seizure-a',date:'2026-11-07',time:'10:00',symptoms:['synthetic'],duration:'TEST',severity:1,notes:'TEST ONLY'}]);await a.cloud.sync();
 await b.cloud.authenticate('PATIENT-TEST','482619');assert.equal(b.c.loadUsers()['patient-test'].seizguardId,pid);assert.equal(b.c.getData('medications')[0].name,medication.name);assert.equal(b.c.getData('medLogs')[0].status,'taken');assert.equal(b.c.getData('seizureLogs')[0].notes,'TEST ONLY');
 a.c.setData('medications',[...a.c.getData('medications'),{...medication,id:'new-med'}]);await a.cloud.sync();await b.cloud.sync();assert.equal(b.c.getData('medications').length,2);
 b.c.setData('medications',b.c.getData('medications').filter(m=>m.id!==medication.id));await b.cloud.sync();await a.cloud.sync();assert.equal(a.c.getData('medications').length,1);
 await b.cloud.logout();assert.equal(await a.cloud.resume(),true);assert.equal(await b.cloud.resume(),false);
});
test('a stale mobile account without a PIN verifier can use an existing cloud login without uploading old local data',async()=>{
 const r=runtime(),central=auth(r,'register').data,mobile=client(r),oldId='SG-1111-2222-3333-4444';
 mobile.c.saveUsers({'patient-test':{seizguardId:oldId}});
 mobile.storage.set('seizguard_patient-test_medications',JSON.stringify([{...medication,id:'old-local-only'}]));
 await mobile.cloud.authenticate('patient-test','482619');
 assert.equal(mobile.c.loadUsers()['patient-test'].seizguardId,central.patientId);
 assert.equal(mobile.c.loadUsers()['__legacy__patient-test'].seizguardId,oldId);
 assert.equal(mobile.storage.has('seizguard_patient-test_medications'),true);
 assert.equal(request(r,central,'patient.state').data.medications.length,0);
});
test('temporary backend contention is retried without repeating an accepted registration',async()=>{
 const r=runtime(),mobile=client(r),original=mobile.c.fetch;let busy=2,registrations=0;
 mobile.c.setTimeout=callback=>{callback();return 1;};
 mobile.c.fetch=async(url,options)=>{
  const action=JSON.parse(options.body).action;
  if(action==='patient.auth.parameters'&&busy>0){busy--;return {json:async()=>({ok:false,error:'ระบบกำลังใช้งาน กรุณาลองใหม่'})};}
  if(action==='patient.auth.register')registrations++;
  return original(url,options);
 };
 await mobile.cloud.authenticate('new-mobile-user','482619',true);
 assert.equal(registrations,1);
 assert.equal(busy,0);
});
test('legacy client migration carries local records to a new device without changing its matched ID',async()=>{
 const r=runtime(),a=client(r),b=client(r),pid='SG-AAAA-BBBB-CCCC-DDDD',patientToken='a'.repeat(64),salt='ab'.repeat(16);
 r.api.handle({action:'patient.enroll',patientId:pid,patientToken});
 a.c.saveUsers({'Old-Local':{seizguardId:pid,cloudToken:patientToken,pinSalt:salt,pinHash:await a.c.hashPin('482619',salt)}});a.c.currentUser='Old-Local';a.c.setData('medications',[medication]);a.c.setData('medLogs',[{id:'old-log',date:dose.date,scheduledTime:'08:00',status:'taken',medicationId:medication.id}]);
 await a.cloud.authenticate('Old-Local','482619');assert.equal(a.c.loadUsers()['old-local'].seizguardId,pid);assert.equal(a.c.loadUsers()['old-local'].pinHash,undefined);
 await b.cloud.authenticate('old-local','482619');assert.equal(b.c.getData('medications')[0].id,medication.id);assert.equal(b.c.getData('medLogs')[0].status,'taken');
 assert.equal(a.storage.has('seizguard_Old-Local_medications'),false);
});
test('a change made during an upload is kept pending and sent on the next sync',async()=>{
 const r=runtime(),a=client(r);await a.cloud.authenticate('patient-test','482619',true);
 a.c.setData('medications',[medication]);const original=a.c.fetch;let release,arrived;
 const waiting=new Promise(resolve=>arrived=resolve);a.c.fetch=async(url,options)=>{if(JSON.parse(options.body).action==='patient.sync'){await new Promise(resolve=>{release=resolve;arrived();});}return original(url,options);};
 const flight=a.cloud.sync();await waiting;a.c.setData('medications',[{...medication,dosage:'UPDATED WHILE UPLOADING'}]);release();await flight;
 assert.equal(a.c.getData('medications')[0].dosage,'UPDATED WHILE UPLOADING');assert.equal(Object.keys(a.c.getObj('cloudPending').medications).length,1);
 a.c.fetch=original;await a.cloud.sync();const b=client(r);await b.cloud.authenticate('patient-test','482619');assert.equal(b.c.getData('medications')[0].dosage,'UPDATED WHILE UPLOADING');
});
test('a colliding legacy username cannot merge into a different cloud account; choosing a new name preserves its ID',async()=>{
 const r=runtime(),a=client(r);auth(r,'register','patient-test');const salt='ab'.repeat(16),pid='SG-AAAA-BBBB-CCCC-DDDD',patientToken='a'.repeat(64);
 r.api.handle({action:'patient.enroll',patientId:pid,patientToken});a.c.saveUsers({'patient-test':{seizguardId:pid,cloudToken:patientToken,pinSalt:salt,pinHash:await a.c.hashPin('482619',salt)}});
 await assert.rejects(a.cloud.authenticate('patient-test','482619'),e=>e.code==='USERNAME_TAKEN'&&e.legacyName==='patient-test');
 assert.equal(a.c.loadUsers()['patient-test'].cloudAccount,undefined);
 await a.cloud.authenticate('new-name','482619',false,'patient-test');assert.equal(a.c.loadUsers()['new-name'].seizguardId,pid);
});
