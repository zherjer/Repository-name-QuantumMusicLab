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
  updateSoundReadout
} from "./ui.js";

const elements = getElements();
const state = {
  vector: new THREE.Vector3(INITIAL_VECTOR.x, INITIAL_VECTOR.y, INITIAL_VECTOR.z).normalize()
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

initResponsiveStatus(elements.screenMode);
syncInputs(elements, state.vector);
refresh(false);
