import {createTargetInspector} from './target-inspector.js';
const input=document.getElementById('images'),previews=document.getElementById('previews'),compileButton=document.getElementById('compile'),downloadButton=document.getElementById('download'),applyButton=document.getElementById('apply'),message=document.getElementById('message'),progressBox=document.getElementById('progress-box');
const inspector=createTargetInspector(document.getElementById('target-analysis'));
let Compiler,files=[],imageUrls=[],output=null,busy=false;
function say(text,state=''){message.textContent=text;message.className=state}
function notify(busy){parent.postMessage({type:'compiler-state',busy},location.origin)}
async function choose(list){
 if(busy)return;
 const selected=Array.from(list);
 if(!selected.length)return;
 if(selected.length>5||selected.some(file=>!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)){say('Selecciona hasta 5 imágenes PNG, JPG o WebP, de hasta 8 MB cada una.','error');return}
 files=selected;output=null;inspector.reset();downloadButton.hidden=true;applyButton.hidden=true;progressBox.hidden=true;say('');
 imageUrls.forEach(url=>URL.revokeObjectURL(url));imageUrls=[];previews.replaceChildren();
 files.forEach((file,index)=>{const url=URL.createObjectURL(file);imageUrls.push(url);const card=document.createElement('div');card.className='preview';const img=document.createElement('img');img.src=url;img.alt=file.name;const badge=document.createElement('span');badge.className='index';badge.textContent='Target '+index;const title=document.createElement('b');title.textContent=file.name;const info=document.createElement('small');info.textContent=(file.size/1024).toFixed(0)+' KB';card.append(img,badge,title,info);previews.append(card)});
 compileButton.disabled=!Compiler;compileButton.textContent='Generar '+(files.length===1?'target':'targets');
}
input.addEventListener('change',()=>choose(input.files));
document.getElementById('example').addEventListener('click',async()=>{
 if(busy)return;
 try{const image=new Image();image.src='/target-example.svg';await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Imagen no disponible');await choose([new File([blob],'ejemplo-orbita.png',{type:'image/png'})])}catch(error){say('No se pudo preparar el ejemplo. '+error.message,'error')}
});
const drop=document.getElementById('drop-zone');drop.addEventListener('dragover',e=>{e.preventDefault();if(!busy)drop.classList.add('dragging')});drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');choose(e.dataTransfer.files)});
async function loadImage(file){
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();if(!img.width||!img.height)throw Error('No se pudo leer '+file.name);const ratio=Math.min(1,1024/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas}finally{URL.revokeObjectURL(url)}
}
compileButton.addEventListener('click',async()=>{
 if(busy||!Compiler||!files.length)return;
 busy=true;notify(true);input.disabled=true;compileButton.disabled=true;downloadButton.hidden=true;applyButton.hidden=true;progressBox.hidden=false;output=null;inspector.reset();say('');
 try{
  const images=await Promise.all(files.map(loadImage));
  const compiler=new Compiler();
  const data=await compiler.compileImageTargets(images,percent=>{const progress=Math.max(0,Math.min(100,Math.round(percent)));document.getElementById('progress').value=progress;document.getElementById('progress-text').textContent=progress+' %'});
  const buffer=await compiler.exportData();output=new Uint8Array(buffer).slice().buffer;
  if(output.byteLength>25*1024*1024)throw Error('El target supera 25 MB. Usa menos imágenes.');
  document.getElementById('progress').value=100;document.getElementById('progress-text').textContent='100 %';
  const details=data.map((item,index)=>{const points=item.matchingData?.[0];const total=(points?.maximaPoints?.length||0)+(points?.minimaPoints?.length||0);return 'Target '+index+': '+files[index].name+(total?' · '+total+' puntos detectados':'')});
  inspector.setData(data,files.map(file=>file.name));
  say('¡Tu target está listo!\n'+details.join('\n'),'success');downloadButton.hidden=false;applyButton.hidden=false;
 }catch(error){say('No se pudo generar el target. '+error.message,'error');output=null}
 finally{busy=false;notify(false);input.disabled=false;compileButton.disabled=false;compileButton.textContent='Volver a generar'}
});
downloadButton.addEventListener('click',()=>{if(!output)return;const url=URL.createObjectURL(new Blob([output],{type:'application/octet-stream'}));const link=document.createElement('a');link.href=url;link.download='targets-generados.mind';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
applyButton.addEventListener('click',()=>{if(!output)return;const copy=output.slice(0);parent.postMessage({type:'compiled-target',buffer:copy},location.origin,[copy])});
try{const module=await import('/vendor/mindar-image.prod.js');Compiler=module.Compiler;compileButton.textContent='Generar target';compileButton.disabled=!files.length}catch(error){say('No se pudo cargar MindAR. Recarga esta ventana para volver a intentarlo.','error');compileButton.textContent='MindAR no disponible'}
