import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { COLORS } from "./config.js";

export function createBlochSphere(container, initialVector, onPointerVector) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.18, 7.05);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));
  const light = new THREE.PointLight(0x5fffe0, 10, 12);
  light.position.set(0, 2.5, 4);
  scene.add(light);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.72, 72, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x00b890,
      transparent: true,
      opacity: 0.11,
      roughness: 0.15,
      transmission: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  scene.add(sphere);

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.725, 28, 20),
    new THREE.MeshBasicMaterial({
      color: 0x00dca4,
      wireframe: true,
      transparent: true,
      opacity: 0.20,
      depthWrite: false
    })
  );
  scene.add(wire);

  const addArrow = (start, end, color, head = 0.17) => {
    const direction = end.clone().sub(start);
    const arrow = new THREE.ArrowHelper(
      direction.clone().normalize(),
      start,
      direction.length(),
      color,
      head,
      head * 0.62
    );
    scene.add(arrow);
    return arrow;
  };

  addArrow(new THREE.Vector3(0,-2.05,0), new THREE.Vector3(0,2.08,0), COLORS.cyan);
  addArrow(new THREE.Vector3(1.98,.56,0), new THREE.Vector3(-1.98,-.56,0), COLORS.yellow);
  addArrow(new THREE.Vector3(-1.98,.56,0), new THREE.Vector3(1.98,-.56,0), COLORS.pink);

  const equatorPoints = [];
  for (let i = 0; i <= 128; i++) {
    const angle = i / 128 * Math.PI * 2;
    equatorPoints.push(new THREE.Vector3(1.73 * Math.cos(angle), 0, 1.73 * Math.sin(angle)));
  }

  const equator = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(equatorPoints),
    new THREE.LineDashedMaterial({
      color: COLORS.green,
      dashSize: 0.08,
      gapSize: 0.06,
      transparent: true,
      opacity: 0.7
    })
  );
  equator.computeLineDistances();
  scene.add(equator);

  const addLabel = (text, position, color = "#ffffff", scale = 0.34) => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 130;
    const context = canvas.getContext("2d");
    const lines = text.split("\n");
    const fontSize = lines.length > 2 ? 29 : 34;
    const lineHeight = fontSize + 5;
    const startY = 65 - ((lines.length - 1) * lineHeight) / 2;

    context.font = `700 ${fontSize}px Segoe UI`;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = color;
    context.shadowBlur = 7;

    lines.forEach((line, index) => {
      context.fillText(line, 160, startY + index * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
    );
    sprite.position.copy(position);
    sprite.scale.set(scale * 2.7, scale, 1);
    scene.add(sprite);
  };

  addLabel("+z\nz = +1\n|0⟩", new THREE.Vector3(-.30, 2.13, 0), "#00c9ff", .39);
  addLabel("−z\nz = −1\n|1⟩", new THREE.Vector3(-.30, -2.13, 0), "#00c9ff", .39);

  addLabel("+x\nx = +1\n|+⟩", new THREE.Vector3(-2.08, -.83, 0), "#ffd400", .39);
  addLabel("−x\nx = −1\n|−⟩", new THREE.Vector3(2.08, .83, 0), "#ffd400", .39);

  addLabel("−y\ny = −1\n|−i⟩", new THREE.Vector3(-2.10, .86, 0), "#ff3aa7", .39);
  addLabel("+y\ny = +1\n|+i⟩", new THREE.Vector3(2.10, -.86, 0), "#ff3aa7", .39);

  addLabel("z", new THREE.Vector3(.16, 2.34, 0), "#00aaff", .28);
  addLabel("O\n(0,0,0)", new THREE.Vector3(.36, .16, 0), "#7d929b", .26);


  // Transformación entre coordenadas de Bloch y coordenadas visuales de Three.js.
  // En la interfaz, el eje z de Bloch es vertical; Three.js usa Y como eje vertical.
  // Los ejes x e y se proyectan hacia las diagonales aprobadas en la interfaz.
  const BLOCH_X_SCENE = new THREE.Vector3(-1.0, -0.283, 0.65).normalize();
  const BLOCH_Y_SCENE = new THREE.Vector3( 1.0, -0.283, 0.65).normalize();
  const BLOCH_Z_SCENE = new THREE.Vector3( 0.0,  1.0, 0.0);

  const blochToScene = vector => {
    return BLOCH_X_SCENE.clone().multiplyScalar(vector.x)
      .add(BLOCH_Y_SCENE.clone().multiplyScalar(vector.y))
      .add(BLOCH_Z_SCENE.clone().multiplyScalar(vector.z))
      .normalize();
  };

  // Matriz inversa para convertir un punto visual de la esfera
  // nuevamente a coordenadas físicas de Bloch.
  const blochBasis = new THREE.Matrix3().set(
    BLOCH_X_SCENE.x, BLOCH_Y_SCENE.x, BLOCH_Z_SCENE.x,
    BLOCH_X_SCENE.y, BLOCH_Y_SCENE.y, BLOCH_Z_SCENE.y,
    BLOCH_X_SCENE.z, BLOCH_Y_SCENE.z, BLOCH_Z_SCENE.z
  );
  const inverseBlochBasis = blochBasis.clone().invert();

  const sceneToBloch = sceneVector => {
    return sceneVector.clone()
      .applyMatrix3(inverseBlochBasis)
      .normalize();
  };

  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();

  const current = initialVector.clone();
  const target = initialVector.clone();

  const vectorArrow = new THREE.ArrowHelper(
    blochToScene(current),
    new THREE.Vector3(),
    1.68,
    0x00fff0,
    .19,
    .12
  );
  scene.add(vectorArrow);

  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(.085, 24, 18),
    new THREE.MeshStandardMaterial({
      color: 0x99ffff,
      emissive: 0x00eedd,
      emissiveIntensity: 1.7
    })
  );
  scene.add(tip);

  const projectionGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3()
  ]);

  const projectionLine = new THREE.Line(
    projectionGeometry,
    new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: .07,
      gapSize: .05,
      transparent: true,
      opacity: .85
    })
  );
  projectionLine.computeLineDistances();
  scene.add(projectionLine);

  let dragging = false;

  const pointerToVector = event => {
    const rect = renderer.domElement.getBoundingClientRect();

    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

    raycaster.setFromCamera(pointerNdc, camera);

    // La primera intersección corresponde a la superficie visible más cercana.
    const intersections = raycaster.intersectObject(sphere, false);
    if (intersections.length === 0) return null;

    const sceneDirection = intersections[0].point.clone().normalize();
    return sceneToBloch(sceneDirection);
  };

  renderer.domElement.addEventListener("pointerdown", event => {
    dragging = true;
    renderer.domElement.setPointerCapture(event.pointerId);
    const vector = pointerToVector(event);
    if (vector) onPointerVector(vector, true);
  });

  renderer.domElement.addEventListener("pointermove", event => {
    const vector = pointerToVector(event);
    renderer.domElement.style.cursor = vector ? (dragging ? "grabbing" : "crosshair") : "default";

    if (!dragging || !vector) return;
    onPointerVector(vector, false);
  });

  renderer.domElement.addEventListener("pointerup", event => {
    dragging = false;
    renderer.domElement.releasePointerCapture(event.pointerId);
    const vector = pointerToVector(event);
    if (vector) onPointerVector(vector, true);
  });

  renderer.domElement.addEventListener("pointercancel", () => {
    dragging = false;
  });

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    camera.aspect = width / height;

    if (width / height < 0.85) {
      camera.position.z = 7.65;
    } else if (width / height > 1.45) {
      camera.position.z = 6.65;
    } else {
      camera.position.z = 7.05;
    }

    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  // Interpolación esférica robusta para vectores unitarios.
  // Evita el bloqueo que ocurría entre estados antipodales,
  // por ejemplo |0⟩ y |1⟩.
  const slerpUnitVectors = (from, to, amount) => {
    const dot = THREE.MathUtils.clamp(from.dot(to), -1, 1);

    if (dot > 0.9995) {
      return from.clone().lerp(to, amount).normalize();
    }

    if (dot < -0.9995) {
      // Para vectores opuestos existen infinitos caminos.
      // Elegimos un eje perpendicular estable y realizamos una rotación corta.
      const reference = Math.abs(from.x) < 0.8
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);
      const axis = from.clone().cross(reference).normalize();
      return from.clone().applyAxisAngle(axis, Math.PI * amount).normalize();
    }

    const angle = Math.acos(dot);
    const sinAngle = Math.sin(angle);
    const fromWeight = Math.sin((1 - amount) * angle) / sinAngle;
    const toWeight = Math.sin(amount * angle) / sinAngle;

    return from.clone().multiplyScalar(fromWeight)
      .add(to.clone().multiplyScalar(toWeight))
      .normalize();
  };

  const render = () => {
    const remainingAngle = current.angleTo(target);

    if (remainingAngle < 0.002) {
      current.copy(target);
    } else {
      // Respuesta rápida pero visible: aproximadamente 150–250 ms.
      current.copy(slerpUnitVectors(current, target, 0.28));
    }

    const sceneDirection = blochToScene(current);
    vectorArrow.setDirection(sceneDirection);
    tip.position.copy(sceneDirection).multiplyScalar(1.68);

    // Proyección del extremo del vector sobre el plano ecuatorial visual (Y = 0).
    projectionGeometry.setFromPoints([
      tip.position.clone(),
      new THREE.Vector3(tip.position.x, 0, tip.position.z)
    ]);
    projectionLine.computeLineDistances();

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();

  return {
    setVector(vector) {
      target.copy(vector).normalize();
    },
    getVector() {
      return target.clone();
    },
    dispose() {
      observer.disconnect();
      renderer.dispose();
    }
  };
}
