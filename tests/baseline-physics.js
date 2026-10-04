
'use strict';
const KartCore=(()=>{
const TAU=Math.PI*2,N=192,WIDTH=15,GATES=32,colors=[0xd1f58b,0xff9275,0x7fcbfa,0xd3a1f3];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=(v,n)=>((v%n)+n)%n,approach=(v,t,a)=>v+Math.sign(t-v)*Math.min(Math.abs(t-v),a),angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function point(s){const a=s*TAU-Math.PI/2;return{x:90*Math.cos(a),z:56*Math.sin(a)};}
const path=Array.from({length:N},(_,i)=>point(i/N));
function heading(s){const a=point(s),b=point(s+.001);return Math.atan2(b.z-a.z,b.x-a.x);}
function locate(x,z){let best=Infinity,s=0;for(let i=0;i<N;i++){const a=path[i],b=path[(i+1)%N],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;if(d<best){best=d;s=((i+t)/N)%1;}}return{s,d:Math.sqrt(best),road:best<=(WIDTH/2)**2};}
function format(t){const m=Math.floor(t*1000);return String(Math.floor(m/60000)).padStart(2,'0')+':'+String(Math.floor(m/1000)%60).padStart(2,'0')+'.'+String(m%1000).padStart(3,'0');}
function createRace(){const race={cars:[],boxes:[],pads:[.16,.49,.82].map(s=>Object.assign(point(s),{s})),shots:[],traps:[],obstacles:[],phase:'ready',paused:false,time:0,countdown:3,finishOrder:[],notice:'',noticeTime:0,nextId:0};
 race.reset=function(start=false){this.cars=[];this.boxes=[.07,.27,.43,.61,.76,.93].map(s=>Object.assign(point(s),{s,cooldown:0}));this.shots=[];this.traps=[];this.time=0;this.countdown=3;this.phase=start?'countdown':'ready';this.paused=false;this.finishOrder=[];this.notice='';this.noticeTime=0;
 for(let i=0;i<4;i++){const s=.982-Math.floor(i/2)*.014,p=point(s),a=heading(s),offset=(i%2?1:-1)*2;const x=p.x-Math.sin(a)*offset,z=p.z+Math.cos(a)*offset;this.cars.push({id:i,color:colors[i],x,z,angle:a,speed:0,vx:0,vz:0,loc:locate(x,z),lap:0,gate:1,item:null,boost:0,padLock:0,stun:0,immune:0,drift:0,itemDelay:0,finished:false,finishTime:0,splits:[],lapStart:0});}};
 race.progress=function(c){if(c.finished)return 100-this.finishOrder.indexOf(c.id);const base=(c.gate-1)/GATES;let delta=c.loc.s-base;if(delta>.5)delta-=1;if(delta<-.5)delta+=1;return c.lap+base+clamp(delta,-.1,1/GATES);};
 race.order=function(){return this.cars.slice().sort((a,b)=>this.progress(b)-this.progress(a));};
 race.say=function(s){this.notice=s;this.noticeTime=1.8;};
 race.use=function(c){if(this.phase!=='racing'||this.paused||!c.item||c.finished)return;const item=c.item;c.item=null;
 if(item==='turbo')c.boost=Math.max(c.boost,2.1);
 if(item==='projectile'){const order=this.order(),rank=order.indexOf(c),target=rank>0?order[rank-1].id:null;this.shots.push({id:++this.nextId,x:c.x+Math.cos(c.angle)*2.5,z:c.z+Math.sin(c.angle)*2.5,angle:c.angle,owner:c.id,target,life:4});}
 if(item==='trap')this.traps.push({id:++this.nextId,x:c.x-Math.cos(c.angle)*3,z:c.z-Math.sin(c.angle)*3,owner:c.id,age:0,life:22});
 if(c.id===0)this.say({turbo:'¡TURBO!',projectile:'PROYECTIL LANZADO',trap:'TRAMPA COLOCADA'}[item]);};
 race.hit=function(c){if(c.immune>0||c.finished)return;c.stun=1.05;c.immune=2.2;c.speed*=.22;c.vx*=.3;c.vz*=.3;c.drift=0;if(c.id===0)this.say('¡IMPACTO!');};
 race.ai=function(c){const p=point(c.loc.s+.021),diff=angleDiff(Math.atan2(p.z-c.z,p.x-c.x),c.angle),curve=Math.abs(angleDiff(heading(c.loc.s+.045),heading(c.loc.s))),speed=clamp(30-curve*16+c.id*.5,18,29);if(c.item&&c.itemDelay<=0){this.use(c);c.itemDelay=2;}return{up:c.speed<speed?1:0,down:c.speed>speed+3?1:0,turn:clamp(diff*3.6,-1,1),drift:false};};
 race.sample=function(c){const prev=c.loc,now=locate(c.x,c.z);c.loc=now;if(!now.road||!prev.road||c.finished)return;let delta=now.s-prev.s;if(delta<-.5)delta+=1;if(delta>.5)delta-=1;const target=(c.gate%GATES)/GATES,d=wrap(target-prev.s,1);if(delta<=0||delta>.05||d>delta+1e-9||d<1e-9)return;c.gate++;if(c.gate>GATES){c.gate=1;c.lap++;c.splits.push(this.time-c.lapStart);c.lapStart=this.time;if(c.lap===3){c.finished=true;c.finishTime=this.time;c.speed=0;c.vx=0;c.vz=0;this.finishOrder.push(c.id);}else if(c.id===0)this.say('VUELTA '+(c.lap+1)+' / 3');}};
 race.move=function(c,input,dt){if(c.finished)return;for(const key of['boost','padLock','stun','immune','itemDelay'])c[key]=Math.max(0,c[key]-dt);const road=c.loc.road,turbo=c.boost>0,limit=road?(turbo?43:32):8,gas=clamp(Number(input.up),0,1),brake=clamp(Number(input.down),0,1),drift=input.drift&&Math.abs(input.turn)>.1&&c.speed>10&&road&&c.stun<=0;c.drift=drift?Math.min(2,c.drift+dt):0;
 if(c.stun>0)c.speed=approach(c.speed,0,12*dt);else if(brake>0)c.speed=approach(c.speed,c.speed>0?0:-8*brake,(c.speed>0?32:12)*brake*dt);else if(gas>0||turbo)c.speed=approach(c.speed,limit*(turbo?1:gas),(turbo?30:14*gas)*dt);else c.speed=approach(c.speed,0,5*dt);
 if(!road&&Math.abs(c.speed)>limit)c.speed=approach(c.speed,Math.sign(c.speed)*limit,43*dt);if(road&&!turbo&&c.speed>32)c.speed=approach(c.speed,32,18*dt);
 c.angle+=input.turn*Math.sign(c.speed)*Math.min(Math.abs(c.speed)/11,1)*(drift?2.5:1.8)*dt*(c.stun>0?.2:1);const grip=1-Math.exp(-(drift?3.6:16)*dt);c.vx+=(Math.cos(c.angle)*c.speed-c.vx)*grip;c.vz+=(Math.sin(c.angle)*c.speed-c.vz)*grip;c.x+=c.vx*dt;c.z+=c.vz*dt;
 for(const o of this.obstacles){const dx=c.x-o.x,dz=c.z-o.z,d=Math.hypot(dx,dz),r=o.r+1.1;if(d<r){const nx=d>.01?dx/d:1,nz=d>.01?dz/d:0;c.x=o.x+nx*r;c.z=o.z+nz*r;this.hit(c);}}
 const x=clamp(c.x,-135,135),z=clamp(c.z,-100,100);if(x!==c.x||z!==c.z){c.speed=0;c.vx=0;c.vz=0;}c.x=x;c.z=z;this.sample(c);
 for(const pad of this.pads)if(c.padLock<=0&&Math.hypot(c.x-pad.x,c.z-pad.z)<4.5){c.boost=Math.max(c.boost,.9);c.padLock=1.5;}
 for(const box of this.boxes)if(!c.item&&box.cooldown<=0&&Math.hypot(c.x-box.x,c.z-box.z)<2.8){c.item=['turbo','projectile','trap'][Math.floor(Math.random()*3)];c.itemDelay=.8+Math.random();box.cooldown=5;if(c.id===0)this.say('OBJETO LISTO · ESPACIO / A');}};
 race.step=function(dt,input){if(this.paused||this.phase==='ready'||this.phase==='finished')return;if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.phase='racing';this.say('¡YA!');}return;}this.time+=dt;this.noticeTime=Math.max(0,this.noticeTime-dt);for(const b of this.boxes)b.cooldown=Math.max(0,b.cooldown-dt);
 for(const c of this.cars)this.move(c,c.id===0?input:this.ai(c),dt);
 for(const s of this.shots){s.life-=dt;const target=this.cars[s.target];if(target&&!target.finished){const desired=Math.atan2(target.z-s.z,target.x-s.x);s.angle+=clamp(angleDiff(desired,s.angle),-3*dt,3*dt);}s.x+=Math.cos(s.angle)*48*dt;s.z+=Math.sin(s.angle)*48*dt;for(const c of this.cars)if(c.id!==s.owner&&!c.finished&&Math.hypot(c.x-s.x,c.z-s.z)<2){this.hit(c);s.life=0;break;}}
 this.shots=this.shots.filter(s=>s.life>0);
 for(const t of this.traps){t.life-=dt;t.age+=dt;for(const c of this.cars)if(!c.finished&&(c.id!==t.owner||t.age>1)&&Math.hypot(c.x-t.x,c.z-t.z)<2){this.hit(c);t.life=0;break;}}this.traps=this.traps.filter(t=>t.life>0);
 if(this.cars[0].finished)this.phase='finished';};
 race.reset();return race;}
return{createRace,point,heading,locate,path,WIDTH,colors,clamp,angleDiff,format};
})();
