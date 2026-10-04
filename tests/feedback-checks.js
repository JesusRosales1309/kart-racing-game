/* Audio graph/event and particle lifetime tests; not an acoustic/GPU benchmark. */
function runFeedbackChecks(THREE,effectSource,audioSource,core) {
 const assert=(v,message)=>{if(!v)throw Error(message);};
 const effectsFactory=new Function(effectSource+';return createRaceEffects;')();
 const c={x:0,z:0,angle:0,speed:35,loc:{road:false},drift:0,boost:0};
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(62,1,.1,650),effects=effectsFactory(THREE,scene,camera,true,()=>0);
 assert(effects.activeCount===0&&effects.capacity===64,'Empty bounded pool');
 for(let i=0;i<60;i++)effects.update(1/60,[c,{...c},{...c},{...c}],true);
 assert(effects.activeCount>0&&effects.activeCount<=64,'Dust generation');
 const pointObject=scene.children.find(o=>o.geometry&&o.geometry.attributes.alpha),geometry=pointObject.geometry;
 effects.reset();c.loc.road=true;c.drift=1.4;effects.update(.1,[c],true);assert(effects.activeCount===2,'Smoke at both rear wheels');
 const sizes=geometry.attributes.size.array.slice();effects.update(.1,[c],false);assert(geometry.attributes.size.array.some((n,i)=>n>sizes[i]),'Smoke expands');
 effects.reset();for(let i=0;i<30;i++)effects.impact(c,20);assert(effects.activeCount===64,'Sparks respect pool limit');assert(pointObject.geometry===geometry,'No geometry reallocation');effects.update(1,[c],false);assert(effects.activeCount===0,'Expired particles recycled');
 effects.reset();c.drift=0;c.boost=1;for(let i=0;i<60;i++)effects.update(1/60,[c],true);assert(camera.fov>66&&camera.fov<=67,'Boost FOV');const lines=camera.children[0];assert(lines.visible&&lines.material.opacity>0,'Speed lines');c.boost=0;c.speed=0;for(let i=0;i<120;i++)effects.update(1/60,[c],true);assert(Math.abs(camera.fov-62)<.02&&!lines.visible,'FOV/lines return to normal');
 effects.reset();assert(effects.activeCount===0,'Reset clears pool');
 let contexts=0,context,disconnected=0;const sources=[];
 class Param {constructor(value=0){this.value=value;this.events=[];}record(kind,v,t){assert(Number.isFinite(v)&&Number.isFinite(t),'Finite audio automation');this.value=v;this.events.push({kind,v,t});}setValueAtTime(v,t){this.record('set',v,t);}setTargetAtTime(v,t){this.record('target',v,t);}linearRampToValueAtTime(v,t){this.record('linear',v,t);}exponentialRampToValueAtTime(v,t){assert(v>0,'Positive exponential audio ramp');this.record('exp',v,t);}}
 class Node {constructor(){this.gain=new Param();this.frequency=new Param();this.Q=new Param();}connect(){}disconnect(){disconnected++;}start(t=0){this.started=t;}stop(t=0){this.ends=t;if(t<=context.currentTime&&this.onended){const end=this.onended;this.onended=null;end();}}}
 class AudioContext {constructor(){contexts++;context=this;this.state='suspended';this.currentTime=0;this.sampleRate=48000;this.destination=new Node();this.nodes=[];}node(){const n=new Node();this.nodes.push(n);return n;}createGain(){return this.node();}createBiquadFilter(){return this.node();}createOscillator(){const n=this.node();sources.push(n);return n;}createBufferSource(){return this.createOscillator();}createBuffer(ch,length){return {getChannelData:()=>new Float32Array(length)};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}}
 const api=new Function(audioSource+';return {createRaceAudio,createRaceFeedback};')(),audio=api.createRaceAudio({AudioContext});
 assert(contexts===0&&audio.state==='locked','No context/autoplay at load');audio.play('boost');assert(contexts===0,'Events cannot unlock audio');audio.unlock();assert(contexts===1&&audio.state==='running','Gesture resumes context');
 audio.update({...c,speed:0},{up:0},true);const engine=sources[0],lowPitch=engine.frequency.value;audio.update({...c,speed:32},{up:1},true);assert(engine.frequency.value>lowPitch,'Engine pitch follows speed/gas');
 const gainsBefore=context.nodes.filter(n=>n.gain.value>0).length;audio.update({...c,drift:1},{up:1},true);assert(context.nodes.filter(n=>n.gain.value>0).length===gainsBefore+1,'Drift gain fades in');audio.update({...c,drift:0},{up:1},true);assert(context.nodes.filter(n=>n.gain.value>0).length===gainsBefore,'Drift gain fades out');
 const nodesBefore=context.nodes.length;for(let i=0;i<100;i++)audio.update({...c,drift:1},{up:1},true);assert(context.nodes.length===nodesBefore,'Continuous loops reuse audio nodes');
 for(const name of['boost','impact','checkpoint','lap','victory']){context.currentTime+=4;for(const s of [...sources])if(s.ends<=context.currentTime&&s.onended)s.stop();const before=audio.voiceCount;audio.play(name);assert(audio.voiceCount>before,'Audible voice scheduled: '+name);if(name==='impact'){const count=audio.voiceCount;audio.play(name);assert(audio.voiceCount===count,'Impact cooldown');}}
 assert(audio.voiceCount<=12,'Audio voice cap');audio.stop();assert(audio.voiceCount===0&&disconnected>0,'Transient nodes released');audio.suspend();assert(audio.state==='suspended','Background suspends audio');audio.unlock();assert(audio.state==='running','New gesture resumes interrupted audio');
 const events=[],particles=[],fakeAudio={play:e=>events.push(e),reset(){}},fakeEffects={impact:(car,speed)=>particles.push(speed),reset(){}};
 const race=core.createRace();race.phase='racing';const bridge=api.createRaceFeedback(race,fakeAudio,fakeEffects),player=race.cars[0];
 player.speed=20;race.hit(player);race.hit(player);assert(events.filter(e=>e==='impact').length===1&&particles.length===1,'Only accepted hits trigger feedback');player.boost=2;bridge.sample();bridge.sample();player.gate=8;bridge.sample();player.lap=1;player.gate=1;bridge.sample();player.lap=3;player.finished=true;bridge.sample();bridge.sample();
 for(const e of['boost','checkpoint','lap','victory'])assert(events.filter(x=>x===e).length===1,'One-shot event: '+e);
 bridge.reset();
 return {pool:64,dust:true,smoke:true,sparks:true,boostFOV:true,speedLines:true,noAutoplay:true,enginePitch:true,proceduralEvents:events,voiceLimit:12};
}
