import {eq,sql} from 'drizzle-orm';
import {getDb} from '../../../../../db';
import {viewerAttempts,viewerSessions} from '../../../../../db/schema';
import {findLink,privateJson,sameOrigin,sessionCookieName,tokenHash,verifyPassword} from '../../../../../lib/viewer-access';
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
 if(!sameOrigin(request))return privateJson({error:'Origen inválido'},403);
 const {slug}=await params;const found=await findLink(slug);if(!found)return privateJson({error:'Enlace no disponible'},404);
 const link=found.link;if(!link.requireLogin)return privateJson({ok:true});
 const body=await request.json() as {username?:string;password?:string};
 if(typeof body.username!=='string'||typeof body.password!=='string'||body.username.length>64||body.password.length>128)return privateJson({error:'Usuario o contraseña incorrectos'},401);
 const db=getDb();const key=await tokenHash(slug+':'+(request.headers.get('cf-connecting-ip')||'local'));
 const now=Date.now();const windowStart=now-15*60*1000;
 const attempt=(await db.insert(viewerAttempts).values({key,count:1,started:now}).onConflictDoUpdate({target:viewerAttempts.key,set:{count:sql`CASE WHEN ${viewerAttempts.started} < ${windowStart} THEN 1 ELSE ${viewerAttempts.count} + 1 END`,started:sql`CASE WHEN ${viewerAttempts.started} < ${windowStart} THEN ${now} ELSE ${viewerAttempts.started} END`}}).returning())[0];
 if(attempt.count>10)return privateJson({error:'Demasiados intentos. Vuelve a intentarlo en 15 minutos.'},429);
 const valid=link.passwordHash?await verifyPassword(body.password,link.passwordHash):false;
 if(!valid||body.username.trim()!==link.username)return privateJson({error:'Usuario o contraseña incorrectos'},401);
 await db.delete(viewerAttempts).where(eq(viewerAttempts.key,key));
 const token=crypto.randomUUID()+crypto.randomUUID();
 await db.insert(viewerSessions).values({tokenHash:await tokenHash(token),experienceId:link.experienceId,revision:link.revision,expires:now+8*60*60*1000});
 const secure=new URL(request.url).protocol==='https:'?'; Secure':'';
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookieName(link.experienceId)+'='+token+'; HttpOnly; SameSite=Lax; Path=/api/view/'+slug+'; Max-Age=28800'+secure}});
}
export async function DELETE(request:Request,{params}:{params:Promise<{slug:string}>}){
 if(!sameOrigin(request))return privateJson({error:'Origen inválido'},403);
 const {slug}=await params;const found=await findLink(slug);if(!found)return privateJson({ok:true});
 const name=sessionCookieName(found.link.experienceId);const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
 if(token)await getDb().delete(viewerSessions).where(eq(viewerSessions.tokenHash,await tokenHash(token)));
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':name+'=; HttpOnly; SameSite=Lax; Path=/api/view/'+slug+'; Max-Age=0'}});
}
