# Arquitectura de Molecular

## Decisión de la versión 0.2.0

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
│   ├── periodic-table.data.ts    # 118 elementos, posiciones y capacidades
│   └── chemistry.models.ts       # documentos, enlaces, valencias y fórmulas
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
- enlaces con sus extremos, orden y estilo visual;
- fechas de creación y modificación.

Es la primera frontera de interoperabilidad con Atlas Editor. Los conversores a MOL/SDF/SMILES se añadirán sobre este modelo sin acoplarlos a la interfaz.

## Motor educativo de capacidad

Cada enlace tiene un orden entero de 1, 2 o 3. La validación suma ese orden alrededor de cada átomo y compara el resultado con las capacidades configuradas para el elemento y su carga formal. Una modificación incompatible se rechaza antes de mutar el documento.

Los elementos representativos emplean valencias covalentes habituales. Los metales de transición, lantánidos y actínidos utilizan límites de coordinación simplificados: sirven para impedir estructuras arbitrarias, pero no modelan estados de oxidación, ligandos, geometrías de coordinación ni electrones de forma rigurosa.

Los estilos de cuña, cuña discontinua, aromático e indeterminado se conservan en el documento y en la salida SVG. En 0.2.0, Three.js usa su orden entero para la representación y todavía no deriva estereoquímica formal de esas marcas.

## Interacción geométrica

El lienzo utiliza un `viewBox` fijo de 1400 × 800 con `preserveAspectRatio="xMidYMid meet"`. Las coordenadas del puntero se convierten mediante la matriz real del SVG; de este modo abrir un panel no deforma círculos ni distancias. El zoom recalcula la traslación para conservar bajo el cursor o el centro de la pinza el mismo punto molecular.

## Evolución de datos y Python

La evolución prevista tiene dos modos complementarios:

1. **Modo estático:** SQLite compilado a WebAssembly, persistido mediante OPFS/IndexedDB. Permitirá catálogos grandes sin abandonar GitHub Pages.
2. **Modo de cálculo opcional:** FastAPI + SQLite/PostgreSQL con RDKit u Open Babel para optimización geométrica, conversión de formatos, búsqueda estructural y propiedades avanzadas.

El modo de cálculo no será obligatorio para dibujar, guardar o visualizar. Así se evita convertir una herramienta educativa local en una aplicación dependiente de un servidor.

## Límites científicos actuales

La 0.2.0 aplica reglas de valencia y coordinación simplificadas y genera una geometría 3D didáctica a partir del esquema 2D. No realiza minimización de energía, configuración R/S, aromaticidad formal, orbitales ni dinámica molecular. Por ello no sustituye software de química computacional ni debe utilizarse para validar resultados de investigación.
