
'use client';
import { useEffect,useRef,useState } from 'react';
import { Aperture,Atom,Camera,ChevronLeft,ChevronRight,CircleDot,Cpu,Dna,Eye,Fullscreen,Gauge,Hand,Heart,Infinity as InfinityIcon,MousePointer2,Pause,Play,Radio,RotateCcw,Settings2,Sparkles,Video,X,Zap } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { createParticleEngine,type ParticleController,type SceneName } from '@/lib/particles';
import { HandControl } from '@/components/hand-control';
import { registerComposerTools } from '@/lib/webmcp';

const scenes:{id:SceneName;name:string;label:string;icon:typeof Sparkles;colors:string[]}[]=[
 {id:'galaxy',name:'Andromeda',label:'Spiral galaxy',icon:Sparkles,colors:['#c9bcff','#62e7ff']},
 {id:'blackhole',name:'Singularity',label:'Black hole',icon:CircleDot,colors:['#ffbd6e','#ff5ca8']},
 {id:'saturn',name:'Atlas',label:'Ringed world',icon:Aperture,colors:['#73e6ff','#8f7dff']},
 {id:'dna',name:'Genesis',label:'Double helix',icon:Dna,colors:['#b69cff','#ff75c8']},
 {id:'knot',name:'Entanglement',label:'Torus knot',icon:InfinityIcon,colors:['#ff765f','#ffd36f']},
 {id:'wave',name:'Resonance',label:'Wave field',icon:Radio,colors:['#72ffe1','#5c8dff']},
 {id:'heart',name:'Pulse',label:'Heart field',icon:Heart,colors:['#ff5f91','#ffb1da']},
 {id:'text',name:'Signature',label:'Your identity',icon:Atom,colors:['#c2a6ff','#65eaff']},
];
const palettes=[['#c9bcff','#62e7ff'],['#ffbd6e','#ff5ca8'],['#72ffe1','#5c8dff'],['#f3f0ff','#8e82ff']];

export default function Home(){
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<ParticleController|null>(null),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]);
 const [scene,setScene]=useState<SceneName>('galaxy'),[speed,setSpeed]=useState(42),[spread,setSpread]=useState(100),[glow,setGlow]=useState(72),[rotate,setRotate]=useState(true),[paused,setPaused]=useState(false),[settings,setSettings]=useState(false),[hud,setHud]=useState(true),[showcase,setShowcase]=useState(false),[recording,setRecording]=useState(false),[intro,setIntro]=useState(true),[signature,setSignature]=useState('SYED'),[stats,setStats]=useState({fps:0,count:24000}),[palette,setPalette]=useState(0),[notice,setNotice]=useState(''),[engineering,setEngineering]=useState(false),[physics,setPhysics]=useState('ORBIT'),[vision,setVision]=useState({active:false,gesture:'OFFLINE',hands:0,latency:0});
 const active=scenes.find(s=>s.id===scene)!,index=scenes.findIndex(s=>s.id===scene);
 useEffect(()=>{if(!canvas.current)return;const e=createParticleEngine(canvas.current,setStats);engine.current=e;return()=>{e.dispose();engine.current=null;}},[]);
 useEffect(()=>{engine.current?.setScene(scene,signature);const suggested=scenes.find(s=>s.id===scene)!.colors;engine.current?.configure({palette:suggested});},[scene,signature]);
 useEffect(()=>engine.current?.configure({speed:speed/100,spread:spread/100,glow:glow/100,rotate,paused,palette:palette?palettes[palette]:active.colors}),[speed,spread,glow,rotate,paused,palette,active]);
 useEffect(()=>{if(!showcase)return;const t=setInterval(()=>setScene(v=>scenes[(scenes.findIndex(s=>s.id===v)+1)%scenes.length].id),5200);return()=>clearInterval(t)},[showcase]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),2600);return()=>clearTimeout(t)},[notice]);
 useEffect(()=>registerComposerTools({selectScene:(id,text)=>{setScene(id);if(text!==undefined)setSignature(text)},burst:()=>engine.current?.burst()}),[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).matches('input,[role="slider"]'))return;if(e.key==='ArrowRight')next(1);if(e.key==='ArrowLeft')next(-1);if(e.key.toLowerCase()==='e')engine.current?.burst();if(e.key.toLowerCase()==='h')setHud(v=>!v);if(e.code==='Space'){e.preventDefault();setPaused(v=>!v)}};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[]);
 function next(direction:number){setShowcase(false);setScene(v=>{const i=scenes.findIndex(s=>s.id===v);return scenes[(i+direction+scenes.length)%scenes.length].id})}
 async function fullscreen(){try{await document.documentElement.requestFullscreen();setHud(false)}catch{setNotice('Fullscreen is unavailable here')}}
 function snapshot(){canvas.current?.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`reality-composer-${scene}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);setNotice('Scene captured')})}
 function toggleRecord(){
  if(recording){recorder.current?.stop();return} const stream=canvas.current?.captureStream(60);if(!stream||typeof MediaRecorder==='undefined'){setNotice('Recording is not supported here');return}
  chunks.current=[];let r:MediaRecorder;try{r=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm'})}catch{setNotice('Recording is not supported here');return}
  recorder.current=r;r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};r.onstop=()=>{setRecording(false);stream.getTracks().forEach(t=>t.stop());const url=URL.createObjectURL(new Blob(chunks.current,{type:'video/webm'}));const a=document.createElement('a');a.href=url;a.download='reality-composer-showcase.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Showcase saved')};r.start();setRecording(true);setNotice('Recording started');
 }
 return <main className={`experience ${hud?'':'clean'} ${intro?'intro-open':''}`}>
  <canvas ref={canvas} className="world" aria-label={`${active.name}: ${active.label} interactive particle scene`}/>
  <div className="grain" aria-hidden="true"/>
  <header className="hud top-hud">
   <a href="/" className="identity"><span className="identity-mark"><Atom/></span><span><strong>GESTURA</strong><em>NEURAL PHYSICS</em></span></a>
   <div className="system"><i/> GPU ENGINE <span>{stats.fps||'—'} FPS</span><span>{stats.count.toLocaleString()} PARTICLES</span><span>{vision.active?`${vision.latency}MS VISION`:'VISION STANDBY'}</span></div>
   <div className="top-actions"><button className={recording?'recording':''} onClick={toggleRecord}>{recording?<><i/> Stop recording</>:<><Video/> Record</>}</button><button onClick={()=>setSettings(v=>!v)} aria-label="Open visual controls"><Settings2/></button><button onClick={fullscreen} aria-label="Enter fullscreen"><Fullscreen/></button></div>
  </header>
  <section className="hud title-block"><p>EXPERIMENT {String(index+1).padStart(2,'0')} / {String(scenes.length).padStart(2,'0')}</p><h1>{active.name}</h1><span>{active.label}</span></section>
  <div className="hud side-index" aria-hidden="true">{scenes.map((s,i)=><span key={s.id} className={s.id===scene?'active':''}>{String(i+1).padStart(2,'0')}</span>)}</div>
  <section className="hud gesture-dock"><HandControl engine={engine} onTelemetry={setVision}/></section>
  <div className="hud mode-switch"><button className={!engineering?'active':''} onClick={()=>setEngineering(false)}><Eye/> EXPERIENCE</button><button className={engineering?'active':''} onClick={()=>setEngineering(true)}><Cpu/> ENGINEERING</button></div>
  {engineering&&<aside className="hud engineering-panel">
   <div className="engineering-head"><span><i/> LIVE SYSTEM</span><strong>COMPUTER VISION PIPELINE</strong></div>
   <div className="pipeline"><div className={vision.active?'done':''}><b>01</b><span>CAMERA INPUT<small>640 × 480 stream</small></span></div><i/><div className={vision.active?'done':''}><b>02</b><span>LANDMARK MODEL<small>21 points · Web Worker</small></span></div><i/><div className={vision.hands?'done':''}><b>03</b><span>GESTURE CLASSIFIER<small>{vision.gesture}</small></span></div><i/><div className={vision.hands?'done':''}><b>04</b><span>GPU FORCE FIELD<small>Vertex shader response</small></span></div></div>
   <div className="engineering-grid"><div><Gauge/><span>RENDER RATE</span><strong>{stats.fps||'—'}<small> FPS</small></strong></div><div><Cpu/><span>INFERENCE</span><strong>{vision.active?vision.latency:'—'}<small> MS</small></strong></div><div><Hand/><span>HANDS</span><strong>{vision.hands}<small> / 2</small></strong></div><div><Atom/><span>PARTICLES</span><strong>{Math.round(stats.count/1000)}K</strong></div></div>
  </aside>}
  {settings&&<aside className="hud inspector">
   <div className="inspector-head"><div><small>FIELD CONTROLS</small><strong>Shape the energy</strong></div><button onClick={()=>setSettings(false)} aria-label="Close controls"><X/></button></div>
   <label>Physics kernel <output>{physics}</output></label><div className="physics-row">{[['GRAVITY',-1],['ORBIT',0],['REPULSE',.8]].map(([name,force])=><button className={physics===name?'active':''} key={String(name)} onClick={()=>{setPhysics(String(name));engine.current?.setForce(Number(force))}}>{name}</button>)}</div>
   <label>Intensity <output>{glow}%</output></label><Slider value={[glow]} min={10} max={100} onValueChange={v=>setGlow(Array.isArray(v)?v[0]:v)}/>
   <label>Expansion <output>{spread}%</output></label><Slider value={[spread]} min={45} max={170} onValueChange={v=>setSpread(Array.isArray(v)?v[0]:v)}/>
   <label>Motion <output>{(speed/42).toFixed(1)}×</output></label><Slider value={[speed]} min={0} max={100} onValueChange={v=>setSpeed(Array.isArray(v)?v[0]:v)}/>
   <div className="palette-row">{palettes.map((p,i)=><button key={i} aria-label={`Colour palette ${i+1}`} className={palette===i?'active':''} style={{background:`linear-gradient(135deg,${p[0]},${p[1]})`}} onClick={()=>setPalette(i)}/>)}</div>
   <div className="switch-row"><span>Automatic orbit</span><Switch checked={rotate} onCheckedChange={setRotate}/></div>
   <button className="reset" onClick={()=>{setGlow(72);setSpread(100);setSpeed(42);setPalette(0);engine.current?.resetView()}}><RotateCcw/> Reset field</button>
  </aside>}
  {scene==='text'&&<div className="hud signature-box"><label htmlFor="signature">YOUR SIGNATURE</label><input id="signature" maxLength={12} value={signature} onChange={e=>setSignature(e.target.value.toUpperCase())}/><span>Particles become your identity</span></div>}
  <nav className="hud scene-rail" aria-label="Particle scenes">
   <button className="rail-arrow" onClick={()=>next(-1)} aria-label="Previous scene"><ChevronLeft/></button>
   <div className="rail-scroll">{scenes.map((s,i)=><button key={s.id} onClick={()=>{setScene(s.id);setShowcase(false)}} className={`scene-chip ${s.id===scene?'active':''}`}><span className="chip-number">{String(i+1).padStart(2,'0')}</span><s.icon/><span><strong>{s.name}</strong><small>{s.label}</small></span></button>)}</div>
   <button className="rail-arrow" onClick={()=>next(1)} aria-label="Next scene"><ChevronRight/></button>
  </nav>
  <div className="hud transport"><button onClick={()=>setPaused(v=>!v)} aria-label={paused?'Resume':'Pause'}>{paused?<Play/>:<Pause/>}</button><button className="impact" onClick={()=>engine.current?.burst()}><Zap/> IMPACT</button><button onClick={()=>setShowcase(v=>!v)} className={showcase?'active':''}>{showcase?<Pause/>:<Play/>}{showcase?' STOP':' SHOWCASE'}</button><button onClick={snapshot} aria-label="Save image"><Camera/></button><button onClick={()=>setHud(false)} aria-label="Hide interface"><Aperture/></button></div>
  <div className="hud hint"><MousePointer2/> DRAG TO ORBIT <span>·</span> SCROLL TO DIVE <span>·</span> PRESS E TO IMPACT</div>
  {!hud&&<button className="show-hud" onClick={()=>setHud(true)}>SHOW INTERFACE <kbd>H</kbd></button>}
  {notice&&<div className="notice" role="status">{notice}</div>}
  {intro&&<div className="intro">
   <div className="intro-orbit"><span/><i/><b/></div><p>REAL-TIME COMPUTER VISION × GPU PHYSICS</p><h2>Your hands become<br/><em>the interface.</em></h2><div className="intro-steps"><span><b>01</b> Activate vision</span><span><b>02</b> Calibrate your palm</span><span><b>03</b> Bend the particle field</span></div><button onClick={()=>setIntro(false)}>INITIALIZE GESTURA <ArrowIcon/></button><small>No uploads · inference runs privately on your device</small>
  </div>}
 </main>
}
function ArrowIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>}
