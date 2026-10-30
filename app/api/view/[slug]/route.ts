import {findLink,canView,privateJson} from '../../../../lib/viewer-access';
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const found=await findLink(slug);
 if(!found)return privateJson({error:'Este enlace está desactivado o ya no existe.'},404);
 const config=JSON.parse(found.experience.config);
 if(!await canView(request,found.link))return privateJson({name:config.name,requireLogin:true},401);
 const asset=(kind:string)=>'/api/view/'+slug+'/asset/'+kind;
 return privateJson({name:config.name,requireLogin:found.link.requireLogin,config:{name:config.name,model:asset('model'),modelName:config.modelName,target:asset('target'),brandLogo:config.brandLogo?asset('brandLogo'):'',scale:config.scale,rx:config.rx,ry:config.ry,rz:config.rz,x:config.x,y:config.y,z:config.z,targetIndex:config.targetIndex,spin:config.spin}});
}
