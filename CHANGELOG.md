# Historial de versiones

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
