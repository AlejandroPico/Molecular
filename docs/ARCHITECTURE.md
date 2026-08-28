# Arquitectura de Molecular

## Decisión de la versión 0.1.1

Molecular se publica en GitHub Pages. Ese alojamiento sirve archivos estáticos y no ejecuta procesos Python, Java, Go ni un servidor SQLite. Por ello, el primer núcleo se ejecuta íntegramente en el navegador:

- **Angular** organiza la interfaz, el estado y las herramientas del editor.
- **SVG** representa la estructura 2D y permite exportarla sin pérdida.
- **Three.js/WebGL** representa la molécula tridimensional y gestiona la cámara.
- **TypeScript** contiene el modelo químico, las reglas iniciales de valencia y los conversores.
- **localStorage** conserva el autoguardado y una biblioteca privada del dispositivo.

Esta solución mantiene la aplicación rápida, desplegable en Pages y usable sin una cuenta o servidor.

## Módulos actuales

```text
src/app/
├── core/
│   └── chemistry.models.ts       # elementos, documentos, valencias y fórmulas
├── shared/
│   └── icon.component.ts         # iconografía SVG local
├── three-d-viewer/
│   ├── three-d-viewer.component.ts
│   ├── three-d-viewer.component.html
│   └── three-d-viewer.component.scss
├── app.ts                        # estado y operaciones del estudio 2D
├── app.html                      # interfaz principal y paneles
└── app.scss                      # sistema visual adaptable
```

## Documento molecular

El formato `.molecular.json` es deliberadamente sencillo y versionable. Conserva:

- identificador y nombre del documento;
- átomos con elemento, posición 2D y carga;
- enlaces con sus extremos y orden;
- fechas de creación y modificación.

Es la primera frontera de interoperabilidad con Atlas Editor. Los conversores a MOL/SDF/SMILES se añadirán sobre este modelo sin acoplarlos a la interfaz.

## Evolución de datos y Python

La evolución prevista tiene dos modos complementarios:

1. **Modo estático:** SQLite compilado a WebAssembly, persistido mediante OPFS/IndexedDB. Permitirá catálogos grandes sin abandonar GitHub Pages.
2. **Modo de cálculo opcional:** FastAPI + SQLite/PostgreSQL con RDKit u Open Babel para optimización geométrica, conversión de formatos, búsqueda estructural y propiedades avanzadas.

El modo de cálculo no será obligatorio para dibujar, guardar o visualizar. Así se evita convertir una herramienta educativa local en una aplicación dependiente de un servidor.

## Límites científicos actuales

La 0.1.1 aplica reglas de valencia habituales y genera una geometría 3D didáctica a partir del esquema 2D. No realiza minimización de energía, estereoquímica, aromaticidad formal, orbitales ni dinámica molecular. Por ello no sustituye software de química computacional ni debe utilizarse para validar resultados de investigación.
