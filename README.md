# Molecular

**Versión 0.7.0**

Molecular es un estudio químico visual de Alejandro Pico para construir estructuras en dos dimensiones, comprobar reglas básicas de enlace y explorarlas como modelos tridimensionales. Toma como referencia conceptual el flujo 2D → 3D de herramientas educativas como [MolView](https://molview.org/), con interfaz, arquitectura y motor propios.

## Aplicación publicada

**GitHub Pages:** https://alejandropico.github.io/Molecular/

El despliegue se actualiza automáticamente con cada publicación en `main`.

## Novedades de la versión 0.7.0

### Biblioteca y aprendizaje: sugerencias 15–18

- **Biblioteca estructural ampliada** con 36 plantillas editables: seis aminoácidos, seis nucleótidos, seis azúcares, seis lípidos/ácidos grasos, seis grupos protectores con punto R y seis fármacos frecuentes. Dispone de buscador, filtros por familia, enlaces de referencia e inserción no destructiva.
- **Tutorial interactivo** de cinco ejercicios verificables sobre órdenes de enlace, Lewis, carga formal, aromaticidad y SMILES. Cada ejercicio prepara un fragmento junto al trabajo actual, conserva Deshacer y guarda localmente el progreso.
- **Identificación de estructuras** en el Laboratorio: toma el componente del átomo seleccionado o el subgrafo multiseleccionado, busca isomorfismo contra 43 referencias conocidas y propone similitudes mediante elementos, enlaces, grupos funcionales, anillos y carga.
- **Enciclopedia contextual** desde los menús e inspectores de enlaces, carga/Lewis y resultados de grupos funcionales. La enciclopedia crece a 18 capítulos e incorpora grupos funcionales, biblioteca de biomoléculas e identificación estructural.
- **Cobertura automatizada ampliada** a 59 pruebas sobre formatos, edición, biblioteca, tutorial, identificación, navegación contextual y regresiones de interfaz.

## Novedades de la versión 0.6.0

### Laboratorio científico: sugerencias 8–14

- **Reconocimiento de grupos funcionales** sobre el grafo editable: alcohol, fenol, éter, aldehído, cetona, ácido carboxílico, éster, amida, amina, nitrilo, alqueno, alquino, halogenuro, tiol y anillo aromático. Cada coincidencia puede localizarse directamente en el lienzo.
- **Aromaticidad y resonancia formales** mediante detección de ciclos, conjugación y comprobación local de la regla de Hückel 4n+2. Permite normalizar enlaces aromáticos y alternar formas de Kekulé sin confundirlas con especies distintas.
- Panel de **propiedades moleculares** con masa, fórmula, carga neta, TPSA y logP estimados, donantes/aceptores de hidrógeno, enlaces rotables, anillos y composición elemental porcentual.
- **Mediciones 3D interactivas**: selección directa sobre el modelo para medir distancias entre dos átomos, ángulos entre tres y diedros entre cuatro.
- Explorador de **conformaciones tridimensionales** optimizada, plana, extendida y compacta, además de propuestas topológicas sucesivas que no alteran el esquema 2D.
- **Validación configurable** con perfiles Estricto, Guiado y Libre; comprobaciones independientes de valencia, carga, átomos aislados, aromaticidad y estereoquímica, y límite de carga ajustable.
- **Balanceador de ecuaciones** que calcula coeficientes enteros mínimos para los componentes marcados como reactivos y productos, conservando elementos y carga neta.

## Novedades de la versión 0.5.0

### Siete ampliaciones prioritarias

- El documento v2 divide el lienzo en **componentes independientes**: se pueden nombrar, agrupar, bloquear, ocultar, desplazar y asignar como reactivo, producto, reactivo auxiliar, catalizador o disolvente.
- Importación local de `.molecular.json`, **MOL V2000, SDF, SMILES, InChI y CML**; exportación en esos formatos además de SVG y PNG. SDF conserva varios registros. La ruta InChI importa y exporta de forma explícita solo la capa de fórmula, sin fingir una conectividad que el motor local no ha calculado.
- El nuevo motor de **limpieza 2D** combina longitudes de enlace, repulsión, separación angular, penalización de cruces y empaquetado de grafos; respeta los componentes bloqueados.
- Edición estereoquímica declarativa: cuñas delante/detrás, descriptores atómicos **R/S/?** y geometría **E/Z** de dobles enlaces, conservados en el documento y en las salidas compatibles. No se presenta como asignación CIP automática.
- El **editor de reacciones** gestiona coeficientes, reactivos y productos, catalizador, disolvente, temperatura y condiciones; crea una flecha enlazada al esquema y muestra sus condiciones.
- Flechas curvas para movimiento de **pares de electrones** y medias flechas para electrones individuales, editables mediante su menú contextual y exportables en SVG.
- **Historial visual** de hasta 48 estados con miniaturas, puntos manuales y restauración no destructiva, además de Deshacer/Rehacer.

## Mejoras acumuladas de las versiones 0.4.0–0.4.6

### Composición segura y paneles contextuales

- El generador acepta hasta doce fórmulas o cadenas SMILES separadas por coma, punto y coma o salto de línea y las añade junto a lo que ya existe.
- La generación deja de sustituir el documento: todo el lote forma una única operación que puede revertirse con Deshacer.
- El menú contextual de un átomo permite fijar una ficha informativa desplazable; pueden mantenerse varias fichas abiertas a la vez para comparar elementos.
- Cada desplegable lateral nace a la altura de su herramienta y solo se desplaza hacia arriba si necesita espacio; conserva desplazamiento táctil cuando su contenido es alto.
- Deshacer y Rehacer usan dos mitades iguales dentro del ancho habitual de la barra. Vaciar lienzo queda protegido dentro del menú de la goma.
- El selector rápido del menú contextual muestra seis elementos frecuentes, grupo R y tabla periódica en una única fila compacta.

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

- Enciclopedia narrativa, ampliada ahora a 18 capítulos, con buscador, índice, diagramas SVG, tutorial completo, glosario y fuentes primarias enlazadas.
- Explica lectura estructural, valencia, Lewis, enlaces, estereoquímica, resonancia, aromaticidad, interacciones, anillos, isomería, SMILES, flechas, 3D y límites de validación.
- Temas Mañana, Tarde y Noche, más Automático. El modo automático estima amanecer y ocaso según fecha, zona horaria y ubicación opcional autorizada.
- El modo Tarde añade una paleta cálida propia; la preferencia y la última ubicación aproximada se guardan solo en el dispositivo.

## Uso rápido

1. Elige Átomo o Enlace en la barra lateral. Un enlace puede unir átomos existentes o dibujarse directamente sobre el vacío.
2. Usa los puntos suspensivos de Átomo para abrir la tabla periódica completa y sustituir cualquier extremo.
3. Añade carga, pares solitarios, radicales, grupos R, fragmentos o flechas desde sus paletas laterales.
4. Abre el único grupo de selección para elegir Directa, Rectangular, Lazo o Desplazar; usa Limpiar para ordenar el esquema localmente.
5. Abre Fórmula en la barra superior y pega una o varias entradas separadas por coma, punto y coma o línea; se añadirán como borradores editables sin sustituir el lienzo.
6. Abre Laboratorio para reconocer grupos, estudiar aromaticidad, consultar propiedades, identificar una estructura, configurar la validación o balancear una reacción.
7. Usa la rueda o la pinza táctil para ampliar bajo el puntero y abre el visor 3D. Sus controles permiten medir 2/3/4 átomos y explorar conformaciones.
8. Abre Reacciones para asignar papeles y condiciones; el balanceador usará esos componentes.
9. Abre Exportar para obtener SVG, PNG, MOL, SDF, SMILES, CML, capa de fórmula InChI o documento editable.
10. En Archivo explora la biblioteca de 36 estructuras o abre el Historial visual para guardar y restaurar puntos con miniatura.
11. En Enciclopedia alterna entre el lector de 18 capítulos y los cinco ejercicios interactivos.

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
- **localStorage** para autoguardado, biblioteca privada, configuración y progreso didáctico.
- **Vitest** para pruebas del motor y de la interfaz.
- **GitHub Actions + GitHub Pages** para integración y despliegue continuos.

## Arquitectura sin servidor

GitHub Pages sirve archivos estáticos y no ejecuta Python, Java, Go ni un SQLite de servidor. La versión 0.7.0 funciona íntegramente en el navegador para mantener edición, análisis, identificación local, aprendizaje, validación, balance, conversión, generación, consulta, guardado y 3D inmediatos.

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
│   ├── chemical-formats.ts        # MOL/SDF/SMILES/InChI/CML
│   ├── formula-generator.ts       # fórmula molecular y subconjunto OpenSMILES
│   ├── layout-engine.ts           # limpieza y empaquetado 2D
│   ├── molecular-analysis.ts      # grupos, anillos, propiedades y validación
│   ├── reaction-balancer.ts       # conservación elemental y coeficientes mínimos
│   ├── encyclopedia.data.ts       # lector químico de 18 capítulos y fuentes
│   ├── structure-library.data.ts  # 36 plantillas y 43 referencias identificables
│   ├── structure-identifier.ts    # isomorfismo y similitud estructural local
│   ├── tutorial.data.ts           # cinco ejercicios guiados y verificables
│   └── solar-theme.ts             # amanecer, ocaso y tema ambiental
├── src/app/shared/                # iconografía SVG local
├── src/app/three-d-viewer/        # motor y panel 3D
├── src/app/app.*                  # editor 2D e interfaz
├── CHANGELOG.md
└── README.md
```

## Alcance científico

La validación 0.7.0 es educativa y configurable. Las capacidades de elementos representativos se basan en valencias covalentes habituales; para metales de transición y elementos pesados se usan límites de coordinación simplificados. Los descriptores R/S y E/Z son asignaciones declaradas por la persona editora: Molecular no calcula todavía prioridades CIP ni demuestra que el descriptor elegido sea correcto.

Una fórmula molecular no contiene conectividad suficiente para identificar un isómero. El generador produce en ese caso un punto de partida editable; SMILES es la entrada apropiada cuando la conectividad debe ser inequívoca. La colocación 3D es una incrustación topológica relajada, no una optimización energética.

El reconocimiento de grupos y la aromaticidad utilizan patrones locales y ciclos pequeños: son útiles para aprendizaje y edición, pero no equivalen a una percepción química exhaustiva. TPSA y logP se identifican expresamente como estimaciones locales; las conformaciones y su índice relativo son propuestas topológicas, no mínimos energéticos. Las mediciones sí se calculan sobre las coordenadas visibles del modelo generado.

La identificación exacta significa isomorfismo contra una referencia local concreta, no identificación experimental de una muestra. La similitud es una puntuación orientativa de rasgos compartidos; no demuestra nombre, actividad, pureza, seguridad ni estereoquímica completa.

El balanceador resuelve conservación elemental y de carga para las especies presentes; no deduce productos, mecanismos ni especies auxiliares. Molecular no calcula cargas parciales, energía cuántica, espectros, orbitales ni dinámica molecular. No sustituye software de química computacional ni debe emplearse para validar resultados de investigación.

## Roadmap

El plan versionado se mantiene en [ROADMAP.md](ROADMAP.md). Los siguientes hitos se centran en asignación CIP, reacciones multietapa, percepción química mediante un motor opcional, conformadores físicos, cálculos con procedencia y compatibilidad con Atlas Editor.

## Autor

**Alejandro Pico Perez**

- [Portfolio](https://alejandropico.github.io/Portfolio/)
- [GitHub](https://github.com/AlejandroPico)
- [Repositorio Molecular](https://github.com/AlejandroPico/Molecular)
