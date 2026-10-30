import {randomBytes} from 'node:crypto';
// Explicit local provisioning only; no fixed password is shipped or saved here.
const base='http://localhost:5173';
const signIn=await fetch(base+'/signin-with-chatgpt?return_to=%2F',{redirect:'manual'});
const cookie=signIn.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
if(!cookie)throw Error('Open local development sign-in before provisioning the owner account.');
const password=randomBytes(18).toString('base64url');
const response=await fetch(base+'/api/auth/setup',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',displayName:'Administrador',password})});
const result=await response.json();
if(!response.ok)throw Error(result.error||'Administrator was not created. Existing credentials are unchanged.');
process.stdout.write(JSON.stringify({created:true,username:'admin',password}));
