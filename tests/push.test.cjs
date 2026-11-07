const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{runtime}=require('./helpers/backend-runtime.cjs');
test('encrypted Web Push independently decrypts to the requested medication details',()=>{
 const r=runtime(),ua=crypto.createECDH('prime256v1');ua.generateKeys();const auth=crypto.randomBytes(16),keys={p256dh:ua.getPublicKey().toString('base64url'),auth:auth.toString('base64url')};
 const message=r.api.reminderMessage({id:'example',name:'ยาสมมติ A',dosage:'ขนาดตามใบสั่งตัวอย่าง'},'08:00');
 const payload=Buffer.from(r.api.encryptPush(keys,message)),salt=payload.subarray(0,16),pub=payload.subarray(21,86),secret=ua.computeSecret(pub);
 const derive=(ikm,salt,info,length)=>Buffer.from(crypto.hkdfSync('sha256',ikm,salt,info,length));
 const ikm=derive(secret,auth,Buffer.concat([Buffer.from('WebPush: info\0'),ua.getPublicKey(),pub]),32);
 const key=derive(ikm,salt,Buffer.from('Content-Encoding: aes128gcm\0'),16),nonce=derive(ikm,salt,Buffer.from('Content-Encoding: nonce\0'),12),cipher=payload.subarray(86),dec=crypto.createDecipheriv('aes-128-gcm',key,nonce);dec.setAuthTag(cipher.subarray(-16));
 const plain=Buffer.concat([dec.update(cipher.subarray(0,-16)),dec.final()]);assert.equal(plain.at(-1),2);const result=JSON.parse(plain.subarray(0,-1));assert.equal(result.title,'ใกล้ถึงเวลารับประทานยาของท่านแล้ว');assert.match(result.body,/ยาสมมติ A/);assert.match(result.body,/08:00/);assert.match(result.body,/ขนาดตามใบสั่งตัวอย่าง/);assert(!payload.includes(Buffer.from('ยาสมมติ A')));
});
