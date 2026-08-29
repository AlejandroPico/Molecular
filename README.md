# Molecular

**Versión 0.3.0**

Molecular es un estudio químico visual de Alejandro Pico para construir estructuras en dos dimensiones, comprobar reglas básicas de enlace y explorarlas como modelos tridimensionales. Toma como referencia conceptual el flujo 2D → 3D de herramientas educativas como [MolView](https://molview.org/), con interfaz, arquitectura y motor propios.

## Aplicación publicada

**GitHub Pages:** https://alejandropico.github.io/Molecular/

El despliegue se actualiza automáticamente con cada publicación en `main`.

## Novedades de la versión 0.3.0

### Lienzo e interacción

- Fondo continuo de retícula triangular o de puntos que cubre toda el área útil y acompaña el zoom y el desplazamiento.
- Selección directa, rectangular o por lazo, con selección aditiva mediante `Mayús`.
- Deshacer, rehacer y limpieza geométrica se integran en la barra vertical de herramientas.
- Modo esquelético con carbonos terminales implícitos y modo desarrollado para inspeccionar todos los nodos.
- Visor 3D con cierre desde su cabecera, desde el control superior o mediante `Esc`, también en móvil.

### Dibujo químico ampliado

- Los enlaces son entidades editables: pueden dibujarse sobre un espacio vacío y sus extremos nacen como carbonos sustituibles.
- Diez familias visibles: simple, doble, triple, arriba, abajo, deslocalizado, puente de hidrógeno, dativo, aromático e indeterminado.
- Menú contextual propio para cambiar el tipo de un enlace o eliminarlo.
- Grupo R, carga formal positiva o negativa, pares solitarios y electrones radicalarios.
- Flechas de reacción, resonancia y equilibrio, editables y exportables.
- Tabla periódica completa de 118 elementos y fragmentos cíclicos o de cadena.
- La validación previa bloquea enlaces, elementos o cargas que excedan las capacidades educativas configuradas.

### Generador y visualización 3D

- Generador local desde fórmula molecular o SMILES. Reconoce ramas, anillos, enlaces múltiples, aromaticidad y cargas SMILES básicas.
- Una fórmula sin conectividad produce un borrador editable y advierte que distintos isómeros pueden compartirla.
- Limpieza 2D local mediante relajación de enlaces y separación de nodos, sin enviar el documento a un servicio externo.
- Geometría 3D topológica con direcciones tetraédricas, influencia de enlaces arriba/abajo y relajación espacial.
- Cinco representaciones mediante iconos: bola y varilla, licorice, relleno espacial, varillas y alambre.
- Exportación 2D en SVG o PNG, captura 3D en PNG y documento `.molecular.json` editable.

## Uso rápido

1. Elige Átomo o Enlace en la barra lateral. Un enlace puede unir átomos existentes o dibujarse directamente sobre el vacío.
2. Usa los puntos suspensivos de Átomo para abrir la tabla periódica completa y sustituir cualquier extremo.
3. Añade carga, pares solitarios, radicales, grupos R, fragmentos o flechas desde sus paletas laterales.
4. Cambia entre selección directa, rectangular y por lazo; usa Limpiar para ordenar el esquema localmente.
5. Abre Fórmula en la barra superior y pega una fórmula molecular o SMILES para crear un borrador editable.
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

GitHub Pages sirve archivos estáticos y no ejecuta Python, Java, Go ni un SQLite de servidor. La versión 0.3.0 funciona íntegramente en el navegador para mantener edición, validación, generación, guardado y 3D inmediatos.

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
│   └── formula-generator.ts       # fórmula molecular y subconjunto SMILES
├── src/app/shared/                # iconografía SVG local
├── src/app/three-d-viewer/        # motor y panel 3D
├── src/app/app.*                  # editor 2D e interfaz
├── CHANGELOG.md
└── README.md
```

## Alcance científico

La validación 0.3.0 es educativa. Las capacidades de elementos representativos se basan en valencias covalentes habituales; para metales de transición y elementos pesados se usan límites de coordinación simplificados. Las marcas arriba/abajo influyen en la profundidad, pero no determinan todavía configuración R/S ni conformación rigurosa.

Una fórmula molecular no contiene conectividad suficiente para identificar un isómero. El generador produce en ese caso un punto de partida editable; SMILES es la entrada apropiada cuando la conectividad debe ser inequívoca. La colocación 3D es una incrustación topológica relajada, no una optimización energética.

Molecular no calcula resonancia electrónica, aromaticidad formal, cargas parciales, energía, espectros, orbitales ni dinámica molecular. No sustituye software de química computacional ni debe emplearse para validar resultados de investigación.

## Roadmap

El plan versionado se mantiene en [ROADMAP.md](ROADMAP.md). Los siguientes hitos se centran en flechas curvas de mecanismo, importación y exportación química estándar, conformadores reales, optimización geométrica y compatibilidad con Atlas Editor.

## Autor

**Alejandro Pico Perez**

- [Portfolio](https://alejandropico.github.io/Portfolio/)
- [GitHub](https://github.com/AlejandroPico)
- [Repositorio Molecular](https://github.com/AlejandroPico/Molecular)
