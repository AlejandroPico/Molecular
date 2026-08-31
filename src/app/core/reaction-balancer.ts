import { AtomSymbol, MoleculeDocument, MolecularComponent } from './chemistry.models';
import { elementCountsForAtoms } from './molecular-analysis';

export interface BalanceResult {
  balanced: boolean;
  coefficients: Map<string, number>;
  equation: string;
  message: string;
}

interface Fraction {
  numerator: number;
  denominator: number;
}

const ZERO: Fraction = { numerator: 0, denominator: 1 };
const ONE: Fraction = { numerator: 1, denominator: 1 };

export function balanceReaction(
  document: MoleculeDocument,
  components: MolecularComponent[],
): BalanceResult {
  const reactants = components.filter((component) => component.role === 'reactant');
  const products = components.filter((component) => component.role === 'product');
  const participants = [...reactants, ...products];
  if (!reactants.length || !products.length) {
    return failure('Asigna al menos un reactivo y un producto antes de balancear.');
  }
  if (participants.length < 2) return failure('La ecuación necesita al menos dos especies.');

  const counts = participants.map((component) =>
    elementCountsForAtoms(document, component.atomIds),
  );
  const elements = [...new Set(counts.flatMap((entry) => [...entry.keys()]))]
    .filter((symbol) => symbol !== 'R')
    .sort();
  if (!elements.length) return failure('No hay elementos químicos balanceables en la reacción.');

  const matrix: Fraction[][] = elements.map((element) =>
    participants.map((component, index) => {
      const sign = reactants.includes(component) ? 1 : -1;
      return fraction(sign * (counts[index].get(element as AtomSymbol) ?? 0));
    }),
  );
  const chargeRow = participants.map((component) => {
    const selected = new Set(component.atomIds);
    const charge = document.atoms
      .filter((atom) => selected.has(atom.id))
      .reduce((sum, atom) => sum + atom.charge, 0);
    const sign = reactants.includes(component) ? 1 : -1;
    return fraction(sign * charge);
  });
  if (chargeRow.some((value) => value.numerator !== 0)) matrix.push(chargeRow);

  const vector = nullSpaceVector(matrix, participants.length);
  if (!vector || vector.some((value) => value <= 0)) {
    return failure(
      'No se ha encontrado una solución estequiométrica positiva y única para estos componentes.',
    );
  }
  const divisor = vector.reduce((value, coefficient) => gcd(value, coefficient));
  const normalized = vector.map((value) => value / Math.max(1, divisor));
  const coefficients = new Map(
    participants.map((component, index) => [component.id, normalized[index]]),
  );

  if (!verifyBalance(matrix, normalized)) {
    return failure('La solución propuesta no conserva todos los elementos o la carga neta.');
  }

  const equation = formatEquation(reactants, products, coefficients, document);
  return {
    balanced: true,
    coefficients,
    equation,
    message: 'Ecuación balanceada conservando elementos y carga neta.',
  };
}

export function reactionBalanceStatus(
  document: MoleculeDocument,
  components: MolecularComponent[],
): BalanceResult {
  const reactants = components.filter((component) => component.role === 'reactant');
  const products = components.filter((component) => component.role === 'product');
  if (!reactants.length || !products.length) return failure('Asigna reactivos y productos.');
  const elements = new Set<AtomSymbol>();
  const totals = new Map<AtomSymbol, number>();
  let netCharge = 0;
  for (const component of [...reactants, ...products]) {
    const sign = reactants.includes(component) ? 1 : -1;
    for (const [element, count] of elementCountsForAtoms(document, component.atomIds)) {
      if (element === 'R') continue;
      elements.add(element);
      totals.set(element, (totals.get(element) ?? 0) + sign * count * component.coefficient);
    }
    const selected = new Set(component.atomIds);
    netCharge +=
      sign *
      component.coefficient *
      document.atoms
        .filter((atom) => selected.has(atom.id))
        .reduce((sum, atom) => sum + atom.charge, 0);
  }
  const unbalanced = [...elements].filter((element) => totals.get(element) !== 0);
  const balanced = !unbalanced.length && netCharge === 0;
  const coefficients = new Map(
    [...reactants, ...products].map((component) => [component.id, component.coefficient]),
  );
  return {
    balanced,
    coefficients,
    equation: formatEquation(reactants, products, coefficients, document),
    message: balanced
      ? 'La ecuación ya está balanceada.'
      : `Pendiente: ${[...unbalanced, ...(netCharge ? ['carga'] : [])].join(', ')}.`,
  };
}

function nullSpaceVector(matrix: Fraction[][], columns: number): number[] | null {
  const rows = matrix.map((row) => row.map((value) => ({ ...value })));
  const pivots: number[] = [];
  let pivotRow = 0;
  for (let column = 0; column < columns && pivotRow < rows.length; column += 1) {
    const source = rows.findIndex((row, index) => index >= pivotRow && row[column].numerator !== 0);
    if (source < 0) continue;
    [rows[pivotRow], rows[source]] = [rows[source], rows[pivotRow]];
    const pivot = rows[pivotRow][column];
    rows[pivotRow] = rows[pivotRow].map((value) => divide(value, pivot));
    for (let row = 0; row < rows.length; row += 1) {
      if (row === pivotRow || rows[row][column].numerator === 0) continue;
      const factor = rows[row][column];
      rows[row] = rows[row].map((value, index) =>
        subtract(value, multiply(factor, rows[pivotRow][index])),
      );
    }
    pivots.push(column);
    pivotRow += 1;
  }
  const freeColumns = Array.from({ length: columns }, (_, index) => index).filter(
    (column) => !pivots.includes(column),
  );
  if (!freeColumns.length) return null;

  const solution = Array.from({ length: columns }, () => ZERO);
  for (const column of freeColumns) solution[column] = ONE;
  for (let row = pivots.length - 1; row >= 0; row -= 1) {
    const column = pivots[row];
    const sum = rows[row].reduce(
      (total, value, index) =>
        index === column ? total : add(total, multiply(value, solution[index])),
      ZERO,
    );
    solution[column] = negate(sum);
  }
  const commonDenominator = solution.reduce((value, item) => lcm(value, item.denominator), 1);
  let integers = solution.map((item) => item.numerator * (commonDenominator / item.denominator));
  if (integers.every((value) => value < 0)) integers = integers.map((value) => -value);
  return integers.map((value) => Math.round(value));
}

function verifyBalance(matrix: Fraction[][], vector: number[]): boolean {
  return matrix.every(
    (row) =>
      row.reduce(
        (sum, value, index) => sum + (value.numerator * vector[index]) / value.denominator,
        0,
      ) === 0,
  );
}

function formatEquation(
  reactants: MolecularComponent[],
  products: MolecularComponent[],
  coefficients: Map<string, number>,
  document: MoleculeDocument,
): string {
  const side = (items: MolecularComponent[]) =>
    items
      .map((component) => {
        const coefficient = coefficients.get(component.id) ?? 1;
        const formula = formulaForComponent(document, component);
        return `${coefficient === 1 ? '' : coefficient}${formula}`;
      })
      .join(' + ');
  return `${side(reactants)} → ${side(products)}`;
}

function formulaForComponent(document: MoleculeDocument, component: MolecularComponent): string {
  const counts = elementCountsForAtoms(document, component.atomIds);
  const symbols = [...counts.keys()];
  const ordered = symbols.includes('C')
    ? ['C', 'H', ...symbols.filter((symbol) => !['C', 'H'].includes(symbol)).sort()]
    : symbols.sort();
  return ordered
    .filter((symbol, index, all) => all.indexOf(symbol) === index)
    .map(
      (symbol) =>
        `${symbol}${(counts.get(symbol as AtomSymbol) ?? 0) > 1 ? counts.get(symbol as AtomSymbol) : ''}`,
    )
    .join('');
}

function failure(message: string): BalanceResult {
  return { balanced: false, coefficients: new Map(), equation: '—', message };
}

function fraction(numerator: number, denominator = 1): Fraction {
  if (!numerator) return ZERO;
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  return { numerator: (sign * numerator) / divisor, denominator: Math.abs(denominator) / divisor };
}

function add(a: Fraction, b: Fraction): Fraction {
  return fraction(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

function subtract(a: Fraction, b: Fraction): Fraction {
  return add(a, negate(b));
}

function multiply(a: Fraction, b: Fraction): Fraction {
  return fraction(a.numerator * b.numerator, a.denominator * b.denominator);
}

function divide(a: Fraction, b: Fraction): Fraction {
  return fraction(a.numerator * b.denominator, a.denominator * b.numerator);
}

function negate(value: Fraction): Fraction {
  return { numerator: -value.numerator, denominator: value.denominator };
}

function gcd(a: number, b: number): number {
  let left = Math.abs(Math.round(a));
  let right = Math.abs(Math.round(b));
  while (right) [left, right] = [right, left % right];
  return left || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}
