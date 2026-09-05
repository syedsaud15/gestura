'use client';
import {useEffect,useRef,useState} from 'react';
import {Atom,Camera,ChevronLeft,ChevronRight,Dna,Fullscreen,Hand,Heart,Infinity as InfinityIcon,Pause,Play,Radio,RotateCcw,Sparkles,Video,Zap} from 'lucide-react';
import {createParticleEngine,type ParticleController,type SceneName} from '@/lib/particles';
import {HandControl} from '@/components/hand-control';
import {registerComposerTools} from '@/lib/webmcp';

const scenes:{id:SceneName;name:string;icon:typeof Sparkles;colors:string[]}[]=[
 {id:'galaxy',name:'Galaxy',icon:Sparkles,colors:['#ff5c9c','#8d68ff']},{id:'blackhole',name:'Wormhole',icon:Atom,colors:['#ff8a4c','#ff4f9a']},{id:'dna',name:'DNA',icon:Dna,colors:['#a875ff','#ff70c7']},{id:'knot',name:'Knot',icon:InfinityIcon,colors:['#ff6aa8','#6e75ff']},{id:'wave',name:'Wave',icon:Radio,colors:['#7f6cff','#ff78c7']},{id:'heart',name:'Heart',icon:Heart,colors:['#ff3d72','#ff9fc4']},{id:'text',name:'Your Name',icon:Hand,colors:['#b894ff','#ff63bd']},
];
export default function Home(){
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<ParticleController|null>(null),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]);
 const [scene,setScene]=useState<SceneName>('galaxy'),[paused,setPaused]=useState(false),[auto,setAuto]=useState(false),[recording,setRecording]=useState(false),[signature,setSignature]=useState('SYED'),[stats,setStats]=useState({fps:0,count:24000}),[notice,setNotice]=useState('');
 const active=scenes.find(s=>s.id===scene)!,index=scenes.findIndex(s=>s.id===scene);
 useEffect(()=>{if(!canvas.current)return;const e=createParticleEngine(canvas.current,setStats);engine.current=e;e.configure({speed:.48,spread:1.12,glow:.92,rotate:true,palette:active.colors});return()=>e.dispose()},[]);
 useEffect(()=>{engine.current?.setScene(scene,signature);engine.current?.configure({palette:active.colors})},[scene,signature]);
 useEffect(()=>engine.current?.configure({paused}),[paused]);
 useEffect(()=>{if(!auto)return;const t=setInterval(()=>next(1),3500);return()=>clearInterval(t)},[auto]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),2200);return()=>clearTimeout(t)},[notice]);
 useEffect(()=>registerComposerTools({selectScene:(id,text)=>{setScene(id);if(text!==undefined)setSignature(text)},burst:()=>engine.current?.burst()}),[]);
 function next(d:number){setScene(v=>scenes[(scenes.findIndex(s=>s.id===v)+d+scenes.length)%scenes.length].id)}
 function snap(){canvas.current?.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`gestura-${scene}.png`;a.click();setNotice('Snapshot saved')})}
 function record(){if(recording){recorder.current?.stop();return}const stream=canvas.current?.captureStream(60);if(!stream||!window.MediaRecorder){setNotice('Recording unavailable');return}chunks.current=[];const r=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm'});recorder.current=r;r.ondataavailable=e=>e.data.size&&chunks.current.push(e.data);r.onstop=()=>{setRecording(false);stream.getTracks().forEach(t=>t.stop());const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks.current,{type:'video/webm'}));a.download='gestura-demo.webm';a.click();setNotice('Video saved')};r.start();setRecording(true)}
 return <main className="demo"><canvas ref={canvas} className="world" aria-label={`${active.name} particle scene`}/><div className="grain"/>
  <header className="demo-top"><div className="demo-brand"><Atom/><span>GESTURA<small>HAND PARTICLE LAB</small></span></div><div className="demo-live"><i/> LIVE <span>{stats.fps||'—'} FPS</span><span>{Math.round(stats.count/1000)}K POINTS</span></div><div className="demo-actions"><button className={recording?'recording':''} onClick={record}><Video/>{recording?'STOP':'REC'}</button><button onClick={()=>document.documentElement.requestFullscreen()} aria-label="Fullscreen"><Fullscreen/></button></div></header>
  <section className="demo-title"><p>SHAPE {String(index+1).padStart(2,'0')} / {String(scenes.length).padStart(2,'0')}</p><h1>{active.name}</h1><span>Move your hand. Bend the light.</span></section>
  <aside className="demo-hand"><HandControl engine={engine}/></aside>
  {scene==='text'&&<div className="demo-name"><label>TYPE YOUR NAME</label><input maxLength={12} value={signature} onChange={e=>setSignature(e.target.value.toUpperCase())}/></div>}
  <div className="demo-player"><button onClick={()=>setPaused(v=>!v)} aria-label={paused?'Play':'Pause'}>{paused?<Play/>:<Pause/>}</button><button className="burst" onClick={()=>engine.current?.burst()}><Zap/> BURST</button><button className={auto?'active':''} onClick={()=>setAuto(v=>!v)}>{auto?<Pause/>:<Play/>} AUTO</button><button onClick={()=>engine.current?.resetView()} aria-label="Reset"><RotateCcw/></button><button onClick={snap} aria-label="Snapshot"><Camera/></button></div>
  <nav className="shape-dock"><button onClick={()=>next(-1)} aria-label="Previous"><ChevronLeft/></button>{scenes.map(s=><button key={s.id} className={scene===s.id?'active':''} onClick={()=>{setScene(s.id);setAuto(false)}}><s.icon/><span>{s.name}</span></button>)}<button onClick={()=>next(1)} aria-label="Next"><ChevronRight/></button></nav>
  <div className="demo-help"><span><b>PALM</b> MOVE</span><span><b>PINCH</b> ATTRACT</span><span><b>FIST → OPEN</b> EXPLODE</span></div>{notice&&<div className="notice">{notice}</div>}
 </main>
}
