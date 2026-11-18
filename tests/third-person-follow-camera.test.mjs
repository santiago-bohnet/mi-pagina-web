import test from 'node:test';
import assert from 'node:assert/strict';
import { createThirdPersonFollowCamera } from '../assets/third-person-follow-camera.js';

// Vector3 mínimo para probar los cálculos sin descargar Three.js.
class Vector3 {
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
  copy(v){return this.set(v.x,v.y,v.z)}
  clone(){return new Vector3(this.x,this.y,this.z)}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
  lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this}
  applyQuaternion(q){
    const c=Math.cos(q.yaw),s=Math.sin(q.yaw);
    const x=this.x,z=this.z;
    this.x=c*x+s*z;
    this.z=-s*x+c*z;
    return this;
  }
}
const THREE = { Vector3 };
const ship=(x,y,z,yaw=Math.PI)=>({
  position:new Vector3(x,y,z),quaternion:{yaw}
});
test('La cámara sigue a la nave por detrás y observa hacia su morro',()=>{
  const rig=createThirdPersonFollowCamera(THREE);
  const s=ship(5,-1,1,Math.PI);
  const state=rig.update({ship:s,level:0,snap:true});
  assert.ok(state.position.z>s.position.z+7);
  assert.ok(state.lookAt.z<s.position.z);
  assert.ok(Math.hypot(state.position.y-s.position.y,state.position.z-s.position.z)<11,
    'La cámara no debe atravesar la pared curva del túnel');
});
test('La cámara no está pegada al viewport: se desplaza suavemente detrás de la nave',()=>{
  const rig=createThirdPersonFollowCamera(THREE);
  const s=ship(0,0,0);
  const start=rig.update({ship:s,level:0,snap:true}).position.clone();
  s.position.x=20;
  const next=rig.update({ship:s,level:0,dt:1/60}).position.clone();
  assert.ok(next.x>start.x);
  assert.ok(next.x<start.x+20,'Debe haber amortiguación real, no teletransporte de cámara');
  for(let i=0;i<180;i++)rig.update({ship:s,level:0,dt:1/60});
  const settled=rig.update({ship:s,level:0,dt:1/60}).position;
  assert.ok(Math.abs(settled.x-(start.x+20))<.1);
});
test('El seguimiento rota con la nave y reinicia posición tras teletransporte',()=>{
  const rig=createThirdPersonFollowCamera(THREE);
  const s=ship(0,0,0,Math.PI);
  rig.update({ship:s,level:0,snap:true});
  s.quaternion.yaw=0;
  s.position.set(-20,-32,5);
  const state=rig.update({ship:s,level:1});
  assert.ok(state.position.z<s.position.z-7,
    'Con morro +Z la cámara se ubica detrás, del lado -Z');
  assert.equal(state.position.x,-20+2.5);
});
test('Movimiento reducido no introduce suavizado temporal',()=>{
  const rig=createThirdPersonFollowCamera(THREE);
  const s=ship(0,0,0);
  rig.update({ship:s,level:0});
  s.position.x=25;
  const state=rig.update({ship:s,level:0,dt:1/60,reduced:true});
  assert.ok(Math.abs(state.position.x-(25-2.5))<.001);
});
