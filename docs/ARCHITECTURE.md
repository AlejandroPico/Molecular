# Arquitectura de Molecular

## Decisión de la versión 0.4.4

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
│   ├── chemistry.models.ts       # documentos, enlaces, valencias y fórmulas
│   ├── formula-generator.ts      # fórmula molecular y subconjunto OpenSMILES
│   ├── encyclopedia.data.ts      # capítulos, secciones y fuentes
│   └── solar-theme.ts            # ventana solar y tema automático
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
- átomos con elemento, posición 2D, carga y anotaciones de Lewis;
- enlaces con sus extremos, orden, clase química o visual y color opcional;
- flechas con tipo, origen y destino;
- fechas de creación y modificación.

Es la primera frontera de interoperabilidad con Atlas Editor. Los conversores a MOL/SDF/SMILES se añadirán sobre este modelo sin acoplarlos a la interfaz.

## Motor educativo de capacidad

Los enlaces covalentes tienen orden 1, 2 o 3; aromáticos y deslocalizados contribuyen 1,5 en el modelo educativo, mientras que los puentes de hidrógeno y el enlace indeterminado se tratan como anotaciones sin consumo covalente. La validación suma esta contribución alrededor de cada átomo y la compara con las capacidades configuradas para el elemento y su carga formal. Una modificación incompatible se rechaza antes de mutar el documento.

Los elementos representativos emplean valencias covalentes habituales. Los metales de transición, lantánidos y actínidos utilizan límites de coordinación simplificados: sirven para impedir estructuras arbitrarias, pero no modelan estados de oxidación, ligandos, geometrías de coordinación ni electrones de forma rigurosa.

Los estilos arriba, abajo, deslocalizado, puente de hidrógeno, dativo, aromático e indeterminado se conservan en el documento y en la salida SVG. La visualización 3D utiliza arriba/abajo como indicio de profundidad, pero todavía no deriva estereoquímica formal de esas marcas.

## Interacción geométrica

El lienzo utiliza un `viewBox` fijo de 1400 × 800 con `preserveAspectRatio="xMidYMid meet"`. Las coordenadas del puntero se convierten mediante la matriz real del SVG; de este modo abrir un panel no deforma círculos ni distancias. El zoom recalcula la traslación para conservar bajo el cursor o el centro de la pinza el mismo punto molecular.

La retícula es una capa HTML independiente y absoluta que ocupa el escenario completo. Sus variables CSS de escala y origen se actualizan con la cámara 2D; puede dibujarse como malla triangular o como puntos sin introducir márgenes por la relación de aspecto del SVG.

## Generación y geometría

El generador distingue una fórmula molecular de una cadena SMILES. Las fórmulas tradicionales se normalizan mediante segmentación contra los 118 símbolos: admite caja libre y subíndices Unicode, favorece la interpretación con elementos ligeros en entradas totalmente minúsculas y conserva las mayúsculas como vía de desambiguación. Para fórmulas conocidas puede usar una plantilla; en los demás casos distribuye la composición en un borrador que conserva el recuento pedido y deja clara la ambigüedad de isómeros. El analizador SMILES local sigue siendo sensible a caja y cubre átomos alifáticos y aromáticos, ramas, componentes, anillos simples y extendidos, cargas, isótopos, H explícitos, `@/@@` y enlaces simples, dobles, triples, aromáticos, indeterminados y direccionales básicos.

La entrada múltiple separa comas, punto y coma y saltos de línea fuera de corchetes, interpreta todas las entradas antes de modificar el documento y limita cada lote a doce estructuras. La inserción remapea identificadores, coloca los componentes nuevos junto a los límites del contenido previo y registra el lote mediante una única mutación. Así, un error no produce inserciones parciales y Deshacer restaura exactamente el documento anterior.

La interfaz adaptable mantiene una única barra superior y una única barra lateral. Cada flyout toma la coordenada vertical de su botón y la limita contra los bordes seguros de la ventana; únicamente los menús altos se elevan y todos disponen de desplazamiento propio. Las fichas informativas fijadas conservan estado independiente y coordenadas acotadas al escenario. En móvil, la búsqueda ocupa una fila inferior completa y los lectores complejos usan el área útil completa. En orientación horizontal corta, las herramientas se reorganizan en dos columnas para conservar objetivos táctiles legibles.

El visor 3D recorre el grafo molecular, asigna direcciones espaciales semejantes a una distribución tetraédrica y aplica iteraciones de resorte y repulsión. Los hidrógenos implícitos se añaden después, escogiendo direcciones de una esfera de Fibonacci que minimizan la coincidencia con vecinos ocupados. El resultado mejora la legibilidad y aporta profundidad, pero no es un conformador físico ni una minimización de energía.

## Contenido didáctico y temas

La enciclopedia es un conjunto TypeScript versionado de capítulos narrativos, secciones, ejemplos y fuentes. Los diagramas se dibujan como SVG semántico dentro de la interfaz, de modo que mantienen nitidez, contraste temático y adaptación móvil sin depender de recursos de terceros.

El modo Automático calcula una ventana solar aproximada con fecha, zona horaria y, si el usuario lo autoriza expresamente, latitud y longitud. La ubicación queda en `localStorage`; no se transmite. Sin permiso se aplican franjas locales predecibles.

## Evolución de datos y Python

La evolución prevista tiene dos modos complementarios:

1. **Modo estático:** SQLite compilado a WebAssembly, persistido mediante OPFS/IndexedDB. Permitirá catálogos grandes sin abandonar GitHub Pages.
2. **Modo de cálculo opcional:** FastAPI + SQLite/PostgreSQL con RDKit u Open Babel para optimización geométrica, conversión de formatos, búsqueda estructural y propiedades avanzadas.

El modo de cálculo no será obligatorio para dibujar, guardar o visualizar. Así se evita convertir una herramienta educativa local en una aplicación dependiente de un servidor.

## Límites científicos actuales

La 0.4.4 aplica reglas de valencia y coordinación simplificadas y genera una geometría 3D didáctica a partir de la topología. No realiza minimización de energía, asignación CIP R/S, aromaticidad formal, orbitales ni dinámica molecular. Por ello no sustituye software de química computacional ni debe utilizarse para validar resultados de investigación.
