import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

function rotate(vector, axis, angle) {
  return vector.clone().applyAxisAngle(axis, angle).normalize();
}

export function applyGate(name, vector) {
  const v = vector.clone();

  if (name === "H") {
    v.applyAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), Math.PI);
    return { vector: v.normalize(), message: "Compuerta H aplicada." };
  }

  if (name === "X") return { vector: rotate(v, new THREE.Vector3(1,0,0), Math.PI), message: "Compuerta X aplicada." };
  if (name === "Y") return { vector: rotate(v, new THREE.Vector3(0,1,0), Math.PI), message: "Compuerta Y aplicada." };
  if (name === "Z") return { vector: rotate(v, new THREE.Vector3(0,0,1), Math.PI), message: "Compuerta Z aplicada." };
  if (name === "S") return { vector: rotate(v, new THREE.Vector3(0,0,1), Math.PI/2), message: "Compuerta S aplicada." };
  if (name === "T") return { vector: rotate(v, new THREE.Vector3(0,0,1), Math.PI/4), message: "Compuerta T aplicada." };

  return {
    vector,
    message: "CNOT necesita dos qubits. Se habilitará en una siguiente versión."
  };
}
