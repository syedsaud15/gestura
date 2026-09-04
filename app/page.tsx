
'use client';
import { useEffect, useRef, useState } from 'react';
import { Orbit, Dna, Sparkles, MousePointer2, Play, Pause, Maximize2, RotateCcw, Zap, Camera, ArrowUpRight, Circle, Waves, Type, X, Save } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParticleEngine, type SceneName } from '@/lib/particles';
import { HandControl } from '@/components/hand-control';
import { registerComposerTools } from '@/lib/webmcp';

const scenes: { id: SceneName; name: string; note: string; icon: typeof Orbit; group: string }[] = [
  { id: 'galaxy', name: 'Spiral galaxy', note: 'A universe in motion', icon: Sparkles, group: 'cosmos' },
  { id: 'saturn', name: 'Saturn', note: 'Rings of light', icon: Orbit, group: 'cosmos' },
  { id: 'sphere', name: 'Stellar core', note: 'Energy in equilibrium', icon: Circle, group: 'cosmos' },
  { id: 'dna', name: 'Double helix', note: 'The geometry of life', icon: Dna, group: 'lab' },
  { id: 'wave', name: 'Wave field', note: 'Interference in motion', icon: Waves, group: 'lab' },
  { id: 'text', name: 'Your signature', note: 'Make it your own', icon: Type, group: 'create' },
];
const palettes = [{ name: 'Ultraviolet', colors: ['#936cff', '#36d7ed'] }, { name: 'Solar', colors: ['#ff9e4f', '#ff4f83'] }, { name: 'Glacier', colors: ['#4acbff', '#b4ffea'] }, { name: 'Rose', colors: ['#fa80b9', '#b383ff'] }];

export default function Home() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ParticleEngine | null>(null);
  const [scene, setScene] = useState<SceneName>('galaxy');
  const [group, setGroup] = useState('cosmos');
  const [palette, setPalette] = useState(0);
  const [speed, setSpeed] = useState(35);
  const [spread, setSpread] = useState(100);
  const [glow, setGlow] = useState(65);
  const [rotate, setRotate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [cinema, setCinema] = useState(false);
  const [demo, setDemo] = useState(false);
  const [stats, setStats] = useState({ fps: 0, count: 24000 });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [signature, setSignature] = useState('CREATE');
  const [force, setForce] = useState(0);
  const [hasPreset, setHasPreset] = useState(false);
  const current = scenes.find(s => s.id === scene)!;

  useEffect(() => {
    if (!canvas.current) return;
    try {
      const e = new ParticleEngine(canvas.current, setStats); engine.current = e;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPaused(true); setRotate(false); }
      return () => { e.dispose(); engine.current = null; };
    } catch { setError('This browser could not start 3D graphics. Try a browser with hardware acceleration enabled.'); }
  }, []);
  useEffect(() => { engine.current?.setScene(scene, signature); }, [scene, signature]);
  useEffect(() => { engine.current?.configure({ speed: speed / 100, spread: spread / 100, glow: glow / 100, rotate, paused, palette: palettes[palette].colors }); }, [speed, spread, glow, rotate, paused, palette]);
  useEffect(() => { engine.current?.setForce(group === 'lab' ? force / 100 : 0); }, [force, group]);
  useEffect(() => { try { setHasPreset(!!localStorage.getItem('reality-composer-preset')); } catch {} }, []);
  useEffect(() => registerComposerTools({ selectScene: (id, text) => { const s = scenes.find(s => s.id === id)!; setScene(id); setGroup(s.group); setDemo(false); if(text !== undefined)setSignature(text); }, burst: () => engine.current?.burst() }), []);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3600); return () => clearTimeout(t); }, [notice]);
  useEffect(() => {
    if (!demo) return;
    const sequence: SceneName[] = ['galaxy', 'saturn', 'dna', 'wave', 'sphere', 'text']; let i = Math.max(0, sequence.indexOf(scene));
    const t = setInterval(() => { i = (i + 1) % sequence.length; const s = scenes.find(x => x.id === sequence[i])!; setScene(s.id); setGroup(s.group); }, 6500);
    return () => clearInterval(t);
  }, [demo]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,[role="slider"]')) return;
      if (e.code === 'Space') { e.preventDefault(); setPaused(v => !v); }
      if (e.key.toLowerCase() === 'h') setCinema(v => !v);
      if (e.key === 'Escape') setCinema(false);
      if (e.key.toLowerCase() === 'e') engine.current?.burst();
      if (/^[1-6]$/.test(e.key)) { const s = scenes[Number(e.key) - 1]; setScene(s.id); setGroup(s.group); setDemo(false); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, []);
  function selectScene(id: SceneName) { setScene(id); setDemo(false); }
  function reset() { setSpeed(35); setSpread(100); setGlow(65); setPalette(0); setRotate(true); setPaused(false); engine.current?.resetView(); setNotice('View reset'); }
  function capture() { const c = canvas.current; if (!c) return; c.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reality-composer-${scene}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Image saved'); }); }
  async function presentation() { setCinema(true); try { await document.documentElement.requestFullscreen?.(); } catch { /* The clean canvas remains available when fullscreen is unsupported. */ } }
  function exitPresentation() { setCinema(false); if(document.fullscreenElement)void document.exitFullscreen(); }
  useEffect(() => { const onChange=()=>{if(!document.fullscreenElement)setCinema(false);};document.addEventListener('fullscreenchange',onChange);return()=>document.removeEventListener('fullscreenchange',onChange); }, []);
  function savePreset() { try { localStorage.setItem('reality-composer-preset',JSON.stringify({signature,palette,speed,spread,glow}));setHasPreset(true);setNotice('Creation saved on this device'); } catch {setNotice('Browser storage is unavailable');} }
  function loadPreset() { try { const p=JSON.parse(localStorage.getItem('reality-composer-preset')||'null');if(!p||typeof p.signature!=='string'||p.signature.length>12||![p.palette,p.speed,p.spread,p.glow].every(Number.isFinite)||p.palette<0||p.palette>3||!Number.isInteger(p.palette)||p.speed<0||p.speed>100||p.spread<50||p.spread>160||p.glow<15||p.glow>100)throw Error();setSignature(p.signature);setPalette(p.palette);setSpeed(p.speed);setSpread(p.spread);setGlow(p.glow);selectScene('text');setNotice('Saved creation restored');}catch{setNotice('No valid saved creation found');} }

  return <main className={`studio ${cinema ? 'cinema' : ''}`}>
    <header className="topbar chrome">
      <a className="brand" href="/" aria-label="Reality Composer home"><span className="brand-mark"><Orbit size={24}/></span><span>reality<span className="brand-light">composer</span><small>INTERACTIVE PARTICLE STUDIO</small></span></a>
      <div className="top-note"><span className="live-dot"/> REALTIME EXPERIMENT / 001</div>
      <button className="button light" onClick={() => { setDemo(v => !v); setPaused(false); }}>{demo ? <Pause size={15}/> : <Play size={15}/>} {demo ? 'Stop showcase' : 'Run showcase'}<ArrowUpRight size={15}/></button>
    </header>
    <div className="workspace">
      <aside className="control-panel chrome">
        <div className="panel-intro"><p className="eyebrow">THE PLAYGROUND</p><h1>Shape your<br/><span>own universe.</span></h1><p>Explore light, motion and a little chaos.</p></div>
        <Tabs value={group} onValueChange={value => { setGroup(String(value)); const first = scenes.find(s => s.group === value); if (first) selectScene(first.id); }}>
          <TabsList className="mode-tabs" aria-label="Experience"><TabsTrigger value="cosmos">Cosmos</TabsTrigger><TabsTrigger value="lab">Lab</TabsTrigger><TabsTrigger value="create">Create</TabsTrigger></TabsList>
        </Tabs>
        <div className="scene-list" aria-label="Scenes">{scenes.filter(s => s.group === group).map(s => <button className={`scene-choice ${scene === s.id ? 'selected' : ''}`} key={s.id} onClick={() => selectScene(s.id)} aria-pressed={scene === s.id}><span className="scene-icon"><s.icon size={23} strokeWidth={1.25}/></span><span><strong>{s.name}</strong><small>{s.note}</small></span><span className="scene-selected">{scene === s.id ? '●' : '↗'}</span></button>)}</div>
        {group === 'create' && <div className="creation-controls"><label className="text-field">Your text<input maxLength={12} value={signature} onChange={e => setSignature(e.target.value)} placeholder="Type your initials"/><small>Up to 12 characters</small></label><div className="preset-actions"><button className="button" onClick={savePreset}><Save size={14}/> Save creation</button>{hasPreset&&<button className="button" onClick={loadPreset}>Restore</button>}</div></div>}
        {group === 'lab' && <div className="range-control force-control"><label id="force-label">Pointer force <span>{force===0?'Off':force<0?'Attract':'Repel'}</span></label><Slider aria-labelledby="force-label" value={[force]} min={-100} max={100} step={10} onValueChange={v=>setForce(Array.isArray(v)?v[0]:v)}/><p>Move the pointer through the field.<br/>Left: attraction · right: repulsion.</p></div>}
        <div className="section-heading"><span>APPEARANCE</span><span>01 — 03</span></div>
        <label className="field-label">Colour spectrum <span>{palettes[palette].name}</span></label>
        <div className="palette-list">{palettes.map((p, i) => <button key={p.name} aria-label={p.name} aria-pressed={palette === i} className={palette === i ? 'chosen' : ''} style={{ background: `linear-gradient(120deg,${p.colors[0]},${p.colors[1]})` }} onClick={() => setPalette(i)}>{palette === i && <span>✓</span>}</button>)}</div>
        <div className="range-control"><label id="speed-label">Motion speed <span>{(speed / 35).toFixed(1)}×</span></label><Slider aria-labelledby="speed-label" value={[speed]} min={0} max={100} onValueChange={v => setSpeed(Array.isArray(v) ? v[0] : v)}/></div>
        <div className="range-control"><label id="spread-label">Expansion <span>{spread}%</span></label><Slider aria-labelledby="spread-label" value={[spread]} min={50} max={160} onValueChange={v => setSpread(Array.isArray(v) ? v[0] : v)}/></div>
        <div className="range-control"><label id="glow-label">Luminosity <span>{glow}%</span></label><Slider aria-labelledby="glow-label" value={[glow]} min={15} max={100} onValueChange={v => setGlow(Array.isArray(v) ? v[0] : v)}/></div>
        <div className="toggle-row"><label htmlFor="auto-orbit">Auto orbit</label><Switch id="auto-orbit" checked={rotate} onCheckedChange={setRotate}/></div>
        <div className="panel-bottom"><span className="tiny-cross">+</span> ARTISTIC SIMULATION<span>V 0.1</span></div>
      </aside>
      <section className="viewport" aria-label="Interactive particle universe">
        <canvas ref={canvas} className="particle-canvas" aria-label={`${current.name} particle scene. Drag to orbit, scroll to zoom, press E to explode.`}/>
        <div className="viewport-top chrome"><span className="scene-tag"><span className="live-dot"/> LIVE CANVAS</span><div className="telemetry"><span>{stats.fps || '—'} <small>FPS</small></span><span>{(stats.count / 1000).toFixed(0)}k <small>PARTICLES</small></span></div></div>
        <div className="scene-title chrome"><div className="eyebrow">{String(scenes.findIndex(s => s.id === scene) + 1).padStart(2, '0')} / {group.toUpperCase()} COLLECTION</div><h2>{current.name}<span>✧</span></h2><p>{scene === 'galaxy' ? 'Every point, a possibility.' : current.note}</p></div>
        {error && <div className="error-card" role="alert">{error}</div>}
        <div className="orientation chrome"><span>Y</span><div>↟<span>↗ X</span></div><small>Z</small></div>
        <div className="canvas-bottom chrome"><div className="interaction-note"><MousePointer2 size={16}/><span>Drag to orbit <b>·</b> Scroll to zoom <b>·</b> E to explode</span></div><span className="coordinate">EST. ∞ POSSIBILITIES</span></div>
        <div className="transport chrome"><button onClick={() => setPaused(v => !v)} aria-label={paused ? 'Play animation' : 'Pause animation'}>{paused ? <Play size={19}/> : <Pause size={19}/>}</button><div className="transport-divider"/><button onClick={() => engine.current?.burst()} className="burst-button"><Zap size={17}/> Supernova</button><div className="transport-divider"/><button onClick={reset} aria-label="Reset view"><RotateCcw size={17}/></button><button onClick={capture} aria-label="Save scene image"><Camera size={18}/></button><button onClick={presentation} aria-label="Enter presentation mode"><Maximize2 size={18}/></button></div>
        <HandControl engine={engine}/>
        {demo && <div className="showcase-indicator">SHOWCASE <span/> AUTOMATIC SCENE TRANSITIONS</div>}
        {cinema && <button className="exit-cinema button" onClick={exitPresentation}><X size={16}/> Exit presentation</button>}
        {notice && <div className="notice" role="status">{notice}</div>}
      </section>
    </div>
    <footer className="statusbar chrome"><span><span className="live-dot"/> ALL SYSTEMS CREATIVE</span><span>Built to be played with.</span><span><kbd>SPACE</kbd> pause <kbd>H</kbd> hide controls <kbd>1–6</kbd> scenes</span></footer>
  </main>;
}
