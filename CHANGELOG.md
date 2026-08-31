# Historial de versiones

## 0.5.0 — 2026-08-31

### Añadido

- Documento Molecular v2 con componentes independientes, papeles de reacción, coeficientes, estereoquímica, mecanismos electrónicos y metadatos de reacción.
- Gestor de componentes para nombrar, agrupar, bloquear, ocultar y desplazar estructuras sin alterar el resto del lienzo.
- Importación y exportación MOL V2000, SDF, SMILES y CML, más compatibilidad explícitamente parcial con la capa de fórmula InChI.
- Motor de limpieza 2D con corrección de longitudes, repulsión, separación angular, penalización de cruces y empaquetado de componentes.
- Controles R/S/? en átomos y E/Z en dobles enlaces, además de las cuñas delante/detrás existentes.
- Editor de reacción con reactivos, productos, coeficientes, catalizador, disolvente, temperatura y condiciones sobre la flecha.
- Flechas curvas para pares de electrones y medias flechas para electrones individuales.
- Historial visual de 48 estados con miniaturas, puntos manuales y restauración no destructiva.
- Pruebas unitarias para formatos químicos, componentes, migración del documento v2 y motor de disposición.

### Cambiado

- El panel Archivo acepta los formatos químicos nuevos y enlaza el historial visual.
- Exportar incorpora cinco salidas químicas, manteniendo SVG, PNG, JSON y captura 3D.
- La exportación SVG conserva estereoquímica declarada, flechas electrónicas y condiciones de reacción.

### Límites documentados

- La salida InChI local contiene la capa de fórmula y no pretende sustituir la generación oficial de InChI.
- R/S y E/Z son descriptores declarados, no una asignación automática de prioridades CIP.

## 0.4.6 — 2026-08-31

### Cambiado

- Deshacer y Rehacer ocupan dos mitades idénticas dentro del ancho habitual de la barra lateral, con iconos del mismo tamaño.
- Los seis elementos frecuentes, el grupo R y el acceso a la tabla periódica se distribuyen en una única fila del menú contextual.

## 0.4.5 — 2026-08-31

### Corregido

- Se regenera y valida íntegramente `package-lock.json` para que `npm ci` funcione en GitHub Actions y el despliegue no quede bloqueado antes de las pruebas.

## 0.4.4 — 2026-08-30

### Añadido

- Entrada por lotes de hasta doce fórmulas o cadenas SMILES separadas por coma, punto y coma o salto de línea.
- Fichas informativas atómicas independientes, desplazables y acumulables desde el menú contextual.
- Pruebas de interfaz para la adición no destructiva, el deshacer del lote y las fichas simultáneas.

### Cambiado

- El generador añade cada estructura junto al documento actual y registra el lote completo como una única operación de historial.
- Los desplegables laterales se alinean con el botón que los abre y solo se elevan lo imprescindible para caber en la ventana.
- Deshacer y rehacer forman un control doble directo, con Deshacer como acción principal y sin submenú.
- Vaciar lienzo pasa al desplegable de la goma; conserva la confirmación explícita y la goma sigue siendo la acción principal.

### Corregido

- Generar una fórmula deja de borrar silenciosamente el documento y de reiniciar el historial.
- Los menús cortos de átomos, flechas y Lewis dejan de desaparecer durante el recorrido entre botón y opciones.

## 0.4.3 — 2026-08-30

### Corregido

- Una regla de estilo posterior ya no anula la anchura compacta del panel de Lewis; el desplegable pasa de 286 a 202 píxeles en escritorio.

## 0.4.2 — 2026-08-30

### Añadido

- Interpretación local de fórmulas tradicionales en mayúsculas, minúsculas o con subíndices Unicode.
- Plantilla estructural de ácido sulfúrico con dos enlaces S=O y dos grupos hidroxilo.

### Cambiado

- Selección directa, rectangular, por lazo y desplazamiento comparten un único grupo lateral.
- Deshacer y rehacer comparten un control de historial desplegable.
- Los inspectores contextuales y los controles de Lewis son más compactos.
- La búsqueda móvil se abre hacia abajo a toda la anchura; Fórmulas y Enciclopedia ocupan el área útil completa.
- En móvil horizontal, la barra lateral se reorganiza en dos columnas.

### Corregido

- Los desplegables laterales quedan confinados entre la navegación superior y el pie, con desplazamiento táctil independiente.
- La tinta de nuevos enlaces permanece accesible en el borde inferior del menú de enlaces.
- `h2o`, `H₂O` y `h2so4` dejan de caer por error en el analizador SMILES.

## 0.4.1 — 2026-08-30

### Corregido

- Los paneles flotantes y su fondo modal quedan por encima del pie de fórmula y de los inspectores, evitando que estos elementos tapen el borde inferior de la enciclopedia.

## 0.4.0 — 2026-08-30

### Añadido

- Inspector exclusivo de enlaces, con tipo, tinta, extremos A/B independientes y acceso 3D del enlace seleccionado.
- Controles reversibles y minimalistas para carga formal, pares libres y electrones radicalarios.
- Paletas Mañana, Tarde y Noche, más modo Automático por ventana solar y ubicación opcional.
- Enciclopedia narrativa de 15 capítulos con índice, búsqueda, diagramas SVG, ejemplos, tutorial, glosario y fuentes IUPAC/OpenSMILES/PubChem.
- Soporte SMILES para anillos `%10` y `%(123)`, isótopos, H entre corchetes, cargas numéricas o repetidas, `~` y quiralidad `@/@@`.
- Color configurable para nuevos enlaces y para enlaces seleccionados.

### Cambiado

- H, carga, pares libres y radicales se distribuyen en huecos angulares separados respecto de los enlaces; la exportación SVG reutiliza la misma disposición.
- El visor 3D sitúa hidrógenos implícitos en las direcciones menos ocupadas y conserva indicios de cuñas y quiralidad.
- Las acciones del visor 3D se centran en una única barra y el cierre ocupa su extremo derecho.
- El pie flotante contiene únicamente fórmula estimada y masa molar.
- La enciclopedia deja de actuar como selector rápido de elementos; la tabla periódica sigue siendo el selector específico del editor.

### Corregido

- `C` y `c` dejan de fusionarse como si fueran un símbolo de elemento de dos letras; la aromaticidad es sensible a mayúsculas.
- Un carbono con una carga sin regla de valencia configurada ya no recupera hidrógenos de la valencia neutra.
- Las líneas visuales de enlaces dobles o triples dejan de provocar una edición ambigua de sus dos extremos.
- El botón de cierre 3D deja de tapar Restablecer cámara y Exportar imagen.

## 0.3.0 — 2026-08-29

### Añadido

- Enlaces autónomos sobre el lienzo vacío y menú contextual para cambiar su clase o eliminarlos.
- Enlaces arriba, abajo, deslocalizado, de hidrógeno y dativo junto a los tipos ya disponibles.
- Flechas de reacción, resonancia y equilibrio; grupos R; pares solitarios y electrones radicalarios.
- Selección por lazo, modo esquelético/desarrollado y limpieza local de la disposición 2D.
- Generador de borradores desde fórmula molecular o SMILES, con ramas, anillos, enlaces múltiples, aromaticidad y cargas básicas.
- Retícula triangular como opción junto al fondo de puntos.
- Representaciones 3D mediante iconos: bola y varilla, licorice, relleno espacial, varillas y alambre.

### Cambiado

- La retícula se desacopla del `viewBox`, cubre todo el escenario y responde al zoom y al desplazamiento.
- Deshacer y rehacer pasan de la barra superior a la barra vertical de herramientas.
- La reconstrucción 3D parte de la topología y distribuye los vecinos en profundidad antes de relajar la geometría.
- El formato Molecular conserva flechas y anotaciones electrónicas, migrando documentos anteriores al cargarlos.
- «Acerca de», la arquitectura y el alcance científico describen explícitamente los límites del generador y de la geometría 3D.

### Corregido

- El visor 3D puede cerrarse desde su cabecera, el control superior, un botón exterior de seguridad o `Esc`.
- El fondo deja de mostrar márgenes laterales sin retícula al cambiar la proporción disponible.
- Los puentes de hidrógeno dejan de consumir valencia covalente.

## 0.2.0 — 2026-08-29

### Añadido

- Catálogo y selector periódico completo de 118 elementos, con búsqueda, número atómico, nombre, masa, familia y capacidades educativas.
- Flyouts laterales para átomos, siete estilos de enlace, cargas y fragmentos.
- Enlaces de cuña sólida, cuña discontinua, aromático visual e indeterminado, además de simple, doble y triple.
- Plantillas de benceno, ciclopropano, ciclobutano, ciclopentano, ciclohexano, ciclooctano y cadena de carbono.
- Selección completa de elemento desde el inspector y desde el menú contextual.
- Validación previa de enlace, sustitución de elemento y cambio de carga.
- Zoom táctil mediante gesto de pinza.

### Cambiado

- La navegación pasa a ser una barra única y aislada en la esquina superior derecha, con búsqueda expandible a la izquierda y porcentaje de zoom como último control.
- La paleta inferior desaparece; sus funciones se integran en la barra vertical.
- «Acerca de» concentra identidad, versión, autoría, funciones y enlaces, y elimina el diagrama de ecosistema.
- El estado químico se presenta como módulo flotante en lugar de una franja de borde completo.
- Los hidrógenos implícitos tienen en cuenta cargas formales comunes.
- El visor móvil 3D ocupa el área de trabajo completa mientras está abierto.

### Corregido

- El zoom mantiene fijo el punto situado bajo el cursor en lugar de tomar la esquina superior izquierda como origen.
- El SVG conserva su relación de aspecto al redimensionarse o al abrir el visor 3D; los átomos permanecen circulares.
- Añadir una carga al carbono ya no elimina indiscriminadamente todos los hidrógenos implícitos.
- Las operaciones que exceden la capacidad de enlace ya no crean primero una estructura inválida: se rechazan con un mensaje explicativo.
- Se añade `favicon.svg` literal en la raíz del repositorio.

## 0.1.1 — 2026-08-28

### Corregido

- El visor 3D muestra ahora un estado de compatibilidad claro cuando el navegador no puede crear un contexto WebGL, en lugar de dejar un panel vacío.
- Los controles exclusivos del visor quedan desactivados mientras WebGL no está disponible.

## 0.1.0 — 2026-08-28

Primera versión funcional de Molecular.

### Añadido

- Editor molecular 2D basado en SVG con átomos y enlaces simples, dobles y triples.
- Herramientas de selección rectangular, arrastre, desplazamiento, borrado y duplicación.
- Paleta inicial de 19 elementos y accesos rápidos para los más comunes.
- Cálculo local de fórmula estimada, masa molar, hidrógenos implícitos y avisos de valencia.
- Visor WebGL 3D con Three.js, controles orbitales y tres representaciones.
- Moléculas iniciales: agua, metano, amoniaco, dióxido de carbono, etanol y benceno.
- Guardado automático, biblioteca local e importación/exportación del formato Molecular JSON.
- Exportación 2D en SVG y PNG y captura del visor 3D en PNG.
- Temas claro, oscuro y automático; capas de visualización; enciclopedia y ventana Acerca de.
- Interfaz adaptable a escritorio, tableta y móvil.
- Despliegue automático a GitHub Pages desde `main`.
