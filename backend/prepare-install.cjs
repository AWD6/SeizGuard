const fs=require('fs'),crypto=require('crypto'),path=require('path');
const dir=path.join(__dirname,'../.local');fs.mkdirSync(dir,{recursive:true});
const filename=path.join(dir,'Install.gs');if(fs.existsSync(filename))throw Error('Install configuration already exists; preserving existing keys');
const ecdh=crypto.createECDH('prime256v1');ecdh.generateKeys();
const config={registryId:process.argv[2],pepper:crypto.randomBytes(32).toString('hex'),vapidPrivate:ecdh.getPrivateKey('hex'),vapidPublic:ecdh.getPublicKey().toString('base64url'),ownerCode:'SGA-'+crypto.randomBytes(32).toString('base64url')};
if(!config.registryId)throw Error('Registry ID required');
fs.writeFileSync(filename,'\nfunction installSeizGuard(){return SGBackend.install('+JSON.stringify(config)+');}\n');
fs.writeFileSync(path.join(dir,'admin-access.txt'),'SeizGuard owner admin code\n'+config.ownerCode+'\nKeep this private. Do not put it into GitHub or the patient form.\n');
console.log('Prepared private local install configuration and owner access file.');
