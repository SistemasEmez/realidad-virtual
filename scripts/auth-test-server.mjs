import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
// Separate, disposable SQL/R2 state. This never opens the main preview database.
const root=path.resolve('dist/server');
const moduleFiles=(await readdir(root,{recursive:true})).filter(name=>name.endsWith('.js')&&name!=='index.js');
const modules=['index.js',...moduleFiles].map(name=>({type:'ESModule',path:path.join(root,name)}));
const mf=new Miniflare({name:'orbita-auth-verification',modules,modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],host:'127.0.0.1',port:5178,d1Databases:{DB:'verification-db'},r2Buckets:['BUCKET'],cf:false});
const db=await mf.getD1Database('DB');
const schema=(await readFile('database/schema.sql','utf8')).replace(/^--.*$/gm,'');
for(const statement of schema.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
await mf.ready;console.log('Isolated auth verification ready at http://127.0.0.1:5178');
async function stop(){await mf.dispose();process.exit(0)}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
