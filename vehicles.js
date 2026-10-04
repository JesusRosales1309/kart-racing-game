/* Procedural vehicles. Local +X is forward, +Y is up, Z is the axle.
   No reference image is loaded. Factories return Groups, never physics objects. */
function createVehicleLibrary(THREE) {
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    sphere: new THREE.SphereGeometry(1, 12, 8),
    cone: new THREE.ConeGeometry(1, 1, 8),
    ring: new THREE.TorusGeometry(1, .075, 4, 16)
  };
  const materials = new Map();
  function mat(color, glow = false, metal = false) {
    const key = `${color}:${glow}:${metal}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness: metal ? .48 : .7, metalness: metal ? .5 : .12, emissive: glow ? color : 0, emissiveIntensity: glow ? 1.1 : 0}));
    return materials.get(key);
  }
  const C = {dark:0x242b34, metal:0x929ba2, white:0xeee9dc, cyan:0x54e5eb, gold:0xe9b958, orange:0xdb7532, purple:0x7442bd, red:0xbd3936, glass:0x304b61};
  function group(parent, name) { const g = new THREE.Group(); g.name = name; parent.add(g); return g; }
  function part(parent, shape, color, pos, scale, rot = [0,0,0], glow = false, metal = false) {
    const m = new THREE.Mesh(geometries[shape], mat(color, glow, metal));
    m.position.set(...pos); m.scale.set(...scale); m.rotation.set(rot[0]||0,rot[1]||0,rot[2]||0); parent.add(m); return m;
  }
  function bar(parent, a, b, radius, color = C.dark) {
    const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b), d = q.clone().sub(p);
    const m = part(parent, 'cylinder', color, p.clone().add(q).multiplyScalar(.5).toArray(), [radius,d.length(),radius]);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.normalize()); return m;
  }
  // A tapered box gives hoods, cabins and fins distinct profiles without textures.
  function wedge(parent, color, pos, size, frontHeight = .35, frontWidth = .75) {
    const geo = geometries.box.clone(), p = geo.attributes.position;
    for (let i=0;i<p.count;i++) if(p.getX(i)>0) { p.setY(i, p.getY(i)>0 ? frontHeight-.5 : -.5); p.setZ(i,p.getZ(i)*frontWidth); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo,mat(color));m.userData.uniqueGeometry=true;
    m.position.set(...pos);m.scale.set(...size);parent.add(m);return m;
  }
  function cabinHull(parent,color,pos,size,inset=.65) {
    const geo=geometries.box.clone(),p=geo.attributes.position;
    for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setX(i,p.getX(i)*inset);p.setZ(i,p.getZ(i)*.9);}
    geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat(color));m.userData.uniqueGeometry=true;
    m.position.set(...pos);m.scale.set(...size);parent.add(m);return m;
  }
  function base(name, cfg) {
    const root = new THREE.Group();root.name=name;
    const body=group(root,'body'), cabin=group(body,'cabin'), wheels=[];
    root.userData.parts={body,cabin};
    for(const front of [true,false])for(const left of [true,false]) {
      const radius=front?cfg.frontRadius:cfg.rearRadius, width=front?cfg.frontWidth:cfg.rearWidth;
      const name=(front?'front':'rear')+(left?'LeftWheel':'RightWheel');
      const pivot=group(root,name),spin=group(pivot,'spin');pivot.position.set(front?cfg.frontX:cfg.rearX,radius,left?-cfg.track:cfg.track);
      part(spin,'cylinder',C.dark,[0,0,0],[radius,width,radius],[Math.PI/2,0,0]);
      part(spin,'cylinder',cfg.rim,[0,0,0],[radius*.61,width+.025,radius*.61],[Math.PI/2,0,0],false,true);
      const z=(left?-1:1)*(width/2+.025);
      part(spin,'cylinder',C.dark,[0,0,z],[radius*.36,.035,radius*.36],[Math.PI/2,0,0]);
      for(let i=0;i<3;i++)part(spin,'box',C.metal,[0,0,z*1.015],[radius*1.03,.065,.025],[0,0,i*Math.PI/3]);
      if(cfg.neon)part(spin,'ring',cfg.neon,[0,0,z],[radius*.8,radius*.8,.7],[0,0,0],true);
      if(cfg.treads)for(let i=0;i<12;i++){const a=i*Math.PI/6;part(spin,'box',0x373a3b,[Math.cos(a)*radius,Math.sin(a)*radius,0],[.18,.12,width*1.06],[0,0,a-Math.PI/2]);}
      wheels.push({pivot,spin,front,radius});root.userData.parts[name]=pivot;
    }
    const flame=group(body,'boostFlame');part(flame,'cone',C.cyan,[-2,.7,0],[.28,1,.28],[0,0,Math.PI/2],true);flame.visible=false;
    root.userData.rig={g:root,body,wheels,flame,previousAngle:null,previousSpeed:0,steer:0,roll:0,pitch:0};
    return root;
  }
  function named(root,name) {const g=group(root.userData.parts.body,name);root.userData.parts[name]=g;return g;}
  function lamps(root,x,y,zs,color,rear=false) {const g=named(root,rear?'taillights':'headlights');for(const z of zs)part(g,'cylinder',color,[x,y,z],[.17,.09,.17],[0,0,Math.PI/2],true);return g;}
  function wing(root,x,y,width,color) {const g=named(root,'spoiler');for(const z of [-.65,.65])bar(g,[x,y-.5,z],[x,y,z],.065,C.metal);part(g,'box',color,[x,y,0],[.55,.13,width]);return g;}
  // Merge stationary sibling pieces by material, but retain named animation groups.
  function finish(root) {
    const groups=[];root.traverse(o=>{if(o.isGroup)groups.push(o);});
    for(const g of groups){const buckets=new Map();for(const m of g.children.filter(o=>o.isMesh)){if(!buckets.has(m.material))buckets.set(m.material,[]);buckets.get(m.material).push(m);}
      for(const [material,meshes]of buckets){if(meshes.length<2)continue;const positions=[],normals=[];
        for(const m of meshes){m.updateMatrix();const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrix);positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);geo.dispose();g.remove(m);if(m.userData.uniqueGeometry)m.geometry.dispose();}
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.computeBoundingSphere();g.add(new THREE.Mesh(geo,material));
      }
    }
    root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return root;
  }
  function createJunkyardKart() {
    const r=base('Junkyard Racer',{frontRadius:.57,rearRadius:.62,frontWidth:.43,rearWidth:.5,frontX:1.08,rearX:-1.03,track:1.04,rim:C.red,treads:true}),b=r.userData.parts.body,c=r.userData.parts.cabin;
    part(b,'box',C.orange,[0,.85,0],[2.85,.6,1.75]);cabinHull(c,C.orange,[-.42,1.5,0],[1.5,.95,1.48]);
    part(c,'box',C.glass,[.2,1.55,0],[.04,.52,1.23],[0,0,.28]);part(c,'box',C.dark,[-1.19,1.57,0],[.04,.5,1.1]);
    for(const side of [-1,1]){cabinHull(c,C.glass,[-.42,1.57,side*.73],[1.05,.46,.035]);for(const x of[-1.05,1.08])part(b,'box',side<0?C.orange:0x4b969c,[x,1.24,side*.94],[1.03,.13,.48],[0,0,x>0?-.08:.08]);wedge(b,0x4b969c,[.1,.97,side*.91],[1.45,.55,.1],.75,.8);part(b,'box',C.metal,[-.91,.88,side*.97],[.56,.55,.1],[side*.08,0,.12]);for(const x of[-.43,.55])part(b,'sphere',C.metal,[x,1.13,side*.98],[.065,.065,.035]);part(b,'box',0x885b39,[.24,.83,side*.972],[.4,.09,.015],[0,0,.16]);}
    const engine=named(r,'engine');part(engine,'box',C.dark,[.9,1.22,0],[.85,.42,.95]);part(engine,'box',C.metal,[.86,1.51,0],[.63,.2,.83]);for(const z of[-.26,0,.26])part(engine,'cylinder',C.red,[1.22,1.58,z],[.13,.13,.13],[0,0,Math.PI/2]);
    const exhaust=named(r,'exhaust');for(const side of[-1,1]){bar(exhaust,[-.95,.8,side*.97],[-1.45,1.44,side*.97],.13,C.metal);part(exhaust,'cylinder',C.dark,[-1.47,1.47,side*.97],[.095,.07,.095],[0,0,-.6]);}
    const spoiler=wing(r,-1.15,2.13,2.65,0x4b969c);part(spoiler,'box',C.red,[-1.13,2.22,1.3],[.7,.4,.1],[0,0,.08]);part(spoiler,'box',C.orange,[-1.13,2.22,-1.3],[.7,.4,.1],[0,0,-.08]);
    const bumper=named(r,'bumpers');for(const x of[-1.58,1.56]){part(bumper,'box',C.metal,[x,.61,0],[.18,.25,1.9]);for(const z of[-.6,0,.6])part(bumper,'box',C.dark,[x*1.065,.62,z],[.02,.1,.22]);}
    lamps(r,1.51,1.03,[-.59,.59],0xffca72);lamps(r,-1.48,1,[-.65,.65],C.red,true);return finish(r);
  }
  function createCyberKart() {
    const r=base('Neon Cyber Racer',{frontRadius:.46,rearRadius:.49,frontWidth:.38,rearWidth:.45,frontX:1.1,rearX:-1.15,track:1.05,rim:C.dark,neon:C.cyan}),b=r.userData.parts.body,c=r.userData.parts.cabin;
    wedge(b,C.white,[.13,.67,0],[3.65,.7,1.95],.18,.8);part(b,'box',C.dark,[0,.37,0],[3.65,.13,2.15]);wedge(c,C.glass,[-.38,1.02,0],[1.6,.65,1.25],.28,.7);
    for(const side of[-1,1]){wedge(b,C.white,[-.8,.81,side*.95],[1.65,.48,.35],.4,.7);part(b,'box',C.dark,[-.3,.77,side*1.13],[.65,.22,.045]);part(b,'box',C.cyan,[.15,.4,side*1.09],[2.9,.045,.035],[],true);part(b,'box',C.cyan,[1.97,.4,side*.51],[.05,.065,.45],[],true);}
    const spoiler=wing(r,-1.43,1.64,2.85,C.dark);for(const z of[-1.4,1.4])part(spoiler,'box',0xdf4da8,[-1.43,1.62,z],[.65,.35,.09],[],true);
    const diffuser=named(r,'diffuser');for(const z of[-.8,-.4,0,.4,.8])wedge(diffuser,C.dark,[-1.77,.45,z],[.45,.4,.07],.4,1);
    const tail=named(r,'taillights');part(tail,'box',0xf15bb1,[-1.72,.83,0],[.04,.065,1.75],[],true);return finish(r);
  }
  function createDesertBuggy() {
    const r=base('Desert Rally Buggy',{frontRadius:.7,rearRadius:.74,frontWidth:.52,rearWidth:.58,frontX:1.17,rearX:-1.12,track:1.12,rim:C.orange,treads:true}),b=r.userData.parts.body,c=r.userData.parts.cabin;
    part(b,'box',C.dark,[0,1.03,0],[2.6,.22,1.35]);wedge(b,C.orange,[.95,1.33,0],[1.5,.5,1.45],.4,.8);for(const z of[-.73,.73])wedge(b,0xdcc59a,[-.26,1.23,z],[1.35,.45,.12],.65,1);
    for(const z of[-.36,.36]){part(c,'box',C.dark,[-.4,1.5,z],[.55,.8,.48],[0,0,-.13]);part(c,'box',C.orange,[-.4,1.91,z],[.35,.12,.42]);}
    const cage=named(r,'rollCage');for(const z of[-.69,.69]){bar(cage,[-1.2,1.05,z],[-.82,2.3,z],.065);bar(cage,[-.82,2.3,z],[.42,2.3,z],.065);bar(cage,[.42,2.3,z],[1.05,1.19,z],.065);bar(cage,[-1.12,1.08,z],[.42,2.3,z],.045);}
    for(const x of[-.82,.42])bar(cage,[x,2.3,-.7],[x,2.3,.7],.065);part(cage,'box',C.orange,[-.2,2.34,0],[1.4,.1,1.65]);
    const lights=named(r,'headlights');for(const z of[-.57,-.19,.19,.57])part(lights,'cylinder',0xffd690,[.49,2.45,z],[.16,.13,.16],[0,0,Math.PI/2],true);
    const suspension=named(r,'suspension');for(const x of[-1.12,1.17])for(const side of[-1,1]){bar(suspension,[x,.78,side*1.02],[x-.16,1.5,side*.62],.07,C.metal);for(let i=0;i<4;i++)part(suspension,'ring',C.orange,[x-.13+i*.025,1.35-i*.12,side*(.7+i*.08)],[.14,.14,.14],[Math.PI/2,0,0]);bar(suspension,[x,.79,side*.3],[x,.72,side*1.1],.075);}
    const bumpers=named(r,'bumpers');for(const x of[-1.6,1.78]){bar(bumpers,[x,.92,-.83],[x,.92,.83],.09,C.metal);part(bumpers,'box',0xdcc59a,[x,1.05,0],[.12,.38,.9]);}
    const spare=named(r,'spareWheel');part(spare,'cylinder',C.dark,[-1.35,1.73,0],[.48,.3,.48],[0,0,Math.PI/2]);part(spare,'cylinder',C.orange,[-1.52,1.73,0],[.27,.035,.27],[0,0,Math.PI/2]);lamps(r,-1.6,1.18,[-.62,.62],C.red,true);return finish(r);
  }
  function createRetroMuscleKart() {
    const r=base('Retro Muscle Mini',{frontRadius:.48,rearRadius:.63,frontWidth:.37,rearWidth:.66,frontX:1.13,rearX:-1.04,track:1.01,rim:C.metal}),b=r.userData.parts.body,c=r.userData.parts.cabin;
    part(b,'box',C.red,[.1,.88,0],[3.25,.66,1.72]);part(b,'box',C.red,[.91,1.2,0],[1.56,.15,1.76]);cabinHull(c,C.red,[-.53,1.62,0],[1.65,.85,1.51]);
    part(c,'box',C.glass,[.16,1.65,0],[.055,.48,1.26],[0,0,.32]);part(c,'box',C.glass,[-1.23,1.65,0],[.03,.4,1.16],[0,0,-.32]);for(const z of[-.735,.735])cabinHull(c,C.glass,[-.53,1.67,z],[1.2,.48,.035]);
    for(const z of[-.3,.3]){part(b,'box',C.white,[.96,1.282,z],[1.58,.018,.2]);part(c,'box',C.white,[-.53,2.053,z],[1.04,.014,.2]);part(b,'box',C.white,[-1.45,1.218,z],[.35,.018,.2]);}
    const scoop=named(r,'engine');wedge(scoop,C.red,[.96,1.42,0],[.65,.28,.65],1,.9);part(scoop,'box',C.dark,[1.29,1.43,0],[.025,.15,.49]);
    const bumper=named(r,'bumpers');for(const x of[-1.59,1.76])part(bumper,'box',C.metal,[x,.7,0],[.15,.17,1.91]);part(b,'box',C.dark,[1.735,1.03,0],[.035,.27,1.64]);
    for(const y of[.94,1.04,1.14])part(b,'box',C.metal,[1.76,y,0],[.025,.018,.91]);lamps(r,1.78,1.05,[-.62,.62],0xffdf9e);lamps(r,-1.57,1.01,[-.61,.61],C.red,true);wing(r,-1.31,1.38,1.85,C.red);
    const exhaust=named(r,'exhaust');for(const z of[-.66,.66])part(exhaust,'cylinder',C.metal,[-1.63,.48,z],[.105,.32,.105],[0,0,Math.PI/2]);return finish(r);
  }
  function star(parent,pos,scale,rot=[0,0,0]) {
    const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.43:1;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:false});const m=new THREE.Mesh(geo,mat(C.gold,true));m.userData.uniqueGeometry=true;m.position.set(...pos);m.scale.setScalar(scale);m.rotation.set(...rot);parent.add(m);
  }
  function createGalacticKart() {
    const r=base('Galactic Rocket Kart',{frontRadius:.48,rearRadius:.53,frontWidth:.38,rearWidth:.45,frontX:.97,rearX:-.91,track:1,rim:C.purple,neon:C.cyan}),b=r.userData.parts.body,c=r.userData.parts.cabin;
    part(b,'sphere',C.white,[.1,.73,0],[1.55,.46,.92]);wedge(b,C.purple,[.9,.88,0],[1.35,.35,.64],.3,.55);part(c,'box',C.purple,[-.5,1.2,0],[.3,1.05,.82],[0,0,-.12]);part(c,'box',C.dark,[-.3,1.2,0],[.2,.85,.67]);part(c,'sphere',C.glass,[.57,1.12,0],[.44,.34,.65]);star(c,[-.18,1.52,0],.18,[0,Math.PI/2,0]);
    const rockets=named(r,'rockets');for(const z of[-.8,.8]){part(rockets,'cylinder',C.white,[-1.05,1.57,z],[.43,1.27,.43],[0,0,Math.PI/2]);part(rockets,'cylinder',C.gold,[-1.68,1.57,z],[.46,.12,.46],[0,0,Math.PI/2],false,true);part(rockets,'cylinder',C.purple,[-1.76,1.57,z],[.35,.09,.35],[0,0,Math.PI/2]);part(rockets,'ring',C.cyan,[-1.82,1.57,z],[.29,.29,.29],[0,Math.PI/2,0],true);part(rockets,'cone',C.cyan,[-1.9,1.57,z],[.21,.32,.21],[0,0,Math.PI/2],true);wedge(rockets,C.purple,[-1.1,2.08,z],[.74,.6,.11],.1,1);}
    const fins=named(r,'fins');for(const side of[-1,1]){wedge(fins,C.purple,[-.73,1.19,side*1.03],[.72,.57,.15],.15,1);star(fins,[-.78,1.29,side*1.12],.14,side<0?[0,Math.PI,0]:[0,0,0]);part(b,'box',C.gold,[.1,.46,side*.88],[2.4,.05,.05]);}
    star(b,[1.05,1.03,0],.22,[-Math.PI/2,0,0]);lamps(r,1.45,.78,[-.52,.52],C.cyan);return finish(r);
  }
  const entries=[
    {name:'JUNKYARD RACER',tag:'Piezas recicladas. Carácter de sobra.',accent:'#eca45f',create:createJunkyardKart},
    {name:'NEON CYBER RACER',tag:'Perfil bajo. Una firma de luz.',accent:'#66e4ef',create:createCyberKart},
    {name:'DESERT RALLY BUGGY',tag:'Jaula abierta. Espíritu del desierto.',accent:'#efba71',create:createDesertBuggy},
    {name:'RETRO MUSCLE MINI',tag:'Capó enorme. Actitud clásica.',accent:'#ff8580',create:createRetroMuscleKart},
    {name:'GALACTIC ROCKET KART',tag:'Dos propulsores. Cinco estrellas.',accent:'#c19aff',create:createGalacticKart}
  ];
  const variantMaterials=new Map();
  const palettes=[
    [{[C.orange]:0xb94e40,0x4b969c:0x929ba2},{[C.orange]:0xd5ad48}],
    [{[C.cyan]:0x659dff,0xf15bb1:0xa47be6,0xdf4da8:0xa47be6},{[C.cyan]:0xf08070,0xf15bb1:0xe95855}],
    [{[C.orange]:0xd7b445},{[C.orange]:0x718b55}],
    [{[C.red]:0x426eaa},{[C.red]:0x30353d}],
    [{[C.purple]:0x416faf},{[C.purple]:0xd8dce2}]
  ];
  function createVehicle(type,variant=0){
    const index=((type%entries.length)+entries.length)%entries.length,root=entries[index].create();
    root.userData.vehicleType=index;root.userData.variant=variant;
    if(variant){const palette=palettes[index][(variant-1)%2];root.traverse(o=>{if(!o.isMesh)return;const old=o.material,color=old.color.getHex(),replacement=palette[color];if(replacement===undefined)return;
      const key=index+':'+variant+':'+old.uuid;if(!variantMaterials.has(key)){const m=old.clone();m.color.setHex(replacement);if(old.emissive.getHex()===color)m.emissive.setHex(replacement);variantMaterials.set(key,m);}o.material=variantMaterials.get(key);
    });}
    return root;
  }
  return {entries,createVehicle,createJunkyardKart,createCyberKart,createDesertBuggy,createRetroMuscleKart,createGalacticKart};
}
