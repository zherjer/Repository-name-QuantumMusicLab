# Arquitectura de micrositio

QuantumMusicLab es una aplicación independiente que puede alojarse dentro de un sitio mayor.

## Integración con Ecologías de la Imaginación

Ejemplo de despliegue:

```text
/var/www/ecologias-imaginacion/
├── index.html
└── proyectos/
    └── quantum-music-lab/
        ├── index.html
        ├── explorar/
        ├── instrumento/
        └── shared/
```

La portada de Ecologías puede enlazar a:

```html
<a href="./proyectos/quantum-music-lab/">Abrir QuantumMusicLab</a>
```

También puede incrustarlo:

```html
<iframe
  src="./proyectos/quantum-music-lab/"
  title="QuantumMusicLab">
</iframe>
```

La opción recomendada para la experiencia completa es abrirlo como micrositio.
