import {getDb} from '../../../../db';
import {panelUsers,panelSetup} from '../../../../db/schema';
import {canInitialize,issuePanelSession} from '../../../../lib/panel-auth';
import {sameOrigin,hashPassword,privateJson} from '../../../../lib/viewer-access';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!sameOrigin(request))return privateJson({error:'Origen inválido'},403);
 const owner=await canInitialize();if(!owner)return privateJson({error:'Solo el propietario puede crear el primer administrador. Inicia sesión con ChatGPT.'},403);
 const body=await request.json() as {username?:string;password?:string;displayName?:string};
 const username=body.username?.trim().toLowerCase();
 if(!username||!/^[a-z0-9._-]{3,40}$/.test(username)||typeof body.password!=='string'||body.password.length<10||body.password.length>128)return privateJson({error:'Usa un usuario de 3 a 40 caracteres y una contraseña de al menos 10 caracteres.'},400);
 const user={id:owner.userId,username,displayName:body.displayName?.trim().slice(0,80)||'Administrador',passwordHash:await hashPassword(body.password),role:'admin',active:true,revision:1,created:new Date().toISOString()};
 try{await getDb().batch([getDb().insert(panelSetup).values({key:'administrator',completed:user.created}),getDb().insert(panelUsers).values(user)])}catch{return privateJson({error:'El administrador ya fue configurado. Inicia sesión.'},409)}
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':await issuePanelSession(user,request)}});
}
