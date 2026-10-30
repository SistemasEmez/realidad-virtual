const statusTitle=document.getElementById('status-title');
const statusDescription=document.getElementById('status-description');
const errorPanel=document.getElementById('scanner-error');
let scene,started=false,torchOn=false,startTimer,videoObserver,cameraReady=false,cameraStarted=false;
const activateButton=document.getElementById('activate-camera');
function update(state,title,description){document.body.dataset.state=state;statusTitle.textContent=title;statusDescription.textContent=description;document.getElementById('status').textContent=state==='found'?'TARGET DETECTADO':state==='scanning'?'BUSCANDO IMAGEN':state==='error'?'CÁMARA NO DISPONIBLE':'PREPARANDO EXPERIENCIA'}
function fail(message){clearTimeout(startTimer);update('error','Necesitamos un pequeño ajuste',message);errorPanel.hidden=false;document.getElementById('error-message').textContent=message}
function stop(){clearTimeout(startTimer);videoObserver?.disconnect();try{scene?.systems['mindar-image-system']?.stop()}catch{}document.querySelectorAll('video').forEach(video=>video.srcObject?.getTracks().forEach(track=>track.stop()))}
function watchCameraVideo(){
 const attach=()=>document.querySelectorAll('video').forEach(video=>{
  if(video.dataset.orbitaCamera)return;
  video.dataset.orbitaCamera='true';
  video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.muted=true;
  video.addEventListener('playing',()=>{if(document.body.dataset.state==='initializing')update('initializing','Cámara conectada','Preparando el reconocimiento de tu imagen…')});
  video.addEventListener('error',()=>fail('El navegador no pudo reproducir la cámara. Cierra otras apps que la estén usando y vuelve a intentarlo.'));
 });
 videoObserver=new MutationObserver(attach);videoObserver.observe(document.body,{childList:true});attach();
}
activateButton.addEventListener('click',()=>{
 if(!cameraReady||cameraStarted)return;
 cameraStarted=true;activateButton.hidden=true;
 update('initializing','Permite el acceso a tu cámara','Acepta el permiso de cámara cuando tu navegador lo solicite. Tu imagen se procesa en este dispositivo.');
 try{
  watchCameraVideo();scene.systems['mindar-image-system'].start();
  startTimer=setTimeout(()=>{if(document.body.dataset.state==='initializing')fail('La cámara no terminó de abrirse. Acepta el permiso del navegador. Si no aparece la solicitud, abre la experiencia en Chrome o Safari. Si ya lo permitiste, cierra otras apps que usen la cámara.')},45000);
 }catch{fail('No pudimos iniciar la cámara. Revisa los permisos del navegador y vuelve a intentarlo.')}
});
document.getElementById('close').addEventListener('click',()=>{stop();parent.postMessage({type:'close-ar'},location.origin)});
document.getElementById('retry').addEventListener('click',()=>{stop();parent.postMessage({type:'retry-ar'},location.origin)});
const help=document.getElementById('help-panel');
document.getElementById('help').addEventListener('click',()=>{help.hidden=!help.hidden;document.getElementById('help').setAttribute('aria-expanded',String(!help.hidden))});
document.getElementById('dismiss-help').addEventListener('click',()=>{help.hidden=true;document.getElementById('help').setAttribute('aria-expanded','false')});
document.getElementById('torch').addEventListener('click',async()=>{try{const track=document.querySelector('video')?.srcObject?.getVideoTracks()[0];if(!track)return;torchOn=!torchOn;await track.applyConstraints({advanced:[{torch:torchOn}]});document.getElementById('torch').setAttribute('aria-pressed',String(torchOn))}catch{document.getElementById('torch').disabled=true}});
window.addEventListener('pagehide',stop);
window.addEventListener('message',async event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data.type!=='start'||started)return;
 started=true;const config=event.data.config;
 document.getElementById('experience-name').textContent=config.name||'Tu experiencia AR';
 try{
  if(!window.isSecureContext)throw Error('Abre este enlace por HTTPS para usar la cámara.');
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Este navegador no permite usar la cámara. Prueba en Safari o Chrome en tu teléfono.');
  if(!window.AFRAME||!AFRAME.components['mindar-image'])throw Error('No se pudo cargar el escáner. Comprueba tu conexión y vuelve a intentarlo.');
  if(config.brandLogo){const brand=document.getElementById('brand-icon');brand.textContent='';const image=document.createElement('img');image.src=config.brandLogo;image.alt='Logo de la experiencia';brand.append(image)}
  scene=document.createElement('a-scene');scene.setAttribute('mindar-image','imageTargetSrc: '+config.target+'; autoStart: false; uiScanning: false; uiLoading: false; uiError: false;');
  scene.setAttribute('color-space','sRGB');scene.setAttribute('renderer','alpha: true; colorManagement: true; physicallyCorrectLights: true');scene.setAttribute('vr-mode-ui','enabled: false');scene.setAttribute('device-orientation-permission-ui','enabled: false');
  const camera=document.createElement('a-camera');camera.setAttribute('position','0 0 0');camera.setAttribute('look-controls','enabled: false');scene.append(camera);
  const anchor=document.createElement('a-entity');anchor.setAttribute('mindar-image-target','targetIndex: '+config.targetIndex);
  let modelReady=false,targetVisible=false;
  function found(){update('found',modelReady?'Tu imagen cobró vida':'Imagen encontrada','Mantén la imagen a la vista y muévete suavemente para explorar.')}
  anchor.addEventListener('targetFound',()=>{targetVisible=true;found()});anchor.addEventListener('targetLost',()=>{targetVisible=false;update('scanning','Volvamos a encontrar tu imagen','Apunta de nuevo al target. Acércate un poco y evita los reflejos.')});
  const model=document.createElement('a-gltf-model');model.setAttribute('src',config.model);model.setAttribute('scale',[config.scale,config.scale,config.scale].join(' '));model.setAttribute('rotation',[config.rx,config.ry,config.rz].join(' '));model.setAttribute('position',[config.x,config.y,config.z].join(' '));
  if(config.spin)model.setAttribute('animation','property: rotation; from: '+[config.rx,config.ry,config.rz].join(' ')+'; to: '+[config.rx,config.ry+360,config.rz].join(' ')+'; dur: 12000; easing: linear; loop: true');
  model.addEventListener('model-loaded',()=>{modelReady=true;if(targetVisible)found()});model.addEventListener('model-error',()=>fail('No se pudo cargar el modelo 3D. Vuelve a abrir la experiencia o contacta a quien te compartió el enlace.'));
  anchor.append(model);scene.append(anchor);
  scene.addEventListener('arError',()=>fail('Permite el acceso a la cámara en tu navegador y vuelve a intentarlo.'));
  scene.addEventListener('arReady',()=>{clearTimeout(startTimer);update('scanning','Apunta y descubre','Centra tu imagen dentro del marco. Busca un lugar bien iluminado y mantén el teléfono estable.');const track=document.querySelector('video')?.srcObject?.getVideoTracks()[0];if(track?.getCapabilities?.().torch)document.getElementById('torch').hidden=false});
  // Wait for the renderer, then request camera from a direct click in this frame.
  scene.addEventListener('renderstart',()=>{
   cameraReady=true;activateButton.disabled=false;
   update('initializing','Tu cámara, tu próxima dimensión','Pulsa Activar cámara y permite el acceso en tu navegador para empezar a explorar.');
  },{once:true});
  document.body.append(scene);
 }catch(error){fail(error.message)}
});
