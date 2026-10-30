// Use MindAR's own image pyramid and feature coordinates; no synthetic points.
export function levelsFor(target,mode='matching'){
 const tracking=mode==='tracking';
 const images=tracking?target.trackingImageList:target.imageList;
 const features=tracking?target.trackingData:target.matchingData;
 return (images||[]).map((image,index)=>({
  image,
  scale:image.scale??features?.[index]?.scale??1,
  points:tracking?(features?.[index]?.points||[]):[...(features?.[index]?.maximaPoints||[]),...(features?.[index]?.minimaPoints||[])],
 }));
}

export function grayPixels(image){
 const pixels=new Uint8ClampedArray(image.width*image.height*4);
 for(let i=0;i<image.width*image.height;i++){
  pixels[i*4]=pixels[i*4+1]=pixels[i*4+2]=image.data[i];pixels[i*4+3]=255;
 }
 return pixels;
}

export function createTargetInspector(root){
 const imageTabs=root.querySelector('#analysis-images'),scaleTabs=root.querySelector('#analysis-scales');
 const canvas=root.querySelector('#analysis-canvas'),viewport=root.querySelector('#analysis-viewport');
 const showPoints=root.querySelector('#analysis-points'),showAngles=root.querySelector('#analysis-orientation'),nativeSize=root.querySelector('#analysis-native');
 const matchingButton=root.querySelector('#mode-matching'),trackingButton=root.querySelector('#mode-tracking');
 const summary=root.querySelector('#analysis-summary');
 let targets=[],names=[],imageIndex=0,scaleIndex=0,mode='matching';

 function tabs(container,items,selected,onSelect){
  container.replaceChildren();
  items.forEach((label,index)=>{
   const button=document.createElement('button');button.type='button';button.textContent=label;
   button.setAttribute('role','tab');button.setAttribute('aria-selected',String(index===selected));button.setAttribute('aria-controls','analysis-panel');button.tabIndex=index===selected?0:-1;
   button.addEventListener('click',()=>onSelect(index));
   button.addEventListener('keydown',event=>{
    let next=index;
    if(event.key==='ArrowRight')next=(index+1)%items.length;else if(event.key==='ArrowLeft')next=(index+items.length-1)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;else return;
    event.preventDefault();onSelect(next);container.children[next]?.focus();
   });
   container.append(button);
  });
 }

 function draw(){
  if(!targets.length)return;
  const level=levelsFor(targets[imageIndex],mode)[scaleIndex];if(!level)return;
  const {image,points}=level;
  canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d');context.putImageData(new ImageData(grayPixels(image),image.width,image.height),0,0);
  const valid=points.filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
  if(showPoints.checked){
   context.strokeStyle='#ff3939';context.lineWidth=Math.max(.8,image.width/640);
   for(const point of valid){
    const radius=Math.max(2,Number(point.scale)||1)*1.15;
    context.beginPath();context.arc(point.x,point.y,radius,0,Math.PI*2);context.stroke();
    if(showAngles.checked&&Number.isFinite(point.angle)){
     context.beginPath();context.moveTo(point.x,point.y);context.lineTo(point.x+Math.cos(point.angle)*radius,point.y+Math.sin(point.angle)*radius);context.stroke();
    }
   }
  }
  const percentage=(level.scale*100).toLocaleString('es-MX',{maximumFractionDigits:1});
  summary.textContent=names[imageIndex]+' · '+image.width+' × '+image.height+' px · '+percentage+' % · '+valid.length+' puntos';
  canvas.setAttribute('aria-label','Imagen '+(imageIndex+1)+', escala '+(scaleIndex+1)+', '+valid.length+' puntos de referencia');
  canvas.dataset.pointCount=String(valid.length);canvas.dataset.imageIndex=String(imageIndex);canvas.dataset.scaleIndex=String(scaleIndex);canvas.dataset.mode=mode;
  viewport.classList.toggle('native-size',nativeSize.checked);
  showAngles.disabled=!showPoints.checked||mode==='tracking';
  root.querySelector('#analysis-empty').hidden=valid.length!==0;
 }

 function render(){
  const levels=levelsFor(targets[imageIndex],mode);
  scaleIndex=Math.min(scaleIndex,Math.max(0,levels.length-1));
  tabs(imageTabs,targets.map((_,i)=>'Imagen '+(i+1)),imageIndex,index=>{imageIndex=index;scaleIndex=0;render()});
  tabs(scaleTabs,levels.map((_,i)=>'Escala '+(i+1)),scaleIndex,index=>{scaleIndex=index;render()});
  matchingButton.setAttribute('aria-pressed',String(mode==='matching'));trackingButton.setAttribute('aria-pressed',String(mode==='tracking'));
  draw();
 }
 matchingButton.addEventListener('click',()=>{mode='matching';scaleIndex=0;render()});
 trackingButton.addEventListener('click',()=>{mode='tracking';scaleIndex=0;render()});
 [showPoints,showAngles,nativeSize].forEach(input=>input.addEventListener('change',draw));
 return {
  reset(){targets=[];names=[];root.hidden=true;imageTabs.replaceChildren();scaleTabs.replaceChildren();canvas.width=canvas.height=0},
  setData(data,filenames){targets=data;names=filenames;imageIndex=scaleIndex=0;mode='matching';root.hidden=!targets.length;if(targets.length)render()},
 };
}
