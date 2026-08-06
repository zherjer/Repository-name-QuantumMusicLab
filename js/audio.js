import * as Tone from "https://cdn.jsdelivr.net/npm/tone@14.8.49/+esm";

const filter = new Tone.Filter({ frequency: 4200, type: "lowpass", rolloff: -12 });
const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.16 });
const synth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.03, decay: 0.18, sustain: 0.5, release: 0.55 }
}).chain(filter, reverb, Tone.Destination);

const NOTES = [
  ["Do 3","C3"], ["Re 3","D3"], ["Mi 3","E3"], ["Sol 3","G3"],
  ["La 3","A3"], ["Do 4","C4"], ["Re 4","D4"], ["Mi 4","E4"],
  ["Sol 4","G4"], ["La 4","A4"], ["Do 5","C5"], ["Re 5","D5"],
  ["Mi 5","E5"], ["Sol 5","G5"], ["La 5","A5"], ["Si 5","B5"]
];

const WAVE_NAMES = {
  sine: "Seno",
  triangle: "Triangular",
  sawtooth: "Diente de sierra",
  square: "Cuadrada"
};

let audioReady = false;

export async function activateAudio() {
  await Tone.start();
  audioReady = true;
}

export function updateSound(vector, controls, play = true) {
  const index = Math.round((vector.z + 1) * 0.5 * (NOTES.length - 1));
  const safeIndex = Math.min(NOTES.length - 1, Math.max(0, index));
  const [displayNote, toneNote] = NOTES[safeIndex];

  let wave = "sine";
  if (vector.x < -0.5) wave = "sine";
  else if (vector.x < 0) wave = "triangle";
  else if (vector.x < 0.5) wave = "sawtooth";
  else wave = "square";

  const cutoff = 300 + controls.filter * 6000;
  const db = -28 + controls.volume * 24;

  synth.oscillator.type = wave;
  filter.frequency.rampTo(cutoff, 0.08);
  synth.volume.rampTo(db, 0.08);

  if (audioReady && play) {
    synth.triggerAttackRelease(toneNote, "8n");
  }

  return {
    note: displayNote,
    frequency: `${Tone.Frequency(toneNote).toFrequency().toFixed(2)} Hz`,
    wave: WAVE_NAMES[wave]
  };
}
