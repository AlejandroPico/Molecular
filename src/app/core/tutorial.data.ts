export type TutorialCheck =
  'triple-bond' | 'two-lone-pairs' | 'positive-charge' | 'aromatic-ring' | 'benzene-smiles';

export interface TutorialLesson {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  summary: string;
  objective: string;
  steps: string[];
  chapterId: string;
  check: TutorialCheck;
  starterSmiles?: string;
  starterName?: string;
  failureMessage: string;
}

export const TUTORIAL_LESSONS: ReadonlyArray<TutorialLesson> = [
  {
    id: 'bonds',
    number: '01',
    title: 'Órdenes de enlace',
    eyebrow: 'Simple · doble · triple',
    summary:
      'Convierte un doble enlace C=C en un triple enlace C≡C y observa cómo cambia la valencia.',
    objective: 'La estructura preparada debe contener un enlace triple entre los dos carbonos.',
    steps: [
      'Prepara el ejercicio para añadir eteno sin borrar tu trabajo.',
      'Selecciona Crear o editar enlace y elige Triple.',
      'Pulsa el enlace C=C del fragmento y vuelve aquí para comprobarlo.',
    ],
    chapterId: 'enlaces-covalentes',
    check: 'triple-bond',
    starterSmiles: 'C=C',
    starterName: 'Tutorial · órdenes de enlace',
    failureMessage: 'Todavía no hay un enlace triple dentro del fragmento del ejercicio.',
  },
  {
    id: 'lewis',
    number: '02',
    title: 'Pares libres de Lewis',
    eyebrow: 'Electrones no enlazantes',
    summary: 'Completa la representación de Lewis del oxígeno de una molécula de agua.',
    objective: 'El oxígeno preparado debe mostrar al menos dos pares de electrones solitarios.',
    steps: [
      'Prepara el ejercicio para añadir una molécula de agua.',
      'Selecciona el oxígeno y abre Cargas y electrones.',
      'Añade dos pares libres y comprueba el resultado.',
    ],
    chapterId: 'lewis',
    check: 'two-lone-pairs',
    starterSmiles: 'O',
    starterName: 'Tutorial · estructura de Lewis',
    failureMessage: 'El oxígeno del ejercicio aún no muestra dos pares solitarios.',
  },
  {
    id: 'charges',
    number: '03',
    title: 'Carga formal',
    eyebrow: 'Contabilidad electrónica',
    summary: 'Transforma el nitrógeno neutro del amoníaco en el centro de un ion amonio.',
    objective: 'El nitrógeno preparado debe tener carga formal +1.',
    steps: [
      'Prepara el ejercicio para añadir el nitrógeno del amoníaco.',
      'Selecciónalo y usa el control + de Carga.',
      'Observa el cambio de hidrógenos implícitos y verifica el objetivo.',
    ],
    chapterId: 'lewis',
    check: 'positive-charge',
    starterSmiles: 'N',
    starterName: 'Tutorial · carga formal',
    failureMessage: 'El nitrógeno del ejercicio todavía no tiene carga formal +1.',
  },
  {
    id: 'aromaticity',
    number: '04',
    title: 'Aromaticidad',
    eyebrow: 'Ciclos conjugados',
    summary: 'Localiza un anillo de benceno y comprueba por qué cumple la regla 4n+2.',
    objective: 'El laboratorio debe reconocer un anillo aromático de seis miembros.',
    steps: [
      'Prepara el ejercicio para añadir benceno.',
      'Abre Laboratorio científico y entra en Aromaticidad.',
      'Selecciona el anillo reconocido y vuelve al tutorial para validarlo.',
    ],
    chapterId: 'resonancia-aromaticidad',
    check: 'aromatic-ring',
    starterSmiles: 'c1ccccc1',
    starterName: 'Tutorial · aromaticidad',
    failureMessage: 'No se reconoce aún un ciclo aromático dentro del fragmento del ejercicio.',
  },
  {
    id: 'smiles',
    number: '05',
    title: 'SMILES desde cero',
    eyebrow: 'Estructuras como texto',
    summary: 'Escribe la cadena aromática del benceno y deja que Molecular reconstruya su grafo.',
    objective: 'Introduce c1ccccc1 y genera una coincidencia estructural con benceno.',
    steps: [
      'Escribe c1ccccc1 en el campo del ejercicio.',
      'Genera la estructura editable: c indica carbono aromático y 1 cierra el anillo.',
      'La identificación local comprobará la conectividad obtenida.',
    ],
    chapterId: 'smiles',
    check: 'benzene-smiles',
    failureMessage: 'La última estructura del ejercicio todavía no coincide con el benceno.',
  },
];
