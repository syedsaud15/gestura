export type Landmark = { x: number; y: number; z: number };
const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x-b.x,a.y-b.y);
export function interpretHands(hands: Landmark[][]) {
  if (!hands.length || hands[0].length < 21) return null;
  const h = hands[0], palm = Math.max(.04, distance(h[5],h[17]));
  const pinch = distance(h[4],h[8])/palm < .32;
  const fingers = [8,12,16,20].filter(t => distance(h[t],h[0]) > distance(h[t-2],h[0])*1.16).length;
  const fist = fingers === 0;
  let scale = fist ? .45 : pinch ? .75 : 1.1;
  if (hands.length > 1 && hands[1].length >= 21) scale = Math.max(.5,Math.min(1.7,distance(h[9],hands[1][9])*3));
  return { x:1-h[9].x, y:h[9].y, scale, force:pinch ? -1 : .45, fist, open:fingers>=3, label:hands.length>1 ? 'Two hands · expand' : fist ? 'Fist · collapse' : pinch ? 'Pinch · attract' : 'Open palm · orbit' };
}
