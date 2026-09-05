export type SceneName = 'galaxy' | 'blackhole' | 'saturn' | 'dna' | 'knot' | 'wave' | 'heart' | 'text';
export interface ParticleController { configure(p: Partial<Config>):void; setScene(s:SceneName,text?:string):void; burst():void; resetView():void; setHand(x:number,y:number,scale:number,force:number):void; clearHand():void; setForce(force:number):void; dispose():void; }
type Config = { speed: number; spread: number; glow: number; rotate: boolean; paused: boolean; palette: string[] };
const TAU = Math.PI * 2;
function random(seed: number) { let s = seed; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

export function generateScene(name: SceneName, count: number, text = 'CREATE'): Float32Array {
  const a = new Float32Array(count * 3), rand = random(49327);
  const pixels: [number, number][] = [];
  if (name === 'text' && typeof document !== 'undefined') {
    const c = document.createElement('canvas'); c.width = 900; c.height = 220;
    const ctx = c.getContext('2d');
    if (ctx) { ctx.font = 'bold 150px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'white'; ctx.fillText(text.trim() || 'CREATE', 450, 110, 850); const d = ctx.getImageData(0, 0, 900, 220).data; for (let y = 0; y < 220; y += 2) for (let x = 0; x < 900; x += 2) if (d[(y * 900 + x) * 4 + 3] > 100) pixels.push([(x - 450) / 165, (110 - y) / 165]); }
  }
  for (let i = 0; i < count; i++) {
    const u = rand(), v = rand(), w = rand(); let x = 0, y = 0, z = 0;
    if (name === 'galaxy') {
      const core = i % 5 === 0, r = core ? Math.pow(u, 1.8) * .75 : Math.pow(u, .7) * 2.65;
      const angle = (i % 4) * TAU / 4 + r * 2.25 + (v - .5) * (.25 + .5 * r);
      x = Math.cos(angle) * r; y = Math.sin(angle) * r; z = (w - .5) * (core ? .6 : .19) * (1 - r / 3.5);
    } else if (name === 'blackhole') {
      if(i<count*.8){const r=.42+Math.pow(u,.58)*2.75,t=v*TAU+r*1.5;x=Math.cos(t)*r;y=Math.sin(t)*r;z=(w-.5)*.1*(.3+r);}
      else {const side=i%2?1:-1,r=Math.pow(u,1.7)*2.5,t=v*TAU;x=Math.cos(t)*r*.12;y=Math.sin(t)*r*.12;z=side*(.35+r);}
    } else if (name === 'saturn') {
      if (i < count * .42) { const t = u * TAU, p = Math.acos(2 * v - 1), r = .94 + w * .05; x = r * Math.sin(p) * Math.cos(t); y = r * Math.sin(p) * Math.sin(t); z = r * Math.cos(p); }
      else { const r = 1.38 + u * 1.15, t = v * TAU; x = Math.cos(t) * r; y = Math.sin(t) * r; z = (w - .5) * .045; }
    } else if (name === 'dna') {
      const h = u * 4.5 - 2.25, t = h * 3.1 + (i % 2) * Math.PI;
      const bridge = i % 5 === 0, r = bridge ? (v * 2 - 1) * .83 : .83 + (v - .5) * .09;
      const h2 = bridge ? Math.round(h * 8) / 8 : h;
      x = Math.cos(bridge ? h2 * 3.1 : t) * r; y = h2; z = Math.sin(bridge ? h2 * 3.1 : t) * r + (w - .5) * .06;
    } else if (name === 'knot') { const t=u*TAU*2,r=1.35+.5*Math.cos(3*t);x=r*Math.cos(2*t)+(w-.5)*.07;y=r*Math.sin(2*t)+(v-.5)*.07;z=.5*Math.sin(3*t)+(w-.5)*.07; }
    else if (name === 'wave') { x = (u - .5) * 5.4; y = (v - .5) * 4.5; z = Math.sin(x * 2) * Math.cos(y * 2) * .36 + (w - .5) * .06; }
    else if(name==='heart'){const t=u*TAU;x=Math.pow(Math.sin(t),3)*1.55;y=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/10-.25;z=(v-.5)*.55*(1-Math.min(1,Math.abs(x)/2.6))+(w-.5)*.05;}
    else if (name === 'text' && pixels.length) { const p = pixels[Math.floor(u * pixels.length)]; x = p[0] + (v - .5) * .018; y = p[1]; z = (w - .5) * .2; }
    else { const t = u * TAU, p = Math.acos(2 * v - 1), r = 1.68 + Math.sin(t * 6) * .05 + (w - .5) * .06; x = r * Math.sin(p) * Math.cos(t); y = r * Math.sin(p) * Math.sin(t); z = r * Math.cos(p); }
    a.set([x, y, z], i * 3);
  }
  return a;
}

const vertex = `
attribute vec3 aFrom; attribute vec3 aTo; attribute float aSeed;
uniform float uMorph,uTime,uSpread,uBurst,uGlow,uRatio,uAspect,uZoom,uRotX,uRotY,uWave,uStar,uForce;
uniform vec2 uPointer; varying mediump float vColor,vAlpha;
void main(){
 float m=uMorph*uMorph*(3.0-2.0*uMorph); vec3 p=mix(aFrom,aTo,m);
 if(uStar<0.5){
 p.z+=sin(p.x*2.0+uTime)*cos(p.y*2.0+uTime*.6)*.22*uWave;
 p+=normalize(p+vec3(.01))*uBurst*(.7+aSeed*2.0); p*=uSpread*(1.0+sin(uTime*1.7+aSeed*21.0)*.012);
 float cx=cos(uRotX),sx=sin(uRotX),cy=cos(uRotY),sy=sin(uRotY);
 p=vec3(p.x,p.y*cx-p.z*sx,p.y*sx+p.z*cx);
 p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);
 vec2 d=p.xy-uPointer; float f=exp(-dot(d,d)*.8)*uForce; p.xy+=normalize(d+vec2(.001))*f*.65;
 }
 float depth=max(1.2,7.4-p.z); float scale=uZoom/depth;
 gl_Position=vec4(p.x*scale/uAspect,p.y*scale,0.,1.);
 gl_PointSize=clamp((1.0+aSeed*2.0+uGlow*1.5)*uRatio*7.0/depth,1.,14.);
 vColor=clamp(length(mix(aFrom,aTo,m))*.32+aSeed*.25,0.,1.);
 vAlpha=(.4+aSeed*.6)*(uStar>.5?.3:1.0);
}`;
const fragment = `precision highp float; uniform highp vec3 uColorA,uColorB; uniform highp float uGlow,uStar; varying mediump float vColor,vAlpha;
void main(){ float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard; float light=exp(-d*d*4.5); vec3 col=mix(uColorA,uColorB,vColor); col=mix(col,vec3(.95,.94,1.),pow(1.-vColor,4.)*.7); if(uStar>.5)col=vec3(.54,.61,.8); gl_FragColor=vec4(col,light*vAlpha*(.34+uGlow*.7)); }`;
function rgb(hex: string) { return [1,3,5].map(i => parseInt(hex.slice(i, i+2),16)/255); }

export class ParticleEngine {
  private gl: WebGLRenderingContext; private program: WebGLProgram;
  private buffers: WebGLBuffer[] = []; private locations: Record<string, WebGLUniformLocation | null> = {};
  private dirty = true; private fieldForce = 0; private hasHand = false; private reducedMotion = false;
  private from: Float32Array; private to: Float32Array; private seeds: Float32Array; private stars: Float32Array; private starSeeds: Float32Array;
  private config: Config = { speed: .35, spread: 1, glow: .65, rotate: true, paused: false, palette: ['#936cff','#36d7ed'] };
  private frame = 0; private time = 0; private last = 0; private morph = 1; private blast = 0;
  private rotation = {x: .68,y: -.18}; private zoom = 2.05; private scene: SceneName = 'galaxy';
  private pointer = {x:0,y:0}; private force = 0; private handScale = 1;
  private count: number; private frames = 0; private fpsTime = 0;
  private observer: ResizeObserver; private abort = new AbortController(); private dragging = false; private previous = {x:0,y:0};
  constructor(private canvas: HTMLCanvasElement, private onStats: (s: {fps:number;count:number})=>void) {
    const gl = canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true}); if(!gl)throw new Error('WebGL unavailable'); this.gl=gl;
    const compile=(type:number,source:string)=>{const s=gl.createShader(type)!; gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'Shader error');return s;};
    const p=gl.createProgram()!;const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('Shader link failed');gl.deleteShader(vs);gl.deleteShader(fs);this.program=p;gl.useProgram(p);
    this.count=window.innerWidth<700?12000:24000;this.from=generateScene('galaxy',this.count);this.to=this.from.slice();this.seeds=new Float32Array(this.count);const r=random(523);for(let i=0;i<this.count;i++)this.seeds[i]=r();
    this.stars=new Float32Array(1500*3);this.starSeeds=new Float32Array(1500);for(let i=0;i<1500;i++){this.stars.set([(r()-.5)*21,(r()-.5)*15,(r()-.5)*4-2],i*3);this.starSeeds[i]=r();}
    for(const n of ['uMorph','uTime','uSpread','uBurst','uGlow','uRatio','uAspect','uZoom','uRotX','uRotY','uWave','uStar','uForce','uPointer','uColorA','uColorB'])this.locations[n]=gl.getUniformLocation(p,n);
    for(let i=0;i<6;i++)this.buffers.push(gl.createBuffer()!);
    this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.upload(this.stars,0);this.upload(this.stars,1);this.upload(this.starSeeds,2);this.upload(this.seeds,5);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(.012,.018,.035,1);
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
    const signal=this.abort.signal;
    canvas.addEventListener('pointerdown',e=>{this.dragging=true;this.previous={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},{signal});
    canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();this.pointer={x:(e.clientX-b.left-b.width/2)/b.height*6,y:-(e.clientY-b.top-b.height/2)/b.height*6};if(this.dragging){this.rotation.y+=(e.clientX-this.previous.x)*.005;this.rotation.x+=(e.clientY-this.previous.y)*.005;this.previous={x:e.clientX,y:e.clientY};}},{signal});
    canvas.addEventListener('pointerup',()=>this.dragging=false,{signal});canvas.addEventListener('pointercancel',()=>this.dragging=false,{signal});
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.9,Math.min(4,this.zoom-e.deltaY*.0015));},{signal,passive:false});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(this.frame);},{signal});
    canvas.addEventListener('webglcontextrestored',()=>window.location.reload(),{signal});
    this.frame=requestAnimationFrame(this.tick);
  }
  private resize(){const d=Math.min(window.devicePixelRatio||1,1.8);this.canvas.width=Math.round(this.canvas.clientWidth*d);this.canvas.height=Math.round(this.canvas.clientHeight*d);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
  configure(p: Partial<Config>){Object.assign(this.config,p);}
  setScene(s: SceneName,text='CREATE'){const m=this.morph*this.morph*(3-2*this.morph);for(let i=0;i<this.from.length;i++)this.from[i]+=(this.to[i]-this.from[i])*m;this.to=generateScene(s,this.count,text);this.morph=this.reducedMotion?1:0;this.scene=s;this.rotation.x=s==='text'||s==='heart'?.04:s==='dna'?.1:.68;this.rotation.y=-.18;this.dirty=true;}
  burst(){this.blast=2.1;}
  resetView(){this.rotation={x:this.scene==='text'||this.scene==='heart'?.04:this.scene==='dna'?.1:.68,y:-.18};this.zoom=2.05;this.handScale=1;this.force=0;}
  setHand(x:number,y:number,scale:number,force:number){this.hasHand=true;this.pointer={x:(x-.5)*6,y:(.5-y)*5};this.rotation.y+=(x-.5)*.015;this.handScale+=(scale-this.handScale)*.12;this.force=force;}
  clearHand(){this.hasHand=false;this.handScale=1;this.force=this.fieldForce;}
  setForce(force:number){this.fieldForce=force;if(!this.hasHand)this.force=force;}
  private upload(data:Float32Array,index:number){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers[index]);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);}
  private attribute(name:string,size:number,index:number){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers[index]);const l=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);}
  private tick=(now:number)=>{
    const dt=Math.min((now-(this.last||now))/1000,.05);this.last=now;const c=this.config;
    this.morph=Math.min(1,this.morph+dt*.55);
    if(!c.paused){this.time+=dt*c.speed*2;this.blast*=Math.exp(-dt*2.3);if(c.rotate&&!this.dragging&&this.scene!=='text')this.rotation.y+=dt*c.speed*.15;}
    const gl=this.gl;gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);
    const f=(k:string,v:number)=>gl.uniform1f(this.locations[k],v);
    f('uTime',this.time);f('uMorph',this.morph);f('uSpread',c.spread*this.handScale);f('uBurst',this.blast);f('uGlow',c.glow);f('uRatio',Math.min(window.devicePixelRatio||1,1.8));f('uAspect',this.canvas.width/Math.max(1,this.canvas.height));f('uZoom',this.zoom);f('uRotX',this.rotation.x);f('uRotY',this.rotation.y);f('uWave',this.scene==='wave'?1:0);f('uForce',this.force);gl.uniform2f(this.locations.uPointer,this.pointer.x,this.pointer.y);gl.uniform3fv(this.locations.uColorA,rgb(c.palette[0]));gl.uniform3fv(this.locations.uColorB,rgb(c.palette[1]));
    if(this.dirty){this.upload(this.from,3);this.upload(this.to,4);this.dirty=false;}
    f('uStar',1);this.attribute('aFrom',3,0);this.attribute('aTo',3,1);this.attribute('aSeed',1,2);gl.drawArrays(gl.POINTS,0,1500);
    f('uStar',0);this.attribute('aFrom',3,3);this.attribute('aTo',3,4);this.attribute('aSeed',1,5);gl.drawArrays(gl.POINTS,0,this.count);
    this.frames++;if(now-this.fpsTime>1000){this.onStats({fps:Math.round(this.frames*1000/(now-this.fpsTime)),count:this.count});this.fpsTime=now;this.frames=0;}
    this.frame=requestAnimationFrame(this.tick);
  };
  dispose(){cancelAnimationFrame(this.frame);this.abort.abort();this.observer.disconnect();for(const b of this.buffers)this.gl.deleteBuffer(b);this.gl.deleteProgram(this.program);}
}

export function createParticleEngine(canvas:HTMLCanvasElement,onStats:(s:{fps:number;count:number})=>void):ParticleController {
  try{return new ParticleEngine(canvas,onStats);}catch(error){console.info('WebGL renderer unavailable; using the compatible canvas renderer.',error);return new CanvasParticleEngine(canvas,onStats);}
}

class CanvasParticleEngine implements ParticleController {
  private ctx:CanvasRenderingContext2D;private count:number;private from:Float32Array;private to:Float32Array;
  private config:Config={speed:.35,spread:1,glow:.65,rotate:true,paused:false,palette:['#936cff','#36d7ed']};
  private morph=1;private angle=0;private zoom=1;private blast=0;private frame=0;private last=0;private frames=0;private fpsTime=0;
  private scene:SceneName='galaxy';private drag=false;private previous={x:0,y:0};private abort=new AbortController();private observer:ResizeObserver;
  private pointer={x:0,y:0};private force=0;private fieldForce=0;private handScale=1;private hasHand=false;
  constructor(private canvas:HTMLCanvasElement,private onStats:(s:{fps:number;count:number})=>void){
    const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('Canvas graphics unavailable');this.ctx=context;
    this.count=window.innerWidth<700?1800:3600;this.from=generateScene('galaxy',this.count);this.to=this.from.slice();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();const signal=this.abort.signal;
    canvas.addEventListener('pointerdown',e=>{this.drag=true;this.previous={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},{signal});
    canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();this.pointer={x:e.clientX-b.left,y:e.clientY-b.top};if(this.drag){this.angle+=(e.clientX-this.previous.x)*.006;this.previous={x:e.clientX,y:e.clientY};}},{signal});
    canvas.addEventListener('pointerup',()=>this.drag=false,{signal});canvas.addEventListener('pointercancel',()=>this.drag=false,{signal});
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.55,Math.min(1.8,this.zoom-e.deltaY*.001));},{signal,passive:false});
    this.frame=requestAnimationFrame(this.tick);
  }
  private resize(){const d=Math.min(window.devicePixelRatio||1,1.5);this.canvas.width=Math.max(1,Math.round(this.canvas.clientWidth*d));this.canvas.height=Math.max(1,Math.round(this.canvas.clientHeight*d));this.ctx.setTransform(d,0,0,d,0,0);}
  configure(p:Partial<Config>){Object.assign(this.config,p);}
  setScene(s:SceneName,text='CREATE'){const eased=this.morph*this.morph*(3-2*this.morph);for(let i=0;i<this.from.length;i++)this.from[i]+=(this.to[i]-this.from[i])*eased;this.to=generateScene(s,this.count,text);this.morph=window.matchMedia('(prefers-reduced-motion: reduce)').matches?1:0;this.scene=s;}
  burst(){this.blast=1;}
  resetView(){this.angle=0;this.zoom=1;this.handScale=1;this.force=0;}
  setHand(x:number,y:number,scale:number,force:number){this.hasHand=true;this.pointer={x:x*this.canvas.clientWidth,y:y*this.canvas.clientHeight};this.handScale+=(scale-this.handScale)*.12;this.force=force;this.angle+=(x-.5)*.012;}
  clearHand(){this.hasHand=false;this.handScale=1;this.force=this.fieldForce;}
  setForce(force:number){this.fieldForce=force;if(!this.hasHand)this.force=force;}
  private tick=(now:number)=>{
    const dt=Math.min((now-(this.last||now))/1000,.05);this.last=now;const c=this.config;this.morph=Math.min(1,this.morph+dt*.6);
    if(!c.paused){if(c.rotate&&this.scene!=='text'&&!this.drag)this.angle+=dt*c.speed*.24;this.blast*=Math.exp(-dt*2.5);}
    const ctx=this.ctx,w=this.canvas.clientWidth,h=this.canvas.clientHeight;ctx.setTransform(this.canvas.width/Math.max(1,w),0,0,this.canvas.height/Math.max(1,h),0,0);ctx.fillStyle='#030509';ctx.fillRect(0,0,w,h);
    const m=this.morph*this.morph*(3-2*this.morph),cos=Math.cos(this.angle),sin=Math.sin(this.angle),scale=Math.min(w,h)*.13*c.spread*this.zoom*this.handScale;
    ctx.globalCompositeOperation='lighter';const step=Math.max(1,Math.floor(this.count/3200));
    for(let i=0;i<this.count;i+=step){const n=i*3,x0=this.from[n]+(this.to[n]-this.from[n])*m,y0=this.from[n+1]+(this.to[n+1]-this.from[n+1])*m,z0=this.from[n+2]+(this.to[n+2]-this.from[n+2])*m;const x=x0*cos-z0*sin,y=y0,z=x0*sin+z0*cos;let px=w/2+x*scale,py=h/2-y*scale*.88;const dx=px-this.pointer.x,dy=py-this.pointer.y,dd=Math.max(24,Math.hypot(dx,dy));const influence=Math.exp(-dd*dd/24000)*this.force*42;px+=dx/dd*influence;py+=dy/dd*influence;const explode=this.blast*(.3+(i%17)/17)*scale;px+=x/Math.max(.2,Math.hypot(x,y,z))*explode;py-=y/Math.max(.2,Math.hypot(x,y,z))*explode;const depth=Math.max(.5,1+z*.12),size=(.7+(i%11)/11*1.7+c.glow)*depth;ctx.globalAlpha=.28+c.glow*.48;ctx.fillStyle=i%3?c.palette[0]:c.palette[1];ctx.fillRect(px-size/2,py-size/2,size,size);}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';this.frames++;if(now-this.fpsTime>1000){this.onStats({fps:Math.round(this.frames*1000/(now-this.fpsTime)),count:this.count});this.frames=0;this.fpsTime=now;}this.frame=requestAnimationFrame(this.tick);
  };
  dispose(){cancelAnimationFrame(this.frame);this.abort.abort();this.observer.disconnect();}
}
