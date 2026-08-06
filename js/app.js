import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { INITIAL_VECTOR } from "./config.js";
import { createBlochSphere } from "./bloch.js";
import { activateAudio, updateSound } from "./audio.js";
import { applyGate } from "./gates.js";
import { initResponsiveStatus } from "./responsive.js";
import {
  getElements,
  syncInputs,
  updateReadout,
  updateSoundReadout,
  updateMeasurementReadout,
  updatePreparedStateReadout,
  updateExperimentReadout
} from "./ui.js";

const elements = getElements();
const state = {
  vector: new THREE.Vector3(INITIAL_VECTOR.x, INITIAL_VECTOR.y, INITIAL_VECTOR.z).normalize(),
  measurements: { zero: 0, one: 0 },
  preparedVector: new THREE.Vector3(INITIAL_VECTOR.x, INITIAL_VECTOR.y, INITIAL_VECTOR.z).normalize(),
  measuring: false,
  runningExperiment: false
};

const soundControls = () => ({
  filter: Number(elements.filterSlider.value),
  volume: Number(elements.volumeSlider.value)
});

function refresh(play = false) {
  updateReadout(elements, state.vector);
  updateSoundReadout(elements, updateSound(state.vector, soundControls(), play));
}

function setVector(vector, { sync = true, play = true } = {}) {
  if (vector.lengthSq() < 1e-8) {
    elements.inputWarning.textContent = "El vector no puede ser (0, 0, 0).";
    return false;
  }

  elements.inputWarning.textContent = "";
  state.vector.copy(vector).normalize();
  bloch.setVector(state.vector);

  if (sync) syncInputs(elements, state.vector);
  refresh(play);
  return true;
}

const bloch = createBlochSphere(
  elements.blochContainer,
  state.vector,
  (vector, play) => {
    setVector(vector, { sync: true, play });
    elements.gateMessage.textContent = "Moviste el vector directamente sobre la esfera.";
  }
);

function updateFromInputs() {
  const vector = new THREE.Vector3(
    Number(elements.xInput.value),
    Number(elements.yInput.value),
    Number(elements.zInput.value)
  );

  if ([vector.x, vector.y, vector.z].some(Number.isNaN)) {
    elements.inputWarning.textContent = "Escribe valores numéricos válidos.";
    return;
  }

  const originalNorm = vector.length();
  if (setVector(vector)) {
    if (Math.abs(originalNorm - 1) > 0.015) {
      elements.inputWarning.textContent =
        `Los valores se normalizaron automáticamente (norma original: ${originalNorm.toFixed(2)}).`;
    }
    elements.gateMessage.textContent = "Actualizaste el estado mediante sus coordenadas.";
  }
}

elements.updateButton.addEventListener("click", updateFromInputs);

for (const input of [elements.xInput, elements.yInput, elements.zInput]) {
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") updateFromInputs();
  });
}

for (const axis of ["x", "y", "z"]) {
  elements[`${axis}Slider`].addEventListener("input", event => {
    elements[`${axis}Input`].value = Number(event.target.value).toFixed(2);
  });

  elements[`${axis}Slider`].addEventListener("change", updateFromInputs);
}

elements.resetButton.addEventListener("click", () => {
  setVector(new THREE.Vector3(0, 0, 1));
  elements.gateMessage.textContent = "Regresamos al estado |0⟩.";
});

elements.audioButton.addEventListener("click", async () => {
  await activateAudio();
  elements.audioButton.classList.add("active");
  elements.audioButton.querySelector("span:last-child").textContent = "Sonido activado";
  refresh(true);
});

elements.filterSlider.addEventListener("input", event => {
  elements.filterAmount.value = Number(event.target.value).toFixed(2);
  refresh(false);
});

elements.volumeSlider.addEventListener("input", event => {
  elements.volumeAmount.value = Number(event.target.value).toFixed(2);
  refresh(false);
});

document.querySelectorAll("[data-gate]").forEach(button => {
  button.addEventListener("click", () => {
    const result = applyGate(button.dataset.gate, state.vector);
    setVector(result.vector);
    elements.gateMessage.textContent = result.message;
  });
});

function savePreparedState() {
  state.preparedVector.copy(state.vector).normalize();
  updatePreparedStateReadout(elements, state.preparedVector);
  elements.gateMessage.textContent = "Se guardó el estado actual como estado preparado.";
}

function restorePreparedState({ play = true } = {}) {
  setVector(state.preparedVector.clone(), { sync: true, play });
  elements.gateMessage.textContent = "Se restauró el estado preparado.";
}

function probabilityOfZero(vector) {
  return (1 + THREE.MathUtils.clamp(vector.z, -1, 1)) / 2;
}

async function measureQubit() {
  if (state.measuring) return;
  state.measuring = true;
  elements.measureButton.disabled = true;
  elements.measureButton.textContent = "Midiendo…";

  const result = Math.random() < probabilityOfZero(state.vector) ? 0 : 1;
  await new Promise(resolve => setTimeout(resolve, 350));

  if (result === 0) {
    state.measurements.zero += 1;
    setVector(new THREE.Vector3(0, 0, 1), { sync: true, play: true });
    elements.gateMessage.textContent = "Resultado |0⟩: el vector colapsó al polo norte.";
  } else {
    state.measurements.one += 1;
    setVector(new THREE.Vector3(0, 0, -1), { sync: true, play: true });
    elements.gateMessage.textContent = "Resultado |1⟩: el vector colapsó al polo sur.";
  }

  updateMeasurementReadout(elements, state.measurements, result);
  elements.measureButton.disabled = false;
  elements.measureButton.textContent = "Medir qubit";
  state.measuring = false;
}

elements.measureButton.addEventListener("click", measureQubit);
elements.resetMeasurementsButton.addEventListener("click", () => {
  state.measurements.zero = 0;
  state.measurements.one = 0;
  updateMeasurementReadout(elements, state.measurements, null);
  updateExperimentReadout(elements, 0, 0);
  elements.gateMessage.textContent = "Se reinició el conteo de mediciones.";
});

elements.savePreparedStateButton.addEventListener("click", savePreparedState);
elements.restorePreparedStateButton.addEventListener("click", () => restorePreparedState());

elements.runExperimentButton.addEventListener("click", async () => {
  if (state.runningExperiment) return;
  const shots = Math.max(1, Math.min(10000, Number(elements.shotsInput.value) || 1));
  elements.shotsInput.value = shots;
  state.runningExperiment = true;
  elements.runExperimentButton.disabled = true;
  elements.runExperimentButton.textContent = "Ejecutando…";
  const p0 = probabilityOfZero(state.preparedVector);
  let result0 = 0, result1 = 0;
  for (let i = 0; i < shots; i++) { if (Math.random() < p0) result0++; else result1++; }
  await new Promise(resolve => setTimeout(resolve, Math.min(800, 150 + shots * 0.4)));
  updateExperimentReadout(elements, result0, result1);
  elements.gateMessage.textContent = `Experimento completado: ${result0} resultados |0⟩ y ${result1} resultados |1⟩.`;
  elements.runExperimentButton.disabled = false;
  elements.runExperimentButton.textContent = "Ejecutar experimento";
  state.runningExperiment = false;
});

initResponsiveStatus(elements.screenMode);
syncInputs(elements, state.vector);
updateMeasurementReadout(elements, state.measurements, null);
updatePreparedStateReadout(elements, state.preparedVector);
updateExperimentReadout(elements, 0, 0);
refresh(false);
