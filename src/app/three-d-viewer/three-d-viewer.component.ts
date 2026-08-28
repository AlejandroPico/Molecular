import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  MoleculeDocument,
  ELEMENT_BY_SYMBOL,
  implicitHydrogensForAtom,
} from '../core/chemistry.models';
import { IconComponent } from '../shared/icon.component';

type Representation = 'ball-stick' | 'spacefill' | 'wireframe';

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
  readonly isReady = signal(false);

  @ViewChild('viewport', { static: true }) private viewportRef!: ElementRef<HTMLDivElement>;

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private moleculeGroup?: THREE.Group;
  private resizeObserver?: ResizeObserver;
  private animationFrame = 0;

  constructor(private readonly zone: NgZone) {
    effect(() => {
      this.molecule();
      this.representation();
      this.showHydrogens();
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
    this.renderer?.domElement.remove();
  }

  setRepresentation(value: string): void {
    this.representation.set(value as Representation);
  }

  toggleHydrogens(): void {
    this.showHydrogens.update((visible) => !visible);
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

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewport.appendChild(this.renderer.domElement);

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

    if (representation !== 'spacefill') {
      for (const bond of bonds) {
        const start = positions.get(bond.a);
        const end = positions.get(bond.b);
        if (!start || !end) continue;
        this.addBond(start, end, bond.order, representation);
      }
    }

    for (const atom of atoms) this.addAtom(atom, representation);
    this.fitCamera(atoms);
  }

  private expandMolecule(molecule: MoleculeDocument): { atoms: RenderAtom[]; bonds: RenderBond[] } {
    if (!molecule.atoms.length) return { atoms: [], bonds: [] };
    const centerX = molecule.atoms.reduce((sum, atom) => sum + atom.x, 0) / molecule.atoms.length;
    const centerY = molecule.atoms.reduce((sum, atom) => sum + atom.y, 0) / molecule.atoms.length;
    const atoms: RenderAtom[] = molecule.atoms.map((atom, index) => ({
      id: atom.id,
      element: atom.element,
      position: new THREE.Vector3(
        (atom.x - centerX) * 0.016,
        -(atom.y - centerY) * 0.016,
        Math.sin(index * 1.9) * 0.16,
      ),
      implicit: false,
    }));
    const bonds: RenderBond[] = molecule.bonds.map((bond) => ({
      a: bond.atomA,
      b: bond.atomB,
      order: bond.order,
    }));

    if (!this.showHydrogens()) return { atoms, bonds };
    const positions = new Map(atoms.map((atom) => [atom.id, atom.position]));
    for (const [atomIndex, source] of molecule.atoms.entries()) {
      const count = implicitHydrogensForAtom(molecule, source);
      const origin = positions.get(source.id);
      if (!origin || count <= 0) continue;
      const directions = this.hydrogenDirections(count, atomIndex);
      directions.forEach((direction, index) => {
        const id = source.id + '-implicit-h-' + index;
        atoms.push({
          id,
          element: 'H',
          position: origin.clone().add(direction.multiplyScalar(1.18)),
          implicit: true,
        });
        bonds.push({ a: source.id, b: id, order: 1 });
      });
    }
    return { atoms, bonds };
  }

  private hydrogenDirections(count: number, seed: number): THREE.Vector3[] {
    const tetrahedral = [
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(-1, -1, 1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(1, -1, -1),
    ];
    const rotation = new THREE.Euler(seed * 0.47, seed * 0.31, seed * 0.22);
    if (count === 1) return [new THREE.Vector3(0.9, 0.45, 0.35).applyEuler(rotation).normalize()];
    if (count === 2) {
      return [new THREE.Vector3(-0.79, 0.61, 0.25), new THREE.Vector3(0.79, 0.61, -0.25)].map(
        (vector) => vector.applyEuler(rotation).normalize(),
      );
    }
    if (count === 3) {
      return [0, 1, 2].map((index) => {
        const angle = (index * Math.PI * 2) / 3;
        return new THREE.Vector3(Math.cos(angle), -0.28, Math.sin(angle))
          .applyEuler(rotation)
          .normalize();
      });
    }
    return tetrahedral
      .slice(0, Math.min(count, 4))
      .map((vector) => vector.applyEuler(rotation).normalize());
  }

  private addAtom(atom: RenderAtom, representation: Representation): void {
    if (!this.moleculeGroup) return;
    const definition = ELEMENT_BY_SYMBOL.get(atom.element as never);
    const radius =
      representation === 'spacefill'
        ? (definition?.vanDerWaalsRadius ?? 1.5) * 0.46
        : representation === 'wireframe'
          ? 0.15
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
    this.moleculeGroup.add(sphere);
  }

  private addBond(
    start: THREE.Vector3,
    end: THREE.Vector3,
    order: 1 | 2 | 3,
    representation: Representation,
  ): void {
    if (!this.moleculeGroup) return;
    const direction = end.clone().sub(start);
    const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
    if (!Number.isFinite(perpendicular.x)) perpendicular.set(1, 0, 0);
    const spacing = representation === 'wireframe' ? 0.055 : 0.095;
    for (let index = 0; index < order; index++) {
      const offsetIndex = index - (order - 1) / 2;
      const offset = perpendicular.clone().multiplyScalar(offsetIndex * spacing * 2);
      const a = start.clone().add(offset);
      const b = end.clone().add(offset);
      const length = a.distanceTo(b);
      const geometry = new THREE.CylinderGeometry(
        representation === 'wireframe' ? 0.025 : 0.065,
        representation === 'wireframe' ? 0.025 : 0.065,
        length,
        14,
      );
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
