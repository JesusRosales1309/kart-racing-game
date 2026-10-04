/* One renderer, a separate scene/camera, and a cached set of five real 3D Groups. */
function createShowroom(THREE, renderer, library, onStart) {
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x182631);
  const camera=new THREE.PerspectiveCamera(38,1,.1,70);
  scene.add(new THREE.HemisphereLight(0xddecff,0x596354,2.4));
  const key=new THREE.DirectionalLight(0xffe8c8,3);key.position.set(5,8,4);key.castShadow=true;
  key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:25});key.shadow.camera.updateProjectionMatrix();key.shadow.normalBias=.025;scene.add(key);
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.45,.2,48),new THREE.MeshStandardMaterial({color:0x354b56,roughness:.85}));floor.position.y=-.11;floor.receiveShadow=true;scene.add(floor);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(3.3,.025,4,64),new THREE.MeshStandardMaterial({color:0x95bec5,emissive:0x558b95,emissiveIntensity:.4}));rim.rotation.x=Math.PI/2;rim.position.y=-.025;scene.add(rim);
  const pool=library.entries.map((entry,i)=>library.createVehicle(i));
  const element=document.getElementById('showroom'), name=document.getElementById('vehicle-name'),tag=document.getElementById('vehicle-tag'),indexLabel=document.getElementById('vehicle-index');
  const previous=document.getElementById('vehicle-prev'),next=document.getElementById('vehicle-next'),startButton=document.getElementById('vehicle-start');
  let selected=0,active=false,current=null,width=1,height=1,rotation=0,gamepadLatch=false;
  function resetRig(root){const rig=root.userData.rig;root.position.set(0,0,0);root.rotation.set(0,0,0);rig.body.position.set(0,0,0);rig.body.rotation.set(0,0,0);rig.flame.visible=false;rig.previousAngle=null;rig.previousSpeed=rig.steer=rig.roll=rig.pitch=0;for(const w of rig.wheels){w.pivot.rotation.y=0;w.spin.rotation.z=0;}}
  function showSelected(){if(current)scene.remove(current);current=pool[selected];resetRig(current);rotation=-.2;current.rotation.y=rotation;scene.add(current);const entry=library.entries[selected];name.textContent=entry.name;tag.textContent=entry.tag;indexLabel.textContent=(selected+1)+' / '+pool.length;element.style.setProperty('--vehicle-accent',entry.accent);}
  function change(direction){if(!active)return;selected=(selected+direction+pool.length)%pool.length;showSelected();}
  function enter(){active=true;element.hidden=false;document.documentElement.classList.add('selecting');showSelected();startButton.focus({preventScroll:true});}
  function start(){if(!active)return;active=false;element.hidden=true;document.documentElement.classList.remove('selecting');scene.remove(current);resetRig(current);onStart(current);}
  function handleKey(e){if(!active)return false;const key=e.key.toLowerCase();if(['a','d','arrowleft','arrowright','enter',' '].includes(key)){e.preventDefault();if(!e.repeat){if(key==='a'||key==='arrowleft')change(-1);else if(key==='d'||key==='arrowright')change(1);else start();}}return true;}
  // One change per deflection; require neutral before accepting another.
  function gamepad(direction,confirm){if(!active)return;if(!direction)gamepadLatch=false;else if(!gamepadLatch){gamepadLatch=true;change(direction);}if(confirm)start();}
  function resize(w,h){width=w;height=h;}
  function render(dt){if(!active)return;const compact=height<500,top=compact?52:94,bottom=compact?104:186,viewHeight=Math.max(80,height-top-bottom);
    camera.aspect=width/viewHeight;camera.updateProjectionMatrix();
    const distance=Math.max(7.1,7.4/camera.aspect);camera.position.set(distance*.76,distance*.43,distance*.65);camera.lookAt(0,1.02,0);
    rotation+=Math.min(dt,.05)*.27;current.rotation.y=rotation;
    renderer.setViewport(0,bottom,width,viewHeight);renderer.render(scene,camera);renderer.setViewport(0,0,width,height);
  }
  previous.addEventListener('click',()=>change(-1));next.addEventListener('click',()=>change(1));startButton.addEventListener('click',start);
  return {enter,start,change,handleKey,gamepad,resize,render,get active(){return active;},get selected(){return selected;},get current(){return current;}};
}
