import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as Tone from "https://cdn.jsdelivr.net/npm/tone@14.8.49/+esm";

const $=s=>document.querySelector(s), C={cyan:0x00c9ff,yellow:0xffd400,pink:0xff3aa7,green:0x00ef9d,purple:0xbd55ff};
const state={vector:new THREE.Vector3(.5,.5,.71).normalize(),target:new THREE.Vector3(.5,.5,.71).normalize(),drag:false,audio:false};
const box=$("#bloch"), scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1,.1,100);
camera.position.set(0,.15,6.2); camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; box.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff,1.25)); const light=new THREE.PointLight(0x5fffe0,10,12); light.position.set(0,2.5,4); scene.add(light);

const sphere=new THREE.Mesh(new THREE.SphereGeometry(1.72,72,48),new THREE.MeshPhysicalMaterial({color:0x00b890,transparent:true,opacity:.11,roughness:.15,transmission:.08,side:THREE.DoubleSide,depthWrite:false})); scene.add(sphere);
const wire=new THREE.Mesh(new THREE.SphereGeometry(1.725,28,20),new THREE.MeshBasicMaterial({color:0x00dca4,wireframe:true,transparent:true,opacity:.20,depthWrite:false})); scene.add(wire);

function arrow(a,b,color,head=.17){const d=b.clone().sub(a),h=new THREE.ArrowHelper(d.clone().normalize(),a,d.length(),color,head,head*.62);scene.add(h);return h}
arrow(new THREE.Vector3(0,-2.05,0),new THREE.Vector3(0,2.08,0),C.cyan);
arrow(new THREE.Vector3(1.98,.56,0),new THREE.Vector3(-1.98,-.56,0),C.yellow);
arrow(new THREE.Vector3(-1.98,.56,0),new THREE.Vector3(1.98,-.56,0),C.pink);

const eq=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;eq.push(new THREE.Vector3(1.73*Math.cos(a),0,1.73*Math.sin(a)))}
const eg=new THREE.BufferGeometry().setFromPoints(eq), em=new THREE.LineDashedMaterial({color:C.green,dashSize:.08,gapSize:.06,transparent:true,opacity:.7}), eline=new THREE.Line(eg,em);eline.computeLineDistances();scene.add(eline);

function label(text,pos,color="#fff",scale=.34){const c=document.createElement("canvas");c.width=300;c.height=120;const x=c.getContext("2d");x.font="700 42px Segoe UI";x.fillStyle=color;x.textAlign="center";x.textBaseline="middle";x.shadowColor=color;x.shadowBlur=7;x.fillText(text,150,60);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.position.copy(pos);s.scale.set(scale*2.5,scale,1);scene.add(s)}
label("+z |0⟩",new THREE.Vector3(-.25,2.02,0),"#00c9ff"); label("−z |1⟩",new THREE.Vector3(-.25,-2.02,0),"#00c9ff");
label("+x +1",new THREE.Vector3(-2.03,-.77,0),"#ffd400"); label("−x −1",new THREE.Vector3(2.03,.77,0),"#ffd400");
label("−y −i",new THREE.Vector3(-2.04,.79,0),"#ff3aa7"); label("+y +i",new THREE.Vector3(2.04,-.79,0),"#ff3aa7");
label("Z",new THREE.Vector3(.18,2.24,0),"#00aaff",.30);

const va=new THREE.ArrowHelper(state.vector.clone(),new THREE.Vector3(),1.68,0x00fff0,.19,.12);scene.add(va);
const tip=new THREE.Mesh(new THREE.SphereGeometry(.085,24,18),new THREE.MeshStandardMaterial({color:0x99ffff,emissive:0x00eedd,emissiveIntensity:1.7}));scene.add(tip);
const pg=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),pm=new THREE.LineDashedMaterial({color:0xffffff,dashSize:.07,gapSize:.05,transparent:true,opacity:.85}),pl=new THREE.Line(pg,pm);pl.computeLineDistances();scene.add(pl);

const filter=new Tone.Filter({frequency:4200,type:"lowpass",rolloff:-12}),reverb=new Tone.Reverb({decay:1.8,wet:.16}),synth=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:.03,decay:.18,sustain:.5,release:.55}}).chain(filter,reverb,Tone.Destination);
const notes=[["Do 3","C3"],["Re 3","D3"],["Mi 3","E3"],["Sol 3","G3"],["La 3","A3"],["Do 4","C4"],["Re 4","D4"],["Mi 4","E4"],["Sol 4","G4"],["La 4","A4"],["Do 5","C5"],["Re 5","D5"],["Mi 5","E5"],["Sol 5","G5"],["La 5","A5"],["Si 5","B5"]], waveNames={sine:"Seno",triangle:"Triangular",sawtooth:"Diente de sierra",square:"Cuadrada"};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

function sound(v,play=true){const i=Math.round((v.z+1)*.5*(notes.length-1)),[dn,tn]=notes[clamp(i,0,notes.length-1)];let w=v.x<-.5?"sine":v.x<0?"triangle":v.x<.5?"sawtooth":"square";synth.oscillator.type=w;filter.frequency.rampTo(300+Number($("#filter").value)*6000,.08);synth.volume.rampTo(-28+Number($("#volume").value)*24,.08);$("#note").value=dn;$("#freq").value=`${Tone.Frequency(tn).toFrequency().toFixed(2)} Hz`;$("#wave").value=waveNames[w];if(state.audio&&play)synth.triggerAttackRelease(tn,"8n")}
function ket(v){const th=Math.acos(clamp(v.z,-1,1)),ph=Math.atan2(v.y,v.x),a=Math.cos(th/2),bm=Math.sin(th/2),br=bm*Math.cos(ph),bi=bm*Math.sin(ph);return `|ψ⟩ = ${a.toFixed(2)} |0⟩ + (${br.toFixed(2)} ${bi>=0?"+":"−"} ${Math.abs(bi).toFixed(2)}i) |1⟩`}
function ui(v){$("#xo").value=v.x.toFixed(2);$("#yo").value=v.y.toFixed(2);$("#zo").value=v.z.toFixed(2);$("#norm").value=v.length().toFixed(2);$("#ket").textContent=ket(v);const th=Math.acos(clamp(v.z,-1,1));let ph=Math.atan2(v.y,v.x);if(ph<0)ph+=Math.PI*2;$("#theta").value=`${THREE.MathUtils.radToDeg(th).toFixed(1)}°`;$("#phi").value=`${THREE.MathUtils.radToDeg(ph).toFixed(1)}°`}
function sync(v){for(const a of["x","y","z"]){$(`#${a}N`).value=v[a].toFixed(2);$(`#${a}R`).value=v[a].toFixed(2)}}
function set(v,{syncInput=true,play=true}={}){if(v.lengthSq()<1e-8){$("#warn").textContent="El vector no puede ser (0,0,0).";return}$("#warn").textContent="";state.target.copy(v.normalize());if(syncInput)sync(state.target);sound(state.target,play)}
function fromInputs(){const v=new THREE.Vector3(Number($("#xN").value),Number($("#yN").value),Number($("#zN").value));if([v.x,v.y,v.z].some(Number.isNaN)){return $("#warn").textContent="Escribe valores válidos."}const n=v.length();set(v);if(Math.abs(n-1)>.015)$("#warn").textContent=`Se normalizó automáticamente (norma original ${n.toFixed(2)}).`;$("#msg").textContent="Actualizaste el estado mediante sus coordenadas."}
$("#update").onclick=fromInputs;["xN","yN","zN"].forEach(id=>$( "#"+id).addEventListener("keydown",e=>{if(e.key==="Enter")fromInputs()}));["x","y","z"].forEach(a=>{$(`#${a}R`).oninput=e=>$(`#${a}N`).value=Number(e.target.value).toFixed(2);$(`#${a}R`).onchange=fromInputs});
$("#reset").onclick=()=>{set(new THREE.Vector3(0,0,1));$("#msg").textContent="Regresamos al estado |0⟩."};
$("#audio").onclick=async e=>{await Tone.start();state.audio=true;e.currentTarget.textContent="🔊 Sonido activado";sound(state.target,true)};
$("#filter").oninput=e=>{$("#fo").value=Number(e.target.value).toFixed(2);sound(state.target,false)};$("#volume").oninput=e=>{$("#vo").value=Number(e.target.value).toFixed(2);sound(state.target,false)};

function rot(v,a,t){return v.clone().applyAxisAngle(a,t).normalize()}
function gate(g){if(g==="CNOT"){return $("#msg").textContent="CNOT necesita dos qubits. Se habilitará en la siguiente etapa."}let v=state.target.clone();if(g==="H")v.applyAxisAngle(new THREE.Vector3(1,0,1).normalize(),Math.PI);if(g==="X")v=rot(v,new THREE.Vector3(1,0,0),Math.PI);if(g==="Y")v=rot(v,new THREE.Vector3(0,1,0),Math.PI);if(g==="Z")v=rot(v,new THREE.Vector3(0,0,1),Math.PI);if(g==="S")v=rot(v,new THREE.Vector3(0,0,1),Math.PI/2);if(g==="T")v=rot(v,new THREE.Vector3(0,0,1),Math.PI/4);set(v);$("#msg").textContent=`Compuerta ${g} aplicada.`}
document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>gate(b.dataset.g));

function pointer(e){const r=renderer.domElement.getBoundingClientRect();let x=((e.clientX-r.left)/r.width)*2-1,y=-(((e.clientY-r.top)/r.height)*2-1);x=clamp(x/.82,-1,1);y=clamp(y/.82,-1,1);const q=x*x+y*y;if(q>1){const d=Math.sqrt(q);x/=d;y/=d}const z=Math.sqrt(Math.max(0,1-x*x-y*y));return new THREE.Vector3(-x,-y,z).normalize()}
renderer.domElement.onpointerdown=e=>{state.drag=true;renderer.domElement.setPointerCapture(e.pointerId);set(pointer(e));$("#msg").textContent="Moviste el vector directamente sobre la esfera."};
renderer.domElement.onpointermove=e=>{if(state.drag)set(pointer(e),{play:false})};renderer.domElement.onpointerup=e=>{state.drag=false;renderer.domElement.releasePointerCapture(e.pointerId);sound(state.target,true)};renderer.domElement.onpointercancel=()=>state.drag=false;

function resize(){camera.aspect=box.clientWidth/box.clientHeight;camera.updateProjectionMatrix();renderer.setSize(box.clientWidth,box.clientHeight,false)}addEventListener("resize",resize);resize();
function loop(){requestAnimationFrame(loop);state.vector.lerp(state.target,.12).normalize();va.setDirection(state.vector.clone());tip.position.copy(state.vector).multiplyScalar(1.68);pg.setFromPoints([tip.position.clone(),new THREE.Vector3(tip.position.x,tip.position.y,0)]);pl.computeLineDistances();ui(state.vector);renderer.render(scene,camera)}sync(state.vector);ui(state.vector);sound(state.vector,false);loop();
