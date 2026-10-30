import {cookies} from 'next/headers';
import {and,eq,gt,sql} from 'drizzle-orm';
import {getDb} from '../db';
import {panelUsers,panelSessions,panelSetup,viewerAttempts,experiences} from '../db/schema';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {tokenHash} from './viewer-access';
export type PanelUser={userId:string;displayName:string;username:string;role:'admin'|'member';legacy?:boolean};
export async function setupComplete(){return (await getDb().select().from(panelSetup).where(eq(panelSetup.key,'administrator'))).length>0}
export async function getPanelUser():Promise<PanelUser|null>{
 const db=getDb(),token=(await cookies()).get('orbita_panel')?.value;
 if(token&&/^[a-f0-9-]{72}$/.test(token)){
  const rows=await db.select({user:panelUsers,session:panelSessions}).from(panelSessions).innerJoin(panelUsers,eq(panelSessions.userId,panelUsers.id)).where(and(eq(panelSessions.tokenHash,await tokenHash(token)),gt(panelSessions.expires,Date.now()),eq(panelUsers.active,true)));
  const row=rows[0];if(row&&row.user.revision===row.session.revision)return {userId:row.user.id,displayName:row.user.displayName,username:row.user.username,role:row.user.role==='admin'?'admin':'member'};
 }
 // Keep the existing workspace accessible until its owner creates the SQL admin.
 if(!await setupComplete()){
  const legacy=await getChatGPTUser();
  if(legacy)return {userId:legacy.userId,displayName:legacy.displayName,username:'admin',role:'admin',legacy:true};
 }
 return null;
}
export async function canInitialize(){
 const user=await getChatGPTUser();if(!user)return null;
 if(await setupComplete())return null;
 const owners=await getDb().select({owner:experiences.owner}).from(experiences).groupBy(experiences.owner);
 if(owners.length&&!owners.some(o=>o.owner===user.userId))return null;
 return user;
}
export async function allowAttempt(request:Request,scope:string){
 const key=await tokenHash(scope+':'+(request.headers.get('cf-connecting-ip')||'local'));
 const now=Date.now(),windowStart=now-15*60*1000;
 const row=(await getDb().insert(viewerAttempts).values({key,count:1,started:now}).onConflictDoUpdate({target:viewerAttempts.key,set:{count:sql`CASE WHEN ${viewerAttempts.started} < ${windowStart} THEN 1 ELSE ${viewerAttempts.count} + 1 END`,started:sql`CASE WHEN ${viewerAttempts.started} < ${windowStart} THEN ${now} ELSE ${viewerAttempts.started} END`}}).returning())[0];
 return {allowed:row.count<=10,key};
}
export async function issuePanelSession(user:typeof panelUsers.$inferSelect,request:Request){
 const token=crypto.randomUUID()+crypto.randomUUID();
 await getDb().insert(panelSessions).values({tokenHash:await tokenHash(token),userId:user.id,revision:user.revision,expires:Date.now()+8*60*60*1000});
 return 'orbita_panel='+token+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800'+(new URL(request.url).protocol==='https:'?'; Secure':'');
}
