const vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
function runtime(){
 const sheets=new Map(),properties=new Map(),cache=new Map();
 function sheet(name){const data=[];return {data,getLastRow:()=>data.length,getRange(r,c,n=1,w=1){return {getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>data[r-1+i]?.[c-1+j]??'')),setValues(rows){rows.forEach((row,i)=>{data[r-1+i]||=[];row.forEach((v,j)=>data[r-1+i][c-1+j]=v);});}};},getDataRange(){return {getDisplayValues:()=>data.map(r=>r.map(String))};},setFrozenRows(){}};}
 const book={getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=sheet(n);sheets.set(n,s);return s;}};
 const util={getUuid:()=>crypto.randomUUID(),base64DecodeWebSafe:s=>Array.from(Buffer.from(s,"base64url")),base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url'),computeHmacSha256Signature:(s,key)=>Array.from(crypto.createHmac('sha256',key).update(s).digest()),newBlob:s=>({getBytes:()=>Array.from(Buffer.from(s))}),formatDate(d,t,f){return new Intl.DateTimeFormat('en-CA',{timeZone:t,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}};
 const context={console,Uint8Array,Utilities:util,PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k),setProperties:o=>Object.entries(o).forEach(([k,v])=>properties.set(k,v))})},SpreadsheetApp:{openById:()=>book},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},ScriptApp:{newTrigger:()=>({timeBased:()=>({everyMinutes:()=>({create(){}})})})}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../../backend/Code.gs','utf8'),context);
 const ecdh=crypto.createECDH('prime256v1');ecdh.generateKeys();const key='SGA-test-owner-strong-key-only';context.SGBackend.install({registryId:'test',pepper:'test-pepper',vapidPrivate:ecdh.getPrivateKey('hex'),vapidPublic:ecdh.getPublicKey().toString('base64url'),ownerCode:key});const identity=book.insertSheet('ทะเบียนผู้ป่วย');identity.data.push(['ID','HN','name'],['SG-AAAA-BBBB-CCCC-DDDD','TEST-HN','TEST ONLY']);return {api:context.SGBackend,book,key,ecdh,properties};
}

module.exports={runtime};
