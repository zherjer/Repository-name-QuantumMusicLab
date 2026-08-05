# Sintetizador Cuántico — Fase 1

Prototipo web para el taller **Sonidos cuánticos: música del mundo visible**.

## Qué incluye

- Una esfera de Bloch tridimensional.
- Un vector interactivo que se mueve al arrastrar el mouse.
- Compuertas H, X, Z, S y T.
- Síntesis musical en tiempo real.
- Traducción de coordenadas a parámetros musicales:
  - `z` → nota/frecuencia;
  - `x` → forma de onda;
  - `y` → frecuencia de corte del filtro.
- Lenguaje infantil para nombrar las compuertas.

## Cómo ejecutarlo

Este prototipo carga Three.js y Tone.js desde internet.

### Método recomendado

1. Descomprime la carpeta.
2. Abre una terminal dentro de la carpeta.
3. Ejecuta:

```bash
python -m http.server 8000
```

4. Abre en el navegador:

```text
http://localhost:8000
```

5. Presiona **Activar sonido**. Los navegadores requieren una interacción antes de reproducir audio.

## Interacción

- Arrastra dentro de la esfera para mover el vector.
- Presiona H, X, Z, S o T para aplicar una transformación.
- Observa los valores de x, y, z.
- Escucha cómo cambian nota, timbre y filtro.

## Alcance de esta primera versión

Esta versión no ejecuta un backend cuántico. Las compuertas se representan mediante
rotaciones matemáticas del vector de Bloch, adecuadas para validar la interfaz y la
experiencia educativa de la Fase 1.

## Próximo incremento

- historial visual del circuito;
- reproducción continua;
- secuenciador rítmico;
- cinco esferas/qubits musicales;
- modo infantil y modo facilitador;
- exportación de una micropieza sonora.
