# Roadmap de Molecular

Este documento separa lo publicado de lo previsto. Las fechas no son compromisos: el orden refleja dependencia técnica y valor para el editor.

## 0.3.0 — Publicado

- Lienzo continuo con retícula triangular o de puntos.
- Enlaces autónomos y diez clases visibles.
- Grupo R, carga formal, pares solitarios, radicales y tres flechas de reacción.
- Selección directa, rectangular y por lazo; modo esquelético y limpieza local.
- Generación desde fórmula molecular y subconjunto SMILES.
- Geometría 3D topológica y cinco representaciones visuales.

## 0.4 — Mecanismos e interoperabilidad

- Flechas curvas de empuje electrónico con puntos de control editables.
- Etiquetas, corchetes, coeficientes, condiciones de reacción y objetos de texto.
- Importación y exportación SMILES, MOL y SDF con pruebas de ida y vuelta.
- Editor explícito de hidrógenos, isotopía y numeración de átomos.
- Portapapeles vectorial y contratos de intercambio iniciales con Atlas Editor.

## 0.5 — Química estructural

- Aromaticidad formal, estereoquímica tetraédrica y dobles enlaces E/Z.
- Grupos funcionales, abreviaturas químicas y plantillas ampliables.
- Normalización de enlaces, detección de anillos y limpieza 2D con restricciones químicas.
- Conformadores reales y propiedades verificadas mediante una fuente química externa opcional.

## 0.6 — Datos locales y cálculo opcional

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

Molecular 0.3 no realiza química cuántica, dinámica molecular, predicción de reacciones ni validación experimental. La geometría 3D actual es topológica y educativa; cualquier capacidad avanzada deberá indicar su método y procedencia.
