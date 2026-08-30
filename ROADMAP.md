# Roadmap de Molecular

Este documento separa lo publicado de lo previsto. Las fechas no son compromisos: el orden refleja dependencia técnica y valor para el editor.

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

## 0.5 — Mecanismos e interoperabilidad

- Flechas curvas de empuje electrónico con puntos de control editables.
- Etiquetas, corchetes, coeficientes, condiciones de reacción y objetos de texto.
- Importación y exportación SMILES, MOL y SDF con pruebas de ida y vuelta.
- Editor explícito de hidrógenos, isotopía y numeración de átomos.
- Portapapeles vectorial y contratos de intercambio iniciales con Atlas Editor.

## 0.6 — Química estructural

- Aromaticidad formal, estereoquímica tetraédrica y dobles enlaces E/Z.
- Grupos funcionales, abreviaturas químicas y plantillas ampliables.
- Normalización de enlaces, detección de anillos y limpieza 2D con restricciones químicas.
- Conformadores reales y propiedades verificadas mediante una fuente química externa opcional.

## 0.7 — Datos locales y cálculo opcional

- SQLite-WASM con OPFS/IndexedDB para catálogos, proyectos y búsqueda local.
- Servicio opcional FastAPI con RDKit u Open Babel para conversión y optimización geométrica.
- Búsqueda estructural y por subestructura, manteniendo el editor básico utilizable sin servidor.
- Cálculos con procedencia, unidades y límites científicos visibles.

## Futuro

- Escenas reutilizables en Atlas Editor.
- Esquemas de reacción multietapa y rutas metabólicas.
- Enlaces contextuales con los proyectos de partículas, átomo y tabla periódica.
- Formato de componentes científicos exportables como SVG y PNG.

## Fuera del alcance actual

Molecular 0.4 no realiza química cuántica, dinámica molecular, predicción de reacciones ni validación experimental. La geometría 3D actual es topológica y educativa; cualquier capacidad avanzada deberá indicar su método y procedencia.
