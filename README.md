# Molecular

**Versión 0.1.0**

Molecular es un estudio químico visual para construir estructuras en dos dimensiones, comprobar sus propiedades básicas y explorarlas como modelos tridimensionales interactivos. El proyecto toma como referencia conceptual el flujo 2D → 3D popularizado por herramientas educativas como [MolView](https://molview.org/), pero utiliza una interfaz, una arquitectura y un motor propios.

## Aplicación publicada

**GitHub Pages:** https://alejandropico.github.io/Molecular/

El despliegue se actualiza automáticamente al publicar cambios en `main`.

## Funciones de la versión 0.1.0

### Lienzo molecular 2D

- Creación y sustitución de átomos sobre un lienzo SVG.
- Enlaces simples, dobles y triples.
- Selección individual, selección múltiple rectangular y selección aditiva con `Mayús`.
- Arrastre de átomos o fragmentos seleccionados.
- Desplazamiento del lienzo y zoom entre 35 % y 320 %.
- Duplicación, borrado, cambio de elemento y ajuste de carga.
- Historial de hasta 80 operaciones con deshacer y rehacer.

### Motor químico inicial

- Catálogo local de 19 elementos con número atómico, masa, radios, color y valencias habituales.
- Fórmula molecular estimada mediante el orden de enlaces e hidrógenos implícitos.
- Masa molar aproximada.
- Conteo de átomos y enlaces explícitos e implícitos.
- Avisos visuales cuando un átomo supera su valencia máxima configurada.

### Visor 3D

- Renderizado WebGL mediante Three.js.
- Rotación, desplazamiento y zoom orbital.
- Representaciones de bolas y varillas, espacio ocupado y alambre.
- Generación y ocultación de hidrógenos implícitos.
- Exportación de la vista tridimensional en PNG.

### Documentos y exportación

- Autoguardado continuo en el navegador.
- Biblioteca local de moléculas guardadas.
- Formato editable `.molecular.json` para importar y exportar documentos.
- Exportación de la estructura 2D en SVG y PNG de alta resolución.
- Captura PNG del modelo tridimensional.

### Interfaz

- Menú superior estático con Archivo, Capas, Enciclopedia, Tema, Exportación, 3D y Acerca de.
- Temas claro, oscuro y automático.
- Capas para retícula, símbolos, índices, órdenes de enlace, hidrógenos y avisos.
- Enciclopedia inicial de elementos.
- Diseño adaptable a escritorio, tableta y móvil.
- Moléculas de ejemplo: agua, metano, amoniaco, dióxido de carbono, etanol y benceno.

## Uso rápido

1. Selecciona un elemento en la barra inferior.
2. Haz clic en el lienzo para añadir átomos.
3. Elige un enlace simple, doble o triple y pulsa dos átomos para unirlos.
4. Usa la herramienta de selección para mover o editar un fragmento.
5. Pulsa **3D** para construir la representación tridimensional.
6. Abre **Exportar** para obtener SVG, PNG o el documento editable.

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

- **Angular 22** y **TypeScript** para la aplicación.
- **SVG** como superficie de edición 2D y formato vectorial.
- **Three.js** y **WebGL** para la visualización 3D.
- **localStorage** para autoguardado y biblioteca local.
- **Vitest** para pruebas del motor y de la interfaz.
- **GitHub Actions + GitHub Pages** para integración y despliegue continuos.

## Por qué no hay un servidor Python en esta versión

GitHub Pages no puede ejecutar Python ni un SQLite de servidor. La 0.1.0 funciona completamente en el navegador para que el editor, el guardado y el 3D sean inmediatos y no necesiten infraestructura.

La evolución prevista conserva dos vías:

- SQLite compilado a WebAssembly y persistido con OPFS/IndexedDB para ampliar el catálogo manteniendo el alojamiento estático.
- Un servicio opcional FastAPI con RDKit/Open Babel para optimización geométrica, SMILES, MOL/SDF, búsqueda estructural y cálculos avanzados.

La decisión completa está recogida en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

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

`npm run build` genera la versión preparada para GitHub Pages con base `/Molecular/`. Para una compilación estática con base local puede utilizarse `npm run build:local`.

## Estructura

```text
Molecular/
├── .github/workflows/          # despliegue de Pages
├── docs/                       # decisiones técnicas
├── public/                     # favicon, versión y recursos estáticos
├── src/app/core/               # modelo y motor químico
├── src/app/shared/             # componentes reutilizables
├── src/app/three-d-viewer/     # motor y panel 3D
├── src/app/app.*               # estudio molecular 2D e interfaz
├── CHANGELOG.md
└── README.md
```

## Alcance científico

La validación de la 0.1.0 es educativa: usa valencias habituales y una geometría 3D aproximada derivada del dibujo. Todavía no calcula estereoquímica, resonancia, aromaticidad formal, cargas parciales, energía, espectros u orbitales. No sustituye herramientas de química computacional ni debe emplearse para validar resultados de investigación.

## Roadmap inmediato

- Importación y exportación MOL, SDF y SMILES.
- Plantillas de anillos, cadenas y grupos funcionales.
- Búsqueda en PubChem y carga de conformadores reales.
- Optimización geométrica y estereoquímica.
- SQLite-WASM para un catálogo local ampliado.
- Compatibilidad de intercambio con Atlas Editor.
- Rutas de reacción y, posteriormente, rutas metabólicas.

## Autor

**Alejandro Pico Perez**

- [Portfolio](https://alejandropico.github.io/Portfolio/)
- [GitHub](https://github.com/AlejandroPico)
- [Repositorio Molecular](https://github.com/AlejandroPico/Molecular)
