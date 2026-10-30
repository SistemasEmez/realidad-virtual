import {eq,and} from 'drizzle-orm';
import {getPanelUser} from '../../../../lib/panel-auth';
import {getDb} from '../../../../db';
import {experiences,experienceLinks} from '../../../../db/schema';
import {hashPassword,privateJson,sameOrigin} from '../../../../lib/viewer-access';

async function owned(id:string){
 const user=await getPanelUser();if(!user)return false;
 const rows=await getDb().select().from(experiences).where(and(eq(experiences.id,id),eq(experiences.owner,user.userId)));
 return rows.length>0;
}
function safe(link:typeof experienceLinks.$inferSelect){return {slug:link.slug,enabled:link.enabled,requireLogin:link.requireLogin,username:link.username,hasPassword:!!link.passwordHash}}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!await owned(id))return privateJson({error:'Guarda la experiencia e inicia sesión para gestionar su enlace.'},403);
 const rows=await getDb().select().from(experienceLinks).where(eq(experienceLinks.experienceId,id));
 return privateJson(rows[0]?safe(rows[0]):{slug:null,enabled:false,requireLogin:true,username:'',hasPassword:false});
}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!sameOrigin(request))return privateJson({error:'Origen inválido'},403);
 const {id}=await params;if(!await owned(id))return privateJson({error:'No tienes acceso a esta experiencia'},403);
 const body=await request.json() as {enabled?:boolean;requireLogin?:boolean;username?:string;password?:string};
 if(typeof body.enabled!=='boolean'||typeof body.requireLogin!=='boolean'||typeof body.username!=='string'||typeof body.password!=='string')return privateJson({error:'Configuración inválida'},400);
 const username=body.username.trim();
 if(username.length>64||body.password.length>128)return privateJson({error:'El usuario admite 64 caracteres y la contraseña 128.'},400);
 const db=getDb();const old=(await db.select().from(experienceLinks).where(eq(experienceLinks.experienceId,id)))[0];
 if(body.password&&body.password.length<8)return privateJson({error:'Usa una contraseña de al menos 8 caracteres.'},400);
 if(body.enabled&&body.requireLogin&&(!username||(!body.password&&!old?.passwordHash)))return privateJson({error:'Define un usuario y una contraseña para proteger este enlace.'},400);
 const passwordHash=body.password?await hashPassword(body.password):old?.passwordHash||null;
 const values={experienceId:id,slug:old?.slug||crypto.randomUUID(),enabled:body.enabled,requireLogin:body.requireLogin,username,passwordHash,revision:(old?.revision||0)+1};
 await db.insert(experienceLinks).values(values).onConflictDoUpdate({target:experienceLinks.experienceId,set:{enabled:values.enabled,requireLogin:values.requireLogin,username,passwordHash,revision:values.revision}});
 return privateJson(safe(values));
}
