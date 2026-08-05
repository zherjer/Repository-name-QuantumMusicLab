import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as Tone from "https://cdn.jsdelivr.net/npm/tone@14.8.49/+esm";

// ---------- Estado del qubit ----------
// Estado inicial |0>: vector de Bloch (0, 0, 1).
const state = {
  vector: new THREE.Vector3(0, 0, 1),
  target: new THREE.Vector3(0, 0, 1),
  audioReady: false,
  dragging: false
};

// ---------- Escena 3D ----------
const container = document.querySelector("#blochContainer");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(3.3, 2.4, 4.2);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.3));
const keyLight = new THREE.DirectionalLight(0xaedfff, 2.7);
keyLight.position.set(4, 5, 3);
scene.add(keyLight);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.45, 48, 32),
  new THREE.MeshPhysicalMaterial({
    color: 0x4e72d9,
    transparent: true,
    opacity: 0.19,
    roughness: 0.25,
    metalness: 0.05,
    side: THREE.DoubleSide
  })
);
scene.add(sphere);

const wireSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.46, 20, 14),
  new THREE.MeshBasicMaterial({
    color: 0x79dfff,
    wireframe: true,
    transparent: true,
    opacity: 0.20
  })
);
scene.add(wireSphere);

function axis(color, start, end) {
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.78 });
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
}

axis(0xff8aa1, new THREE.Vector3(-1.85,0,0), new THREE.Vector3(1.85,0,0));
axis(0x83f1b5, new THREE.Vector3(0,-1.85,0), new THREE.Vector3(0,1.85,0));
axis(0xfbe17d, new THREE.Vector3(0,0,-1.85), new THREE.Vector3(0,0,1.85));

function label(text, position, color="#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.font = "700 34px sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, 64, 42);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.position.copy(position);
  sprite.scale.set(.46, .23, 1);
  scene.add(sprite);
}
label("X", new THREE.Vector3(2.0,0,0), "#ff9ca8");
label("Y", new THREE.Vector3(0,2.0,0), "#8ff3ba");
label("|0⟩", new THREE.Vector3(0,0,1.95), "#ffe88a");
label("|1⟩", new THREE.Vector3(0,0,-1.95), "#ffe88a");

const arrow = new THREE.ArrowHelper(
  state.vector.clone().normalize(),
  new THREE.Vector3(0,0,0),
  1.44,
  0xffffff,
  0.22,
  0.13
);
scene.add(arrow);

const tip = new THREE.Mesh(
  new THREE.SphereGeometry(.09, 24, 16),
  new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x63d8ff, emissiveIntensity: 1.2 })
);
scene.add(tip);

// ---------- Audio ----------
const filter = new Tone.Filter({ frequency: 4200, type: "lowpass", rolloff: -12 });
const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.18 });
const synth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.03, decay: 0.18, sustain: 0.5, release: 0.55 }
}).chain(filter, reverb, Tone.Destination);

const noteNames = ["C3","D3","E3","G3","A3","C4","D4","E4","G4","A4","C5","D5","E5","G5","A5","B5"];
const waveNames = {
  sine: "seno",
  triangle: "triangular",
  sawtooth: "diente de sierra",
  square: "cuadrada"
};

function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function soundFromVector(v, play=true) {
  // z: altura musical; x: timbre; y: brillo del filtro.
  const noteIndex = Math.round(mapRange(v.z, -1, 1, 0, noteNames.length - 1));
  const note = noteNames[Math.max(0, Math.min(noteNames.length - 1, noteIndex))];

  let wave = "sine";
  if (v.x < -0.5) wave = "sine";
  else if (v.x < 0) wave = "triangle";
  else if (v.x < 0.5) wave = "sawtooth";
  else wave = "square";

  const cutoff = Math.round(mapRange(v.y, -1, 1, 350, 6200));
  synth.oscillator.type = wave;
  filter.frequency.rampTo(cutoff, 0.12);

  document.querySelector("#noteValue").value = note;
  document.querySelector("#frequencyValue").value =
    `${Tone.Frequency(note).toFrequency().toFixed(1)} Hz`;
  document.querySelector("#waveValue").value = waveNames[wave];
  document.querySelector("#filterValue").value =
    cutoff < 1800 ? "oscuro" : cutoff < 4200 ? "medio" : "brillante";

  if (state.audioReady && play) {
    synth.triggerAttackRelease(note, "8n");
  }
}

// ---------- Transformaciones cuánticas ----------
function rotateVector(v, axisName, angle) {
  const axisMap = {
    x: new THREE.Vector3(1,0,0),
    y: new THREE.Vector3(0,1,0),
    z: new THREE.Vector3(0,0,1)
  };
  return v.clone().applyAxisAngle(axisMap[axisName], angle).normalize();
}

const gateMessages = {
  H: "H lleva el vector hacia el ecuador: aparecen dos posibilidades equilibradas.",
  X: "X gira el vector media vuelta alrededor de X: intercambia |0⟩ y |1⟩.",
  Z: "Z gira el vector media vuelta alrededor de Z: cambia la fase del estado.",
  S: "S produce un cuarto de vuelta alrededor de Z.",
  T: "T produce un octavo de vuelta alrededor de Z.",
  RESET: "Regresamos al polo norte: el estado |0⟩."
};

function applyGate(gate) {
  let v = state.target.clone();

  switch (gate) {
    case "H":
      // H en la esfera de Bloch equivale a rotación pi alrededor del eje (x+z)/sqrt(2).
      v.applyAxisAngle(new THREE.Vector3(1,0,1).normalize(), Math.PI);
      break;
    case "X":
      v = rotateVector(v, "x", Math.PI);
      break;
    case "Z":
      v = rotateVector(v, "z", Math.PI);
      break;
    case "S":
      v = rotateVector(v, "z", Math.PI / 2);
      break;
    case "T":
      v = rotateVector(v, "z", Math.PI / 4);
      break;
    case "RESET":
      v.set(0,0,1);
      break;
  }

  state.target.copy(v.normalize());
  document.querySelector("#message").textContent = gateMessages[gate];
  soundFromVector(state.target, true);
}

document.querySelectorAll("[data-gate]").forEach(button => {
  button.addEventListener("click", () => applyGate(button.dataset.gate));
});

document.querySelector("#audioButton").addEventListener("click", async (event) => {
  await Tone.start();
  state.audioReady = true;
  event.currentTarget.textContent = "Sonido activado";
  event.currentTarget.classList.add("active");
  soundFromVector(state.vector, true);
});

// ---------- Interacción directa ----------
function pointerToVector(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

  // Mapeo pedagógico: horizontal -> longitud; vertical -> latitud.
  const longitude = nx * Math.PI;
  const latitude = ny * Math.PI / 2;
  return new THREE.Vector3(
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude),
    Math.cos(latitude) * Math.cos(longitude)
  ).normalize();
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  state.dragging = true;
  renderer.domElement.setPointerCapture(event.pointerId);
  state.target.copy(pointerToVector(event));
  document.querySelector("#message").textContent =
    "Moviste el vector directamente: ahora estás diseñando el sonido con la esfera.";
  soundFromVector(state.target, true);
});

renderer.domElement.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  state.target.copy(pointerToVector(event));
  soundFromVector(state.target, false);
});

renderer.domElement.addEventListener("pointerup", (event) => {
  state.dragging = false;
  renderer.domElement.releasePointerCapture(event.pointerId);
  soundFromVector(state.target, true);
});

renderer.domElement.addEventListener("pointercancel", () => {
  state.dragging = false;
});

// ---------- Render ----------
function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener("resize", resize);
resize();

function updateReadout(v) {
  document.querySelector("#xValue").textContent = v.x.toFixed(2);
  document.querySelector("#yValue").textContent = v.y.toFixed(2);
  document.querySelector("#zValue").textContent = v.z.toFixed(2);
}

function animate() {
  requestAnimationFrame(animate);

  state.vector.lerp(state.target, 0.10).normalize();
  arrow.setDirection(state.vector.clone().normalize());
  tip.position.copy(state.vector).multiplyScalar(1.44);
  wireSphere.rotation.y += 0.0015;

  updateReadout(state.vector);
  renderer.render(scene, camera);
}
soundFromVector(state.vector, false);
animate();
