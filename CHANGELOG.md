# Historial de versiones

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
