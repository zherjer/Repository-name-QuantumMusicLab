# Arquitectura v0.3

## app.js
Coordina estado, eventos y comunicación entre módulos.

## bloch.js
Crea la escena Three.js, esfera, ejes, etiquetas, vector y adaptación de cámara.

## audio.js
Convierte la posición del vector en nota, frecuencia, forma de onda, filtro y volumen.

## gates.js
Contiene las transformaciones H, X, Y, Z, S y T.

## ui.js
Centraliza elementos HTML y actualización de lecturas.

## responsive.js
Detecta resolución, orientación y proporción. CSS realiza la reorganización visual mediante media queries.

## config.js
Define colores y estado inicial.


## Actualización v0.3.1

`ui.js` calcula amplitudes, probabilidades e interpretación pedagógica a partir del vector de Bloch.

Las relaciones implementadas son:

- `α = cos(θ/2)`
- `β = exp(iφ) sin(θ/2)`
- `P(0) = |α|²`
- `P(1) = |β|²`

`bloch.js` contiene las etiquetas científicamente corregidas para los seis estados cardinales.
