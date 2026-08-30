# Molecular

**Versión 0.4.4**

Molecular es un estudio químico visual de Alejandro Pico para construir estructuras en dos dimensiones, comprobar reglas básicas de enlace y explorarlas como modelos tridimensionales. Toma como referencia conceptual el flujo 2D → 3D de herramientas educativas como [MolView](https://molview.org/), con interfaz, arquitectura y motor propios.

## Aplicación publicada

**GitHub Pages:** https://alejandropico.github.io/Molecular/

El despliegue se actualiza automáticamente con cada publicación en `main`.

## Novedades de las versiones 0.4.0–0.4.4

### Composición segura y paneles contextuales

- El generador acepta hasta doce fórmulas o cadenas SMILES separadas por coma, punto y coma o salto de línea y las añade junto a lo que ya existe.
- La generación deja de sustituir el documento: todo el lote forma una única operación que puede revertirse con Deshacer.
- El menú contextual de un átomo permite fijar una ficha informativa desplazable; pueden mantenerse varias fichas abiertas a la vez para comparar elementos.
- Cada desplegable lateral nace a la altura de su herramienta y solo se desplaza hacia arriba si necesita espacio; conserva desplazamiento táctil cuando su contenido es alto.
- Deshacer y Rehacer usan un control doble directo, con mayor superficie para Deshacer. Vaciar lienzo queda protegido dentro del menú de la goma.

### Interfaz compacta y fórmulas tolerantes

- Selección directa, rectangular, por lazo y desplazamiento viven en un único grupo; el botón central o `Espacio` desplazan temporalmente desde cualquier herramienta.
- Deshacer y rehacer comparten un control doble directo, y los menús laterales se mantienen dentro de la ventana con desplazamiento táctil propio.
- Los controles de Lewis y los inspectores de átomos/enlaces ocupan menos anchura sin perder acciones.
- En móvil, la búsqueda aparece como una segunda fila de anchura completa; Fórmulas y Enciclopedia usan toda el área útil, también en horizontal.
- Las fórmulas tradicionales aceptan mayúsculas, minúsculas y subíndices (`H2O`, `h2o`, `H₂O`, `h2so4`) sin alterar la sensibilidad de SMILES aromáticos.
- Se incorpora una plantilla estructural editable del ácido sulfúrico para `H2SO4`.

### Edición precisa y notación de Lewis

- Los enlaces disponen de selección e inspector propios. Un doble o triple enlace es una entidad química única y sus extremos A/B se editan de manera independiente.
- Carga, pares libres y electrones radicalarios usan controles reversibles `− / +`, tanto en la herramienta lateral como en el inspector.
- Las anotaciones se distribuyen en posiciones libres alrededor del átomo para que H, carga, pares, radicales y enlaces no se tapen.
- Color de enlace configurable por herramienta o por entidad y conservado en el documento y en la exportación SVG.
- Pie informativo reducido a fórmula estimada y masa molar, centrado y sin mensajes permanentes redundantes.

### SMILES y visualización 3D

- El analizador local distingue correctamente símbolos alifáticos y aromáticos sensibles a mayúsculas (`C`/`c`).
- Admite ramas, componentes, anillos de un dígito, `%10` y `%(123)`, enlaces `- = # : ~ / \\`, isótopos, H entre corchetes, cargas repetidas o numéricas y quiralidad `@/@@`.
- Los hidrógenos implícitos de cargas sin regla fiable dejan de reaparecer por una caída errónea a la valencia neutra.
- El generador 3D coloca H en direcciones que maximizan su separación respecto de vecinos explícitos y de otros H; los H del benceno salen del anillo.
- El cierre 3D vive en la misma línea que hidrógenos, giro, cámara y exportación, sin superponerse a ningún control.

### Enciclopedia y temas ambientales

- Nueva enciclopedia narrativa de 15 capítulos con buscador, índice, diagramas SVG, tutorial completo, glosario y fuentes primarias enlazadas.
- Explica lectura estructural, valencia, Lewis, enlaces, estereoquímica, resonancia, aromaticidad, interacciones, anillos, isomería, SMILES, flechas, 3D y límites de validación.
- Temas Mañana, Tarde y Noche, más Automático. El modo automático estima amanecer y ocaso según fecha, zona horaria y ubicación opcional autorizada.
- El modo Tarde añade una paleta cálida propia; la preferencia y la última ubicación aproximada se guardan solo en el dispositivo.

## Uso rápido

1. Elige Átomo o Enlace en la barra lateral. Un enlace puede unir átomos existentes o dibujarse directamente sobre el vacío.
2. Usa los puntos suspensivos de Átomo para abrir la tabla periódica completa y sustituir cualquier extremo.
3. Añade carga, pares solitarios, radicales, grupos R, fragmentos o flechas desde sus paletas laterales.
4. Abre el único grupo de selección para elegir Directa, Rectangular, Lazo o Desplazar; usa Limpiar para ordenar el esquema localmente.
5. Abre Fórmula en la barra superior y pega una o varias entradas separadas por coma, punto y coma o línea; se añadirán como borradores editables sin sustituir el lienzo.
6. Usa la rueda o la pinza táctil para ampliar bajo el puntero y abre el visor 3D para elegir una representación.
7. Abre Exportar para obtener SVG, PNG, captura 3D o documento editable.

### Atajos

| Acción                        | Atajo                    |
| ----------------------------- | ------------------------ |
| Seleccionar                   | `V`                      |
| Desplazar                     | `H` o mantener `Espacio` |
| Añadir átomo                  | `A`                      |
| Crear enlace                  | `B`                      |
| Crear flecha                  | `F`                      |
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

GitHub Pages sirve archivos estáticos y no ejecuta Python, Java, Go ni un SQLite de servidor. La versión 0.4.4 funciona íntegramente en el navegador para mantener edición, validación, generación, consulta, guardado y 3D inmediatos.

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
│   ├── chemistry.models.ts        # documento, valencia, fórmulas y validación
│   ├── formula-generator.ts       # fórmula molecular y subconjunto OpenSMILES
│   ├── encyclopedia.data.ts       # lector químico de 15 capítulos y fuentes
│   └── solar-theme.ts             # amanecer, ocaso y tema ambiental
├── src/app/shared/                # iconografía SVG local
├── src/app/three-d-viewer/        # motor y panel 3D
├── src/app/app.*                  # editor 2D e interfaz
├── CHANGELOG.md
└── README.md
```

## Alcance científico

La validación 0.4.4 es educativa. Las capacidades de elementos representativos se basan en valencias covalentes habituales; para metales de transición y elementos pesados se usan límites de coordinación simplificados. Las marcas arriba/abajo y `@/@@` influyen en la profundidad inicial, pero no constituyen todavía una asignación CIP ni una conformación rigurosa.

Una fórmula molecular no contiene conectividad suficiente para identificar un isómero. El generador produce en ese caso un punto de partida editable; SMILES es la entrada apropiada cuando la conectividad debe ser inequívoca. La colocación 3D es una incrustación topológica relajada, no una optimización energética.

Molecular no calcula resonancia electrónica, aromaticidad formal, cargas parciales, energía, espectros, orbitales ni dinámica molecular. No sustituye software de química computacional ni debe emplearse para validar resultados de investigación.

## Roadmap

El plan versionado se mantiene en [ROADMAP.md](ROADMAP.md). Los siguientes hitos se centran en flechas curvas de mecanismo, formatos MOL/SDF, estereoquímica formal, conformadores reales y compatibilidad con Atlas Editor.

## Autor

**Alejandro Pico Perez**

- [Portfolio](https://alejandropico.github.io/Portfolio/)
- [GitHub](https://github.com/AlejandroPico)
- [Repositorio Molecular](https://github.com/AlejandroPico/Molecular)
