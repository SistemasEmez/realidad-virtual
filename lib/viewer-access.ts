import {and,eq,gt} from 'drizzle-orm';
import {getDb} from '../db';
import {experiences,experienceLinks,viewerSessions} from '../db/schema';

const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function tokenHash(value:string){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)))}
export async function hashPassword(password:string,salt=hex(crypto.getRandomValues(new Uint8Array(16)).buffer)){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const digest=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256);
 return salt+':'+hex(digest);
}
export async function verifyPassword(password:string,stored:string){
 const calculated=await hashPassword(password,stored.split(':')[0]);
 if(calculated.length!==stored.length)return false;
 let difference=0;for(let i=0;i<stored.length;i++)difference|=stored.charCodeAt(i)^calculated.charCodeAt(i);
 return difference===0;
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin}
export function privateJson(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export function sessionCookieName(id:string){return 'orbita_view_'+id.replace(/[^a-zA-Z0-9]/g,'')}
export async function findLink(slug:string){
 if(!/^[a-f0-9-]{36}$/.test(slug))return null;
 const rows=await getDb().select({link:experienceLinks,experience:experiences}).from(experienceLinks).innerJoin(experiences,eq(experienceLinks.experienceId,experiences.id)).where(and(eq(experienceLinks.slug,slug),eq(experienceLinks.enabled,true)));
 return rows[0]||null;
}
export async function canView(request:Request,link:typeof experienceLinks.$inferSelect){
 if(!link.requireLogin)return true;
 const name=sessionCookieName(link.experienceId);
 const cookie=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
 if(!cookie||!/^[a-f0-9-]{72}$/.test(cookie))return false;
 const sessions=await getDb().select().from(viewerSessions).where(and(eq(viewerSessions.tokenHash,await tokenHash(cookie)),eq(viewerSessions.experienceId,link.experienceId),eq(viewerSessions.revision,link.revision),gt(viewerSessions.expires,Date.now())));
 return sessions.length>0;
}
