import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../chatgpt-auth';
export async function GET(request:Request,{params}:{params:Promise<{key:string[]}>}){
 const user=await getChatGPTUser();if(!user)return new Response(null,{status:401});
 const {key}=await params;if(key[0]!==user.userId)return new Response(null,{status:403});
 const object=await env.BUCKET!.get(key.join('/'));if(!object)return new Response(null,{status:404});
 const headers=new Headers();object.writeHttpMetadata(headers);headers.set('Cache-Control','private, max-age=3600');headers.set('X-Content-Type-Options','nosniff');
 return new Response(object.body,{headers});
}
