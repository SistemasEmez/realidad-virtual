import {eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {panelSessions} from '../../../../db/schema';
import {tokenHash,sameOrigin} from '../../../../lib/viewer-access';
export async function POST(request:Request){
 if(!sameOrigin(request))return new Response(null,{status:403});
 const token=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('orbita_panel='))?.slice(13);
 if(token)await getDb().delete(panelSessions).where(eq(panelSessions.tokenHash,await tokenHash(token)));
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':'orbita_panel=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'}});
}
