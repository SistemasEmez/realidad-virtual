'use client';
import {useRef,useEffect,useState} from 'react';
import {X,ScanLine} from 'lucide-react';
export default function TargetCompiler({name,onApply,onClose}:{name:string;onApply:(file:File)=>Promise<void>;onClose:()=>void}){
 const frame=useRef<HTMLIFrameElement>(null),[applying,setApplying]=useState(false),[compiling,setCompiling]=useState(false);
 const applyRef=useRef(onApply);applyRef.current=onApply;
 useEffect(()=>{function receive(event:MessageEvent){
  if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;
  if(event.data.type==='compiler-state')setCompiling(!!event.data.busy);
  if(event.data.type==='compiled-target'&&event.data.buffer instanceof ArrayBuffer&&event.data.buffer.byteLength<=25*1024*1024){
   setApplying(true);applyRef.current(new File([event.data.buffer],'targets-generados.mind',{type:'application/octet-stream'})).finally(()=>setApplying(false));
  }
 }window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[]);
 function close(){if(applying)return;if(compiling&&!confirm('El target se está generando. ¿Quieres cerrar y cancelar el proceso?'))return;onClose()}
 return <div className="modal-backdrop"><section className="compiler-dialog" role="dialog" aria-modal="true" aria-label="Generador de targets MindAR"><header><span className="compiler-icon"><ScanLine size={22}/></span><div><h2>Generador de targets</h2><p>Aplicar a: <b>{name}</b></p></div><button className="icon-button" aria-label="Cerrar generador de targets" disabled={applying} onClick={close}><X size={20}/></button></header><iframe ref={frame} src="/target-compiler.html" title="Crear targets con MindAR dentro del panel"/>{applying&&<div className="compiler-saving" role="status">Guardando y aplicando el target a tu experiencia…</div>}</section></div>
}
