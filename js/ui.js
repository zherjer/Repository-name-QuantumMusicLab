const $ = selector => document.querySelector(selector);

export function getElements() {
  return {
    xInput: $("#xInput"),
    yInput: $("#yInput"),
    zInput: $("#zInput"),
    xSlider: $("#xSlider"),
    ySlider: $("#ySlider"),
    zSlider: $("#zSlider"),
    updateButton: $("#updateVectorButton"),
    resetButton: $("#resetButton"),
    measureButton: $("#measureButton"),
    audioButton: $("#audioButton"),
    filterSlider: $("#filterSlider"),
    volumeSlider: $("#volumeSlider"),
    filterAmount: $("#filterAmount"),
    volumeAmount: $("#volumeAmount"),
    inputWarning: $("#inputWarning"),
    gateMessage: $("#gateMessage"),
    xValue: $("#xValue"),
    yValue: $("#yValue"),
    zValue: $("#zValue"),
    normValue: $("#normValue"),
    alphaValue: $("#alphaValue"),
    betaValue: $("#betaValue"),
    stateKet: $("#stateKet"),
    probability0Value: $("#probability0Value"),
    probability1Value: $("#probability1Value"),
    probability0Bar: $("#probability0Bar"),
    probability1Bar: $("#probability1Bar"),
    interpretationText: $("#interpretationText"),
    thetaValue: $("#thetaValue"),
    phiValue: $("#phiValue"),
    noteValue: $("#noteValue"),
    frequencyValue: $("#frequencyValue"),
    waveValue: $("#waveValue"),
    screenMode: $("#screenMode"),
    blochContainer: $("#blochContainer")
  };
}

export function syncInputs(elements, vector) {
  for (const axis of ["x", "y", "z"]) {
    elements[`${axis}Input`].value = vector[axis].toFixed(2);
    elements[`${axis}Slider`].value = vector[axis].toFixed(2);
  }
}

function describeState(vector, probability0, probability1) {
  const tolerance = 0.04;

  if (vector.z > 1 - tolerance) {
    return "El qubit está en |0⟩, en el polo norte. Al medirlo, se obtiene 0 con probabilidad de 100 %.";
  }

  if (vector.z < -1 + tolerance) {
    return "El qubit está en |1⟩, en el polo sur. Al medirlo, se obtiene 1 con probabilidad de 100 %.";
  }

  if (Math.abs(vector.x - 1) < tolerance) {
    return "El qubit está cerca de |+⟩: una superposición equilibrada de |0⟩ y |1⟩ con fase relativa cero.";
  }

  if (Math.abs(vector.x + 1) < tolerance) {
    return "El qubit está cerca de |−⟩: tiene probabilidades iguales de medir 0 o 1, pero una fase relativa de π.";
  }

  if (Math.abs(vector.y - 1) < tolerance) {
    return "El qubit está cerca de |+i⟩: tiene probabilidades iguales de medir 0 o 1 y una fase relativa de +π/2.";
  }

  if (Math.abs(vector.y + 1) < tolerance) {
    return "El qubit está cerca de |−i⟩: tiene probabilidades iguales de medir 0 o 1 y una fase relativa de −π/2.";
  }

  if (Math.abs(probability0 - probability1) < 0.06) {
    return "El qubit está en una superposición casi equilibrada: medir 0 o 1 tiene una probabilidad muy parecida. La dirección sobre el ecuador representa su fase.";
  }

  if (probability0 > probability1) {
    return `El qubit está más cerca de |0⟩. Si se mide ahora, 0 es el resultado más probable (${(probability0 * 100).toFixed(1)} %).`;
  }

  return `El qubit está más cerca de |1⟩. Si se mide ahora, 1 es el resultado más probable (${(probability1 * 100).toFixed(1)} %).`;
}

export function updateReadout(elements, vector) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const theta = Math.acos(clamp(vector.z, -1, 1));
  let phi = Math.atan2(vector.y, vector.x);
  if (phi < 0) phi += Math.PI * 2;

  // Estado de un qubit puro:
  // |ψ⟩ = α|0⟩ + β|1⟩
  // α = cos(θ/2)
  // β = exp(iφ) sin(θ/2)
  const alpha = Math.cos(theta / 2);
  const betaMagnitude = Math.sin(theta / 2);
  const betaReal = betaMagnitude * Math.cos(phi);
  const betaImaginary = betaMagnitude * Math.sin(phi);
  const betaSign = betaImaginary >= 0 ? "+" : "−";

  const probability0 = alpha * alpha;
  const probability1 = betaMagnitude * betaMagnitude;
  const probability0Percent = probability0 * 100;
  const probability1Percent = probability1 * 100;

  elements.xValue.value = vector.x.toFixed(2);
  elements.yValue.value = vector.y.toFixed(2);
  elements.zValue.value = vector.z.toFixed(2);
  elements.normValue.value = vector.length().toFixed(2);

  elements.alphaValue.value = alpha.toFixed(3);
  elements.betaValue.value =
    `${betaReal.toFixed(3)} ${betaSign} ${Math.abs(betaImaginary).toFixed(3)}i`;

  elements.stateKet.textContent =
    `|ψ⟩ = ${alpha.toFixed(3)}|0⟩ + (${betaReal.toFixed(3)} ${betaSign} ${Math.abs(betaImaginary).toFixed(3)}i)|1⟩`;

  elements.probability0Value.value = `${probability0Percent.toFixed(1)} %`;
  elements.probability1Value.value = `${probability1Percent.toFixed(1)} %`;
  elements.probability0Bar.style.width = `${probability0Percent}%`;
  elements.probability1Bar.style.width = `${probability1Percent}%`;

  elements.thetaValue.value = `${(theta * 180 / Math.PI).toFixed(1)}°`;
  elements.phiValue.value = `${(phi * 180 / Math.PI).toFixed(1)}°`;

  elements.interpretationText.textContent =
    describeState(vector, probability0, probability1);
}

export function updateSoundReadout(elements, soundInfo) {
  elements.noteValue.value = soundInfo.note;
  elements.frequencyValue.value = soundInfo.frequency;
  elements.waveValue.value = soundInfo.wave;
}
