'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, VideoOff, LoaderCircle, ScanLine } from 'lucide-react';
import { interpretHands } from '@/lib/gestures';
import type { ParticleController } from '@/lib/particles';

export function HandControl({ engine, onTelemetry }: { engine: { current: ParticleController | null }; onTelemetry?:(v:{active:boolean;gesture:string;hands:number;latency:number})=>void }) {
  const video = useRef<HTMLVideoElement>(null), overlay=useRef<HTMLCanvasElement>(null), worker = useRef<Worker | null>(null), stream = useRef<MediaStream | null>(null);
  const frame = useRef(0), generation = useRef(0), active = useRef(false), busy = useRef(false), initTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentAt=useRef(0);const [state, setState] = useState<'off'|'loading'|'on'>('off'), [status, setStatus] = useState(''), [failure, setFailure] = useState(''),[latency,setLatency]=useState(0),[handCount,setHandCount]=useState(0);
  const stop = useCallback(() => {
    generation.current++; active.current=false; cancelAnimationFrame(frame.current); worker.current?.terminate(); worker.current=null;
    if(initTimer.current)clearTimeout(initTimer.current);
    stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
    if(video.current)video.current.srcObject=null;busy.current=false;engine.current?.clearHand();setHandCount(0);onTelemetry?.({active:false,gesture:'OFFLINE',hands:0,latency:0});
  }, [engine]);
  useEffect(() => () => stop(), [stop]);
  useEffect(()=>{if(!failure)return;const timer=setTimeout(()=>setFailure(''),6500);return()=>clearTimeout(timer)},[failure]);
  async function start() {
    setFailure('');setState('loading');setStatus('Preparing hand tracking…');
    const run=++generation.current;let fistAt=0,lastBurst=0,lastFrame=0,lastVideo=-1;
    try {
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access needs a secure browser connection.');
      const media=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
      if(run!==generation.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media; const v=video.current!;v.srcObject=media;await v.play();
      if(run!==generation.current)return;
      const w=new Worker('/hand-worker.js');worker.current=w;
      const fail=()=>{if(run!==generation.current)return;stop();setState('off');setFailure('Hand tracking could not start. Please retry; mouse controls still work.');};
      initTimer.current=setTimeout(fail,45000); w.onerror=fail;
      w.onmessage=({data})=>{
        if(run!==generation.current)return;
        if(data.type==='ready') { if(initTimer.current)clearTimeout(initTimer.current);active.current=true;setState('on');setStatus('Show your palm');onTelemetry?.({active:true,gesture:'SCANNING',hands:0,latency:0});frame.current=requestAnimationFrame(tick); }
        if(data.type==='error')fail();
        if(data.type==='hands'){
          busy.current=false;const measured=Math.round(performance.now()-sentAt.current),count=data.landmarks.length;setLatency(measured);setHandCount(count);drawLandmarks(data.landmarks);
          const hand=interpretHands(data.landmarks);
          if(!hand){engine.current?.clearHand();setStatus('Looking for your hands');onTelemetry?.({active:true,gesture:'SCANNING',hands:0,latency:measured});fistAt=0;return;}
          engine.current?.setHand(hand.x,hand.y,hand.scale,hand.force);setStatus(hand.label);onTelemetry?.({active:true,gesture:hand.label.toUpperCase(),hands:count,latency:measured});
          const now=performance.now();
          if(hand.fist)fistAt=now;
          if(fistAt&&hand.open&&now-fistAt<1800&&now-lastBurst>1600){engine.current?.burst();lastBurst=now;fistAt=0;}
        }
      };
      async function tick(now:number){
        if(!active.current||run!==generation.current)return;
        frame.current=requestAnimationFrame(tick);
        if(busy.current||now-lastFrame<65||v.readyState<2||v.currentTime===lastVideo)return;
        busy.current=true;lastFrame=now;lastVideo=v.currentTime;
        try{const bitmap=await createImageBitmap(v);if(!active.current||run!==generation.current){bitmap.close();return;}sentAt.current=performance.now();w.postMessage({type:'frame',bitmap,timestamp:now},[bitmap]);}catch{busy.current=false;}
      }
      w.postMessage({type:'init'});
    } catch(error) {
      if(run!==generation.current)return;stop();setState('off');
      setFailure(error instanceof DOMException && error.name==='NotAllowedError' ? 'Camera is blocked here. Open this link in Chrome or Edge, allow Camera, then retry.' : error instanceof DOMException && error.name==='NotFoundError' ? 'No webcam found. Connect one, or use the mouse controls.' : 'Camera is unavailable. Close other camera apps and retry.');
    }
  }
  function drawLandmarks(hands:{x:number;y:number}[][]){const c=overlay.current;if(!c)return;const x=c.getContext('2d');if(!x)return;c.width=c.clientWidth*devicePixelRatio;c.height=c.clientHeight*devicePixelRatio;x.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);x.clearRect(0,0,c.clientWidth,c.clientHeight);const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];for(const h of hands){x.strokeStyle='#74fbd4';x.lineWidth=1.4;x.beginPath();for(const [a,b] of links){x.moveTo((1-h[a].x)*c.clientWidth,h[a].y*c.clientHeight);x.lineTo((1-h[b].x)*c.clientWidth,h[b].y*c.clientHeight)}x.stroke();for(const p of h){x.beginPath();x.fillStyle='#f5f1ff';x.arc((1-p.x)*c.clientWidth,p.y*c.clientHeight,2.4,0,Math.PI*2);x.fill()}}}
  return <div className={`gesture-card chrome ${state==='on'?'tracking':''}`}>
    <div className="vision-feed"><video ref={video} muted playsInline aria-hidden={state!=='on'} className={state==='on'?'camera-preview':'camera-hidden'} aria-label="Your camera preview"/><canvas ref={overlay}/>{state!=='on'&&<div className="vision-idle"><ScanLine/><span>VISION OFFLINE</span></div>}</div>
    <div className="gesture-heading"><Hand size={22}/><strong>{state==='on'?'Neural tracking active':'Activate neural vision'}</strong></div>
    <p>{state==='off'?'Move your palm to shape the scene.':status}</p>
    {state==='on'&&<p className="gesture-guide">Pinch to attract · two hands to expand<br/>Fist, then open palm to explode.</p>}
    {state==='on'&&<div className="vision-metrics"><span>HANDS <b>{handCount}</b></span><span>INFERENCE <b>{latency}ms</b></span><span>CPU</span></div>}
    <button className="gesture-button" onClick={()=>state==='off'?void start():(stop(),setState('off'))}>{state==='loading'?<><LoaderCircle className="spin" size={15}/> Cancel setup</>:state==='on'?<><VideoOff size={15}/> Turn camera off</>:<>Enable hand control <span>↗</span></>}</button>
    <small>{state==='off'?'Camera off · video stays on your device':'Video processed on your device'}</small>
    {failure&&<p role="alert" className="camera-error">{failure}<button onClick={()=>setFailure('')} aria-label="Dismiss camera message">×</button></p>}
  </div>;
}
