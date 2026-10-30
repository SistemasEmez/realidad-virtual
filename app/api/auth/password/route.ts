import {eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {panelUsers} from '../../../../db/schema';
import {getPanelUser,issuePanelSession,allowAttempt} from '../../../../lib/panel-auth';
import {sameOrigin,privateJson,verifyPassword,hashPassword} from '../../../../lib/viewer-access';
export async function POST(request:Request){
 if(!sameOrigin(request))return privateJson({error:'Origen inválido'},403);
 const actor=await getPanelUser();if(!actor||actor.legacy)return privateJson({error:'Inicia sesión con tu usuario del panel.'},401);
 if(!(await allowAttempt(request,'panel-password:'+actor.userId)).allowed)return privateJson({error:'Demasiados intentos. Espera 15 minutos.'},429);
 const body=await request.json() as {currentPassword?:string;newPassword?:string};
 if(typeof body.currentPassword!=='string'||typeof body.newPassword!=='string'||body.currentPassword.length>128||body.newPassword.length<10||body.newPassword.length>128)return privateJson({error:'Usa una contraseña nueva de 10 a 128 caracteres.'},400);
 const user=(await getDb().select().from(panelUsers).where(eq(panelUsers.id,actor.userId)))[0];
 if(!await verifyPassword(body.currentPassword,user.passwordHash))return privateJson({error:'La contraseña actual es incorrecta.'},401);
 const updated={...user,passwordHash:await hashPassword(body.newPassword),revision:user.revision+1};
 await getDb().update(panelUsers).set({passwordHash:updated.passwordHash,revision:updated.revision}).where(eq(panelUsers.id,user.id));
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':await issuePanelSession(updated,request)}});
}
