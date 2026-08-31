import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  BondKind,
  MoleculeDocument,
  ELEMENT_BY_SYMBOL,
  implicitHydrogensForAtom,
} from '../core/chemistry.models';
import { IconComponent } from '../shared/icon.component';

type Representation = 'ball-stick' | 'licorice' | 'spacefill' | 'sticks' | 'wireframe';
type Conformation = 'optimized' | 'planar' | 'extended' | 'compact';
type MeasurementMode = 'distance' | 'angle' | 'dihedral';

interface MeasurementResult {
  label: string;
  value: string;
  detail: string;
}

interface RenderAtom {
  id: string;
  element: string;
  position: THREE.Vector3;
  implicit: boolean;
}

interface RenderBond {
  a: string;
  b: string;
  order: 1 | 2 | 3;
  kind: BondKind;
}

@Component({
  selector: 'app-three-d-viewer',
  imports: [IconComponent],
  templateUrl: './three-d-viewer.component.html',
  styleUrl: './three-d-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreeDViewerComponent implements AfterViewInit, OnDestroy {
  readonly molecule = input.required<MoleculeDocument>();
  readonly closeRequested = output<void>();
  readonly representation = signal<Representation>('ball-stick');
  readonly showHydrogens = signal(true);
  readonly spin = signal(false);
  readonly isReady = signal(false);
  readonly webglError = signal<string | null>(null);
  readonly conformation = signal<Conformation>('optimized');
  readonly conformerIndex = signal(0);
  readonly conformationPanelOpen = signal(false);
  readonly measurementPanelOpen = signal(false);
  readonly measurementMode = signal<MeasurementMode>('distance');
  readonly measurementAtomIds = signal<string[]>([]);
  readonly measurementResult = signal<MeasurementResult | null>(null);
  readonly measurementTargetCount = computed(() =>
    this.measurementMode() === 'distance' ? 2 : this.measurementMode() === 'angle' ? 3 : 4,
  );
  readonly conformationQuality = computed(() => {
    const base: Record<Conformation, number> = {
      optimized: 1.8,
      planar: 9.6,
      extended: 4.7,
      compact: 7.2,
    };
    return (base[this.conformation()] + (this.conformerIndex() % 5) * 0.16).toFixed(2);
  });
  readonly representationOptions: ReadonlyArray<{
    id: Representation;
    label: string;
    icon: 'ball-stick' | 'licorice' | 'spacefill' | 'stick' | 'grid';
  }> = [
    { id: 'ball-stick', label: 'Bolas y varillas', icon: 'ball-stick' },
    { id: 'licorice', label: 'Licorice', icon: 'licorice' },
    { id: 'spacefill', label: 'Relleno espacial', icon: 'spacefill' },
    { id: 'sticks', label: 'Varillas', icon: 'stick' },
    { id: 'wireframe', label: 'Alambre', icon: 'grid' },
  ];

  @ViewChild('viewport', { static: true }) private viewportRef!: ElementRef<HTMLDivElement>;

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private moleculeGroup?: THREE.Group;
  private resizeObserver?: ResizeObserver;
  private animationFrame = 0;
  private renderPositions = new Map<string, THREE.Vector3>();
  private pointerOrigin: { x: number; y: number } | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();

  constructor(private readonly zone: NgZone) {
    effect(() => {
      this.molecule();
      this.representation();
      this.showHydrogens();
      this.conformation();
      this.conformerIndex();
      if (this.isReady()) this.renderMolecule();
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initializeScene());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.disposeGroup(this.moleculeGroup);
    this.renderer?.dispose();
    this.renderer?.domElement.removeEventListener('pointerdown', this.onMeasurementPointerDown);
    this.renderer?.domElement.removeEventListener('pointerup', this.onMeasurementPointerUp);
    this.renderer?.domElement.remove();
  }

  setRepresentation(value: string): void {
    this.representation.set(value as Representation);
  }

  toggleHydrogens(): void {
    this.showHydrogens.update((visible) => !visible);
  }

  toggleSpin(): void {
    this.spin.update((active) => !active);
  }

  toggleMeasurementPanel(): void {
    this.measurementPanelOpen.update((open) => !open);
    if (this.measurementPanelOpen()) this.conformationPanelOpen.set(false);
  }

  toggleConformationPanel(): void {
    this.conformationPanelOpen.update((open) => !open);
    if (this.conformationPanelOpen()) this.measurementPanelOpen.set(false);
  }

  setMeasurementMode(mode: MeasurementMode): void {
    this.measurementMode.set(mode);
    this.clearMeasurement();
  }

  clearMeasurement(): void {
    this.measurementAtomIds.set([]);
    this.measurementResult.set(null);
    this.applyMeasurementHighlights();
  }

  setConformation(value: Conformation): void {
    this.conformation.set(value);
    this.conformerIndex.set(0);
    this.clearMeasurement();
  }

  nextConformer(): void {
    this.conformation.set('optimized');
    this.conformerIndex.update((index) => index + 1);
    this.clearMeasurement();
  }

  resetView(): void {
    if (!this.camera || !this.controls) return;
    this.camera.position.set(0, 1.6, 8.5);
    this.controls.target.set(0, 0, 0);
    this.controls.reset();
  }

  exportSnapshot(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
    this.renderer.domElement.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.safeFileName(this.molecule().name) + '-3d.png';
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  }

  private initializeScene(): void {
    const viewport = this.viewportRef.nativeElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this.camera.position.set(0, 1.6, 8.5);

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      this.zone.run(() => {
        this.webglError.set(
          'Este navegador no ha podido activar WebGL. La estructura 2D sigue siendo totalmente editable.',
        );
      });
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewport.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('pointerdown', this.onMeasurementPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onMeasurementPointerUp);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 28;

    this.scene.add(new THREE.HemisphereLight(0xdde8ff, 0x263142, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 8, 7);
    keyLight.castShadow = true;
    this.scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x78b5ff, 2.0);
    rimLight.position.set(-7, 2, -6);
    this.scene.add(rimLight);

    const grid = new THREE.GridHelper(18, 18, 0x3a75a6, 0x314456);
    grid.position.y = -2.25;
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.18;
    });
    this.scene.add(grid);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(viewport);
    this.resize();
    this.isReady.set(true);
    this.renderMolecule();
    this.animate();
  }

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);
    if (this.spin() && this.moleculeGroup) this.moleculeGroup.rotation.y += 0.0045;
    this.controls?.update();
    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  };

  private resize(): void {
    if (!this.renderer || !this.camera) return;
    const { width, height } = this.viewportRef.nativeElement.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private renderMolecule(): void {
    if (!this.scene) return;
    this.disposeGroup(this.moleculeGroup);
    this.moleculeGroup = new THREE.Group();
    this.scene.add(this.moleculeGroup);

    const { atoms, bonds } = this.expandMolecule(this.molecule());
    const representation = this.representation();
    const positions = new Map(atoms.map((atom) => [atom.id, atom.position]));
    this.renderPositions = new Map(
      [...positions.entries()].map(([id, position]) => [id, position.clone()]),
    );

    if (representation !== 'spacefill') {
      for (const bond of bonds) {
        const start = positions.get(bond.a);
        const end = positions.get(bond.b);
        if (!start || !end) continue;
        this.addBond(start, end, bond.order, representation, bond.kind);
      }
    }

    for (const atom of atoms) this.addAtom(atom, representation);
    this.applyMeasurementHighlights();
    this.fitCamera(atoms);
  }

  private expandMolecule(molecule: MoleculeDocument): { atoms: RenderAtom[]; bonds: RenderBond[] } {
    if (!molecule.atoms.length) return { atoms: [], bonds: [] };
    const geometry = this.layoutExplicitAtoms(molecule);
    const atoms: RenderAtom[] = molecule.atoms.map((atom) => ({
      id: atom.id,
      element: atom.element,
      position: geometry.get(atom.id)?.clone() ?? new THREE.Vector3(),
      implicit: false,
    }));
    const bonds: RenderBond[] = molecule.bonds.map((bond) => ({
      a: bond.atomA,
      b: bond.atomB,
      order: bond.order,
      kind: bond.kind ?? (bond.order === 2 ? 'double' : bond.order === 3 ? 'triple' : 'single'),
    }));

    if (!this.showHydrogens()) return { atoms, bonds };
    const positions = new Map(atoms.map((atom) => [atom.id, atom.position]));
    for (const [atomIndex, source] of molecule.atoms.entries()) {
      const count = implicitHydrogensForAtom(molecule, source);
      const origin = positions.get(source.id);
      if (!origin || count <= 0) continue;
      const occupied = molecule.bonds
        .filter((bond) => bond.atomA === source.id || bond.atomB === source.id)
        .map((bond) => positions.get(bond.atomA === source.id ? bond.atomB : bond.atomA))
        .filter((position): position is THREE.Vector3 => !!position)
        .map((position) => position.clone().sub(origin).normalize());
      const directions = this.hydrogenDirections(count, atomIndex, occupied);
      const hydrogenDistance = this.targetBondLength(source.element, 'H');
      directions.forEach((direction, index) => {
        const id = source.id + '-implicit-h-' + index;
        atoms.push({
          id,
          element: 'H',
          position: origin.clone().add(direction.multiplyScalar(hydrogenDistance)),
          implicit: true,
        });
        bonds.push({ a: source.id, b: id, order: 1, kind: 'single' });
      });
    }
    return { atoms, bonds };
  }

  private layoutExplicitAtoms(molecule: MoleculeDocument): Map<string, THREE.Vector3> {
    const positions = new Map<string, THREE.Vector3>();
    const neighbours = new Map<string, string[]>();
    molecule.atoms.forEach((atom) => neighbours.set(atom.id, []));
    molecule.bonds.forEach((bond) => {
      neighbours.get(bond.atomA)?.push(bond.atomB);
      neighbours.get(bond.atomB)?.push(bond.atomA);
    });

    if (this.conformation() === 'planar') {
      const centerX = molecule.atoms.reduce((sum, atom) => sum + atom.x, 0) / molecule.atoms.length;
      const centerY = molecule.atoms.reduce((sum, atom) => sum + atom.y, 0) / molecule.atoms.length;
      molecule.atoms.forEach((atom) =>
        positions.set(
          atom.id,
          new THREE.Vector3((atom.x - centerX) / 92, -(atom.y - centerY) / 92, 0),
        ),
      );
      return positions;
    }

    const directionSets: Record<Exclude<Conformation, 'planar'>, THREE.Vector3[]> = {
      optimized: [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(-1, -1, 1),
        new THREE.Vector3(-1, 1, -1),
        new THREE.Vector3(1, -1, -1),
        new THREE.Vector3(1, 0.1, -0.72),
        new THREE.Vector3(-0.6, 0.82, 0.45),
      ],
      extended: [
        new THREE.Vector3(1, 0.42, 0.18),
        new THREE.Vector3(1, -0.42, -0.18),
        new THREE.Vector3(0.88, 0.2, -0.52),
        new THREE.Vector3(0.88, -0.2, 0.52),
        new THREE.Vector3(-0.7, 0.7, 0.15),
        new THREE.Vector3(-0.7, -0.7, -0.15),
      ],
      compact: [
        new THREE.Vector3(0.7, 1, 0.8),
        new THREE.Vector3(-0.8, 0.7, 1),
        new THREE.Vector3(-1, -0.7, 0.7),
        new THREE.Vector3(0.8, -1, -0.7),
        new THREE.Vector3(0.2, 0.9, -1),
        new THREE.Vector3(-0.2, -0.9, 1),
      ],
    };
    const conformation = this.conformation() as Exclude<Conformation, 'planar'>;
    const seedAngle = this.conformerIndex() * 0.754877666;
    const directions = directionSets[conformation].map((direction, index) =>
      direction
        .clone()
        .normalize()
        .applyEuler(
          new THREE.Euler(
            seedAngle * (index % 2 ? -0.34 : 0.27),
            seedAngle + index * 0.17,
            seedAngle * 0.21,
          ),
        ),
    );
    const visited = new Set<string>();
    let componentIndex = 0;

    for (const root of molecule.atoms) {
      if (visited.has(root.id)) continue;
      positions.set(root.id, new THREE.Vector3(componentIndex * 4.2, 0, 0));
      visited.add(root.id);
      const queue: Array<{ id: string; parent: string | null }> = [{ id: root.id, parent: null }];
      while (queue.length) {
        const current = queue.shift()!;
        const origin = positions.get(current.id)!;
        const candidates = neighbours.get(current.id) ?? [];
        const backDirection = current.parent
          ? positions.get(current.parent)!.clone().sub(origin).normalize()
          : null;
        let childIndex = 0;
        for (const neighbourId of candidates) {
          if (visited.has(neighbourId)) continue;
          const available = directions
            .map((direction, index) => ({ direction, index }))
            .filter(({ direction }) => !backDirection || direction.dot(backDirection) < 0.35)
            .sort((a, b) => {
              const aScore = Math.abs(
                Math.sin((childIndex + a.index + componentIndex + this.conformerIndex()) * 1.73),
              );
              const bScore = Math.abs(
                Math.sin((childIndex + b.index + componentIndex + this.conformerIndex()) * 1.73),
              );
              return bScore - aScore;
            });
          const direction = (
            available[childIndex % Math.max(1, available.length)]?.direction ??
            directions[childIndex % directions.length]
          ).clone();
          const connectingBond = molecule.bonds.find(
            (bond) =>
              (bond.atomA === current.id && bond.atomB === neighbourId) ||
              (bond.atomB === current.id && bond.atomA === neighbourId),
          );
          const source = molecule.atoms.find((atom) => atom.id === current.id)!;
          const target = molecule.atoms.find((atom) => atom.id === neighbourId)!;
          if (connectingBond?.kind === 'up') direction.z = Math.abs(direction.z || 0.55);
          if (connectingBond?.kind === 'down') direction.z = -Math.abs(direction.z || 0.55);
          if (target.chirality === '@') direction.z = -Math.abs(direction.z || 0.55);
          if (target.chirality === '@@') direction.z = Math.abs(direction.z || 0.55);
          direction.normalize();
          const distance = this.targetBondLength(source.element, target.element);
          positions.set(neighbourId, origin.clone().add(direction.multiplyScalar(distance)));
          visited.add(neighbourId);
          queue.push({ id: neighbourId, parent: current.id });
          childIndex += 1;
        }
      }
      componentIndex += 1;
    }

    const atoms = molecule.atoms;
    for (let iteration = 0; iteration < 100; iteration += 1) {
      for (const bond of molecule.bonds) {
        const a = positions.get(bond.atomA);
        const b = positions.get(bond.atomB);
        if (!a || !b) continue;
        const atomA = atoms.find((atom) => atom.id === bond.atomA)!;
        const atomB = atoms.find((atom) => atom.id === bond.atomB)!;
        const target = this.targetBondLength(atomA.element, atomB.element);
        const delta = b.clone().sub(a);
        const length = Math.max(0.001, delta.length());
        const correction = delta.multiplyScalar(((length - target) / length) * 0.18);
        a.add(correction.clone().multiplyScalar(0.5));
        b.sub(correction.clone().multiplyScalar(0.5));
      }
      for (let first = 0; first < atoms.length; first += 1) {
        for (let second = first + 1; second < atoms.length; second += 1) {
          const a = positions.get(atoms[first].id)!;
          const b = positions.get(atoms[second].id)!;
          const delta = b.clone().sub(a);
          const distance = Math.max(0.001, delta.length());
          if (distance >= 0.92) continue;
          const push = delta.multiplyScalar(((0.92 - distance) / distance) * 0.035);
          a.sub(push);
          b.add(push);
        }
      }
    }

    const center = new THREE.Vector3();
    positions.forEach((position) => center.add(position));
    center.multiplyScalar(1 / Math.max(1, positions.size));
    positions.forEach((position) => position.sub(center));
    return positions;
  }

  private targetBondLength(elementA: string, elementB: string): number {
    const radiusA = ELEMENT_BY_SYMBOL.get(elementA as never)?.covalentRadius ?? 0.75;
    const radiusB = ELEMENT_BY_SYMBOL.get(elementB as never)?.covalentRadius ?? 0.75;
    return Math.max(0.9, Math.min(1.65, (radiusA + radiusB) * 0.92));
  }

  private hydrogenDirections(
    count: number,
    seed: number,
    occupied: THREE.Vector3[],
  ): THREE.Vector3[] {
    const outward = occupied
      .reduce((sum, direction) => sum.add(direction), new THREE.Vector3())
      .multiplyScalar(-1);
    const candidates: THREE.Vector3[] = [];
    if (outward.lengthSq() > 0.0001) candidates.push(outward.normalize());

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const phase = (seed * 0.61803398875) % 1;
    for (let index = 0; index < 64; index += 1) {
      const y = 1 - ((index + 0.5) / 64) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = goldenAngle * (index + phase);
      candidates.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    }

    const selected: THREE.Vector3[] = [];
    for (let index = 0; index < Math.min(count, 4); index += 1) {
      let best = candidates[0];
      let bestScore = Number.POSITIVE_INFINITY;
      for (const candidate of candidates) {
        const collisions = [...occupied, ...selected];
        const closestDirection = collisions.length
          ? Math.max(...collisions.map((direction) => candidate.dot(direction)))
          : -1;
        const outwardPenalty = outward.lengthSq() > 0 ? -candidate.dot(outward) * 0.08 : 0;
        const score = closestDirection + outwardPenalty;
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      const chosen = best.clone().normalize();
      selected.push(chosen);
      const candidateIndex = candidates.indexOf(best);
      if (candidateIndex >= 0) candidates.splice(candidateIndex, 1);
    }
    return selected;
  }

  private addAtom(atom: RenderAtom, representation: Representation): void {
    if (!this.moleculeGroup) return;
    const definition = ELEMENT_BY_SYMBOL.get(atom.element as never);
    const radius =
      representation === 'spacefill'
        ? (definition?.vanDerWaalsRadius ?? 1.5) * 0.46
        : representation === 'wireframe'
          ? 0.15
          : representation === 'licorice'
            ? 0.16
            : representation === 'sticks'
              ? 0.09
              : Math.max(0.26, (definition?.covalentRadius ?? 0.7) * 0.48);
    const geometry = new THREE.SphereGeometry(
      radius,
      representation === 'wireframe' ? 16 : 32,
      representation === 'wireframe' ? 12 : 22,
    );
    const material = new THREE.MeshStandardMaterial({
      color: definition?.color ?? '#9aa5b5',
      roughness: 0.32,
      metalness:
        atom.element === 'Fe' || atom.element === 'Cu' || atom.element === 'Zn' ? 0.45 : 0.05,
      wireframe: representation === 'wireframe',
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(atom.position);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.userData['atomId'] = atom.id;
    sphere.userData['baseEmissive'] = material.emissive.getHex();
    this.moleculeGroup.add(sphere);
  }

  private readonly onMeasurementPointerDown = (event: PointerEvent): void => {
    this.pointerOrigin = { x: event.clientX, y: event.clientY };
  };

  private readonly onMeasurementPointerUp = (event: PointerEvent): void => {
    if (
      !this.measurementPanelOpen() ||
      !this.pointerOrigin ||
      !this.renderer ||
      !this.camera ||
      !this.moleculeGroup
    )
      return;
    const moved = Math.hypot(
      event.clientX - this.pointerOrigin.x,
      event.clientY - this.pointerOrigin.y,
    );
    this.pointerOrigin = null;
    if (moved > 5) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster
      .intersectObjects(this.moleculeGroup.children, true)
      .find((intersection) => Boolean(intersection.object.userData['atomId']));
    const atomId = hit?.object.userData['atomId'] as string | undefined;
    if (!atomId) return;
    this.zone.run(() => this.addMeasurementAtom(atomId));
  };

  private addMeasurementAtom(atomId: string): void {
    const targetCount = this.measurementTargetCount();
    let ids = this.measurementAtomIds();
    if (ids.includes(atomId)) ids = ids.filter((id) => id !== atomId);
    else ids = [...ids, atomId].slice(-targetCount);
    this.measurementAtomIds.set(ids);
    this.measurementResult.set(ids.length === targetCount ? this.calculateMeasurement(ids) : null);
    this.applyMeasurementHighlights();
  }

  private calculateMeasurement(ids: string[]): MeasurementResult | null {
    const points = ids
      .map((id) => this.renderPositions.get(id))
      .filter((point): point is THREE.Vector3 => !!point);
    if (points.length !== ids.length) return null;
    if (this.measurementMode() === 'distance') {
      const value = points[0].distanceTo(points[1]);
      return {
        label: 'Distancia',
        value: `${value.toFixed(3)} Å`,
        detail: `${this.atomLabel(ids[0])} – ${this.atomLabel(ids[1])}`,
      };
    }
    if (this.measurementMode() === 'angle') {
      const angle = points[0].clone().sub(points[1]).angleTo(points[2].clone().sub(points[1]));
      return {
        label: 'Ángulo',
        value: `${THREE.MathUtils.radToDeg(angle).toFixed(2)}°`,
        detail: ids.map((id) => this.atomLabel(id)).join(' – '),
      };
    }
    const b0 = points[0].clone().sub(points[1]);
    const b1 = points[2].clone().sub(points[1]).normalize();
    const b2 = points[3].clone().sub(points[2]);
    const v = b0.clone().sub(b1.clone().multiplyScalar(b0.dot(b1)));
    const w = b2.clone().sub(b1.clone().multiplyScalar(b2.dot(b1)));
    const angle = Math.atan2(b1.clone().cross(v).dot(w), v.dot(w));
    return {
      label: 'Ángulo diedro',
      value: `${THREE.MathUtils.radToDeg(angle).toFixed(2)}°`,
      detail: ids.map((id) => this.atomLabel(id)).join(' – '),
    };
  }

  private applyMeasurementHighlights(): void {
    if (!this.moleculeGroup) return;
    const selected = new Set(this.measurementAtomIds());
    this.moleculeGroup.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.userData['atomId']) return;
      const material = child.material;
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      const active = selected.has(child.userData['atomId'] as string);
      material.emissive.set(active ? '#f3a712' : '#000000');
      material.emissiveIntensity = active ? 0.7 : 0;
    });
  }

  private atomLabel(atomId: string): string {
    const atom = this.molecule().atoms.find((candidate) => candidate.id === atomId);
    if (atom) return `${atom.element}${this.molecule().atoms.indexOf(atom) + 1}`;
    return atomId.includes('implicit-h') ? 'H implícito' : atomId;
  }

  private addBond(
    start: THREE.Vector3,
    end: THREE.Vector3,
    order: 1 | 2 | 3,
    representation: Representation,
    kind: BondKind,
  ): void {
    if (!this.moleculeGroup) return;
    if (kind === 'hydrogen') {
      const geometry = new THREE.SphereGeometry(0.045, 10, 8);
      const material = new THREE.MeshStandardMaterial({
        color: '#7aa7c7',
        roughness: 0.45,
        metalness: 0.02,
      });
      for (let index = 1; index < 8; index += 1) {
        const dot = new THREE.Mesh(geometry.clone(), material.clone());
        dot.position.copy(start).lerp(end, index / 8);
        this.moleculeGroup.add(dot);
      }
      geometry.dispose();
      material.dispose();
      return;
    }
    const direction = end.clone().sub(start);
    const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
    if (!Number.isFinite(perpendicular.x)) perpendicular.set(1, 0, 0);
    const spacing =
      representation === 'wireframe' ? 0.055 : representation === 'licorice' ? 0.12 : 0.095;
    const bondRadius =
      representation === 'wireframe'
        ? 0.025
        : representation === 'licorice'
          ? 0.16
          : representation === 'sticks'
            ? 0.095
            : 0.065;
    for (let index = 0; index < order; index++) {
      const offsetIndex = index - (order - 1) / 2;
      const offset = perpendicular.clone().multiplyScalar(offsetIndex * spacing * 2);
      const a = start.clone().add(offset);
      const b = end.clone().add(offset);
      const length = a.distanceTo(b);
      const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 14);
      const material = new THREE.MeshStandardMaterial({
        color: '#a9b5c5',
        roughness: 0.38,
        metalness: 0.08,
      });
      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.position.copy(a).add(b).multiplyScalar(0.5);
      cylinder.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        b.clone().sub(a).normalize(),
      );
      cylinder.castShadow = true;
      this.moleculeGroup.add(cylinder);
    }
  }

  private fitCamera(atoms: RenderAtom[]): void {
    if (!this.camera || !this.controls || !atoms.length) return;
    const box = new THREE.Box3().setFromPoints(atoms.map((atom) => atom.position));
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    this.controls.target.copy(center);
    const distance = Math.max(5.5, size * 1.55 + 3.4);
    this.camera.position.set(
      center.x + distance * 0.28,
      center.y + distance * 0.2,
      center.z + distance,
    );
    this.camera.near = Math.max(0.05, distance / 100);
    this.camera.far = distance * 20;
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.controls.saveState();
  }

  private disposeGroup(group?: THREE.Group): void {
    if (!group) return;
    group.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    });
    group.removeFromParent();
  }

  private safeFileName(name: string): string {
    return (
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'molecula'
    );
  }
}
