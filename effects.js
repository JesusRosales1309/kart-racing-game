/* Fixed-size GPU point pool: no Mesh/material allocation during a race. */
function createRaceEffects(THREE,scene,camera,mobile,groundHeight) {
 const capacity=mobile?64:96,positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*3),sizes=new Float32Array(capacity),alpha=new Float32Array(capacity);
 const life=new Float32Array(capacity),duration=new Float32Array(capacity),velocity=new Float32Array(capacity*3),growth=new Float32Array(capacity),gravity=new Float32Array(capacity),timers=new Float32Array(8);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));geometry.setAttribute('alpha',new THREE.Float32BufferAttribute(alpha,1));
 // Use the BufferAttributes' actual arrays (Three copies constructor inputs).
 const pos=geometry.attributes.position.array,col=geometry.attributes.color.array,size=geometry.attributes.size.array,opacity=geometry.attributes.alpha.array;
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{pixelScale:{value:400}},vertexShader:`attribute float size; attribute float alpha; attribute vec3 color; varying float vAlpha; varying vec3 vColor;
 uniform float pixelScale; void main(){vAlpha=alpha;vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=alpha>0.0?clamp(size*pixelScale/max(0.1,-p.z),1.0,44.0):0.0;}`,
 fragmentShader:`varying float vAlpha; varying vec3 vColor; void main(){float r=length(gl_PointCoord-vec2(0.5))*2.0;if(r>1.0||vAlpha<0.01)discard;gl_FragColor=vec4(vColor,vAlpha*(1.0-smoothstep(0.35,1.0,r)));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const points=new THREE.Points(geometry,material);points.frustumCulled=false;scene.add(points);let cursor=0,clock=0;
 function emit(x,y,z,vx,vy,vz,kind){let slot=-1;for(let n=0;n<capacity;n++){const i=(cursor+n)%capacity;if(life[i]<=0){slot=i;cursor=(i+1)%capacity;break;}}if(slot<0)return false;const i=slot,j=i*3;
  pos[j]=x;pos[j+1]=y;pos[j+2]=z;velocity[j]=vx;velocity[j+1]=vy;velocity[j+2]=vz;
  const smoke=kind==='smoke',spark=kind==='spark',boost=kind==='boost';duration[i]=life[i]=spark?.22:boost?.3:smoke?.65:.55;size[i]=spark?.1:boost?.14:smoke?.21:.16;growth[i]=spark?0:boost?.15:smoke?.9:.55;gravity[i]=spark?-8:0;
  col[j]=spark?1:boost?.15:smoke?.65:.36;col[j+1]=spark?.5:boost?.8:smoke?.68:.29;col[j+2]=spark?.04:boost?1:smoke?.7:.21;opacity[i]=.65;return true;
 }
 function behind(c,kind){const cos=Math.cos(c.angle),sin=Math.sin(c.angle);for(const side of[-1,1]){const x=c.x-cos*1.2-sin*side,z=c.z-sin*1.2+cos*side;emit(x,groundHeight(x,z)+.25,z,-cos*(kind==='boost'?7:1)+(Math.random()-.5),.45+Math.random()*.4,-sin*(kind==='boost'?7:1)+(Math.random()-.5),kind);}}
 function impact(c,strength){if(strength<4)return;for(let i=0;i<(mobile?6:10);i++){const angle=Math.random()*Math.PI*2,speed=2+Math.random()*4;emit(c.x,groundHeight(c.x,c.z)+.6,c.z,Math.cos(angle)*speed,1+Math.random()*2,Math.sin(angle)*speed,'spark');}}
 const lineCount=mobile?8:12,lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(lineCount*6),3));
 const lineMaterial=new THREE.LineBasicMaterial({color:0xd1e8ed,transparent:true,opacity:0,depthTest:false,depthWrite:false});
 const lines=new THREE.LineSegments(lineGeometry,lineMaterial);lines.frustumCulled=false;lines.renderOrder=10;camera.add(lines);scene.add(camera);const linePos=lineGeometry.attributes.position.array;
 function reset(){life.fill(0);opacity.fill(0);timers.fill(0);geometry.attributes.alpha.needsUpdate=true;lines.visible=false;points.visible=false;camera.fov=62;camera.updateProjectionMatrix();}
 function resize(height,dpr){material.uniforms.pixelScale.value=height*dpr*.5;}
 function update(dt,cars,active){const player=cars[0];clock+=dt;points.visible=true;
  for(let i=0;i<capacity;i++){if(life[i]<=0)continue;life[i]=Math.max(0,life[i]-dt);const j=i*3;velocity[j+1]+=gravity[i]*dt;pos[j]+=velocity[j]*dt;pos[j+1]+=velocity[j+1]*dt;pos[j+2]+=velocity[j+2]*dt;size[i]+=growth[i]*dt;opacity[i]=.65*life[i]/duration[i];}
  if(active)for(let i=0;i<cars.length;i++){const c=cars[i];timers[i]-=dt;timers[i+4]-=dt;if(Math.abs(c.speed)>4&&timers[i]<=0){if(!c.loc.road)behind(c,'dust');else if(i===0&&c.drift>0)behind(c,'smoke');timers[i]=i===0?.085/(1+Math.min(c.drift,2)*.25):.3;}if(i===0&&c.boost>0&&timers[4]<=0){behind(c,'boost');timers[4]=.08;}}
  for(const key of['position','size','alpha','color'])geometry.attributes[key].needsUpdate=true;
  const intensity=active?Math.max(Math.min(Math.max((Math.abs(player.speed)-26)/16,0),1),player.boost>0?.75:0):0;
  lines.visible=intensity>.02;lineMaterial.opacity=intensity*.3;
  if(lines.visible){const tangent=Math.tan(camera.fov*Math.PI/360);for(let i=0;i<lineCount;i++){const a=i/lineCount*Math.PI*2+.2,depth=3+((i*.71-clock*(2+intensity*4))%4+4)%4,j=i*6;const x=Math.cos(a)*depth*tangent*(camera.aspect||1)*.9,y=Math.sin(a)*depth*tangent*.9;linePos[j]=x;linePos[j+1]=y;linePos[j+2]=-depth;linePos[j+3]=x*1.14;linePos[j+4]=y*1.14;linePos[j+5]=-depth+.55+intensity*.5;}lineGeometry.attributes.position.needsUpdate=true;}
  const target=active&&player.boost>0?67:62,next=camera.fov+(target-camera.fov)*(1-Math.exp(-5*dt));if(Math.abs(next-camera.fov)>.001){camera.fov=next;camera.updateProjectionMatrix();}
 }
 reset();return {update,impact,reset,resize,capacity,get activeCount(){let n=0;for(const t of life)if(t>0)n++;return n;}};
}
