# Molecular

**Versión 0.2.0**

Molecular es un estudio químico visual de Alejandro Pico para construir estructuras en dos dimensiones, comprobar reglas básicas de enlace y explorarlas como modelos tridimensionales. Toma como referencia conceptual el flujo 2D → 3D de herramientas educativas como [MolView](https://molview.org/), con interfaz, arquitectura y motor propios.

## Aplicación publicada

**GitHub Pages:** https://alejandropico.github.io/Molecular/

El despliegue se actualiza automáticamente con cada publicación en `main`.

## Novedades de la versión 0.2.0

### Interfaz y lienzo

- Barra principal única, compacta y aislada en la esquina superior derecha.
- Búsqueda como primer control, expandible hacia la izquierda.
- Porcentaje de zoom como último control; la rueda o el gesto de pinza controlan la escala.
- Zoom anclado al puntero: el punto señalado permanece bajo el ratón al acercar o alejar.
- SVG proporcional mediante `preserveAspectRatio`; los átomos no se convierten en elipses al abrir el visor 3D.
- Estado químico y métricas en un módulo flotante inferior, sin paleta horizontal.
- `favicon.svg` disponible tanto en la raíz del repositorio como en los recursos públicos.
- Identidad, descripción, autoría, versión y enlaces concentrados en «Acerca de».

### Herramientas químicas

- Paletas laterales desplegables desde la barra de herramientas.
- Siete estilos de enlace: simple, doble, triple, cuña sólida, cuña discontinua, aromático visual e indeterminado.
- Fragmentos listos para insertar: benceno, ciclopropano, ciclobutano, ciclopentano, ciclohexano, ciclooctano y cadena de seis carbonos.
- Ajuste de carga formal desde la herramienta, el inspector de selección o el menú contextual.
- Favoritos de elementos y acceso mediante puntos suspensivos a la tabla periódica completa.
- Cambio de elemento desde el inspector y el menú contextual.

### Tabla periódica y validación

- Catálogo local de los 118 elementos con número atómico, nombre en español, masa, familia, color, periodo, posición y capacidades de enlace educativas.
- Microtabla periódica completa y buscable por número, símbolo, nombre o familia.
- Enciclopedia ampliada a los 118 elementos.
- Validación previa: una unión, cambio de elemento o cambio de carga incompatible se rechaza antes de alterar el documento.
- El orden de enlace consume capacidad: simple = 1, doble = 2 y triple = 3.
- Cálculo de hidrógenos implícitos sensible a cargas comunes. Un carbono con carga formal ya no pierde todos sus hidrógenos automáticamente.
- Importaciones antiguas siguen mostrando avisos si contienen una estructura fuera de los límites configurados.

### Edición, 3D y documentos

- Selección individual, rectangular y aditiva con `Mayús`.
- Arrastre, desplazamiento, duplicación, borrado y un historial de hasta 80 operaciones.
- Visor Three.js con bolas y varillas, espacio ocupado y alambre.
- Autoguardado y biblioteca privada en el navegador.
- Importación y exportación `.molecular.json`.
- Exportación 2D en SVG y PNG y captura 3D en PNG.
- Ejemplos: agua, metano, amoniaco, dióxido de carbono, etanol y benceno.

## Uso rápido

1. Sitúa el puntero sobre la herramienta de átomo y elige un favorito o abre la tabla periódica.
2. Haz clic en el lienzo para colocar átomos.
3. Sitúa el puntero sobre Enlace, elige un estilo y pulsa dos átomos.
4. Usa Fragmentos para insertar un anillo o una cadena desde un punto del lienzo.
5. Selecciona átomos para cambiar elemento o carga, duplicar, borrar o abrir el fragmento en 3D.
6. Usa la rueda del ratón o la pinza táctil para ampliar exactamente donde estás señalando.
7. Abre Exportar para obtener SVG, PNG o el documento editable.

### Atajos

| Acción                        | Atajo                    |
| ----------------------------- | ------------------------ |
| Seleccionar                   | `V`                      |
| Desplazar                     | `H` o mantener `Espacio` |
| Añadir átomo                  | `A`                      |
| Crear enlace                  | `B`                      |
| Borrar                        | `E`                      |
| Enlace simple, doble o triple | `1`, `2`, `3`            |
| Seleccionar todo              | `Ctrl + A`               |
| Deshacer / rehacer            | `Ctrl + Z` / `Ctrl + Y`  |
| Eliminar selección            | `Supr` o `Retroceso`     |
| Cancelar operación            | `Esc`                    |

## Tecnología

- **Angular 22** y **TypeScript** para aplicación, estado y motor educativo.
- **SVG** como superficie de edición 2D y formato vectorial.
- **Three.js/WebGL** para la visualización 3D.
- **localStorage** para autoguardado y biblioteca local.
- **Vitest** para pruebas del motor y de la interfaz.
- **GitHub Actions + GitHub Pages** para integración y despliegue continuos.

## Arquitectura sin servidor

GitHub Pages sirve archivos estáticos y no ejecuta Python, Java, Go ni un SQLite de servidor. La versión 0.2.0 funciona íntegramente en el navegador para mantener edición, validación, guardado y 3D inmediatos.

La evolución prevista conserva dos vías:

- SQLite compilado a WebAssembly y persistido con OPFS/IndexedDB para datos amplios manteniendo el alojamiento estático.
- Servicio opcional FastAPI con RDKit u Open Babel para SMILES, MOL/SDF, búsqueda estructural, optimización geométrica y cálculos avanzados.

La decisión se detalla en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Desarrollo local

Requisitos: Node.js 24 y npm 11 o posteriores.

```bash
npm install
npm start
```

La aplicación se abre en `http://localhost:4200/`.

### Comprobaciones

```bash
npm test -- --watch=false
npm run build
```

`npm run build` genera la versión para GitHub Pages con base `/Molecular/`. `npm run build:local` genera una compilación con base local.

## Estructura

```text
Molecular/
├── .github/workflows/             # despliegue de Pages
├── docs/                          # decisiones técnicas
├── favicon.svg                    # identidad disponible desde la raíz
├── public/                        # favicon y metadatos públicos
├── src/app/core/
│   ├── periodic-table.data.ts     # catálogo de 118 elementos
│   └── chemistry.models.ts        # documento, valencia, fórmulas y validación
├── src/app/shared/                # iconografía SVG local
├── src/app/three-d-viewer/        # motor y panel 3D
├── src/app/app.*                  # editor 2D e interfaz
├── CHANGELOG.md
└── README.md
```

## Alcance científico

La validación 0.2.0 es educativa. Las capacidades de elementos representativos se basan en valencias covalentes habituales; para metales de transición y elementos pesados se usan límites de coordinación simplificados. Las cuñas representan intención estereoquímica en 2D, pero todavía no determinan configuración R/S ni geometría 3D rigurosa.

Molecular no calcula resonancia, aromaticidad formal, cargas parciales, energía, espectros, orbitales ni dinámica molecular. No sustituye software de química computacional ni debe emplearse para validar resultados de investigación.

## Roadmap inmediato

- Importación y exportación MOL, SDF y SMILES.
- Grupos funcionales y edición avanzada de cadenas.
- Búsqueda en PubChem y carga de conformadores reales.
- Optimización geométrica, aromaticidad formal y estereoquímica.
- SQLite-WASM para ampliar la base local.
- Intercambio con Atlas Editor.
- Rutas de reacción y, posteriormente, rutas metabólicas.

## Autor

**Alejandro Pico Perez**

- [Portfolio](https://alejandropico.github.io/Portfolio/)
- [GitHub](https://github.com/AlejandroPico)
- [Repositorio Molecular](https://github.com/AlejandroPico/Molecular)
