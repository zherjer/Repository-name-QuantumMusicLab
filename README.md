# QuantumMusicLab v0.5.4 — Stability Hotfix

**Desarrollado por Julio Zaldívar · aka m0m0 · y Ale Escárcega**

Esta versión corrige una saturación detectada al mover bruscamente los vectores
de las esferas durante la reproducción.

## Causa identificada

Un movimiento rápido del mouse puede generar cientos de eventos `pointermove`
por segundo. Cada evento actualizaba inmediatamente parámetros de Tone.js:

- forma de onda;
- filtro;
- delay;
- reverb;
- tempo.

Las llamadas `rampTo()` se acumulaban y podían saturar el hilo principal y el
motor de audio del navegador.

El patrón de ocho pasos no estaba siendo modificado por Q4; al bloquearse el
hilo de renderizado, los estados visuales dejaban de refrescarse y podía parecer
que los pasos desaparecían progresivamente.

## Correcciones v0.5.4

- Visualización y audio desacoplados.
- El vector sigue el mouse a frecuencia de pantalla.
- El motor de audio se limita a aproximadamente 29 actualizaciones por segundo.
- Se cancelan automatizaciones anteriores antes de programar un nuevo valor.
- La forma de onda solo se reconstruye cuando realmente cambia.
- El preview sonoro solo se dispara al finalizar el movimiento.
- Q4 continúa limitado a delay y reverb.
- Q5 continúa limitado a tempo y duración.
- Protección adicional para mantener siempre un patrón de ocho pasos.
- Reiniciar cancela automatizaciones de audio pendientes.

## Prueba crítica

1. Activar sonido.
2. Iniciar loop.
3. Arrastrar Q4 rápidamente de extremo a extremo durante 15–20 segundos.
4. Hacer lo mismo con Q1, Q2, Q3 y Q5.
5. Confirmar que los ocho botones conservan su patrón.
6. Detener.
7. Iniciar nuevamente.
8. Pausar y continuar.
9. Reiniciar.

La página no debería bloquear Firefox ni perder control del transporte.
