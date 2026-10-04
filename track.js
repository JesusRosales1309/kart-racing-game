/* Shared circuit geometry for road, driving, AI, checkpoints and minimap.
   Rounded corners are resampled by distance, so s always means lap progress. */
const KartTrack=(()=>{
 const WIDTH=13,N=640,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=v=>((v%1)+1)%1;
 const corners=[
  [140,-105,24],[158,-55,20],[112,-35,18],[155,15,20],
  [120,60,22],[70,58,18],[65,5,18],[25,2,18],
  [18,88,25],[-65,110,32],[-140,62,28],[-100,5,22],
  [-140,-48,22],[-120,-105,22]
 ];
 function elevation(x,z){return 17*Math.exp(-(((x-112)/66)**2+((z-37)/65)**2))-3*Math.exp(-(((x+85)/48)**2+((z-45)/44)**2));}
 const dense=[{x:0,z:-105}];
 const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
 const cornerData=corners.map((v,i)=>{const p={x:v[0],z:v[1]},before=corners[(i+corners.length-1)%corners.length],after=corners[(i+1)%corners.length],dist=(q)=>Math.hypot(q[0]-p.x,q[1]-p.z),a={x:before[0],z:before[1]},b={x:after[0],z:after[1]};return {p,entry:lerp(p,a,Math.min(v[2],dist(before)*.43)/dist(before)),exit:lerp(p,b,Math.min(v[2],dist(after)*.43)/dist(after))};});
 function line(to){const from=dense[dense.length-1],n=Math.ceil(Math.hypot(to.x-from.x,to.z-from.z));for(let i=1;i<=n;i++)dense.push(lerp(from,to,i/n));}
 for(const c of cornerData){line(c.entry);for(let i=1;i<=64;i++){const t=i/64,u=1-t;dense.push({x:u*u*c.entry.x+2*u*t*c.p.x+t*t*c.exit.x,z:u*u*c.entry.z+2*u*t*c.p.z+t*t*c.exit.z});}}
 line(dense[0]);
 const distances=[0];for(let i=1;i<dense.length;i++)distances.push(distances[i-1]+Math.hypot(dense[i].x-dense[i-1].x,dense[i].z-dense[i-1].z));
 const length=distances.at(-1),path=[];let cursor=0;
 for(let i=0;i<N;i++){const d=i/N*length;while(distances[cursor+1]<d)cursor++;const p=lerp(dense[cursor],dense[cursor+1],(d-distances[cursor])/(distances[cursor+1]-distances[cursor]));p.y=elevation(p.x,p.z);path.push(p);}
 function point(s){const f=wrap(s)*N,i=Math.floor(f),p=lerp(path[i],path[(i+1)%N],f-i);p.y=elevation(p.x,p.z);return p;}
 function heading(s){const a=point(s-.001),b=point(s+.001);return Math.atan2(b.z-a.z,b.x-a.x);}
 function curvature(s){const ds=3/length,a=heading(s-ds),b=heading(s+ds);return Math.atan2(Math.sin(b-a),Math.cos(b-a))/6;}
 function locate(x,z){let best=Infinity,s=0;for(let i=0;i<N;i++){const a=path[i],b=path[(i+1)%N],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;if(d<best){best=d;s=((i+t)/N)%1;}}return {s,d:Math.sqrt(best),road:best<=(WIDTH/2)**2};}
 function offset(s,lateral){const p=point(s),a=heading(s),x=p.x-Math.sin(a)*lateral,z=p.z+Math.cos(a)*lateral;return {x,z,y:elevation(x,z)};}
 const bounds={minX:-175,maxX:185,minZ:-135,maxZ:135};
 // Pads on the main straight and broad sweep, away from tight corner entries.
 const pads=[.025,.60,.94];
 return {WIDTH,N,path,length,point,heading,curvature,locate,elevation,offset,bounds,pads,corners:cornerData};
})();
