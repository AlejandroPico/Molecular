import { MoleculeDocument, MolecularComponent } from './chemistry.models';

export type ObjectTreeNodeKind =
  'component' | 'atom' | 'bond' | 'reaction-arrow' | 'electron-arrow';

export interface ObjectTreeNode {
  id: string;
  kind: ObjectTreeNodeKind;
  label: string;
  detail: string;
  atomIds: string[];
  hidden: boolean;
  locked: boolean;
  children: ObjectTreeNode[];
}

function componentNode(document: MoleculeDocument, component: MolecularComponent): ObjectTreeNode {
  const atomIds = new Set(component.atomIds);
  const atomChildren: ObjectTreeNode[] = component.atomIds
    .map((id) => document.atoms.find((atom) => atom.id === id))
    .filter((atom) => Boolean(atom))
    .map((atom, index) => ({
      id: atom!.id,
      kind: 'atom' as const,
      label: atom!.element,
      detail: `Átomo ${index + 1} · carga ${atom!.charge >= 0 ? '+' : ''}${atom!.charge}`,
      atomIds: [atom!.id],
      hidden: component.hidden,
      locked: component.locked,
      children: [],
    }));
  const bondChildren: ObjectTreeNode[] = document.bonds
    .filter((bond) => atomIds.has(bond.atomA) && atomIds.has(bond.atomB))
    .map((bond, index) => ({
      id: bond.id,
      kind: 'bond' as const,
      label: `Enlace ${index + 1}`,
      detail: `${bond.kind ?? bond.order} · orden ${bond.order}`,
      atomIds: [bond.atomA, bond.atomB],
      hidden: component.hidden,
      locked: component.locked,
      children: [],
    }));
  return {
    id: component.id,
    kind: 'component',
    label: component.name,
    detail: `${component.atomIds.length} átomos · ${bondChildren.length} enlaces`,
    atomIds: [...component.atomIds],
    hidden: component.hidden,
    locked: component.locked,
    children: [...atomChildren, ...bondChildren],
  };
}

export function buildObjectTree(document: MoleculeDocument, query = ''): ObjectTreeNode[] {
  const nodes: ObjectTreeNode[] = (document.components ?? []).map((component) =>
    componentNode(document, component),
  );
  nodes.push(
    ...document.arrows.map((arrow, index) => ({
      id: arrow.id,
      kind: 'reaction-arrow' as const,
      label: `Flecha química ${index + 1}`,
      detail: arrow.kind,
      atomIds: [],
      hidden: false,
      locked: false,
      children: [],
    })),
    ...(document.electronArrows ?? []).map((arrow, index) => ({
      id: arrow.id,
      kind: 'electron-arrow' as const,
      label: `Flecha electrónica ${index + 1}`,
      detail: arrow.kind === 'pair' ? 'Par de electrones' : 'Electrón individual',
      atomIds: [],
      hidden: false,
      locked: false,
      children: [],
    })),
  );
  const normalized = query.trim().toLocaleLowerCase('es');
  if (!normalized) return nodes;
  return nodes
    .map((node) => {
      const children = node.children.filter((child) =>
        `${child.label} ${child.detail}`.toLocaleLowerCase('es').includes(normalized),
      );
      return { ...node, children };
    })
    .filter(
      (node) =>
        `${node.label} ${node.detail}`.toLocaleLowerCase('es').includes(normalized) ||
        node.children.length > 0,
    );
}
