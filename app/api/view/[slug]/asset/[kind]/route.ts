import {env} from 'cloudflare:workers';
import {findLink,canView,privateJson} from '../../../../../../lib/viewer-access';
export async function GET(request:Request,{params}:{params:Promise<{slug:string;kind:string}>}){
 const {slug,kind}=await params;
 if(!['model','target','brandLogo'].includes(kind))return new Response(null,{status:404});
 const found=await findLink(slug);if(!found)return new Response(null,{status:404});
 if(!await canView(request,found.link))return privateJson({error:'Inicia sesión en esta experiencia'},401);
 const url=JSON.parse(found.experience.config)[kind];
 if(typeof url!=='string'||!url)return new Response(null,{status:404});
 if(url.startsWith('/original/'))return Response.redirect(new URL(url,request.url),302);
 if(!url.startsWith('/api/files/'))return new Response(null,{status:404});
 const parts=url.slice('/api/files/'.length).split('/').map(decodeURIComponent);
 if(parts[0]!==found.experience.owner)return new Response(null,{status:403});
 const object=await env.BUCKET!.get(parts.join('/'));if(!object)return new Response(null,{status:404});
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});object.writeHttpMetadata(headers);
 return new Response(object.body,{headers});
}
