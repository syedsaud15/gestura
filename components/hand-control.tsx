'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, VideoOff, LoaderCircle } from 'lucide-react';
import { interpretHands } from '@/lib/gestures';
import type { ParticleEngine } from '@/lib/particles';

export function HandControl({ engine }: { engine: { current: ParticleEngine | null } }) {
  const video = useRef<HTMLVideoElement>(null), worker = useRef<Worker | null>(null), stream = useRef<MediaStream | null>(null);
  const frame = useRef(0), generation = useRef(0), active = useRef(false), busy = useRef(false), initTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<'off'|'loading'|'on'>('off'), [status, setStatus] = useState(''), [failure, setFailure] = useState('');
  const stop = useCallback(() => {
    generation.current++; active.current=false; cancelAnimationFrame(frame.current); worker.current?.terminate(); worker.current=null;
    if(initTimer.current)clearTimeout(initTimer.current);
    stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
    if(video.current)video.current.srcObject=null;busy.current=false;engine.current?.clearHand();
  }, [engine]);
  useEffect(() => () => stop(), [stop]);
  async function start() {
    setFailure('');setState('loading');setStatus('Preparing hand tracking…');
    const run=++generation.current;let wasFist=false,lastBurst=0,lastFrame=0,lastVideo=-1;
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
        if(data.type==='ready') { if(initTimer.current)clearTimeout(initTimer.current);active.current=true;setState('on');setStatus('Show your palm');frame.current=requestAnimationFrame(tick); }
        if(data.type==='error')fail();
        if(data.type==='hands'){
          busy.current=false;const hand=interpretHands(data.landmarks);
          if(!hand){engine.current?.clearHand();setStatus('Looking for your hands');wasFist=false;return;}
          engine.current?.setHand(hand.x,hand.y,hand.scale,hand.force);setStatus(hand.label);
          if(wasFist&&hand.open&&performance.now()-lastBurst>1600){engine.current?.burst();lastBurst=performance.now();}
          wasFist=hand.fist;
        }
      };
      async function tick(now:number){
        if(!active.current||run!==generation.current)return;
        frame.current=requestAnimationFrame(tick);
        if(busy.current||now-lastFrame<65||v.readyState<2||v.currentTime===lastVideo)return;
        busy.current=true;lastFrame=now;lastVideo=v.currentTime;
        try{const bitmap=await createImageBitmap(v);if(!active.current||run!==generation.current){bitmap.close();return;}w.postMessage({type:'frame',bitmap,timestamp:now},[bitmap]);}catch{busy.current=false;}
      }
      w.postMessage({type:'init'});
    } catch(error) {
      if(run!==generation.current)return;stop();setState('off');
      setFailure(error instanceof DOMException && error.name==='NotAllowedError' ? 'Camera permission was denied. Allow it in your browser, then retry.' : error instanceof DOMException && error.name==='NotFoundError' ? 'No webcam found. Connect one, or use the mouse controls.' : 'Camera is unavailable. Close other camera apps and retry.');
    }
  }
  return <div className={`gesture-card chrome ${state==='on'?'tracking':''}`}>
    <video ref={video} muted playsInline className={state==='on'?'camera-preview':'camera-hidden'} aria-label="Your camera preview"/>
    <div className="gesture-heading"><Hand size={22}/><strong>{state==='on'?'Hand control active':'Your hands. The controls.'}</strong></div>
    <p>{state==='off'?'Move your palm to shape the scene.':status}</p>
    {state==='on'&&<p className="gesture-guide">Pinch to attract · two hands to expand<br/>Fist, then open palm to explode.</p>}
    <button className="gesture-button" onClick={()=>state==='off'?void start():(stop(),setState('off'))}>{state==='loading'?<><LoaderCircle className="spin" size={15}/> Cancel setup</>:state==='on'?<><VideoOff size={15}/> Turn camera off</>:<>Enable hand control <span>↗</span></>}</button>
    <small>{state==='off'?'Camera off · video stays on your device':'Video processed on your device'}</small>
    {failure&&<p role="alert" className="camera-error">{failure}</p>}
  </div>;
}
