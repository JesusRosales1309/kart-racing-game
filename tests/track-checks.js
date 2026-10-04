/* Simulation and numerical geometry checks, independent of WebGL. */
function runTrackChecks(trackSource,simulation,obstacles=[]) {
 const assert=(ok,label)=>{if(!ok)throw Error(label);};
 const core=new Function(trackSource+simulation+';return KartCore;')(),t=core.track;
 assert(t.corners.length===14,'Fourteen designed corners');assert(t.WIDTH===13,'Road width');
 assert(Math.hypot(t.point(0).x-t.point(1).x,t.point(0).z-t.point(1).z)<1e-8,'Closed circuit');
 let maxGrade=0,minY=Infinity,maxY=-Infinity,minNormal=Infinity;
 for(let i=0;i<t.N;i++){
  const p=t.path[i],q=t.path[(i+1)%t.N];minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);maxGrade=Math.max(maxGrade,Math.abs(p.y-q.y)/Math.hypot(p.x-q.x,p.z-q.z));
  const a=t.offset(i/t.N,-t.WIDTH/2),b=t.offset(i/t.N,t.WIDTH/2),c=t.offset((i+1)/t.N,-t.WIDTH/2);
  minNormal=Math.min(minNormal,(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z));
 }
 assert(maxGrade<.23,'Grade is progressive');assert(maxY-minY>15,'Elevation variation');assert(minNormal>0,'Road ribbon does not invert');
 // Adjacent road arms must leave room for runoff: no crossings or overlap.
 let separation=Infinity;for(let i=0;i<t.N;i+=2)for(let j=i+1;j<t.N;j+=2){const steps=Math.min(j-i,t.N-(j-i));if(steps*t.length/t.N<40)continue;separation=Math.min(separation,Math.hypot(t.path[i].x-t.path[j].x,t.path[i].z-t.path[j].z));}
 assert(separation>t.WIDTH+4,'No overlapping road sections');
 const race=core.createRace();race.obstacles=obstacles;race.reset(true);const off=[0,0,0,0];
 // Park the player so finishing the player does not end the other racers' test.
 for(let frame=0;frame<18000&&!race.cars.slice(1).every(c=>c.finished);frame++){race.step(1/60,{up:0,down:0,turn:0,drift:false});for(const c of race.cars)if(!c.loc.road)off[c.id]++;}
 assert(race.cars.slice(1).every(c=>c.finished&&c.lap===3&&c.splits.length===3),'Every rival completes three laps');assert(off.slice(1).every(n=>n===0),'AI stays on asphalt');
 const playerRace=core.createRace();playerRace.obstacles=obstacles;playerRace.reset(true);
 for(let frame=0;frame<18000&&playerRace.phase!=='finished';frame++)playerRace.step(1/60,playerRace.ai(playerRace.cars[0]));
 assert(playerRace.cars[0].lap===3&&playerRace.phase==='finished','Player can finish using normal controls');
 // Start-line wiggles and skipping checkpoints must not award a lap.
 const check=core.createRace(),car=check.cars[0];
 function moveTo(s){const p=t.point(s);car.x=p.x;car.z=p.z;check.sample(car);}
 for(let i=0;i<5;i++){moveTo(.999);moveTo(.001);}assert(car.lap===0,'Finish alone is not a lap');
 car.gate=1;car.loc=t.locate(t.point(.48).x,t.point(.48).z);moveTo(.501);assert(car.gate===1&&car.lap===0,'Skipped checkpoints rejected');
 car.loc=t.locate(t.point(.025).x,t.point(.025).z);moveTo(.019);assert(car.gate===1,'Reverse checkpoint rejected');
 // Sequential path traversal counts exactly once at each complete crossing.
 check.reset();const c=check.cars[0];let lastLap=0;
 for(let i=1;i<=t.N*3+10;i++){const s=(.992+i/t.N)%1,p=t.point(s);c.x=p.x;c.z=p.z;check.sample(c);assert(c.lap-lastLap<=1,'No double lap');lastLap=c.lap;}
 assert(c.lap===3&&c.finished,'Sequential checkpoints and finish');
 const hairpin=t.path.map((p,i)=>({s:i/t.N,k:Math.abs(t.curvature(i/t.N))})).sort((a,b)=>b.k-a.k)[0];
 const cTest=core.createRace().cars[1],p=t.point(hairpin.s);Object.assign(cTest,{x:p.x,z:p.z,angle:t.heading(hairpin.s),speed:29,loc:t.locate(p.x,p.z)});assert(race.ai(cTest).down===1,'AI brakes at tight corner');
 return {length:t.length,turns:t.corners.length,width:t.WIDTH,elevation:[minY,maxY],maxGrade,minNormal,minTrackSeparation:separation,offroadFrames:off,rivalTimes:race.cars.slice(1).map(c=>c.finishTime),playerTime:playerRace.cars[0].finishTime,checkpoints:core.GATES};
}
