import { env } from 'cloudflare:workers';
import {getPanelUser} from '../../../lib/panel-auth';
export async function POST(request:Request){
 const user=await getPanelUser();if(!user)return new Response(null,{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});
 const form=await request.formData();const file=form.get('file');
 if(!(file instanceof File)||file.size>25*1024*1024||!file.size)return Response.json({error:'Sube un archivo de hasta 25 MB'},{status:400});
 const ext=file.name.split('.').pop()?.toLowerCase();
 if(!['glb','mind','png','jpg','jpeg','webp'].includes(ext||''))return Response.json({error:'Formato no compatible'},{status:400});
 const bytes=await file.arrayBuffer(); const header=new Uint8Array(bytes);
 if(ext==='glb'&&String.fromCharCode(...header.slice(0,4))!=='glTF')return Response.json({error:'El archivo GLB no es válido'},{status:400});
 const type=ext==='glb'?'model/gltf-binary':ext==='mind'?'application/octet-stream':ext==='jpg'||ext==='jpeg'?'image/jpeg':'image/'+ext;
 const key=user.userId+'/'+crypto.randomUUID()+'.'+ext;
 await env.BUCKET!.put(key,bytes,{httpMetadata:{contentType:type}});
 return Response.json({url:'/api/files/'+key.split('/').map(encodeURIComponent).join('/'),name:file.name});
}
