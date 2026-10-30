import {eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {panelUsers,viewerAttempts} from '../../../../db/schema';
import {allowAttempt,issuePanelSession} from '../../../../lib/panel-auth';
import {sameOrigin,privateJson,verifyPassword} from '../../../../lib/viewer-access';
export async function POST(request:Request){
 if(!sameOrigin(request))return privateJson({error:'Origen inválido'},403);
 const attempt=await allowAttempt(request,'panel-login');if(!attempt.allowed)return privateJson({error:'Demasiados intentos. Espera 15 minutos.'},429);
 const body=await request.json() as {username?:string;password?:string};
 if(typeof body.username!=='string'||typeof body.password!=='string'||body.username.length>40||body.password.length>128)return privateJson({error:'Usuario o contraseña incorrectos'},401);
 const user=(await getDb().select().from(panelUsers).where(eq(panelUsers.username,body.username.trim().toLowerCase())))[0];
 const stored=user?.passwordHash||'unavailable-account-salt:'+('0'.repeat(64));
 const valid=await verifyPassword(body.password,stored);
 if(!user||!valid||!user.active)return privateJson({error:'Usuario o contraseña incorrectos'},401);
 await getDb().delete(viewerAttempts).where(eq(viewerAttempts.key,attempt.key));
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':await issuePanelSession(user,request)}});
}
