import {and,eq,sql} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {panelUsers} from '../../../../db/schema';
import {getPanelUser} from '../../../../lib/panel-auth';
import {privateJson,sameOrigin,hashPassword} from '../../../../lib/viewer-access';
const safe=(u:typeof panelUsers.$inferSelect)=>({id:u.id,username:u.username,displayName:u.displayName,role:u.role,active:u.active,created:u.created});
export async function GET(){const actor=await getPanelUser();if(!actor||actor.role!=='admin'||actor.legacy)return privateJson({error:'Acceso exclusivo del administrador'},403);return privateJson((await getDb().select().from(panelUsers)).map(safe))}
export async function POST(request:Request){return write(request,false)}
export async function PATCH(request:Request){return write(request,true)}
async function write(request:Request,editing:boolean){
 if(!sameOrigin(request))return privateJson({error:'Origen inválido'},403);
 const actor=await getPanelUser();if(!actor||actor.role!=='admin'||actor.legacy)return privateJson({error:'Acceso exclusivo del administrador'},403);
 const body=await request.json() as {id?:string;username?:string;displayName?:string;role?:string;active?:boolean;password?:string};
 const username=body.username?.trim().toLowerCase(),displayName=body.displayName?.trim();
 if(!username||!/^[a-z0-9._-]{3,40}$/.test(username)||!displayName||displayName.length>80||!['admin','member'].includes(body.role||'')||typeof body.active!=='boolean'||typeof body.password!=='string'||body.password.length>128)return privateJson({error:'Revisa el usuario, nombre y rol.'},400);
 if((!editing||body.password)&&body.password.length<10)return privateJson({error:'La contraseña necesita al menos 10 caracteres.'},400);
 if(editing&&body.id===actor.userId&&(!body.active||body.role!=='admin'))return privateJson({error:'No puedes desactivar o quitar el rol de tu propia cuenta.'},400);
 const db=getDb(),passwordHash=body.password?await hashPassword(body.password):null;
 try{
  if(editing){
   if(!body.id)return privateJson({error:'Usuario inválido'},400);
   const condition=body.active&&body.role==='admin'?eq(panelUsers.id,body.id):and(eq(panelUsers.id,body.id),sql`(${panelUsers.role} <> 'admin' OR ${panelUsers.active} = 0 OR (SELECT COUNT(*) FROM panel_users WHERE role = 'admin' AND active = 1) > 1)`);
   const result=await db.update(panelUsers).set({username,displayName,role:body.role,active:body.active,revision:sql`${panelUsers.revision}+1`,...(passwordHash?{passwordHash}:{})}).where(condition).returning();
   if(!result.length)return privateJson({error:'Usuario no disponible o es el último administrador activo.'},409);
   return privateJson({ok:true,user:safe(result[0]),signInAgain:body.id===actor.userId});
  }
  const created={id:crypto.randomUUID(),username,displayName,passwordHash:passwordHash!,role:body.role!,active:body.active,revision:1,created:new Date().toISOString()};
  await db.insert(panelUsers).values(created);return privateJson({ok:true,user:safe(created)});
 }catch{return privateJson({error:'No se pudo guardar. Comprueba que el usuario no esté repetido.'},409)}
}
