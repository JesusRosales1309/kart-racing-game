/* Original procedural sounds; no downloads or copyrighted samples.
   See assets/audio/README.md before replacing voices with recorded files. */
const RaceAudioSettings={masterVolume:.45,engineVolume:.18,effectsVolume:.32};
function createRaceAudio(environment=window) {
 let ctx=null,master,engineGain,engine,sub,driftGain,driftFilter,noiseBuffer,enabled=true;
 const voices=new Set(),cooldown={};let driving=false;
 function ramp(param,value,time=.06){if(!ctx)return;param.setTargetAtTime(value,ctx.currentTime,time);}
 function init(){const Context=environment.AudioContext||environment.webkitAudioContext;if(!Context){enabled=false;return false;}
  ctx=new Context();master=ctx.createGain();master.gain.value=RaceAudioSettings.masterVolume;master.connect(ctx.destination);
  engineGain=ctx.createGain();engineGain.gain.value=0;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=430;engineGain.connect(filter);filter.connect(master);
  engine=ctx.createOscillator();engine.type='sawtooth';engine.frequency.value=48;engine.connect(engineGain);engine.start();
  sub=ctx.createOscillator();sub.type='sine';sub.frequency.value=24;const subGain=ctx.createGain();subGain.gain.value=.4;sub.connect(subGain);subGain.connect(engineGain);sub.start();
  noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=noiseBuffer.getChannelData(0);let seed=31;for(let i=0;i<samples.length;i++){seed=(seed*16807)%2147483647;samples[i]=(seed/2147483647)*2-1;}
  const drift=ctx.createBufferSource();drift.buffer=noiseBuffer;drift.loop=true;driftFilter=ctx.createBiquadFilter();driftFilter.type='bandpass';driftFilter.frequency.value=1500;driftFilter.Q.value=2;driftGain=ctx.createGain();driftGain.gain.value=0;drift.connect(driftFilter);driftFilter.connect(driftGain);driftGain.connect(master);drift.start();return true;
 }
 // Called synchronously from click/keydown handlers, never during page loading.
 function unlock(){if(!enabled)return;try{if(!ctx&&!init())return;if(ctx.state==='suspended'||ctx.state==='interrupted')Promise.resolve(ctx.resume()).catch(()=>{});}catch(_error){enabled=false;}}
 function tone(frequency,start,length,volume=.3,end=frequency,noise=false){if(!ctx||ctx.state!=='running'||voices.size>=12)return;
  const source=noise?ctx.createBufferSource():ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=noise?2200:3600;
  if(noise)source.buffer=noiseBuffer;else{source.type='sine';source.frequency.setValueAtTime(frequency,start);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),start+length);}
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*RaceAudioSettings.effectsVolume,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+length);
  source.connect(filter);filter.connect(gain);gain.connect(master);voices.add(source);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();voices.delete(source);};source.start(start);source.stop(start+length+.025);
 }
 function play(event){if(!enabled||!ctx||ctx.state!=='running')return;const now=ctx.currentTime;if(now<(cooldown[event]||0))return;cooldown[event]=now+({impact:.45,boost:.35,checkpoint:.4,lap:1,victory:3}[event]||.2);
  if(event==='boost'){tone(85,now,.35,.65,420);tone(0,now,.25,.25,0,true);}
  if(event==='impact'){tone(0,now,.18,.7,0,true);tone(95,now,.15,.5,32);}
  if(event==='checkpoint')tone(620,now,.09,.2,830);
  if(event==='lap')[523,659,784].forEach((f,i)=>tone(f,now+i*.105,.16,.32));
  if(event==='victory')[523,659,784,1047].forEach((f,i)=>tone(f,now+i*.16,i===3?.45:.22,.4));
 }
 function update(car,input,active){driving=active;if(!ctx||!enabled||ctx.state!=='running')return;const speed=Math.min(Math.abs(car.speed)/43,1),gas=active?Math.max(0,Math.min(input.up,1)):0;
  ramp(master.gain,RaceAudioSettings.masterVolume);ramp(engine.frequency,48+speed*125+gas*14,.09);ramp(sub.frequency,24+speed*62+gas*7,.09);ramp(engineGain.gain,active?RaceAudioSettings.engineVolume*(.32+speed*.36+gas*.2):0,.09);
  ramp(driftGain.gain,active&&car.drift>0?RaceAudioSettings.effectsVolume*(.12+Math.min(car.drift,2)*.12):0,.055);ramp(driftFilter.frequency,1200+speed*1100,.08);
 }
 function stop(){driving=false;if(!ctx)return;ramp(engineGain.gain,0,.025);ramp(driftGain.gain,0,.025);for(const voice of voices){try{voice.stop();}catch(_error){}}}
 function reset(){stop();for(const key of Object.keys(cooldown))delete cooldown[key];}
 function suspend(){stop();if(ctx&&ctx.state==='running')Promise.resolve(ctx.suspend()).catch(()=>{});}
 return {unlock,update,play,stop,reset,suspend,get state(){return !enabled?'unavailable':ctx?ctx.state:'locked';},get voiceCount(){return voices.size;},get driving(){return driving;}};
}

// Observe accepted gameplay changes; never alter simulation values or collision rules.
function createRaceFeedback(race,audio,effects) {
 let boost=0,lap=0,gate=1,finished=false;
 const originalHit=race.hit;
 race.hit=function(car){const accepted=car.immune<=0&&!car.finished,speed=Math.abs(car.speed);originalHit.call(this,car);if(accepted){effects.impact(car,speed);if(car.id===0)audio.play('impact');}};
 function reset(){boost=0;lap=0;gate=1;finished=false;audio.reset();effects.reset();}
 function sample(){const c=race.cars[0];if(c.boost>boost+.05)audio.play('boost');if(c.finished&&!finished)audio.play('victory');else if(c.lap>lap)audio.play('lap');else if(c.gate!==gate&&c.gate%8===0)audio.play('checkpoint');boost=c.boost;lap=c.lap;gate=c.gate;finished=c.finished;}
 return {reset,sample};
}
