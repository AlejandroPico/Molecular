import { MoleculeDocument, cloneDocument } from './chemistry.models';

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const orientation = (p: Point, q: Point, r: Point) =>
    Math.sign((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
  return (
    orientation(a, b, c) !== orientation(a, b, d) && orientation(c, d, a) !== orientation(c, d, b)
  );
}

function connectedSets(document: MoleculeDocument): string[][] {
  const adjacency = new Map(document.atoms.map((atom) => [atom.id, [] as string[]]));
  for (const bond of document.bonds) {
    adjacency.get(bond.atomA)?.push(bond.atomB);
    adjacency.get(bond.atomB)?.push(bond.atomA);
  }
  const seen = new Set<string>();
  const sets: string[][] = [];
  for (const atom of document.atoms) {
    if (seen.has(atom.id)) continue;
    const queue = [atom.id];
    const set: string[] = [];
    seen.add(atom.id);
    while (queue.length) {
      const id = queue.shift()!;
      set.push(id);
      for (const neighbor of adjacency.get(id) ?? []) {
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        queue.push(neighbor);
      }
    }
    sets.push(set);
  }
  return sets;
}

function boundsFor(ids: string[], positions: Map<string, Point>): Bounds {
  const points = ids.map((id) => positions.get(id)!).filter(Boolean);
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

/**
 * Local, deterministic 2D relaxation. It balances bond lengths, angular separation,
 * atom repulsion and line crossings, then packs disconnected graphs into rows.
 */
export function cleanMolecularLayout(
  source: MoleculeDocument,
  lockedAtomIds: ReadonlySet<string> = new Set(),
): MoleculeDocument {
  const document = cloneDocument(source);
  const targetLength = 112;
  const positions = new Map(
    document.atoms.map((atom) => [atom.id, { x: atom.x, y: atom.y } as Point]),
  );
  const adjacency = new Map(document.atoms.map((atom) => [atom.id, [] as string[]]));
  for (const bond of document.bonds) {
    adjacency.get(bond.atomA)?.push(bond.atomB);
    adjacency.get(bond.atomB)?.push(bond.atomA);
  }

  const move = (id: string, dx: number, dy: number) => {
    if (lockedAtomIds.has(id)) return;
    const point = positions.get(id);
    if (!point) return;
    point.x += Math.max(-9, Math.min(9, dx));
    point.y += Math.max(-9, Math.min(9, dy));
  };

  for (let iteration = 0; iteration < 150; iteration += 1) {
    const cooling = 1 - iteration / 190;
    for (const bond of document.bonds) {
      const a = positions.get(bond.atomA);
      const b = positions.get(bond.atomB);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = ((distance - targetLength) / distance) * 0.18 * cooling;
      move(bond.atomA, dx * force * 0.5, dy * force * 0.5);
      move(bond.atomB, -dx * force * 0.5, -dy * force * 0.5);
    }

    for (let first = 0; first < document.atoms.length; first += 1) {
      for (let second = first + 1; second < document.atoms.length; second += 1) {
        const atomA = document.atoms[first];
        const atomB = document.atoms[second];
        const a = positions.get(atomA.id)!;
        const b = positions.get(atomB.id)!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (Math.abs(dx) + Math.abs(dy) < 0.1) {
          dx = ((first * 37 + second * 17) % 11) - 5;
          dy = ((first * 19 + second * 29) % 13) - 6;
        }
        const distance = Math.max(1, Math.hypot(dx, dy));
        const minimum = adjacency.get(atomA.id)?.includes(atomB.id) ? 76 : 94;
        if (distance >= minimum) continue;
        const force = ((minimum - distance) / distance) * 0.085 * cooling;
        move(atomA.id, -dx * force, -dy * force);
        move(atomB.id, dx * force, dy * force);
      }
    }

    for (const [centerId, neighbors] of adjacency) {
      if (neighbors.length < 2) continue;
      const center = positions.get(centerId)!;
      const sorted = [...neighbors].sort((a, b) => {
        const pa = positions.get(a)!;
        const pb = positions.get(b)!;
        return (
          Math.atan2(pa.y - center.y, pa.x - center.x) -
          Math.atan2(pb.y - center.y, pb.x - center.x)
        );
      });
      const ideal = (Math.PI * 2) / sorted.length;
      sorted.forEach((id, index) => {
        const point = positions.get(id)!;
        const next = positions.get(sorted[(index + 1) % sorted.length])!;
        let gap =
          Math.atan2(next.y - center.y, next.x - center.x) -
          Math.atan2(point.y - center.y, point.x - center.x);
        if (gap <= 0) gap += Math.PI * 2;
        const correction = Math.max(-0.055, Math.min(0.055, (ideal - gap) * 0.05 * cooling));
        const px = point.x - center.x;
        const py = point.y - center.y;
        move(id, -py * correction, px * correction);
        const nx = next.x - center.x;
        const ny = next.y - center.y;
        move(sorted[(index + 1) % sorted.length], ny * correction, -nx * correction);
      });
    }

    if (iteration % 3 === 0) {
      for (let first = 0; first < document.bonds.length; first += 1) {
        for (let second = first + 1; second < document.bonds.length; second += 1) {
          const aBond = document.bonds[first];
          const bBond = document.bonds[second];
          if ([aBond.atomA, aBond.atomB].some((id) => id === bBond.atomA || id === bBond.atomB))
            continue;
          const a = positions.get(aBond.atomA)!;
          const b = positions.get(aBond.atomB)!;
          const c = positions.get(bBond.atomA)!;
          const d = positions.get(bBond.atomB)!;
          if (!segmentsCross(a, b, c, d)) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.max(1, Math.hypot(dx, dy));
          const nx = (-dy / length) * 3.2 * cooling;
          const ny = (dx / length) * 3.2 * cooling;
          move(bBond.atomA, nx, ny);
          move(bBond.atomB, nx, ny);
          move(aBond.atomA, -nx, -ny);
          move(aBond.atomB, -nx, -ny);
        }
      }
    }
  }

  const graphs = connectedSets(document).sort((a, b) => b.length - a.length);
  let cursorX = 120;
  let cursorY = 130;
  let rowHeight = 0;
  for (const graph of graphs) {
    if (graph.some((id) => lockedAtomIds.has(id))) continue;
    const bounds = boundsFor(graph, positions);
    const width = Math.max(90, bounds.maxX - bounds.minX);
    const height = Math.max(70, bounds.maxY - bounds.minY);
    if (cursorX + width > 1260) {
      cursorX = 120;
      cursorY += rowHeight + 135;
      rowHeight = 0;
    }
    const dx = cursorX - bounds.minX;
    const dy = cursorY - bounds.minY;
    graph.forEach((id) => {
      const point = positions.get(id)!;
      point.x += dx;
      point.y += dy;
    });
    cursorX += width + 150;
    rowHeight = Math.max(rowHeight, height);
  }

  document.atoms.forEach((atom) => {
    const point = positions.get(atom.id)!;
    atom.x = Number(point.x.toFixed(2));
    atom.y = Number(point.y.toFixed(2));
  });
  return document;
}
