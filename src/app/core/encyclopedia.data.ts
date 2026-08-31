export type EncyclopediaDiagram =
  | 'structure'
  | 'valence'
  | 'lewis'
  | 'bonds'
  | 'stereo'
  | 'resonance'
  | 'interactions'
  | 'rings'
  | 'formula'
  | 'smiles'
  | 'reaction'
  | 'geometry'
  | 'validation'
  | 'workflow'
  | 'functional-groups'
  | 'biomolecules'
  | 'identification'
  | 'glossary';

export interface EncyclopediaSource {
  label: string;
  url: string;
}

export interface EncyclopediaSection {
  title: string;
  paragraphs: string[];
  points?: string[];
  example?: string;
}

export interface EncyclopediaChapter {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  summary: string;
  readTime: number;
  diagram: EncyclopediaDiagram;
  sections: EncyclopediaSection[];
  sources: EncyclopediaSource[];
}

const iupac = (path: string) => `https://goldbook.iupac.org/terms/view/${path}`;

export const ENCYCLOPEDIA_CHAPTERS: ReadonlyArray<EncyclopediaChapter> = [
  {
    id: 'leer-estructura',
    number: '01',
    title: 'Cómo leer una estructura química',
    eyebrow: 'Punto de partida',
    summary:
      'Una estructura no es una fotografía: es un lenguaje gráfico que resume qué átomos hay, cómo están unidos y qué información se ha decidido omitir.',
    readTime: 7,
    diagram: 'structure',
    sections: [
      {
        title: 'Átomos, enlaces y convenciones',
        paragraphs: [
          'Cada símbolo representa un elemento. C es carbono, O oxígeno y Cl cloro; la mayúscula y la minúscula importan. Las líneas representan enlaces o interacciones, pero su aspecto cambia el significado: una, dos o tres líneas indican orden de enlace; una cuña aporta orientación espacial; una línea discontinua puede indicar deslocalización o una interacción no covalente.',
          'En la notación esquelética, muy usada en química orgánica, muchos carbonos no se escriben. Cada vértice y extremo sin símbolo es un carbono, y los hidrógenos unidos a él se deducen hasta completar la valencia. Molecular puede mostrar esos hidrógenos implícitos para facilitar el aprendizaje o esconderlos para obtener un esquema profesional más limpio.',
        ],
        points: [
          'El símbolo identifica el elemento; el subíndice de una fórmula indica cuántos hay.',
          'La conectividad dice quién está unido a quién; la geometría 2D no siempre es la geometría real.',
          'Carga, radicales, isótopos y pares libres son anotaciones del átomo, no nuevos átomos.',
        ],
      },
      {
        title: 'Lo explícito y lo implícito',
        paragraphs: [
          'Una H dibujada es explícita: forma parte del documento como nodo independiente. Una H calculada es implícita: se infiere a partir del elemento, la carga y la suma de órdenes de enlace. Ambas cuentan para la fórmula y la masa, pero solo la primera tiene coordenadas 2D propias.',
          'No toda información química cabe en un dibujo. Una estructura puede no especificar estereoquímica, protonación, estado electrónico, conformación o condiciones de reacción. La ausencia de un símbolo significa “no indicado”, no necesariamente “imposible”.',
        ],
        example:
          'En etanol, CH₃–CH₂–OH, el dibujo puede mostrar solo C–C–O; los seis H de los carbonos y el H del oxígeno se infieren.',
      },
      {
        title: 'Método de lectura en cuatro preguntas',
        paragraphs: [
          'Empieza por identificar los componentes desconectados. Después sigue los enlaces como si recorrieras un mapa. Revisa cargas y electrones no enlazantes, y solo entonces interpreta la forma espacial. Este orden evita confundir una elección de maquetación con una propiedad molecular.',
        ],
        points: [
          '¿Qué elementos y cuántos componentes hay?',
          '¿Cuál es la conectividad y el orden de cada enlace?',
          '¿Dónde están las cargas, pares libres y electrones desapareados?',
          '¿Se especifica orientación 3D o solo un esquema plano?',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — bond', url: iupac('B00697') },
      { label: 'OpenSMILES — atoms and bonds', url: 'https://opensmiles.org/opensmiles.html' },
    ],
  },
  {
    id: 'atomo-valencia',
    number: '02',
    title: 'Electrones, valencia y octeto',
    eyebrow: 'Fundamentos',
    summary:
      'La valencia ayuda a estimar cuántos enlaces puede formar un átomo, pero no es una cifra universal ni una prohibición absoluta.',
    readTime: 9,
    diagram: 'valence',
    sections: [
      {
        title: 'Electrones de valencia',
        paragraphs: [
          'Los electrones de la capa externa participan de forma dominante en los enlaces. Para los elementos representativos, el grupo de la tabla periódica ofrece una primera pista: carbono suele aportar cuatro electrones de valencia, nitrógeno cinco, oxígeno seis y los halógenos siete.',
          'La regla del octeto describe la tendencia de muchos átomos de los periodos segundo y tercero a alcanzar una configuración con ocho electrones de valencia. Es una heurística extraordinariamente útil, no una ley sin excepciones: H busca un dueto; B puede quedar electrón-deficiente; especies radicalarias tienen un número impar; y elementos más pesados pueden presentar hipervalencia.',
        ],
      },
      {
        title: 'Valencia no es carga ni estado de oxidación',
        paragraphs: [
          'En el editor, la suma de órdenes de enlace es una comprobación local. Un carbono con cuatro enlaces simples suma 4; uno con un triple y un simple también suma 4. La carga formal contabiliza electrones en una estructura de Lewis, mientras que el estado de oxidación es una asignación formal que imagina enlaces completamente iónicos. Son conceptos distintos.',
          'Azufre no está limitado siempre a dos enlaces: aparece con estados de coordinación y oxidación diferentes. Por eso Molecular usa valencias habituales y advertencias conservadoras. Impide casos manifiestamente incompatibles con el modelo local, pero no pretende sustituir un cálculo de estructura electrónica.',
        ],
        example:
          'CH₄, CO₂ y HCN muestran carbono con suma de orden 4 mediante 4×simple, 2×doble y triple+simple, respectivamente.',
      },
      {
        title: 'Qué valida Molecular',
        paragraphs: [
          'La validación considera el elemento, la carga formal y los enlaces dibujados. Los enlaces de hidrógeno y otras interacciones se representan, pero no consumen valencia covalente como un enlace ordinario. Cuando una combinación queda fuera del catálogo fiable, se evita inventar hidrógenos implícitos y se conserva la estructura explícita para que el usuario la revise.',
        ],
        points: [
          'Una advertencia señala una representación improbable, no demuestra que una especie sea inexistente.',
          'La coordinación de metales, la hipervalencia y estados excitados requieren modelos más avanzados.',
          'La base de datos guarda valencias habituales; la literatura química manda sobre la heurística.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — valence', url: iupac('V06588') },
      { label: 'IUPAC Gold Book — oxidation state', url: iupac('O04365') },
    ],
  },
  {
    id: 'lewis',
    number: '03',
    title: 'Lewis: cargas, pares libres y radicales',
    eyebrow: 'Electrones visibles',
    summary:
      'Las estructuras de Lewis hacen visibles los electrones de valencia: pares compartidos en enlaces y electrones no enlazantes alrededor de los átomos.',
    readTime: 10,
    diagram: 'lewis',
    sections: [
      {
        title: 'Carga formal',
        paragraphs: [
          'La carga formal compara los electrones de valencia del átomo neutro con los que se le asignan en una estructura: electrones no enlazantes completos y la mitad de los electrones enlazantes. Es una herramienta contable. No afirma que la carga real esté localizada exactamente en ese átomo.',
          'Al modificar una carga, también cambia la valencia compatible y por tanto el número de hidrógenos que puede inferirse. Ese ajuste no debe oscilar caprichosamente: si Molecular no dispone de una regla fiable para una carga poco habitual, muestra cero hidrógenos implícitos en vez de aplicar la valencia neutra.',
        ],
        example:
          'En NH₄⁺, N tiene cuatro enlaces, ningún par libre y carga formal +1. En NH₃, tiene tres enlaces y un par libre.',
      },
      {
        title: 'Pares libres',
        paragraphs: [
          'Un par libre son dos electrones de valencia no compartidos en un enlace. Influye en geometría, basicidad, polaridad y reactividad. En los dibujos aparece como dos puntos. El oxígeno neutro del agua se representa habitualmente con dos pares libres; el nitrógeno del amoníaco, con uno.',
          'Los botones − y + permiten retirar o añadir pares explícitos. Molecular limita la cantidad representable para mantener una notación legible, pero el valor no debe usarse como licencia para construir cualquier configuración electrónica. La validación detallada depende del estado electrónico completo.',
        ],
      },
      {
        title: 'Radicales',
        paragraphs: [
          'Un radical contiene al menos un electrón desapareado y suele marcarse con un punto único. No es lo mismo que una carga: puede existir un radical neutro, un radical catión o un radical anión. Muchos radicales son muy reactivos, aunque algunos están estabilizados por deslocalización o impedimento estérico.',
          'Molecular separa radicales, pares libres, carga e hidrógeno en posiciones angulares distintas. Esta decisión visual evita que una H tape electrones o que un enlace oculte la carga, tanto en el lienzo como en el SVG exportado.',
        ],
        points: [
          'Dos puntos juntos: un par libre.',
          'Un punto: un electrón desapareado o centro radicalario.',
          '+/− junto al símbolo: carga formal; el número indica su magnitud.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — formal charge', url: iupac('08169/html') },
      { label: 'IUPAC Gold Book — lone pair', url: iupac('L03618/pdf') },
      { label: 'IUPAC Gold Book — radical', url: iupac('R05066/pdf') },
    ],
  },
  {
    id: 'enlaces-covalentes',
    number: '04',
    title: 'Enlaces simple, doble y triple',
    eyebrow: 'Orden de enlace',
    summary:
      'El número de líneas resume cuántos pares de electrones se comparten en un modelo de Lewis y condiciona longitud, rigidez y geometría.',
    readTime: 8,
    diagram: 'bonds',
    sections: [
      {
        title: 'Enlace simple y enlace σ',
        paragraphs: [
          'Un enlace simple suele contener un enlace sigma, formado por solapamiento aproximadamente frontal de orbitales. Permite con frecuencia rotación alrededor del eje internuclear, aunque el entorno molecular puede impedirla o hacerla energéticamente costosa.',
          'Una sola línea no significa un enlace débil por definición. La fuerza depende de los átomos, el entorno electrónico, la polaridad y la geometría. Tampoco todas las distancias dibujadas en 2D codifican longitudes reales.',
        ],
      },
      {
        title: 'Dobles, triples y enlaces π',
        paragraphs: [
          'Un doble enlace se describe habitualmente como un enlace sigma más uno pi; un triple, como uno sigma más dos pi. Los componentes pi resultan del solapamiento lateral y restringen la rotación. Por eso un alqueno puede presentar estereoisomería E/Z.',
          'En una representación gráfica, las dos o tres líneas siguen siendo una sola entidad química. Al seleccionar un doble enlace en Molecular se edita el enlace completo: no tendría sentido cargar una de sus líneas visuales como si fuese un átomo independiente.',
        ],
        example: 'C–C en etano es simple; C=C en eteno es doble; C≡C en etino es triple.',
      },
      {
        title: 'Orden entero y orden efectivo',
        paragraphs: [
          'Los órdenes 1, 2 y 3 son esenciales para dibujar estructuras de Lewis, pero la distribución electrónica real puede producir órdenes fraccionarios o intermedios. En benceno, todos los enlaces C–C son equivalentes en la molécula real; alternar simples y dobles es una forma contribuyente, no una fotografía de enlaces que cambian de sitio.',
        ],
        points: [
          'Mayor orden suele correlacionarse con menor longitud y mayor energía de disociación dentro de una familia comparable.',
          'La resonancia y la deslocalización exigen interpretar el conjunto, no cada línea de forma aislada.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — bond order', url: iupac('B00701') },
      { label: 'IUPAC Gold Book — sigma bond', url: iupac('S05514') },
    ],
  },
  {
    id: 'estereoquimica',
    number: '05',
    title: 'Cuñas, trazos y estereoquímica',
    eyebrow: 'Del plano al espacio',
    summary:
      'Las cuñas no son enlaces nuevos: indican hacia qué lado del plano apunta un enlace y permiten distinguir configuraciones espaciales.',
    readTime: 9,
    diagram: 'stereo',
    sections: [
      {
        title: 'Arriba y abajo',
        paragraphs: [
          'Una cuña sólida suele señalar un enlace que sale del plano hacia quien observa. Una cuña rayada indica que se aleja detrás del plano. Una línea normal permanece en el plano o no especifica profundidad. Debe leerse el extremo ancho/estrecho según la convención aplicada.',
          'En Molecular, Arriba y Abajo codifican esa orientación en el enlace. El visor 3D la usa como restricción inicial, pero una estructura completa puede requerir un algoritmo estereoquímico y conformacional más sofisticado para preservar todos los centros simultáneamente.',
        ],
      },
      {
        title: 'Centro estereogénico',
        paragraphs: [
          'Un átomo tetraédrico unido a cuatro sustituyentes distinguibles puede ser estereogénico. Intercambiar dos sustituyentes puede producir un estereoisómero que no se superpone con el original. Las etiquetas R/S se asignan con reglas de prioridad CIP; no significan “derecha” e “izquierda” en el dibujo.',
          'SMILES usa @ y @@ para registrar una orientación local basada en el orden de vecinos de la cadena. Esa marca no debe interpretarse sin leer el orden del SMILES completo.',
        ],
        example:
          'N[C@@H](C)C(=O)O contiene una especificación quiral en el carbono marcado, además de ramas y un doble enlace.',
      },
      {
        title: 'Qué puede quedar indeterminado',
        paragraphs: [
          'Una línea ondulada o un enlace sin especificación puede comunicar estereoquímica desconocida, mezcla de configuraciones o falta deliberada de información. Indeterminado no equivale a enlace flexible: describe el grado de conocimiento del esquema.',
        ],
        points: [
          'Cuña sólida: orientación hacia delante.',
          'Cuña rayada: orientación hacia atrás.',
          'Línea normal: en el plano o sin profundidad especificada.',
          'Ondulada: configuración no determinada según el contexto.',
        ],
      },
    ],
    sources: [
      {
        label: 'IUPAC — graphical representation of stereochemistry',
        url: 'https://publications.iupac.org/pac/78/10/1897/index.html',
      },
      { label: 'OpenSMILES — chirality', url: 'https://opensmiles.org/opensmiles.html#chirality' },
    ],
  },
  {
    id: 'resonancia-aromaticidad',
    number: '06',
    title: 'Resonancia, deslocalización y aromaticidad',
    eyebrow: 'Electrones distribuidos',
    summary:
      'Cuando una sola estructura de Lewis no describe bien la distribución electrónica, varias formas contribuyentes representan un mismo híbrido.',
    readTime: 11,
    diagram: 'resonance',
    sections: [
      {
        title: 'La resonancia no es una reacción',
        paragraphs: [
          'Las formas de resonancia tienen la misma posición de núcleos y difieren en la colocación formal de electrones y enlaces múltiples. La molécula no oscila físicamente entre dibujos; la estructura real es un híbrido con deslocalización electrónica.',
          'Se usa una flecha de doble punta ↔ entre contribuyentes, no la flecha de equilibrio ⇌. Confundirlas sugiere de manera incorrecta que existen dos especies separadas que se interconvierten.',
        ],
      },
      {
        title: 'Enlace deslocalizado',
        paragraphs: [
          'El estilo deslocalizado permite comunicar que un enlace o una carga se extiende sobre varios centros. Es útil como convención didáctica, pero debe acompañarse de contexto: una línea discontinua también puede tener otros significados en distintas disciplinas.',
          'En carboxilato, los dos enlaces C–O resultan equivalentes aunque una forma de Lewis dibuje C=O y C–O⁻. En benceno, el sexteto pi se deslocaliza por el anillo.',
        ],
      },
      {
        title: 'Aromaticidad',
        paragraphs: [
          'La aromaticidad describe estabilización y propiedades asociadas a sistemas cíclicos conjugados. Para muchos sistemas sencillos se enseña la regla de Hückel, 4n+2 electrones pi, junto con ciclicidad, conjugación y una geometría adecuada. No basta con que una molécula tenga forma de hexágono.',
          'En SMILES, los átomos aromáticos del subconjunto habitual se escriben en minúscula, como c1ccccc1. Molecular distingue c aromático de C alifático y crea enlaces aromáticos por defecto entre dos átomos aromáticos adyacentes.',
        ],
        example:
          'O=C[O−] ↔ [O−]C=O representa contribuyentes del carboxilato; no dos moléculas en equilibrio.',
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — mesomeric effect', url: iupac('M03844') },
      { label: 'IUPAC Gold Book — aromaticity', url: iupac('A00442') },
    ],
  },
  {
    id: 'enlaces-especiales',
    number: '07',
    title: 'Dativo, puente de hidrógeno e interacciones',
    eyebrow: 'Más allá de una línea',
    summary:
      'Una flecha sobre un enlace puede indicar el origen del par electrónico; puntos o trazos pueden representar atracciones que no son enlaces covalentes ordinarios.',
    readTime: 9,
    diagram: 'interactions',
    sections: [
      {
        title: 'Enlace coordinado o dativo',
        paragraphs: [
          'En un enlace dativo, los dos electrones del enlace formal proceden inicialmente del mismo participante. Se representa a menudo con una flecha desde el donante hacia el aceptor. Una vez formado, no es una categoría física totalmente separada de otros enlaces covalentes; la notación conserva información sobre el modelo de formación o reparto electrónico.',
          'Es frecuente en química de coordinación y en aductos ácido-base de Lewis. El sentido de la flecha importa: parte del par donante y apunta al centro aceptor.',
        ],
        example: 'NH₃→BF₃: el par libre del nitrógeno se dona al boro electrón-deficiente.',
      },
      {
        title: 'Puente de hidrógeno',
        paragraphs: [
          'Un enlace o puente de hidrógeno es una interacción atractiva en la que un H enlazado a un átomo o grupo electronegativo interactúa con otra región rica en electrones. Se dibuja normalmente con una línea de puntos. Es esencial en agua, proteínas y ácidos nucleicos.',
          'No debe contarse como orden de enlace covalente al validar la valencia del átomo. Puede variar desde interacciones débiles a casos con carácter covalente apreciable; la geometría donante–H···aceptor es informativa.',
        ],
      },
      {
        title: 'Convenciones y límites',
        paragraphs: [
          'Líneas punteadas también se usan para contactos, coordinación parcial o enlaces en formación y ruptura. El título, la leyenda y el campo científico determinan el significado. Molecular asigna estilos explícitos para reducir la ambigüedad y los explica en esta enciclopedia.',
        ],
        points: [
          'Dativo: flecha del donante de par hacia el aceptor.',
          'Hidrógeno: interacción X–H···Y, normalmente punteada.',
          'Indeterminado: relación química conocida sin orden o estereoquímica definidos.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — dative bond', url: iupac('D01523') },
      { label: 'IUPAC Gold Book — hydrogen bond', url: iupac('H02899/pdf') },
    ],
  },
  {
    id: 'anillos-fragmentos',
    number: '08',
    title: 'Anillos, ciclos y fragmentos',
    eyebrow: 'Geometría recurrente',
    summary:
      'Ciclopropano, ciclobutano y ciclohexano nombran anillos de carbono; el polígono 2D es una abreviatura de una geometría espacial que rara vez es plana.',
    readTime: 9,
    diagram: 'rings',
    sections: [
      {
        title: 'Qué significa “ciclo”',
        paragraphs: [
          'Un ciclo aparece cuando un recorrido de enlaces vuelve al átomo inicial. Ciclopropano tiene tres carbonos, ciclobutano cuatro, ciclopentano cinco, ciclohexano seis y ciclooctano ocho. En el lienzo se insertan como polígonos regulares para editar con comodidad.',
          'El polígono no garantiza planaridad. Ciclopropano está forzado a ángulos pequeños y presenta tensión; ciclobutano se pliega; ciclohexano prefiere conformaciones como silla, que reducen tensión angular y torsional.',
        ],
      },
      {
        title: 'Benceno no es ciclohexano con tres dobles fijos',
        paragraphs: [
          'Ambos tienen seis carbonos, pero ciclohexano está saturado y benceno es aromático. Los dobles alternos son una forma convencional de dibujar benceno; un círculo interior o enlaces aromáticos también comunican deslocalización.',
          'La herramienta Benceno crea conectividad y órdenes alternos compatibles con una representación de Kekulé. El visor 3D construye una topología y coloca los H hacia las regiones libres alrededor del anillo para evitar que queden incrustados en los carbonos.',
        ],
      },
      {
        title: 'Cadenas y ramificaciones',
        paragraphs: [
          'Una cadena carbonada es una secuencia abierta. Puede ser lineal en conectividad aunque el dibujo zigzaguee. Las ramas se escriben como enlaces laterales; no cambian el hecho de que cada átomo sea una entidad única.',
        ],
        points: [
          'Triángulo: ciclo de tres miembros, no necesariamente tres dobles.',
          'Hexágono simple: puede representar ciclohexano si todos los enlaces son simples.',
          'Hexágono aromático: benceno u otro anillo aromático según sustituyentes.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — ring', url: iupac('R05399') },
      { label: 'IUPAC Gold Book — conformation', url: iupac('C01258') },
    ],
  },
  {
    id: 'formulas-isomeria',
    number: '09',
    title: 'Fórmula, conectividad e isomería',
    eyebrow: 'Tres niveles de descripción',
    summary:
      'La misma fórmula molecular puede corresponder a estructuras diferentes; para reconstruir una molécula hace falta información de conectividad y, a veces, estereoquímica.',
    readTime: 8,
    diagram: 'formula',
    sections: [
      {
        title: 'Qué dice una fórmula molecular',
        paragraphs: [
          'C₂H₆O enumera dos carbonos, seis hidrógenos y un oxígeno. Permite calcular masa molar y composición, pero no especifica el orden de conexión. Puede corresponder a etanol o dimetil éter, que tienen propiedades distintas.',
          'Por ello, el generador de fórmula construye una propuesta razonable, no una solución única. Molecular avisa de la ambigüedad cuando solo recibe una fórmula molecular.',
        ],
      },
      {
        title: 'Fórmula desarrollada y condensada',
        paragraphs: [
          'Una fórmula desarrollada dibuja cada enlace; una semidesarrollada agrupa unidades como CH₃; una condensada escribe secuencias como CH₃CH₂OH. Cada formato equilibra detalle y legibilidad.',
          'SMILES añade reglas precisas para ramas, ciclos, cargas y estereoquímica, de modo que una cadena de texto pueda conservar conectividad de manera mucho menos ambigua.',
        ],
      },
      {
        title: 'Isómeros',
        paragraphs: [
          'Los isómeros constitucionales comparten fórmula y difieren en conectividad. Los estereoisómeros comparten conectividad y difieren en disposición espacial. Los confórmeros se interconvierten por rotaciones y movimientos sin romper la conectividad.',
        ],
        example: 'C₂H₆O → etanol (CH₃CH₂OH) o dimetil éter (CH₃OCH₃). La fórmula sola no decide.',
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — molecular formula', url: iupac('M03986') },
      { label: 'IUPAC Gold Book — isomer', url: iupac('I03289') },
    ],
  },
  {
    id: 'smiles',
    number: '10',
    title: 'SMILES de principio a fin',
    eyebrow: 'Estructuras como texto',
    summary:
      'SMILES recorre un grafo molecular: escribe átomos, usa paréntesis para ramas, números para cerrar anillos y símbolos para enlaces o estereoquímica.',
    readTime: 14,
    diagram: 'smiles',
    sections: [
      {
        title: 'Átomos y sensibilidad a mayúsculas',
        paragraphs: [
          'C es carbono alifático y c es carbono aromático. N/n, O/o, P/p y S/s conservan la misma distinción cuando la gramática permite la forma aromática. Cl y Br son símbolos de dos letras; en cambio Cc significa un C alifático seguido de un c aromático, no un elemento “Cc”.',
          'Los átomos del subconjunto orgánico pueden escribirse sin corchetes. Los casos con isótopo, carga, hidrógeno explícito, quiralidad o elementos menos comunes se expresan entre corchetes: [13CH3−], [NH4+], [C@@H].',
        ],
      },
      {
        title: 'Enlaces, ramas y anillos',
        paragraphs: [
          'La yuxtaposición implica normalmente enlace simple o aromático según los átomos. -, =, #, : y ~ especifican simple, doble, triple, aromático o cualquiera. Los paréntesis vuelven al átomo anterior para abrir una rama. Un dígito repetido conecta dos posiciones y cierra un anillo; %10 permite índices de dos cifras y %(123) una forma ampliada.',
          'Un punto separa componentes desconectados, como un ion positivo y su contraión. Las barras / y \\ expresan direcciones relativas en dobles enlaces. @ y @@ registran quiralidad local dependiente del orden de vecinos.',
        ],
        example:
          'CC(=O)O es ácido acético; c1ccccc1 es benceno; C1CCCCC1 es ciclohexano; [Na+].[Cl−] son dos componentes.',
      },
      {
        title: 'Qué acepta el generador',
        paragraphs: [
          'El analizador local de Molecular admite el subconjunto orgánico, aromáticos habituales, ramas anidadas, cierres de anillo simples y extendidos, cargas, isótopos, H explícitos, @/@@ y varios tipos de enlace. Conserva la conectividad sin enviar datos a un servidor.',
          'SMILES tiene dialectos y extensiones. Un texto producido por otra herramienta puede incluir consultas SMARTS, CXSMILES, clases quirales avanzadas o metadatos no cubiertos. El editor informa de la posición del problema en vez de reinterpretarlo silenciosamente.',
        ],
        points: [
          'Mayúscula/minúscula es semántica, no estilo.',
          'Los números conectan; no cuentan átomos.',
          'Los paréntesis crean ramas; el punto separa componentes.',
          'Un SMILES válido no contiene por sí solo una conformación 3D única.',
        ],
      },
    ],
    sources: [
      { label: 'OpenSMILES specification', url: 'https://opensmiles.org/opensmiles.html' },
      {
        label: 'Daylight — SMILES theory',
        url: 'https://www.daylight.com/dayhtml/doc/theory/theory.smiles.html',
      },
    ],
  },
  {
    id: 'flechas',
    number: '11',
    title: 'Reacciones, resonancia y equilibrio',
    eyebrow: 'El significado de las flechas',
    summary:
      'Una flecha conecta estados o ideas químicas. Su forma distingue transformación, resonancia y equilibrio; no es una decoración intercambiable.',
    readTime: 8,
    diagram: 'reaction',
    sections: [
      {
        title: 'Flecha de reacción →',
        paragraphs: [
          'Separa reactivos y productos y señala el sentido en que se presenta la transformación. Encima y debajo pueden escribirse reactivos auxiliares, catalizadores, disolvente, temperatura, luz o tiempo. No afirma por sí sola que la conversión sea completa o irreversible.',
          'Las flechas curvas de mecanismo tienen otro papel: muestran movimiento formal de pares de electrones o de un electrón. La versión actual de Molecular incluye flechas de esquema; una capa mecanística avanzada pertenece al roadmap.',
        ],
      },
      {
        title: 'Resonancia ↔',
        paragraphs: [
          'Une formas contribuyentes de una misma especie. No deben moverse átomos ni romperse enlaces sigma; cambia la contabilidad de electrones, cargas y enlaces pi. Las formas no se encuentran como sustancias separadas en un recipiente.',
        ],
      },
      {
        title: 'Equilibrio ⇌',
        paragraphs: [
          'Representa procesos directo e inverso que ocurren simultáneamente. En equilibrio macroscópico, las velocidades se igualan, pero las concentraciones de ambos lados no tienen por qué ser iguales. La longitud desigual de las semiflechitas puede usarse informalmente para sugerir qué lado está favorecido.',
        ],
        points: [
          '→ transformación presentada de reactivos a productos.',
          '↔ formas de resonancia de una misma entidad.',
          '⇌ especies que se interconvierten en equilibrio dinámico.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — chemical reaction', url: iupac('C01033/pdf') },
      { label: 'IUPAC Gold Book — chemical equilibrium', url: iupac('C01023') },
    ],
  },
  {
    id: 'geometria-3d',
    number: '12',
    title: 'Geometría molecular y visor 3D',
    eyebrow: 'Topología convertida en espacio',
    summary:
      'El 3D no consiste en levantar el dibujo plano: hay que proponer ángulos, longitudes, conformación y orientación de hidrógenos compatibles con la conectividad.',
    readTime: 12,
    diagram: 'geometry',
    sections: [
      {
        title: 'VSEPR como primera aproximación',
        paragraphs: [
          'El modelo VSEPR organiza dominios electrónicos alrededor de un centro para reducir repulsiones. Dos dominios sugieren geometría lineal, tres trigonal plana y cuatro tetraédrica. Los pares libres ocupan espacio y modifican ángulos, de modo que la forma molecular no siempre coincide con la geometría electrónica.',
          'Es un modelo cualitativo, especialmente útil para elementos representativos. Metales de transición, deslocalización extensa y especies electrónicamente complejas requieren teorías más completas.',
        ],
      },
      {
        title: 'Topología frente a conformación',
        paragraphs: [
          'La conectividad define el grafo. Una conformación añade coordenadas 3D, y puede haber muchas para el mismo grafo. Molecular genera una disposición didáctica mediante longitudes covalentes, separación estérica, información de cuñas y direcciones que maximizan el espacio libre alrededor de cada átomo.',
          'Los hidrógenos implícitos se sitúan después de los átomos explícitos. El algoritmo compara direcciones ocupadas y escoge las más separadas, lo que hace que los H del benceno apunten hacia fuera del anillo en lugar de quedar dentro del carbono vecino.',
        ],
      },
      {
        title: 'Representaciones visuales',
        paragraphs: [
          'Bolas y varillas resalta átomos y conectividad; licorice engrosa enlaces y reduce las esferas; relleno espacial aproxima el volumen de van der Waals; varillas prioriza el esqueleto; alambre reduce carga gráfica. Cambiar de representación no cambia la molécula.',
          'Una geometría generada localmente debe verse como hipótesis de visualización, no como estructura optimizada cuánticamente. Para investigación pueden consultarse conformeros experimentales o calculados, por ejemplo mediante PubChem3D.',
        ],
        points: [
          'El 2D comunica topología con claridad.',
          'El 3D generado propone una geometría legible.',
          'Una estructura validada experimentalmente requiere una fuente o cálculo apropiado.',
        ],
      },
    ],
    sources: [
      { label: 'PubChem3D documentation', url: 'https://pubchem.ncbi.nlm.nih.gov/docs/pubchem3d' },
      {
        label: 'PubChem 3D Structure Viewer',
        url: 'https://pubchem.ncbi.nlm.nih.gov/docs/3d-structure-viewer',
      },
    ],
  },
  {
    id: 'validacion',
    number: '13',
    title: 'Validación: qué puede comprobar un editor',
    eyebrow: 'Pensamiento crítico',
    summary:
      'Una comprobación de valencia detecta muchos errores de dibujo, pero no demuestra estabilidad, existencia, pureza ni seguridad de una sustancia.',
    readTime: 9,
    diagram: 'validation',
    sections: [
      {
        title: 'Comprobaciones deterministas',
        paragraphs: [
          'El editor puede impedir enlaces duplicados incompatibles, contar órdenes de enlace, comparar con valencias habituales, verificar cierres de anillo y mantener consistencia entre fórmula, masa y grafo. Estas comprobaciones son rápidas, reproducibles y funcionan sin red.',
          'También puede detectar anotaciones fuera de los límites de interfaz, referencias a átomos inexistentes o sintaxis SMILES incompleta. Son errores de documento, no debates sobre teoría química.',
        ],
      },
      {
        title: 'Zonas que exigen cautela',
        paragraphs: [
          'Hipervalencia, compuestos organometálicos, enlaces multicéntricos, aromaticidad no clásica, estados excitados, tautomería y protonación dependiente del medio no se resuelven con una tabla corta de valencias. Bloquear todo lo inusual produciría falsos negativos; aceptar todo produciría estructuras absurdas.',
          'Molecular aplica una política conservadora: evita sobrevalencias inequívocas en el modelo disponible, marca lo dudoso y no inventa H cuando la carga no tiene una regla definida. La enciclopedia explica por qué aparece cada advertencia.',
        ],
      },
      {
        title: 'Seguridad y significado',
        paragraphs: [
          'Dibujar una estructura no ofrece instrucciones de síntesis ni evaluación de riesgos. Reactividad, toxicidad, inflamabilidad y manipulación necesitan fichas de datos, literatura fiable y formación profesional. Una molécula gráficamente válida puede ser inestable o peligrosa.',
        ],
        points: [
          'Válido sintácticamente ≠ químicamente estable.',
          'Valencia habitual ≠ única química posible.',
          'Modelo 3D legible ≠ geometría experimental.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — coordination number', url: iupac('C01331') },
      { label: 'PubChem PUG REST', url: 'https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest' },
    ],
  },
  {
    id: 'tutorial-molecular',
    number: '14',
    title: 'Tutorial práctico de Molecular',
    eyebrow: 'Del lienzo a la exportación',
    summary:
      'Un recorrido completo por selección, construcción, anotación, 3D y salida vectorial, con decisiones que mantienen el documento editable.',
    readTime: 10,
    diagram: 'workflow',
    sections: [
      {
        title: 'Construir',
        paragraphs: [
          'Elige Átomo y selecciona un elemento rápido o abre la tabla periódica completa. Pulsa en un espacio vacío para colocarlo. Elige Enlace, selecciona tipo y color y arrastra entre átomos; también puedes colocar un enlace autónomo y sustituir después sus extremos A y B.',
          'Los fragmentos insertan anillos o cadenas como punto de partida. Selección directa elige una entidad; Rectángulo y Lazo agrupan átomos. La rueda del ratón amplía alrededor del puntero y el gesto de pinza hace lo mismo en móvil.',
        ],
      },
      {
        title: 'Editar con precisión',
        paragraphs: [
          'Al seleccionar un átomo, el inspector ofrece elemento, carga, pares libres y radicales con controles −/+. Al seleccionar un enlace, aparece un inspector distinto: modifica tipo y color del enlace y muestra dos microsecciones A/B para editar cada extremo sin afectar accidentalmente al otro.',
          'El menú contextual reúne acciones equivalentes con clic derecho. Deshacer y rehacer pertenecen a la barra de herramientas porque modifican el documento, no la configuración global.',
        ],
      },
      {
        title: 'Comprobar y comunicar',
        paragraphs: [
          'Activa hidrógenos implícitos, avisos de valencia o modo esquelético desde Capas. Abre 3D para inspeccionar topología y alterna bolas-varillas, licorice, relleno, varillas y alambre. La X está en la misma barra de acciones del visor y siempre cierra el panel.',
          'Exporta SVG para conservar calidad vectorial o PNG para uso inmediato. El SVG distribuye H, carga y electrones con el mismo algoritmo del lienzo. Guarda JSON para recuperar la editabilidad completa.',
        ],
        points: [
          'Guarda JSON como documento maestro.',
          'Usa SVG para Atlas Editor, impresión o escalado.',
          'Consulta las advertencias antes de interpretar la fórmula estimada.',
        ],
      },
    ],
    sources: [
      { label: 'MolView — features', url: 'https://molview.com/features/' },
      { label: 'OpenSMILES specification', url: 'https://opensmiles.org/opensmiles.html' },
    ],
  },
  {
    id: 'grupos-funcionales',
    number: '15',
    title: 'Grupos funcionales y reactividad local',
    eyebrow: 'Patrones dentro de una molécula',
    summary:
      'Un grupo funcional es un patrón de átomos y enlaces que permite comparar familias químicas y anticipar parte de su comportamiento sin reducir toda la molécula a una etiqueta.',
    readTime: 14,
    diagram: 'functional-groups',
    sections: [
      {
        title: 'Qué reconoce el laboratorio',
        paragraphs: [
          'Molecular busca patrones explícitos de conectividad. Alcohol y fenol contienen O–H, pero en el fenol el oxígeno está unido a un sistema aromático. Aldehído y cetona contienen carbonilo; el aldehído conserva al menos un H en el carbono carbonílico. Ácido carboxílico, éster y amida comparten un carbonilo unido a O u N, pero sus propiedades y reactividad no son intercambiables.',
          'Amina, nitrilo, alqueno, alquino, haluro, tiol y anillo aromático completan el repertorio local inicial. Una molécula puede contener varios grupos, grupos solapados o motivos cuya clasificación depende del contexto. El resultado es una ayuda de lectura, no un nombre IUPAC automático.',
        ],
        points: [
          'Alcohol R–OH; fenol Ar–OH; éter R–O–R.',
          'Aldehído R–CHO; cetona R–CO–R; ácido R–CO₂H.',
          'Éster R–CO₂R; amida R–CONR₂; amina deriva formalmente de NH₃.',
          'C=C es alqueno; C≡C es alquino; C≡N es nitrilo.',
        ],
      },
      {
        title: 'Cómo interpretar un resultado',
        paragraphs: [
          'Selecciona el resultado para iluminar exactamente los átomos y enlaces que forman el patrón. El botón de libro abre este capítulo sin perder la estructura. Si un grupo esperado no aparece, revisa el orden de enlace, la carga y si el hidrógeno es explícito o puede inferirse con la valencia actual.',
          'Los grupos funcionales orientan sobre polaridad, acidez, basicidad e interacciones, pero el entorno modifica esas tendencias. Resonancia, efectos inductivos, impedimento estérico, disolvente y protonación pueden cambiar profundamente el comportamiento.',
        ],
        example:
          'La aspirina contiene un ácido carboxílico y un éster. El paracetamol contiene un fenol y una amida. La biblioteca permite añadir ambos y comparar el reconocimiento.',
      },
      {
        title: 'Límites del reconocimiento local',
        paragraphs: [
          'La tautomería, los complejos metálicos, grupos organoborados u organofosforados, estados de protonación alternativos y patrones de consulta tipo SMARTS requieren motores más amplios. Molecular declara sus coincidencias sobre el grafo dibujado y evita presentar una heurística como identificación experimental.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — functional group', url: iupac('F02555') },
      { label: 'IUPAC Blue Book', url: 'https://iupac.org/what-we-do/books/color-books/bluebook/' },
    ],
  },
  {
    id: 'biomoleculas-biblioteca',
    number: '16',
    title: 'Biomoléculas, protectores y biblioteca estructural',
    eyebrow: 'Fragmentos reutilizables',
    summary:
      'La biblioteca reúne estructuras editables para comparar familias biológicas, fragmentos de síntesis y principios activos sin convertir el catálogo en una colección de imágenes cerradas.',
    readTime: 13,
    diagram: 'biomolecules',
    sections: [
      {
        title: 'Aminoácidos, azúcares y nucleótidos',
        paragraphs: [
          'Los α-aminoácidos proteinogénicos comparten un carbono unido a grupo amino, carboxilo, H y cadena lateral. La cadena lateral diferencia glicina, alanina, valina, leucina, serina o fenilalanina. A pH fisiológico suelen representarse como zwitteriones, mientras que la biblioteca usa inicialmente una forma neutra editable para que carga y protonación puedan estudiarse de manera explícita.',
          'Los azúcares combinan varios alcoholes y un carbonilo o un enlace hemiacetal/acetal al ciclar. Dos moléculas con fórmula C₆H₁₂O₆ pueden ser glucosa o fructosa y presentar conectividad o estereoquímica diferentes. Los nucleótidos incorporan base nitrogenada, pentosa y uno o más fosfatos; ATP no es simplemente una molécula grande de adenina, sino un nucleósido trifosfato.',
        ],
      },
      {
        title: 'Lípidos y grado de insaturación',
        paragraphs: [
          'Un ácido graso posee una cadena hidrocarbonada y un ácido carboxílico. C16:0 indica dieciséis carbonos y ninguna insaturación; C18:1, dieciocho carbonos y un doble enlace. La posición y geometría cis/trans no quedan determinadas por esa abreviatura, por lo que deben conservarse en la estructura o en un identificador inequívoco.',
          'Triacetina ofrece un ejemplo compacto del motivo triéster de un triacilglicérido. Los lípidos reales abarcan además fosfolípidos, esfingolípidos, esteroles y muchas otras clases que podrán añadirse sin cambiar el formato del catálogo.',
        ],
      },
      {
        title: 'Grupos protectores y punto R',
        paragraphs: [
          'Un grupo protector modifica temporalmente una función para controlar selectividad. Boc, Cbz y Fmoc se asocian especialmente con aminas; bencilo, acetilo y TBDMS se usan en contextos de alcoholes y otras funciones. La R violeta de Molecular es un punto de conexión genérico: debe sustituirse o enlazarse al sustrato correspondiente.',
          'La presencia de un fragmento en la biblioteca no constituye una recomendación de síntesis ni instrucciones de laboratorio. Condiciones, compatibilidad, seguridad y retirada del protector requieren fuentes especializadas.',
        ],
        points: [
          'Pulsa + para añadir una estructura junto a lo que ya existe.',
          'Usa el buscador por nombre, abreviatura, fórmula o familia.',
          'Cada ficha enlaza una referencia externa y conserva un SMILES editable.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — nucleotide', url: iupac('N04259') },
      { label: 'PubChem documentation', url: 'https://pubchem.ncbi.nlm.nih.gov/docs/' },
      { label: 'IUPAC Blue Book', url: 'https://iupac.org/what-we-do/books/color-books/bluebook/' },
    ],
  },
  {
    id: 'identificacion-estructural',
    number: '17',
    title: 'Identificación estructural y similitud',
    eyebrow: 'De un grafo a un posible nombre',
    summary:
      'Reconocer una estructura significa comparar grafos, cargas y estereoquímica; sugerir una molécula parecida es una operación distinta y debe expresarse con incertidumbre.',
    readTime: 12,
    diagram: 'identification',
    sections: [
      {
        title: 'Coincidencia exacta de conectividad',
        paragraphs: [
          'El identificador local toma el componente conectado que contiene el átomo seleccionado. Si hay varios átomos seleccionados, utiliza exactamente ese subgrafo. Compara número y tipo de átomos, carga, hidrógenos implícitos, vecinos y clases de enlace mediante una búsqueda de isomorfismo: la posición en el lienzo y los identificadores internos no afectan al resultado.',
          'La etiqueta “exacta” de Molecular significa exacta respecto a la representación almacenada en su biblioteca. No demuestra pureza, concentración, conformación experimental ni identidad de una muestra material.',
        ],
      },
      {
        title: 'Similitud y falsos amigos',
        paragraphs: [
          'Cuando no existe isomorfismo, se comparan rasgos del grafo: recuentos de elementos, pares de átomos enlazados, órdenes, grupos funcionales, anillos y carga. La proporción de rasgos compartidos produce una clasificación orientativa. Un porcentaje alto puede reflejar un esqueleto común sin que ambos compuestos tengan la misma actividad o seguridad.',
          'Isómeros constitucionales pueden compartir fórmula; estereoisómeros pueden compartir conectividad; tautómeros y estados de protonación pueden variar con el medio. Por eso el panel distingue coincidencia de conectividad y posible coincidencia, y enlaza la fuente para continuar la comprobación.',
        ],
        example:
          'Etanol y dimetil éter comparten C₂H₆O, pero no el mismo grafo. L-alanina y D-alanina comparten conectividad, pero difieren en configuración espacial.',
      },
      {
        title: 'Cómo usar el identificador',
        paragraphs: [
          'Selecciona un átomo del componente que quieras analizar y abre Laboratorio científico → Identificar. Usa Localizar para comprobar el ámbito real. Una coincidencia puede añadirse como copia editable para compararla sin reemplazar el original.',
        ],
        points: [
          'Nombre sugerido no equivale a identificación experimental.',
          'La estereoquímica ausente debe constar como no especificada.',
          'Espectroscopía, cromatografía y datos de referencia resuelven preguntas que un dibujo no puede.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book — molecular structure', url: iupac('M04007') },
      { label: 'PubChem structure search', url: 'https://pubchem.ncbi.nlm.nih.gov/search/' },
      { label: 'PubChem PUG REST', url: 'https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest' },
    ],
  },
  {
    id: 'glosario-fuentes',
    number: '18',
    title: 'Glosario y rutas para seguir aprendiendo',
    eyebrow: 'Mapa de consulta',
    summary:
      'Definiciones breves para volver al trabajo rápidamente y fuentes primarias para profundizar sin depender de explicaciones anónimas.',
    readTime: 8,
    diagram: 'glossary',
    sections: [
      {
        title: 'Vocabulario esencial A–E',
        paragraphs: [
          'Aromaticidad: estabilización y comportamiento característicos de ciertos sistemas cíclicos conjugados. Átomo explícito: nodo escrito y posicionable. Átomo implícito: entidad inferida por reglas de notación. Conectividad: relación de vecinos del grafo. Conformación: disposición espacial accesible sin cambiar conectividad. Enlace: interacción que mantiene entidades químicas asociadas según un modelo definido.',
        ],
      },
      {
        title: 'Vocabulario F–R',
        paragraphs: [
          'Fórmula molecular: recuento de elementos. Isómero: especie con la misma fórmula que otra y distinta estructura. Orden de enlace: índice del carácter enlazante entre dos centros. Par libre: par de electrones de valencia no enlazante. Radical: entidad con uno o más electrones desapareados. Resonancia: representación conjunta mediante varias estructuras contribuyentes.',
        ],
      },
      {
        title: 'Vocabulario S–V y fuentes',
        paragraphs: [
          'SMILES: lenguaje lineal para describir grafos moleculares. Estereoquímica: estudio de la disposición espacial y sus consecuencias. Valencia: capacidad o patrón de combinación definido según el contexto químico. VSEPR: modelo cualitativo de repulsión entre dominios electrónicos.',
          'Para definiciones normativas, empieza por el Gold Book de IUPAC. Para SMILES consulta OpenSMILES y la documentación de Daylight. Para estructuras y conformeros, PubChem documenta tanto sus datos 3D como el acceso programático. Molecular enlaza cada capítulo con sus fuentes específicas.',
        ],
        points: [
          'Usa el buscador para localizar un término dentro de títulos, resúmenes y texto.',
          'Sigue la fuente de cada capítulo cuando necesites una definición normativa.',
          'Distingue siempre convención de dibujo, modelo químico y dato experimental.',
        ],
      },
    ],
    sources: [
      { label: 'IUPAC Gold Book', url: 'https://goldbook.iupac.org/' },
      { label: 'OpenSMILES', url: 'https://opensmiles.org/opensmiles.html' },
      { label: 'PubChem documentation', url: 'https://pubchem.ncbi.nlm.nih.gov/docs/' },
    ],
  },
];
