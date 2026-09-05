import test from 'node:test';
import assert from 'node:assert/strict';
import { generateScene } from '../lib/particles.ts';
import { interpretHands } from '../lib/gestures.ts';

test('all mathematical scenes produce finite, deterministic, bounded geometry', () => {
  const names=['galaxy','blackhole','saturn','dna','knot','wave','heart'];
  for(const name of names){const a=generateScene(name,600);assert.equal(a.length,1800);assert.ok(a.every(Number.isFinite));assert.ok(a.every(x=>Math.abs(x)<3.5));assert.deepEqual(a,generateScene(name,600));}
  assert.notDeepEqual(generateScene('galaxy',100),generateScene('saturn',100));
});
test('Saturn preserves a visible gap between the core and rings',()=>{
  const a=generateScene('saturn',1000);
  for(let i=0;i<420;i++)assert.ok(Math.hypot(a[i*3],a[i*3+1],a[i*3+2])<1.01);
  for(let i=420;i<1000;i++)assert.ok(Math.hypot(a[i*3],a[i*3+1])>=1.37);
});
const palm=()=>{const p=Array.from({length:21},()=>({x:.5,y:.6,z:0}));p[0]={x:.5,y:.9,z:0};p[5]={x:.4,y:.6,z:0};p[17]={x:.6,y:.6,z:0};p[9]={x:.5,y:.6,z:0};p[4]={x:.3,y:.5,z:0};for(const t of [8,12,16,20])p[t]={x:.5,y:.2,z:0};return p;};
test('gestures reject missing hands and distinguish open palm from pinch',()=>{
  assert.equal(interpretHands([]),null);assert.equal(interpretHands([[]]),null);
  const h=palm();assert.equal(interpretHands([h]).open,true);assert.equal(interpretHands([h]).fist,false);
  h[4]={...h[8],x:h[8].x+.01};assert.equal(interpretHands([h]).force,-1);
});
test('two-hand expansion is clamped and fist collapses the scene',()=>{
  const h=palm(),other=palm();other[9].x=1.5;assert.equal(interpretHands([h,other]).scale,1.7);
  for(const t of [8,12,16,20])h[t]={x:.5,y:.8,z:0};assert.equal(interpretHands([h]).fist,true);assert.equal(interpretHands([h]).scale,.45);
});
