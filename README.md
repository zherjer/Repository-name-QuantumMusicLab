# QuantumMusicLab v0.3.1

Actualización científica y pedagógica de la versión modular y responsiva de **QuantumMusicLab**.

## Cambios de esta versión

- Se corrigieron las etiquetas de la esfera de Bloch:
  - `+z`, `z = +1`, `|0⟩`;
  - `−z`, `z = −1`, `|1⟩`;
  - `+x`, `x = +1`, `|+⟩`;
  - `−x`, `x = −1`, `|−⟩`;
  - `+y`, `y = +1`, `|+i⟩`;
  - `−y`, `y = −1`, `|−i⟩`.
- Se añadió el origen geométrico `O (0,0,0)`.
- Se incorporaron las amplitudes:
  - `α = cos(θ/2)`;
  - `β = exp(iφ) sin(θ/2)`.
- Se muestra el estado completo:
  - `|ψ⟩ = α|0⟩ + β|1⟩`.
- Se añadieron probabilidades dinámicas:
  - `P(|0⟩) = |α|² = (1 + z)/2`;
  - `P(|1⟩) = |β|² = (1 − z)/2`.
- Se añadieron barras visuales de probabilidad.
- Se incorporó una interpretación educativa que cambia según la posición del vector.
- Se dejó visible el botón **Medir qubit**, reservado para la versión 0.4.
- Se conserva la respuesta automática a orientación, resolución y proporción de pantalla.

## Aclaración científica

Las coordenadas `x`, `y` y `z` de la esfera de Bloch toman valores de `−1` a `+1`.

Los símbolos `|0⟩` y `|1⟩` son nombres de estados cuánticos:

- `|0⟩ ↔ (0, 0, +1)`;
- `|1⟩ ↔ (0, 0, −1)`.

El número de `|1⟩` no significa que su coordenada `z` sea `+1`.

## Estructura

```text
QuantumMusicLab_v0.3.1/
├── index.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── audio.js
│   ├── bloch.js
│   ├── config.js
│   ├── gates.js
│   ├── responsive.js
│   └── ui.js
├── assets/
└── docs/
    └── ARQUITECTURA.md
```

## Ejecución

```bat
cd /d D:\Proyectos\QuantumMusicLab
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000
```

Three.js y Tone.js se cargan desde internet.

## Pruebas recomendadas

### Estado |0⟩

```text
x = 0
y = 0
z = 1
```

Resultado esperado:

```text
P(|0⟩) = 100 %
P(|1⟩) = 0 %
```

### Estado |1⟩

```text
x = 0
y = 0
z = -1
```

Resultado esperado:

```text
P(|0⟩) = 0 %
P(|1⟩) = 100 %
```

### Estado |+⟩

```text
x = 1
y = 0
z = 0
```

Resultado esperado:

```text
P(|0⟩) = 50 %
P(|1⟩) = 50 %
```

### Estado |+i⟩

```text
x = 0
y = 1
z = 0
```

Resultado esperado:

```text
P(|0⟩) = 50 %
P(|1⟩) = 50 %
β tiene fase +i
```

## Git

Cuando la versión esté probada:

```bat
git status
git add .
git commit -m "fix: corrige notacion de Bloch y agrega amplitudes y probabilidades"
git tag -a v0.3.1 -m "Correccion cientifica de la esfera de Bloch"
git push
git push origin v0.3.1
```


## Corrección v0.3.4

Se corrigió la transformación entre las coordenadas de Bloch y la escena Three.js.
Ahora:

- `(0, 0, +1)` muestra el vector en el polo norte `|0⟩`;
- `(0, 0, -1)` muestra el vector en el polo sur `|1⟩`;
- las coordenadas x e y siguen las diagonales visuales aprobadas;
- la proyección punteada utiliza correctamente el plano ecuatorial visual.


## Correcciones v0.3.4

- Se reemplazó la interpolación lineal normalizada por interpolación esférica.
- Los cambios entre estados antipodales, como |0⟩ y |1⟩, ya no se bloquean.
- El desplazamiento tarda aproximadamente 150–250 ms.
- El mouse utiliza raycasting contra la esfera tridimensional.
- El clic selecciona el punto de la superficie visible situado directamente bajo el cursor.
- El punto visual se transforma de regreso a coordenadas físicas de Bloch.
- Fuera de la esfera el cursor no modifica el estado.
