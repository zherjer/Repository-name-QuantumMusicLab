# QuantumMusicLab v0.5.2

**Desarrollado por Julio Zaldívar · aka m0m0 · y Ale Escárcega**

Micrositio educativo del proyecto **Ecologías de la Imaginación — Laboratorio Transversal de Arte, Ciencia y Tecnología, 2026**.

## Nueva arquitectura

```text
QuantumMusicLab/
├── index.html
├── explorar/
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── docs/
├── instrumento/
│   ├── index.html
│   └── instrument.css
├── shared/
│   ├── css/
│   └── assets/
└── docs/
```

## Rutas

- `/quantum-music-lab/`: menú principal.
- `/quantum-music-lab/explorar/`: aplicación de un qubit.
- `/quantum-music-lab/instrumento/`: instrumento de cinco esferas.

Todas las rutas son relativas, por lo que el micrositio puede alojarse dentro de:

```text
/proyectos/quantum-music-lab/
```

sin depender de la raíz del dominio.

## Ejecución local

```bat
cd /d D:\Proyectos\QuantumMusicLab
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000
```

## Git sugerido

```bat
git add .
git commit -m "feat: agrega menu principal y arquitectura de micrositio"
git tag -a v0.5.2 -m "Menu principal, modo explorar e instrumento de cinco esferas"
git push
git push origin v0.5.2
```


## Instrumento funcional v0.5.2

El módulo `/instrumento/` incorpora cinco esferas independientes:

- Q1: nota musical.
- Q2: forma de onda.
- Q3: filtro.
- Q4: reverb y delay.
- Q5: tempo y patrón rítmico.

También incluye un secuenciador de ocho pasos y reproducción en loop.


## Desarrollo y autoría

- **Julio Zaldívar** · aka **m0m0**
- **Ale Escárcega**

Proyecto desarrollado en el marco de **Ecologías de la Imaginación — Laboratorio Transversal de Arte, Ciencia y Tecnología, 2026**.
