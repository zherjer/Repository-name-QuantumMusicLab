# QuantumMusicLab v0.2

Versión navegable del prototipo educativo **Sonidos cuánticos: música del mundo visible**.

## Incluye
- Esfera de Bloch translúcida verde turquesa.
- Ejes y etiquetas de acuerdo con la interfaz aprobada.
- Controles numéricos x, y, z y actualización con Enter o botón.
- Normalización automática del vector.
- Compuertas H, X, Y, Z, S y T.
- CNOT visible y explicada; se habilitará al integrar un segundo qubit.
- Sonido con Tone.js, filtro y volumen.
- Cintillo de Ecologías de la Imaginación, 2026.

## Ejecutar
```bat
cd /d D:\Proyectos\QuantumMusicLab
python -m http.server 8000
```
Abrir `http://localhost:8000`.

Three.js y Tone.js se cargan desde internet.

## Git
```bat
git status
git add .
git commit -m "feat: agrega interfaz v0.2 con controles, ejes y cintillo institucional"
git tag -a v0.2.0 -m "Interfaz v0.2 del sintetizador cuantico"
git push
git push origin v0.2.0
```
