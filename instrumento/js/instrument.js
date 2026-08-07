import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as Tone from "https://cdn.jsdelivr.net/npm/tone@14.8.49/+esm";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const COLORS = [
  0x00ef9d,
  0xffd400,
  0xff3aa7,
  0x00c9ff,
  0xbd55ff
];

const initialVectors = [
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(.5, .5, .71).normalize(),
  new THREE.Vector3(-.5, .5, .71).normalize()
];

const DEFAULT_PATTERN = [true, false, true, false, true, false, true, false];

const state = {
  vectors: initialVectors.map(vector => vector.clone()),
  pattern: [...DEFAULT_PATTERN],
  audioReady: false,
  transportState: "stopped", // stopped | running | paused
  currentStep: -1
};

const elements = {
  audioButton: document.querySelector("#audioButton"),
  playButton: document.querySelector("#playButton"),
  pauseButton: document.querySelector("#pauseButton"),
  stopButton: document.querySelector("#stopButton"),
  resetButton: document.querySelector("#resetButton"),
  randomizeButton: document.querySelector("#randomizeButton"),
  message: document.querySelector("#instrumentMessage"),
  noteReadout: document.querySelector("#noteReadout"),
  waveReadout: document.querySelector("#waveReadout"),
  filterReadout: document.querySelector("#filterReadout"),
  effectReadout: document.querySelector("#effectReadout"),
  tempoReadout: document.querySelector("#tempoReadout"),
  steps: [...document.querySelectorAll(".step")]
};

const NOTE_NAMES = ["Do 3","Re 3","Mi 3","Sol 3","La 3","Do 4","Re 4","Mi 4","Sol 4","La 4","Do 5","Re 5","Mi 5","Sol 5","La 5","Si 5"];
const TONE_NOTES = ["C3","D3","E3","G3","A3","C4","D4","E4","G4","A4","C5","D5","E5","G5","A5","B5"];
const WAVE_TYPES = ["sine","triangle","sawtooth","square"];
const WAVE_LABELS = {
  sine: "Seno",
  triangle: "Triangular",
  sawtooth: "Sierra",
  square: "Cuadrada"
};
const DURATION_VALUES = ["16n", "8n", "4n"];
const DURATION_LABELS = ["1/16", "1/8", "1/4"];

const filter = new Tone.Filter({ frequency: 3400, type: "lowpass", rolloff: -12 });
const delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: .2, wet: .15 });
const reverb = new Tone.Reverb({ decay: 2.4, wet: .35 });
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: .02, decay: .14, sustain: .45, release: .45 }
}).chain(filter, delay, reverb, Tone.Destination);

Tone.Transport.bpm.value = 100;

function blochToMusic() {
  const [q1, q2, q3, q4, q5] = state.vectors;

  const noteIndex = Math.round((q1.z + 1) * .5 * (TONE_NOTES.length - 1));

  let phi = Math.atan2(q2.y, q2.x);
  if (phi < 0) phi += Math.PI * 2;
  const waveIndex = Math.floor(phi / (Math.PI * 2) * 4) % 4;
  const wave = WAVE_TYPES[waveIndex];

  const cutoff = Math.round(350 + ((q3.y + 1) / 2) * 7200);

  // Q4 se limita exclusivamente a efectos.
  const delayWet = clamp((q4.x + 1) / 2 * .50, 0, .50);
  const reverbWet = clamp((q4.z + 1) / 2 * .65, 0, .65);

  // Q5 se limita a tiempo/duración. No modifica state.pattern.
  const tempo = Math.round(55 + ((q5.z + 1) / 2) * 125);
  const durationIndex = clamp(Math.round(((q5.x + 1) / 2) * (DURATION_VALUES.length - 1)), 0, DURATION_VALUES.length - 1);

  return {
    noteIndex,
    note: TONE_NOTES[noteIndex],
    noteLabel: NOTE_NAMES[noteIndex],
    wave,
    cutoff,
    delayWet,
    reverbWet,
    tempo,
    duration: DURATION_VALUES[durationIndex],
    durationLabel: DURATION_LABELS[durationIndex]
  };
}

function applyMusicState(playPreview = false) {
  const music = blochToMusic();

  synth.set({ oscillator: { type: music.wave } });
  filter.frequency.rampTo(music.cutoff, .08);
  delay.wet.rampTo(music.delayWet, .08);
  reverb.wet.rampTo(music.reverbWet, .08);
  Tone.Transport.bpm.rampTo(music.tempo, .1);

  elements.noteReadout.textContent = music.noteLabel;
  elements.waveReadout.textContent = WAVE_LABELS[music.wave];
  elements.filterReadout.textContent = `${(music.cutoff / 1000).toFixed(1)} kHz`;
  elements.effectReadout.textContent =
    `R ${Math.round(music.reverbWet * 100)} % · D ${Math.round(music.delayWet * 100)} %`;
  elements.tempoReadout.textContent = `${music.tempo} BPM · ${music.durationLabel}`;

  if (state.audioReady && playPreview && state.transportState !== "running") {
    synth.triggerAttackRelease(music.note, music.duration);
  }
}

function renderSteps() {
  elements.steps.forEach((step, index) => {
    step.classList.toggle("active", state.pattern[index]);
    step.classList.toggle("playing", state.currentStep === index && state.transportState === "running");
    step.setAttribute("aria-pressed", String(state.pattern[index]));
  });
}

function updateTransportButtons() {
  const audio = state.audioReady;
  const running = state.transportState === "running";
  const paused = state.transportState === "paused";

  elements.playButton.disabled = !audio || running;
  elements.pauseButton.disabled = !audio || !running;
  elements.stopButton.disabled = !audio || state.transportState === "stopped";

  elements.playButton.textContent = paused ? "▶ Continuar" : "▶ Iniciar";
  elements.pauseButton.textContent = "⏸ Pausar";
}

class MiniBlochSphere {
  constructor(container, index, color, initialVector, onChange) {
    this.container = container;
    this.index = index;
    this.color = color;
    this.vector = initialVector.clone().normalize();
    this.target = this.vector.clone();
    this.onChange = onChange;
    this.dragging = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
    this.camera.position.set(0, .12, 5.7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const light = new THREE.PointLight(color, 6, 10);
    light.position.set(1, 2, 4);
    this.scene.add(light);

    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 40, 28),
      new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: .12,
        roughness: .2,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    this.scene.add(this.sphere);

    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(1.355, 18, 12),
      new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: .18,
        depthWrite: false
      })
    );
    this.scene.add(wire);

    this.addAxis(new THREE.Vector3(0,-1.65,0), new THREE.Vector3(0,1.65,0), 0x00c9ff);
    this.addAxis(new THREE.Vector3(-1.55,-.45,0), new THREE.Vector3(1.55,.45,0), 0xffd400);
    this.addAxis(new THREE.Vector3(-1.55,.45,0), new THREE.Vector3(1.55,-.45,0), 0xff3aa7);

    this.arrow = new THREE.ArrowHelper(
      this.blochToScene(this.vector),
      new THREE.Vector3(),
      1.32,
      color,
      .17,
      .10
    );
    this.scene.add(this.arrow);

    this.tip = new THREE.Mesh(
      new THREE.SphereGeometry(.07, 18, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 1.4 })
    );
    this.scene.add(this.tip);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.bindPointer();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    this.animate();
  }

  addAxis(start, end, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    this.scene.add(new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: .75 })
    ));
  }

  blochToScene(vector) {
    return new THREE.Vector3(vector.x, vector.z, vector.y).normalize();
  }

  sceneToBloch(vector) {
    return new THREE.Vector3(vector.x, vector.z, vector.y).normalize();
  }

  pointerToBloch(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.sphere, false);
    if (!hits.length) return null;
    return this.sceneToBloch(hits[0].point.clone().normalize());
  }

  bindPointer() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener("pointerdown", event => {
      const vector = this.pointerToBloch(event);
      if (!vector) return;
      this.dragging = true;
      canvas.setPointerCapture(event.pointerId);
      this.setVector(vector, true);
    });

    canvas.addEventListener("pointermove", event => {
      const vector = this.pointerToBloch(event);
      canvas.style.cursor = vector ? (this.dragging ? "grabbing" : "crosshair") : "default";
      if (this.dragging && vector) this.setVector(vector, false);
    });

    canvas.addEventListener("pointerup", event => {
      this.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      const vector = this.pointerToBloch(event);
      if (vector) this.setVector(vector, true);
    });

    canvas.addEventListener("pointercancel", () => {
      this.dragging = false;
    });
  }

  setVector(vector, playPreview = false) {
    if (vector.lengthSq() < 1e-8) return;
    this.target.copy(vector).normalize();
    this.onChange(this.index, this.target.clone(), playPreview);
  }

  forceVector(vector) {
    if (vector.lengthSq() < 1e-8) return;
    this.vector.copy(vector).normalize();
    this.target.copy(vector).normalize();
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  slerpUnitVectors(from, to, amount) {
    const dot = THREE.MathUtils.clamp(from.dot(to), -1, 1);

    if (dot > .9995) {
      return from.clone().lerp(to, amount).normalize();
    }

    if (dot < -.9995) {
      const reference = Math.abs(from.x) < .8
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);
      const axis = from.clone().cross(reference).normalize();
      return from.clone().applyAxisAngle(axis, Math.PI * amount).normalize();
    }

    const angle = Math.acos(dot);
    const sinAngle = Math.sin(angle);
    return from.clone()
      .multiplyScalar(Math.sin((1 - amount) * angle) / sinAngle)
      .add(to.clone().multiplyScalar(Math.sin(amount * angle) / sinAngle))
      .normalize();
  }

  animate() {
    if (this.vector.angleTo(this.target) < .002) {
      this.vector.copy(this.target);
    } else {
      this.vector.copy(this.slerpUnitVectors(this.vector, this.target, .28));
    }

    const sceneVector = this.blochToScene(this.vector);
    this.arrow.setDirection(sceneVector);
    this.tip.position.copy(sceneVector).multiplyScalar(1.32);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }
}

const spheres = [];
for (let index = 0; index < 5; index++) {
  spheres.push(new MiniBlochSphere(
    document.querySelector(`#sphere${index + 1}`),
    index,
    COLORS[index],
    state.vectors[index],
    handleVectorChange
  ));
}

function updateQubitControls(index) {
  const vector = state.vectors[index];
  const number = index + 1;

  document.querySelector(`#q${number}x`).value = vector.x.toFixed(2);
  document.querySelector(`#q${number}y`).value = vector.y.toFixed(2);
  document.querySelector(`#q${number}z`).value = vector.z.toFixed(2);

  document.querySelector(`#q${number}State`).textContent =
    `x ${vector.x.toFixed(2)} · y ${vector.y.toFixed(2)} · z ${vector.z.toFixed(2)}`;
}

function handleVectorChange(index, vector, playPreview = false) {
  state.vectors[index].copy(vector).normalize();
  updateQubitControls(index);
  applyMusicState(playPreview);
}

for (let index = 0; index < 5; index++) {
  const number = index + 1;

  ["x","y","z"].forEach(axis => {
    document.querySelector(`#q${number}${axis}`).addEventListener("change", () => {
      const vector = new THREE.Vector3(
        Number(document.querySelector(`#q${number}x`).value),
        Number(document.querySelector(`#q${number}y`).value),
        Number(document.querySelector(`#q${number}z`).value)
      );

      if (vector.lengthSq() < 1e-8) {
        elements.message.textContent = `Q${number}: el vector no puede ser (0,0,0).`;
        updateQubitControls(index);
        return;
      }

      spheres[index].setVector(vector.normalize(), true);
    });
  });
}

elements.audioButton.addEventListener("click", async () => {
  await Tone.start();
  state.audioReady = true;
  elements.audioButton.textContent = "🔊 Sonido activado";
  applyMusicState(true);
  updateTransportButtons();
  elements.message.textContent = "Sonido activado. El instrumento está listo.";
});

elements.steps.forEach((step, index) => {
  step.addEventListener("click", () => {
    state.pattern[index] = !state.pattern[index];
    renderSteps();
    elements.message.textContent =
      `Paso ${index + 1} ${state.pattern[index] ? "activado" : "desactivado"}.`;
  });
});

elements.randomizeButton.addEventListener("click", () => {
  state.pattern = state.pattern.map(() => Math.random() > .45);

  // Garantiza al menos un paso activo para evitar un loop silencioso accidental.
  if (!state.pattern.some(Boolean)) {
    state.pattern[Math.floor(Math.random() * state.pattern.length)] = true;
  }

  renderSteps();
  elements.message.textContent = "Se creó una nueva secuencia de ocho pasos.";
});

// La secuencia se agenda UNA sola vez. El transporte decide si corre,
// se pausa, continúa o vuelve al inicio.
const sequence = new Tone.Sequence((time, stepIndex) => {
  state.currentStep = stepIndex;

  requestAnimationFrame(renderSteps);

  if (!state.pattern[stepIndex]) return;

  const music = blochToMusic();

  // Patrón melódico fijo e independiente de Q4/Q5.
  // Las esferas cambian el sonido y el tiempo, no los pasos activos.
  const melodicOffsets = [0, 2, 4, 7, 4, 2, 9, 7];
  const midi = Tone.Frequency(music.note).toMidi() + melodicOffsets[stepIndex];
  const note = Tone.Frequency(midi, "midi").toNote();

  synth.triggerAttackRelease(note, music.duration, time, .75);
}, [...Array(8).keys()], "8n");

// Importante: se inicia una sola vez en la línea temporal.
// Nunca se llama sequence.stop() durante el uso normal.
sequence.start(0);

elements.playButton.addEventListener("click", async () => {
  if (!state.audioReady || state.transportState === "running") return;

  await Tone.start();

  Tone.Transport.start();
  state.transportState = "running";
  updateTransportButtons();
  renderSteps();

  elements.message.textContent =
    state.currentStep >= 0 ? "El loop continúa desde la posición pausada." : "Loop iniciado.";
});

elements.pauseButton.addEventListener("click", () => {
  if (state.transportState !== "running") return;

  Tone.Transport.pause();
  state.transportState = "paused";
  state.currentStep = -1;

  updateTransportButtons();
  renderSteps();
  elements.message.textContent = "Loop pausado. Presiona Continuar para seguir desde la misma posición.";
});

elements.stopButton.addEventListener("click", () => {
  if (state.transportState === "stopped") return;

  Tone.Transport.stop();
  Tone.Transport.position = 0;
  state.transportState = "stopped";
  state.currentStep = -1;

  updateTransportButtons();
  renderSteps();
  elements.message.textContent = "Loop detenido. Al iniciar nuevamente comenzará desde el paso 1.";
});

elements.resetButton.addEventListener("click", () => {
  Tone.Transport.stop();
  Tone.Transport.position = 0;

  state.transportState = "stopped";
  state.currentStep = -1;
  state.pattern = [...DEFAULT_PATTERN];

  state.vectors = initialVectors.map(vector => vector.clone());

  spheres.forEach((sphere, index) => {
    sphere.forceVector(state.vectors[index]);
    updateQubitControls(index);
  });

  applyMusicState(false);
  renderSteps();
  updateTransportButtons();

  elements.message.textContent =
    "Instrumento reiniciado: esferas, patrón y transporte regresaron al estado inicial.";
});

for (let index = 0; index < 5; index++) {
  updateQubitControls(index);
}

renderSteps();
updateTransportButtons();
applyMusicState(false);
