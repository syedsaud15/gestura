import { flushSync } from 'react-dom';
import type { SceneName } from './particles';
type Tool = { name:string; description:string; inputSchema:object; annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown };
export function registerComposerTools(actions:{selectScene:(scene:SceneName,text?:string)=>void;burst:()=>void}) {
  const context=(document as Document & {modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const sceneNames=['galaxy','blackhole','saturn','dna','knot','wave','heart','text'];
  const tool:Tool={
    name:'compose_particle_scene',description:'Select a particle experiment in GESTURA, optionally setting the text for a signature scene.',
    inputSchema:{type:'object',properties:{scene:{type:'string',enum:sceneNames},text:{type:'string',maxLength:12}},required:['scene'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){
      if(!input||typeof input!=='object')throw new Error('An object is required.');
      const p=input as Record<string,unknown>;
      if(Object.keys(p).some(k=>!['scene','text'].includes(k))||typeof p.scene!=='string'||!sceneNames.includes(p.scene)||p.text!==undefined&&(typeof p.text!=='string'||p.text.length>12))throw new Error('Choose a valid scene and text of up to 12 characters.');
      flushSync(()=>actions.selectScene(p.scene as SceneName,p.text as string|undefined));
      return {scene:p.scene,text:p.text??null,status:'selected'};
    },
  };
  try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return ()=>lifecycle.abort();
}
