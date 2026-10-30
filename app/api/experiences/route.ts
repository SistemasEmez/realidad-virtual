import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { experiences } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
export async function GET() {
 const user = await getChatGPTUser();
 if (!user) return Response.json({error:'Inicia sesión'}, {status:401});
 const rows = await getDb().select().from(experiences).where(eq(experiences.owner,user.userId));
 return Response.json(rows.map(r=>({...JSON.parse(r.config),id:r.id,updated:r.updated})));
}
export async function POST(request:Request) {
 const user = await getChatGPTUser();
 if (!user) return Response.json({error:'Inicia sesión'}, {status:401});
 if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'Origen inválido'},{status:403});
 const c = await request.json() as Record<string,unknown>;
 if (typeof c.id !== 'string' || !/^[\w-]{1,80}$/.test(c.id) || typeof c.name !== 'string' || !c.name.trim() || c.name.length>100) return Response.json({error:'Nombre inválido'},{status:400});
 for (const key of ['scale','rx','ry','rz','x','y','z','targetIndex']) if(typeof c[key]!=='number' || !Number.isFinite(c[key]) || Math.abs(c[key] as number)>100000) return Response.json({error:'Transformación inválida'},{status:400});
 if ((c.scale as number)<=0 || !Number.isInteger(c.targetIndex) || (c.targetIndex as number)<0) return Response.json({error:'Escala o target inválido'},{status:400});
 for (const key of ['model','target','brandLogo']) {
 const val=c[key];
 if (typeof val!=='string' || (val && !val.startsWith('/original/') && !val.startsWith('/api/files/'))) return Response.json({error:'Archivo inválido'},{status:400});
 if(typeof val==='string' && val.startsWith('/api/files/') && !val.startsWith('/api/files/'+encodeURIComponent(user.userId)+'/')) return Response.json({error:'Archivo ajeno'},{status:403});
 }
 const db = getDb();
 const existing=await db.select().from(experiences).where(eq(experiences.id,c.id));
 if(existing.length && existing[0].owner!==user.userId) return Response.json({error:'Sin acceso'},{status:403});
 const updated=new Date().toISOString();
 await db.insert(experiences).values({id:c.id,owner:user.userId,config:JSON.stringify(c),updated}).onConflictDoUpdate({target:experiences.id,set:{config:JSON.stringify(c),updated}});
 return Response.json({ok:true,updated});
}
export async function DELETE(request:Request) {
 const user=await getChatGPTUser(); if(!user)return new Response(null,{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});
 const id=new URL(request.url).searchParams.get('id')||'';
 await getDb().delete(experiences).where(and(eq(experiences.id,id),eq(experiences.owner,user.userId)));
 return Response.json({ok:true});
}
