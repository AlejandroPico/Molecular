# Arquitectura de Molecular

## Decisión de la versión 0.8.0

Molecular se publica en GitHub Pages. Ese alojamiento sirve archivos estáticos y no ejecuta procesos Python, Java, Go ni un servidor SQLite. Por ello, el primer núcleo se ejecuta íntegramente en el navegador:

- **Angular** organiza la interfaz, el estado y las herramientas del editor.
- **SVG** representa la estructura 2D y permite exportarla sin pérdida.
- **Three.js/WebGL** representa la molécula tridimensional y gestiona la cámara.
- **TypeScript** contiene el modelo químico, las reglas iniciales de valencia y los conversores.
- **SQLite-WASM** aporta consultas y persistencia estructurada sin abandonar el navegador.
- **localStorage** sustenta el VFS `JsStorageDb` y conserva respaldos de preferencias y progreso.
- **Angular Service Worker** precarga el shell y permite instalar la aplicación o reabrirla sin conexión.

Esta solución mantiene la aplicación rápida, desplegable en Pages y usable sin una cuenta o servidor.

## Módulos actuales

```text
src/app/
├── core/
│   ├── periodic-table.data.ts    # 118 elementos, posiciones y capacidades
│   ├── chemistry.models.ts       # documentos, enlaces, valencias y fórmulas
│   ├── chemical-formats.ts       # importación/exportación química local
│   ├── formula-generator.ts      # fórmula molecular y subconjunto OpenSMILES
│   ├── layout-engine.ts          # limpieza y empaquetado 2D
│   ├── molecular-analysis.ts     # grupos, anillos, propiedades y validación
│   ├── reaction-balancer.ts      # sistema lineal estequiométrico
│   ├── encyclopedia.data.ts      # capítulos, secciones y fuentes
│   ├── structure-library.data.ts # catálogo químico versionado
│   ├── structure-identifier.ts   # isomorfismo y huella de similitud
│   ├── tutorial.data.ts          # ejercicios didácticos verificables
│   ├── object-tree.ts            # árbol navegable de objetos químicos
│   ├── document-clipboard.ts     # fragmentos de intercambio versionados
│   ├── publication.data.ts       # opciones y plantillas editoriales
│   ├── local-database.ts         # SQLite-WASM y migración de documentos
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
- flechas electrónicas cuadráticas para pares o electrones individuales;
- componentes con nombre, átomos, bloqueo, visibilidad, papel y coeficiente;
- reacciones con relación a componentes, flecha, catalizador, disolvente, temperatura y condiciones;
- descriptores estereoquímicos declarados en átomos y enlaces;
- fechas de creación y modificación.

Es la primera frontera de interoperabilidad con Atlas Editor. `chemical-formats.ts` convierte sin acoplarse a la interfaz entre este grafo y MOL V2000, SDF, SMILES y CML. La compatibilidad InChI local se limita expresamente a su capa de fórmula: la generación completa exige el InChI oficial o un servicio químico especializado.

## Motor educativo de capacidad

Los enlaces covalentes tienen orden 1, 2 o 3; aromáticos y deslocalizados contribuyen 1,5 en el modelo educativo, mientras que los puentes de hidrógeno y el enlace indeterminado se tratan como anotaciones sin consumo covalente. La validación suma esta contribución alrededor de cada átomo y la compara con las capacidades configuradas para el elemento y su carga formal. Una modificación incompatible se rechaza antes de mutar el documento en el perfil Estricto. El perfil Guiado informa y permite continuar; Libre omite las barreras de coherencia. Cada familia de comprobaciones se activa por separado y la configuración se conserva localmente fuera del documento químico.

Los elementos representativos emplean valencias covalentes habituales. Los metales de transición, lantánidos y actínidos utilizan límites de coordinación simplificados: sirven para impedir estructuras arbitrarias, pero no modelan estados de oxidación, ligandos, geometrías de coordinación ni electrones de forma rigurosa.

Los estilos arriba, abajo, deslocalizado, puente de hidrógeno, dativo, aromático e indeterminado se conservan en el documento y en la salida SVG. La visualización 3D utiliza arriba/abajo como indicio de profundidad. R/S y E/Z se conservan como descriptores declarados, pero todavía no se calculan mediante reglas CIP.

## Interacción geométrica

El lienzo utiliza un `viewBox` fijo de 1400 × 800 con `preserveAspectRatio="xMidYMid meet"`. Las coordenadas del puntero se convierten mediante la matriz real del SVG; de este modo abrir un panel no deforma círculos ni distancias. El zoom recalcula la traslación para conservar bajo el cursor o el centro de la pinza el mismo punto molecular.

La retícula es una capa HTML independiente y absoluta que ocupa el escenario completo. Sus variables CSS de escala y origen se actualizan con la cámara 2D; puede dibujarse como malla triangular o como puntos sin introducir márgenes por la relación de aspecto del SVG.

El motor `layout-engine.ts` trabaja sobre una copia del documento. Aplica fuerzas de longitud de enlace, repulsión entre átomos, separación angular en centros con varios vecinos y una penalización geométrica para cruces de segmentos. Finalmente distribuye los grafos desconectados en filas. Los átomos de componentes bloqueados se excluyen de todos los desplazamientos.

## Componentes, reacciones e historial

Los componentes son agrupaciones explícitas de identificadores atómicos. La sincronización elimina referencias obsoletas y crea automáticamente un componente para cada grafo nuevo que todavía no pertenezca a otro; no divide los grupos creados deliberadamente por la persona editora. Ocultar afecta al render 2D, mientras que bloquear impide edición y movimiento.

Una reacción referencia componentes por papel, no duplica átomos. Sus condiciones se vinculan a una flecha de reacción mediante `arrowId`, por lo que el esquema sigue siendo editable. Las flechas electrónicas son objetos distintos de las flechas de reacción y usan curvas de Bézier cuadráticas.

Deshacer/Rehacer conserva pilas de documentos completos. El historial visual mantiene en memoria hasta 48 copias con etiqueta y fecha; una restauración registra primero el estado vigente, evitando que recuperar una miniatura destruya el trabajo actual.

El árbol de objetos es una proyección derivada, no una segunda fuente de verdad. `object-tree.ts` recorre componentes y genera nodos para sus átomos y enlaces, además de flechas químicas y electrónicas. Buscar o contraer nodos solo cambia estado de interfaz; seleccionar localiza los identificadores originales en el lienzo. Reordenar, bloquear, ocultar o separar sí pasa por la mutación versionada del documento.

## Portapapeles y publicación

`document-clipboard.ts` define `molecular/clipboard+json` versión 1. Una copia de selección recorta átomos, enlaces internos y componentes; una copia completa conserva también flechas y reacciones. Al pegar, el editor crea identificadores nuevos, traslada el fragmento al espacio libre y lo registra como una sola operación reversible. El portapapeles del sistema se usa cuando el navegador da permiso y siempre existe un búfer local de respaldo.

El exportador construye primero una vista inmutable del ámbito: documento, selección o componente. Las opciones editoriales solo afectan a esa vista y al SVG/PNG resultante. `publication.data.ts` reúne valores predeterminados y cinco plantillas; aplicar una plantilla copia sus ajustes y después permite modificarlos sin cambiar el documento químico. Los formatos MOL/SDF/SMILES/InChI/CML y JSON respetan también el ámbito escogido.

## Análisis molecular y balance

`molecular-analysis.ts` construye una lista de adyacencia inmutable a partir del documento. Sobre ella reconoce subgrafos funcionales, enumera ciclos simples pequeños, evalúa conjugación y la condición 4n+2, calcula propiedades derivadas y produce incidencias seleccionables. Masa, fórmula, carga y composición proceden directamente de los átomos e hidrógenos implícitos; TPSA y logP usan contribuciones locales deliberadamente etiquetadas como estimaciones.

`reaction-balancer.ts` forma una matriz especies × elementos —con una fila adicional para carga cuando procede—, calcula un vector del espacio nulo mediante eliminación de Gauss con fracciones reducidas y normaliza la solución a los enteros positivos mínimos. El resultado solo modifica los coeficientes de componentes y queda integrado en Deshacer/Historial.

## Biblioteca, tutorial e identificación

`structure-library.data.ts` conserva 36 entradas curadas como datos TypeScript: nombre, alias, familia, fórmula de presentación, SMILES, descripción, etiquetas y fuente. Los siete ejemplos esenciales se suman como referencias de identificación sin duplicarse en la lista ampliada. Insertar una entrada reutiliza el generador SMILES, remapea todos los identificadores y la coloca junto al documento vigente mediante una única mutación reversible.

`structure-identifier.ts` recorta el ámbito al componente conectado del átomo elegido o al subgrafo multiseleccionado. Para una coincidencia exacta compara fórmula, carga y firmas atómicas y resuelve el isomorfismo mediante retroceso con candidatos previamente filtrados. Las formas de Kekulé y los enlaces aromáticos se normalizan contra los ciclos aromáticos percibidos. Cuando no hay isomorfismo, una huella local compara recuentos de elementos, clases de enlace, grupos funcionales, ciclos y carga mediante similitud de Jaccard.

El tutorial es una máquina de progreso ligera definida por datos. Cada ejercicio prepara una estructura mediante la misma ruta no destructiva del editor y conserva sus identificadores para verificar únicamente ese fragmento. El progreso guarda solo los identificadores de lecciones completadas en `localStorage`; no altera el documento químico ni se transmite.

## Generación y geometría

El generador distingue una fórmula molecular de una cadena SMILES. Las fórmulas tradicionales se normalizan mediante segmentación contra los 118 símbolos: admite caja libre y subíndices Unicode, favorece la interpretación con elementos ligeros en entradas totalmente minúsculas y conserva las mayúsculas como vía de desambiguación. Para fórmulas conocidas puede usar una plantilla; en los demás casos distribuye la composición en un borrador que conserva el recuento pedido y deja clara la ambigüedad de isómeros. El analizador SMILES local sigue siendo sensible a caja y cubre átomos alifáticos y aromáticos, ramas, componentes, anillos simples y extendidos, cargas, isótopos, H explícitos, `@/@@` y enlaces simples, dobles, triples, aromáticos, indeterminados y direccionales básicos.

La entrada múltiple separa comas, punto y coma y saltos de línea fuera de corchetes, interpreta todas las entradas antes de modificar el documento y limita cada lote a doce estructuras. La inserción remapea identificadores, coloca los componentes nuevos junto a los límites del contenido previo y registra el lote mediante una única mutación. Así, un error no produce inserciones parciales y Deshacer restaura exactamente el documento anterior.

La interfaz adaptable mantiene una única barra superior y una única barra lateral. Cada flyout toma la coordenada vertical de su botón y la limita contra los bordes seguros de la ventana; únicamente los menús altos se elevan y todos disponen de desplazamiento propio. Las fichas informativas fijadas conservan estado independiente y coordenadas acotadas al escenario. En móvil, la búsqueda ocupa una fila inferior completa y los lectores complejos usan el área útil completa. En orientación horizontal corta, las herramientas se reorganizan en dos columnas para conservar objetivos táctiles legibles.

El visor 3D recorre el grafo molecular, asigna direcciones espaciales semejantes a una distribución tetraédrica y aplica iteraciones de resorte y repulsión. Los hidrógenos implícitos se añaden después, escogiendo direcciones de una esfera de Fibonacci que minimizan la coincidencia con vecinos ocupados. Puede regenerar propuestas, recuperar el plano 2D o sesgar la distribución hacia estados extendidos y compactos.

Las mediciones usan raycasting contra las esferas de Three.js y las mismas coordenadas visibles que el render. Dos selecciones producen una distancia euclídea en ångströms; tres, un ángulo; cuatro, un diedro mediante proyección sobre el enlace central. El resaltado es material y no muta el documento.

## Contenido didáctico y temas

La enciclopedia es un conjunto TypeScript versionado de 18 capítulos narrativos, secciones, ejemplos y fuentes. Los diagramas se dibujan como SVG semántico dentro de la interfaz, de modo que mantienen nitidez, contraste temático y adaptación móvil sin depender de recursos de terceros. Los inspectores traducen cada contexto a un identificador de capítulo estable; por ello un enlace o grupo abre directamente su explicación sin duplicar contenido en el componente visual.

El modo Automático calcula una ventana solar aproximada con fecha, zona horaria y, si el usuario lo autoriza expresamente, latitud y longitud. La ubicación queda en `localStorage`; no se transmite. Sin permiso se aplican franjas locales predecibles.

## Persistencia local y PWA

`local-database.ts` carga SQLite de forma diferida, crea las tablas `molecular_documents` y `molecular_settings` y utiliza el VFS oficial `JsStorageDb`. Ese VFS persiste el fichero lógico en el almacenamiento web del mismo origen y funciona en el hilo principal, por lo que es compatible con GitHub Pages. Durante la inicialización se migran el autoguardado y la biblioteca histórica; si WebAssembly no está disponible, la ruta `localStorage` anterior sigue funcionando.

No se activa OPFS concurrente: la variante con Worker necesita aislamiento entre orígenes mediante COOP/COEP y GitHub Pages no permite definir esas cabeceras. Una futura migración podrá adoptarlo sin alterar el formato del documento cuando cambie el entorno de alojamiento.

La compilación de producción copia `sqlite3.wasm`, genera `ngsw.json` y registra el service worker oficial de Angular. El manifiesto declara Molecular como aplicación independiente. El shell, los chunks, el WASM y los recursos públicos se almacenan en caché; los documentos permanecen privados en el dispositivo y no forman parte de esa caché pública.

## Evolución de datos y Python

La evolución prevista tiene dos modos complementarios:

1. **Modo estático actual:** SQLite compilado a WebAssembly mediante `JsStorageDb`, PWA y respaldo local, sin servidor.
2. **Modo estático ampliado:** OPFS para bases grandes cuando el alojamiento pueda activar las cabeceras de aislamiento necesarias.
3. **Modo de cálculo opcional:** FastAPI + SQLite/PostgreSQL con RDKit u Open Babel para optimización geométrica, conversión de formatos, búsqueda estructural y propiedades avanzadas.

El modo de cálculo no será obligatorio para dibujar, guardar o visualizar. Así se evita convertir una herramienta educativa local en una aplicación dependiente de un servidor.

## Límites científicos actuales

La 0.8.0 aplica reglas de valencia y coordinación simplificadas y genera geometrías 3D didácticas a partir de la topología. La aromaticidad y los grupos funcionales son una percepción local, y la identificación se limita a referencias incluidas: ninguna equivale a un modelo electrónico exhaustivo o a una determinación experimental. TPSA, logP, similitud e índice conformacional son orientativos. No realiza minimización energética, asignación CIP automática, orbitales ni dinámica molecular. Los formatos se orientan al intercambio educativo local; para identificadores canónicos, V3000 o investigación se necesita un motor especializado. Por ello no sustituye software de química computacional ni debe utilizarse para validar resultados de investigación.
