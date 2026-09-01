# Roadmap de Molecular

Este documento separa lo publicado de lo previsto. Las fechas no son compromisos: el orden refleja dependencia técnica y valor para el editor.

## 0.4.6 — Publicado

- Historial lateral simétrico, contenido íntegramente dentro de la anchura normal de la barra.
- Selector contextual de elementos compactado en una sola fila de ocho accesos.

## 0.4.5 — Publicado

- Lockfile reproducible y validado con el mismo flujo `npm ci` que utiliza GitHub Actions.
- Restablecimiento del despliegue automático de la versión con composición no destructiva y fichas informativas.

## 0.4.4 — Publicado

- Flyouts laterales anclados a cada herramienta, limitados dinámicamente por el espacio real de la ventana y desplazables cuando no caben.
- Historial con botón doble directo y vaciado confirmado integrado en el menú de la goma.
- Fichas atómicas informativas que pueden fijarse, moverse y convivir sobre el lienzo.
- Generación múltiple por comas, punto y coma o líneas; cada lote se añade sin destruir el documento y puede deshacerse de una vez.
- Cobertura de pruebas para fórmulas tradicionales en minúsculas, lotes mixtos, conservación del documento e inspectores múltiples.

## 0.4.3 — Publicado

- Panel de Lewis reducido a 202 px reales y verificado en el despliegue público junto con selección, enlaces e inspectores.

## 0.4.2 — Publicado

- Grupo único de selección con Directa, Rectangular, Lazo y Desplazar; paneo temporal siempre disponible mediante botón central o `Espacio`.
- Historial compacto con Deshacer/Rehacer en un solo control y flyouts confinados a la ventana con desplazamiento táctil.
- Inspectores y controles de Lewis más estrechos; tinta de enlace fijada al borde accesible de su menú.
- Búsqueda móvil en una segunda fila completa, paneles de Fórmulas/Enciclopedia a pantalla útil completa y barra de herramientas en dos columnas para móvil horizontal.
- Fórmulas tradicionales tolerantes a caja y subíndices, conservando la semántica sensible a mayúsculas de SMILES.
- Plantilla estructural de ácido sulfúrico y pruebas para `h2o`, `H₂O`, `h2so4` y SMILES aromáticos.

## 0.4.1 — Publicado

- Inspector diferenciado para enlaces con extremos A/B editables y color propio.
- Distribución anticolisión de H, carga, pares libres y radicales en pantalla y SVG.
- Controles `− / +` reversibles para todas las anotaciones de Lewis.
- SMILES ampliado con aromaticidad sensible a caja, anillos extendidos, isótopos, cargas y `@/@@`.
- Colocación 3D de hidrógenos guiada por direcciones libres y cierre integrado en la barra del visor.
- Temas Mañana, Tarde, Noche y Automático mediante cálculo solar local opcional.
- Enciclopedia didáctica de 15 capítulos con diagramas, buscador, glosario y fuentes primarias.
- Capas flotantes corregidas para que enciclopedia e inspectores no queden bajo el pie informativo.

## 0.5.0 — Publicado

- Componentes independientes con nombre, agrupación, bloqueo, visibilidad, desplazamiento, papel de reacción y coeficiente.
- Importación/exportación local MOL V2000, SDF, SMILES, CML y capa de fórmula InChI, además del formato Molecular.
- Limpieza 2D con resortes de enlace, separación angular, repulsión, penalización de cruces y empaquetado de grafos.
- Edición declarativa R/S y E/Z, integrada con cuñas y preservada en el documento y formatos compatibles.
- Editor de reacciones con reactivos, productos, coeficientes, catalizador, disolvente, temperatura y condiciones.
- Flechas curvas de par electrónico y medias flechas radicalarias.
- Historial visual con 48 miniaturas, puntos manuales y recuperación no destructiva.
- Pruebas de ida y vuelta de formatos, migración del documento v2 y restricciones del motor de disposición.

## 0.6.0 — Publicado

- Reconocimiento seleccionable de quince familias de grupos funcionales sobre el grafo molecular.
- Detección de ciclos, evaluación local 4n+2, normalización aromática y generación de formas de Kekulé.
- Propiedades: masa, carga, composición, HBD/HBA, enlaces rotables, anillos, TPSA y logP estimados con límites visibles.
- Mediciones 3D de distancia, ángulo y diedro mediante selección directa de átomos.
- Conformaciones topológicas optimizada, plana, extendida, compacta y propuestas alternativas.
- Perfiles de validación Estricto, Guiado y Libre con cinco comprobaciones y carga límite configurable.
- Balanceador estequiométrico de coeficientes enteros mínimos, incluyendo conservación de carga neta.
- Cobertura unitaria del análisis, balance, panel científico y controles 3D; 53 pruebas superadas.

## 0.7.2 — Publicado

- Biblioteca de 36 estructuras editables repartidas entre aminoácidos, nucleótidos, azúcares, lípidos, grupos protectores y fármacos frecuentes.
- Búsqueda y filtros de biblioteca con inserción no destructiva, fuente enlazada y conservación del historial.
- Tutorial interactivo persistente con cinco ejercicios verificables sobre enlaces, Lewis, cargas, aromaticidad y SMILES.
- Identificador local con isomorfismo sobre 43 referencias y clasificación de similitud por huellas topológicas.
- Ámbito de identificación guiado por componente conectado o multiselección explícita.
- Enciclopedia ampliada a 18 capítulos y navegación contextual desde enlaces, carga/electrones y grupos funcionales.
- Batería de 59 pruebas automatizadas para preservar estas capacidades y las anteriores.
- Parche de composición para que las pestañas Enciclopedia/Tutorial conserven una fila propia y permanezcan pulsables en cualquier anchura.
- Diseño adaptable de biblioteca, tutorial e identificación para escritorio, móvil y orientación horizontal.

## 0.8.0 — Publicado

- Árbol jerárquico filtrable de componentes, átomos, enlaces y flechas, con localización, visibilidad, bloqueo y orden.
- Portapapeles molecular versionado para copiar selecciones o documentos y añadirlos entre pestañas sin destruir contenido.
- Exportación por documento, selección o componente con fondo, proporción, escala, margen, retícula y capas editoriales configurables.
- Plantillas de estructura limpia, artículo, presentación, atlas y publicación cuadrada.
- SQLite-WASM persistente mediante `JsStorageDb`, migración de la biblioteca anterior y respaldo `localStorage`.
- PWA instalable y utilizable sin conexión tras la primera carga, con manifiesto y caché versionada por Angular.
- Laboratorio amplio con navegación lateral en escritorio, navegación táctil móvil y panel Identificar sin superposiciones.
- Batería de 67 pruebas, compilación de producción y verificación de los artefactos SQLite/PWA.

## 0.9 — Química estructural avanzada

- Asignación CIP automática y comprobada para R/S y E/Z.
- Grupos funcionales, abreviaturas químicas y plantillas ampliables.
- Puntos de control editables, texto libre y reacciones multietapa.
- Conformadores reales y propiedades verificadas mediante una fuente química externa opcional.

## 1.0 — Datos amplios y cálculo opcional

- Migración opcional de SQLite-WASM a OPFS para catálogos grandes cuando el entorno de despliegue admita las cabeceras de aislamiento necesarias.
- Servicio opcional FastAPI con RDKit u Open Babel para conversión y optimización geométrica.
- Búsqueda estructural y por subestructura, manteniendo el editor básico utilizable sin servidor.
- Cálculos con procedencia, unidades y límites científicos visibles.

## Futuro

- Escenas reutilizables en Atlas Editor.
- Esquemas de reacción multietapa y rutas metabólicas.
- Enlaces contextuales con los proyectos de partículas, átomo y tabla periódica.
- Formato de componentes científicos exportables como SVG y PNG.

## Fuera del alcance actual

Molecular 0.8 no realiza química cuántica, dinámica molecular, predicción de reacciones ni validación experimental. Los grupos, propiedades y aromaticidad se obtienen con reglas locales; la geometría 3D y sus conformaciones son topológicas y educativas. R/S y E/Z son descriptores introducidos por la persona editora, no resultados de un cálculo CIP.
