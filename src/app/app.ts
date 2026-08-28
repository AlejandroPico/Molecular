import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import {
  Atom,
  Bond,
  ELEMENTS,
  ELEMENT_BY_SYMBOL,
  ElementSymbol,
  MOLECULE_PRESETS,
  MoleculeDocument,
  QUICK_ELEMENTS,
  calculateStats,
  cloneDocument,
  createAtom,
  createBond,
  createDocument,
  documentFromPreset,
  implicitHydrogensForAtom,
} from './core/chemistry.models';
import { IconComponent } from './shared/icon.component';
import { ThreeDViewerComponent } from './three-d-viewer/three-d-viewer.component';

type EditorTool = 'select' | 'pan' | 'atom' | 'bond' | 'erase';
type PanelName = 'file' | 'layers' | 'encyclopedia' | 'theme' | 'export' | 'about' | null;
type ThemeMode = 'auto' | 'light' | 'dark';

interface CanvasPoint {
  x: number;
  y: number;
}
interface SelectionBox {
  startX: number;
  startY: number;
  x: number;
  y: number;
  additive: boolean;
}
interface ContextMenuState {
  x: number;
  y: number;
}
interface StoredDocument {
  id: string;
  name: string;
  document: MoleculeDocument;
  savedAt: string;
}

interface PointerState {
  mode: 'drag' | 'pan' | 'select';
  pointerId: number;
  startClient: CanvasPoint;
  startPoint: CanvasPoint;
  startPan: CanvasPoint;
  original: MoleculeDocument;
  atomPositions: Map<string, CanvasPoint>;
  additive: boolean;
  moved: boolean;
}

interface BondLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'app-root',
  imports: [IconComponent, ThreeDViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly version = '0.1.1';
  protected readonly elements = ELEMENTS;
  protected readonly quickElements = QUICK_ELEMENTS;
  protected readonly presets = MOLECULE_PRESETS;
  protected readonly elementBySymbol = ELEMENT_BY_SYMBOL;

  protected readonly molecule = signal<MoleculeDocument>(this.initialDocument());
  protected readonly selectedAtomIds = signal<Set<string>>(new Set());
  protected readonly modelAtomIds = signal<Set<string>>(new Set());
  protected readonly activeTool = signal<EditorTool>('select');
  protected readonly activeElement = signal<ElementSymbol>('C');
  protected readonly bondOrder = signal<1 | 2 | 3>(1);
  protected readonly bondStartId = signal<string | null>(null);
  protected readonly activePanel = signal<PanelName>(null);
  protected readonly modelOpen = signal(false);
  protected readonly zoom = signal(1);
  protected readonly pan = signal<CanvasPoint>({ x: 0, y: 0 });
  protected readonly selectionBox = signal<SelectionBox | null>(null);
  protected readonly contextMenu = signal<ContextMenuState | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly searchOpen = signal(false);
  protected readonly encyclopediaQuery = signal('');
  protected readonly themeMode = signal<ThemeMode>(this.initialTheme());
  protected readonly toast = signal<string | null>(null);
  protected readonly savedDocuments = signal<StoredDocument[]>(this.loadStoredDocuments());
  protected readonly canUndo = signal(false);
  protected readonly canRedo = signal(false);

  protected readonly layers = {
    grid: signal(true),
    atomLabels: signal(true),
    atomIndexes: signal(false),
    bondOrders: signal(false),
    implicitHydrogens: signal(true),
    valenceWarnings: signal(true),
  };

  protected readonly stats = computed(() => calculateStats(this.molecule()));
  protected readonly formulaDisplay = computed(() => this.toSubscriptFormula(this.stats().formula));
  protected readonly selectedAtoms = computed(() =>
    this.molecule().atoms.filter((atom) => this.selectedAtomIds().has(atom.id)),
  );
  protected readonly selectedElement = computed(() => {
    const atoms = this.selectedAtoms();
    if (!atoms.length) return null;
    return atoms.every((atom) => atom.element === atoms[0].element) ? atoms[0].element : null;
  });
  protected readonly transform = computed(() => {
    const pan = this.pan();
    return 'translate(' + pan.x + ' ' + pan.y + ') scale(' + this.zoom() + ')';
  });
  protected readonly filteredPresets = computed(() => {
    const query = this.normalize(this.searchQuery());
    if (!query) return this.presets.slice(0, 5);
    return this.presets
      .filter((preset) =>
        this.normalize(preset.name + ' ' + preset.commonName + ' ' + preset.category).includes(
          query,
        ),
      )
      .slice(0, 6);
  });
  protected readonly filteredElements = computed(() => {
    const query = this.normalize(this.encyclopediaQuery());
    if (!query) return this.elements;
    return this.elements.filter((element) =>
      this.normalize(element.name + ' ' + element.symbol + ' ' + element.group).includes(query),
    );
  });
  protected readonly modelMolecule = computed(() => {
    const source = this.molecule();
    const ids = this.modelAtomIds();
    if (!ids.size) return source;
    return {
      ...source,
      name: ids.size === 1 ? source.name + ' · átomo seleccionado' : source.name + ' · fragmento',
      atoms: source.atoms.filter((atom) => ids.has(atom.id)),
      bonds: source.bonds.filter((bond) => ids.has(bond.atomA) && ids.has(bond.atomB)),
    };
  });

  @ViewChild('molecularCanvas', { static: true }) private canvasRef!: ElementRef<SVGSVGElement>;
  @ViewChild('importInput') private importInputRef?: ElementRef<HTMLInputElement>;

  private readonly viewWidth = 1400;
  private readonly viewHeight = 800;
  private readonly autosaveKey = 'molecular.autosave.v1';
  private readonly libraryKey = 'molecular.library.v1';
  private readonly themeKey = 'molecular.theme.v1';
  private undoStack: MoleculeDocument[] = [];
  private redoStack: MoleculeDocument[] = [];
  private pointerState: PointerState | null = null;
  private spacePressed = false;
  private toastTimer = 0;

  constructor() {
    this.applyTheme(this.themeMode());
  }

  protected setTool(tool: EditorTool): void {
    this.activeTool.set(tool);
    if (tool !== 'bond') this.bondStartId.set(null);
    this.contextMenu.set(null);
  }

  protected setElement(symbol: ElementSymbol): void {
    this.activeElement.set(symbol);
    this.activeTool.set('atom');
    if (this.selectedAtomIds().size) this.applyElementToSelection(symbol);
  }

  protected setBondOrder(order: 1 | 2 | 3): void {
    this.bondOrder.set(order);
    this.activeTool.set('bond');
  }

  protected togglePanel(panel: Exclude<PanelName, null>): void {
    this.activePanel.update((current) => (current === panel ? null : panel));
    this.contextMenu.set(null);
  }

  protected closePanels(): void {
    this.activePanel.set(null);
    this.contextMenu.set(null);
  }

  protected renameMolecule(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    if (!value || value === this.molecule().name) return;
    this.mutate((document) => {
      document.name = value;
    });
  }

  protected loadPresetById(id: string): void {
    const preset = this.presets.find((candidate) => candidate.id === id);
    if (!preset) return;
    this.loadDocument(documentFromPreset(preset));
    this.searchQuery.set('');
    this.searchOpen.set(false);
    this.activePanel.set(null);
    this.notify(preset.name + ' cargado en el lienzo');
  }

  protected newMolecule(): void {
    if (
      this.molecule().atoms.length &&
      !window.confirm(
        '¿Crear una molécula nueva? El estado actual seguirá disponible en el autoguardado hasta que continúes.',
      )
    )
      return;
    this.loadDocument(createDocument());
    this.notify('Nuevo lienzo preparado');
  }

  protected clearMolecule(): void {
    if (!this.molecule().atoms.length) return;
    if (!window.confirm('¿Vaciar por completo el lienzo molecular?')) return;
    this.mutate((document) => {
      document.atoms = [];
      document.bonds = [];
    });
    this.selectedAtomIds.set(new Set());
    this.notify('Lienzo vaciado');
  }

  protected saveToLibrary(): void {
    const source = cloneDocument(this.molecule());
    const stored: StoredDocument = {
      id: source.id,
      name: source.name,
      document: source,
      savedAt: new Date().toISOString(),
    };
    const library = [
      stored,
      ...this.savedDocuments().filter((item) => item.id !== source.id),
    ].slice(0, 24);
    this.savedDocuments.set(library);
    localStorage.setItem(this.libraryKey, JSON.stringify(library));
    this.notify('Molécula guardada en este dispositivo');
  }

  protected loadSaved(stored: StoredDocument): void {
    this.loadDocument(cloneDocument(stored.document));
    this.activePanel.set(null);
    this.notify(stored.name + ' restaurado');
  }

  protected deleteSaved(event: Event, id: string): void {
    event.stopPropagation();
    const library = this.savedDocuments().filter((item) => item.id !== id);
    this.savedDocuments.set(library);
    localStorage.setItem(this.libraryKey, JSON.stringify(library));
  }

  protected triggerImport(): void {
    this.importInputRef?.nativeElement.click();
  }

  protected importDocument(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as MoleculeDocument;
        if (
          !Array.isArray(parsed.atoms) ||
          !Array.isArray(parsed.bonds) ||
          typeof parsed.name !== 'string'
        )
          throw new Error('Formato no válido');
        const atomIds = new Set(parsed.atoms.map((atom) => atom.id));
        if (parsed.bonds.some((bond) => !atomIds.has(bond.atomA) || !atomIds.has(bond.atomB)))
          throw new Error('Enlaces huérfanos');
        this.loadDocument({ ...parsed, updatedAt: new Date().toISOString() });
        this.activePanel.set(null);
        this.notify('Documento molecular importado');
      } catch {
        this.notify('No se ha podido importar: archivo molecular no válido');
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  protected exportJson(): void {
    this.download(
      new Blob([JSON.stringify(this.molecule(), null, 2)], { type: 'application/json' }),
      this.safeFileName(this.molecule().name) + '.molecular.json',
    );
    this.notify('Documento molecular exportado');
  }

  protected exportSvg(): void {
    this.download(
      new Blob([this.createSvgMarkup()], { type: 'image/svg+xml;charset=utf-8' }),
      this.safeFileName(this.molecule().name) + '.svg',
    );
    this.notify('Fórmula estructural exportada como SVG');
  }

  protected exportPng(): void {
    const blob = new Blob([this.createSvgMarkup()], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width * 2;
      canvas.height = image.height * 2;
      const context = canvas.getContext('2d');
      context?.scale(2, 2);
      context?.drawImage(image, 0, 0);
      canvas.toBlob((png) => {
        if (png) this.download(png, this.safeFileName(this.molecule().name) + '.png');
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    image.src = url;
    this.notify('Preparando imagen PNG');
  }

  protected openModel(ids?: Set<string>): void {
    if (!this.molecule().atoms.length) {
      this.notify('Añade al menos un átomo antes de construir el modelo 3D');
      return;
    }
    this.modelAtomIds.set(ids ?? new Set());
    this.modelOpen.set(true);
    this.activePanel.set(null);
    this.contextMenu.set(null);
  }

  protected openSelectedInModel(): void {
    this.openModel(new Set(this.selectedAtomIds()));
  }
  protected closeModel(): void {
    this.modelOpen.set(false);
  }

  protected selectAll(): void {
    this.selectedAtomIds.set(new Set(this.molecule().atoms.map((atom) => atom.id)));
    this.contextMenu.set(null);
  }

  protected clearSelection(): void {
    this.selectedAtomIds.set(new Set());
  }

  protected deleteSelection(): void {
    const ids = this.selectedAtomIds();
    if (!ids.size) return;
    this.mutate((document) => {
      document.atoms = document.atoms.filter((atom) => !ids.has(atom.id));
      document.bonds = document.bonds.filter(
        (bond) => !ids.has(bond.atomA) && !ids.has(bond.atomB),
      );
    });
    this.selectedAtomIds.set(new Set());
    this.contextMenu.set(null);
    this.notify('Selección eliminada');
  }

  protected duplicateSelection(): void {
    const ids = this.selectedAtomIds();
    if (!ids.size) return;
    const newIds = new Set<string>();
    this.mutate((document) => {
      const idMap = new Map<string, string>();
      const copies = document.atoms
        .filter((atom) => ids.has(atom.id))
        .map((atom) => {
          const copy = createAtom(atom.element, atom.x + 54, atom.y + 54);
          copy.charge = atom.charge;
          idMap.set(atom.id, copy.id);
          newIds.add(copy.id);
          return copy;
        });
      const bonds = document.bonds
        .filter((bond) => ids.has(bond.atomA) && ids.has(bond.atomB))
        .map((bond) => createBond(idMap.get(bond.atomA)!, idMap.get(bond.atomB)!, bond.order));
      document.atoms.push(...copies);
      document.bonds.push(...bonds);
    });
    this.selectedAtomIds.set(newIds);
    this.contextMenu.set(null);
    this.notify('Fragmento duplicado');
  }

  protected applyElementToSelection(symbol: ElementSymbol): void {
    const ids = this.selectedAtomIds();
    if (!ids.size) return;
    this.mutate((document) => {
      document.atoms.forEach((atom) => {
        if (ids.has(atom.id)) atom.element = symbol;
      });
    });
  }

  protected changeCharge(delta: number): void {
    const ids = this.selectedAtomIds();
    if (!ids.size) return;
    this.mutate((document) => {
      document.atoms.forEach((atom) => {
        if (ids.has(atom.id)) atom.charge = Math.max(-4, Math.min(4, atom.charge + delta));
      });
    });
  }

  protected changeZoom(delta: number): void {
    this.zoom.update((value) => Math.max(0.35, Math.min(3.2, Number((value + delta).toFixed(2)))));
  }

  protected resetView(): void {
    this.zoom.set(1);
    this.pan.set({ x: 0, y: 0 });
  }

  protected setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    localStorage.setItem(this.themeKey, mode);
    this.applyTheme(mode);
  }

  protected toggleLayer(layer: keyof typeof this.layers): void {
    this.layers[layer].update((value) => !value);
  }
  protected atomDefinition(symbol: ElementSymbol) {
    return ELEMENT_BY_SYMBOL.get(symbol)!;
  }
  protected atomRadius(atom: Atom): number {
    return atom.element === 'H' ? 22 : atom.element.length > 1 ? 27 : 25;
  }

  protected atomChargeLabel(atom: Atom): string {
    if (!atom.charge) return '';
    const magnitude = Math.abs(atom.charge);
    return (magnitude > 1 ? magnitude : '') + (atom.charge > 0 ? '+' : '−');
  }

  protected implicitHydrogenLabel(atom: Atom): string {
    const count = implicitHydrogensForAtom(this.molecule(), atom);
    if (!count) return '';
    return 'H' + (count > 1 ? this.toSubscriptFormula(String(count)) : '');
  }

  protected bondLines(bond: Bond): BondLine[] {
    const a = this.molecule().atoms.find((atom) => atom.id === bond.atomA);
    const b = this.molecule().atoms.find((atom) => atom.id === bond.atomB);
    if (!a || !b) return [];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const spacing = 7;
    return Array.from({ length: bond.order }, (_, index) => {
      const offset = (index - (bond.order - 1) / 2) * spacing;
      return {
        x1: a.x + nx * offset,
        y1: a.y + ny * offset,
        x2: b.x + nx * offset,
        y2: b.y + ny * offset,
      };
    });
  }

  protected bondMidpoint(bond: Bond): CanvasPoint {
    const a = this.molecule().atoms.find((atom) => atom.id === bond.atomA);
    const b = this.molecule().atoms.find((atom) => atom.id === bond.atomB);
    return { x: ((a?.x ?? 0) + (b?.x ?? 0)) / 2, y: ((a?.y ?? 0) + (b?.y ?? 0)) / 2 };
  }

  protected isSelected(id: string): boolean {
    return this.selectedAtomIds().has(id);
  }

  protected selectionRect(): { x: number; y: number; width: number; height: number } | null {
    const box = this.selectionBox();
    if (!box) return null;
    return {
      x: Math.min(box.startX, box.x),
      y: Math.min(box.startY, box.y),
      width: Math.abs(box.x - box.startX),
      height: Math.abs(box.y - box.startY),
    };
  }

  protected onCanvasPointerDown(event: PointerEvent): void {
    this.contextMenu.set(null);
    const point = this.toMoleculePoint(event);
    if (event.button === 1 || this.activeTool() === 'pan' || this.spacePressed) {
      event.preventDefault();
      this.beginPointer(event, 'pan', point);
      return;
    }
    if (event.button !== 0) return;
    if (this.activeTool() === 'atom') {
      this.mutate((document) =>
        document.atoms.push(createAtom(this.activeElement(), point.x, point.y)),
      );
      return;
    }
    if (this.activeTool() === 'bond') {
      this.bondStartId.set(null);
      this.notify('Selecciona dos átomos para crear el enlace');
      return;
    }
    if (this.activeTool() === 'select') {
      this.beginPointer(event, 'select', point, event.shiftKey);
      this.selectionBox.set({
        startX: point.x,
        startY: point.y,
        x: point.x,
        y: point.y,
        additive: event.shiftKey,
      });
      if (!event.shiftKey) this.selectedAtomIds.set(new Set());
    }
  }

  protected onAtomPointerDown(event: PointerEvent, atom: Atom): void {
    event.stopPropagation();
    this.contextMenu.set(null);
    if (event.button !== 0) return;
    if (this.activeTool() === 'erase') {
      this.deleteAtom(atom.id);
      return;
    }
    if (this.activeTool() === 'atom') {
      const symbol = this.activeElement();
      if (atom.element !== symbol)
        this.mutate((document) => {
          document.atoms.find((candidate) => candidate.id === atom.id)!.element = symbol;
        });
      return;
    }
    if (this.activeTool() === 'bond') {
      this.handleBondTarget(atom.id);
      return;
    }
    if (this.activeTool() === 'pan' || this.spacePressed) {
      this.beginPointer(event, 'pan', this.toMoleculePoint(event));
      return;
    }

    let selected = new Set(this.selectedAtomIds());
    if (event.shiftKey) selected.has(atom.id) ? selected.delete(atom.id) : selected.add(atom.id);
    else if (!selected.has(atom.id)) selected = new Set([atom.id]);
    this.selectedAtomIds.set(selected);
    this.beginPointer(event, 'drag', this.toMoleculePoint(event));
  }

  protected onBondPointerDown(event: PointerEvent, bond: Bond): void {
    event.stopPropagation();
    if (event.button !== 0) return;
    if (this.activeTool() === 'erase') {
      this.mutate((document) => {
        document.bonds = document.bonds.filter((candidate) => candidate.id !== bond.id);
      });
      return;
    }
    if (this.activeTool() === 'bond') {
      const order = this.bondOrder();
      this.mutate((document) => {
        document.bonds.find((candidate) => candidate.id === bond.id)!.order = order;
      });
      return;
    }
    if (this.activeTool() === 'select') this.selectedAtomIds.set(new Set([bond.atomA, bond.atomB]));
  }

  protected onCanvasPointerMove(event: PointerEvent): void {
    const state = this.pointerState;
    if (!state || state.pointerId !== event.pointerId) return;
    const point = this.toMoleculePoint(event);
    const clientDx = event.clientX - state.startClient.x;
    const clientDy = event.clientY - state.startClient.y;
    state.moved ||= Math.hypot(clientDx, clientDy) > 2;
    if (state.mode === 'pan') {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      this.pan.set({
        x: state.startPan.x + (clientDx * this.viewWidth) / rect.width,
        y: state.startPan.y + (clientDy * this.viewHeight) / rect.height,
      });
      return;
    }
    if (state.mode === 'select') {
      const box = this.selectionBox();
      if (box) this.selectionBox.set({ ...box, x: point.x, y: point.y });
      return;
    }
    if (state.mode === 'drag') {
      const dx = point.x - state.startPoint.x;
      const dy = point.y - state.startPoint.y;
      const next = cloneDocument(state.original);
      next.atoms.forEach((atom) => {
        const start = state.atomPositions.get(atom.id);
        if (start) {
          atom.x = start.x + dx;
          atom.y = start.y + dy;
        }
      });
      next.updatedAt = new Date().toISOString();
      this.molecule.set(next);
    }
  }

  protected onCanvasPointerUp(event: PointerEvent): void {
    const state = this.pointerState;
    if (!state || state.pointerId !== event.pointerId) return;
    if (state.mode === 'select') {
      const rect = this.selectionRect();
      if (rect && state.moved) {
        const selected = state.additive ? new Set(this.selectedAtomIds()) : new Set<string>();
        this.molecule().atoms.forEach((atom) => {
          if (
            atom.x >= rect.x &&
            atom.x <= rect.x + rect.width &&
            atom.y >= rect.y &&
            atom.y <= rect.y + rect.height
          )
            selected.add(atom.id);
        });
        this.selectedAtomIds.set(selected);
      }
      this.selectionBox.set(null);
    }
    if (state.mode === 'drag' && state.moved) {
      this.recordHistory(state.original);
      this.persistAutosave();
    }
    try {
      this.canvasRef.nativeElement.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    this.pointerState = null;
  }

  protected onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    this.changeZoom(event.deltaY > 0 ? -0.1 : 0.1);
  }

  protected openContextMenu(event: MouseEvent, atom?: Atom): void {
    event.preventDefault();
    event.stopPropagation();
    if (atom && !this.selectedAtomIds().has(atom.id)) this.selectedAtomIds.set(new Set([atom.id]));
    if (!this.selectedAtomIds().size) return;
    this.contextMenu.set({
      x: Math.min(event.clientX, window.innerWidth - 210),
      y: Math.min(event.clientY, window.innerHeight - 210),
    });
  }

  protected undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.redoStack.push(cloneDocument(this.molecule()));
    this.molecule.set(previous);
    this.selectedAtomIds.set(new Set());
    this.updateHistoryFlags();
    this.persistAutosave();
  }

  protected redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(cloneDocument(this.molecule()));
    this.molecule.set(next);
    this.selectedAtomIds.set(new Set());
    this.updateHistoryFlags();
    this.persistAutosave();
  }

  @HostListener('window:keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    )
      return;
    if (event.code === 'Space') {
      this.spacePressed = true;
      event.preventDefault();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.redo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.selectAll();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.deleteSelection();
      return;
    }
    if (event.key === 'Escape') {
      this.bondStartId.set(null);
      this.selectedAtomIds.set(new Set());
      this.closePanels();
      return;
    }
    const shortcuts: Record<string, EditorTool> = {
      v: 'select',
      h: 'pan',
      a: 'atom',
      b: 'bond',
      e: 'erase',
    };
    const tool = shortcuts[event.key.toLowerCase()];
    if (tool) this.setTool(tool);
    if (event.key === '1' || event.key === '2' || event.key === '3')
      this.setBondOrder(Number(event.key) as 1 | 2 | 3);
  }

  @HostListener('window:keyup', ['$event'])
  protected onKeyUp(event: KeyboardEvent): void {
    if (event.code === 'Space') this.spacePressed = false;
  }

  @HostListener('window:blur')
  protected onWindowBlur(): void {
    this.spacePressed = false;
  }

  private initialDocument(): MoleculeDocument {
    try {
      const saved = localStorage.getItem('molecular.autosave.v1');
      if (saved) {
        const parsed = JSON.parse(saved) as MoleculeDocument;
        if (Array.isArray(parsed.atoms) && Array.isArray(parsed.bonds)) return parsed;
      }
    } catch {
      /* use starter molecule */
    }
    return documentFromPreset(MOLECULE_PRESETS[0]);
  }

  private initialTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem('molecular.theme.v1');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    } catch {
      /* localStorage unavailable */
    }
    return 'auto';
  }

  private loadStoredDocuments(): StoredDocument[] {
    try {
      const parsed = JSON.parse(localStorage.getItem('molecular.library.v1') ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
    document.documentElement.dataset['theme'] = resolved;
  }

  private mutate(mutator: (document: MoleculeDocument) => void): void {
    const before = cloneDocument(this.molecule());
    const next = cloneDocument(before);
    mutator(next);
    next.updatedAt = new Date().toISOString();
    this.molecule.set(next);
    this.recordHistory(before);
    this.persistAutosave();
  }

  private loadDocument(document: MoleculeDocument): void {
    this.molecule.set(cloneDocument(document));
    this.selectedAtomIds.set(new Set());
    this.modelAtomIds.set(new Set());
    this.bondStartId.set(null);
    this.modelOpen.set(false);
    this.undoStack = [];
    this.redoStack = [];
    this.updateHistoryFlags();
    this.resetView();
    this.persistAutosave();
  }

  private recordHistory(previous: MoleculeDocument): void {
    this.undoStack.push(cloneDocument(previous));
    if (this.undoStack.length > 80) this.undoStack.shift();
    this.redoStack = [];
    this.updateHistoryFlags();
  }

  private updateHistoryFlags(): void {
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }
  private persistAutosave(): void {
    try {
      localStorage.setItem(this.autosaveKey, JSON.stringify(this.molecule()));
    } catch {
      /* ignore */
    }
  }

  private beginPointer(
    event: PointerEvent,
    mode: PointerState['mode'],
    point: CanvasPoint,
    additive = false,
  ): void {
    const selected = this.selectedAtomIds();
    const original = cloneDocument(this.molecule());
    this.pointerState = {
      mode,
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startPoint: point,
      startPan: { ...this.pan() },
      original,
      atomPositions: new Map(
        original.atoms
          .filter((atom) => selected.has(atom.id))
          .map((atom) => [atom.id, { x: atom.x, y: atom.y }]),
      ),
      additive,
      moved: false,
    };
    this.canvasRef.nativeElement.setPointerCapture(event.pointerId);
  }

  private toMoleculePoint(event: PointerEvent | WheelEvent): CanvasPoint {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const canvasX = ((event.clientX - rect.left) * this.viewWidth) / rect.width;
    const canvasY = ((event.clientY - rect.top) * this.viewHeight) / rect.height;
    const pan = this.pan();
    const zoom = this.zoom();
    return { x: (canvasX - pan.x) / zoom, y: (canvasY - pan.y) / zoom };
  }

  private handleBondTarget(atomId: string): void {
    const startId = this.bondStartId();
    if (!startId) {
      this.bondStartId.set(atomId);
      return;
    }
    if (startId === atomId) {
      this.bondStartId.set(null);
      return;
    }
    const existing = this.molecule().bonds.find(
      (bond) =>
        (bond.atomA === startId && bond.atomB === atomId) ||
        (bond.atomA === atomId && bond.atomB === startId),
    );
    if (existing)
      this.mutate((document) => {
        document.bonds.find((bond) => bond.id === existing.id)!.order = this.bondOrder();
      });
    else
      this.mutate((document) => document.bonds.push(createBond(startId, atomId, this.bondOrder())));
    this.bondStartId.set(null);
  }

  private deleteAtom(id: string): void {
    this.mutate((document) => {
      document.atoms = document.atoms.filter((atom) => atom.id !== id);
      document.bonds = document.bonds.filter((bond) => bond.atomA !== id && bond.atomB !== id);
    });
    const selected = new Set(this.selectedAtomIds());
    selected.delete(id);
    this.selectedAtomIds.set(selected);
  }

  private createSvgMarkup(): string {
    const molecule = this.molecule();
    const margin = 90;
    const minX = molecule.atoms.length
      ? Math.min(...molecule.atoms.map((atom) => atom.x)) - margin
      : 0;
    const minY = molecule.atoms.length
      ? Math.min(...molecule.atoms.map((atom) => atom.y)) - margin
      : 0;
    const maxX = molecule.atoms.length
      ? Math.max(...molecule.atoms.map((atom) => atom.x)) + margin
      : this.viewWidth;
    const maxY = molecule.atoms.length
      ? Math.max(...molecule.atoms.map((atom) => atom.y)) + margin
      : this.viewHeight;
    const width = Math.max(280, maxX - minX);
    const height = Math.max(220, maxY - minY);
    const bondMarkup = molecule.bonds
      .flatMap((bond) =>
        this.bondLines(bond).map(
          (line) =>
            '<line x1="' +
            line.x1 +
            '" y1="' +
            line.y1 +
            '" x2="' +
            line.x2 +
            '" y2="' +
            line.y2 +
            '"/>',
        ),
      )
      .join('');
    const atomMarkup = molecule.atoms
      .map((atom) => {
        const definition = ELEMENT_BY_SYMBOL.get(atom.element)!;
        const radius = this.atomRadius(atom);
        const charge = this.atomChargeLabel(atom);
        return (
          '<g><circle cx="' +
          atom.x +
          '" cy="' +
          atom.y +
          '" r="' +
          radius +
          '" fill="' +
          definition.color +
          '" stroke="#172033" stroke-width="2"/><text x="' +
          atom.x +
          '" y="' +
          (atom.y + 6) +
          '" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="700" fill="' +
          definition.textColor +
          '">' +
          atom.element +
          '</text>' +
          (charge
            ? '<text x="' +
              (atom.x + radius - 2) +
              '" y="' +
              (atom.y - radius + 4) +
              '" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700">' +
              charge +
              '</text>'
            : '') +
          '</g>'
        );
      })
      .join('');
    return (
      '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="' +
      Math.round(width) +
      '" height="' +
      Math.round(height) +
      '" viewBox="' +
      minX +
      ' ' +
      minY +
      ' ' +
      width +
      ' ' +
      height +
      '"><rect x="' +
      minX +
      '" y="' +
      minY +
      '" width="' +
      width +
      '" height="' +
      height +
      '" fill="#ffffff"/><g stroke="#263142" stroke-width="4" stroke-linecap="round">' +
      bondMarkup +
      '</g>' +
      atomMarkup +
      '</svg>'
    );
  }

  private download(blob: Blob, fileName: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private notify(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(null), 2800);
  }

  private safeFileName(name: string): string {
    return (
      this.normalize(name)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'molecula'
    );
  }
  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private toSubscriptFormula(formula: string): string {
    const subscripts: Record<string, string> = {
      '0': '₀',
      '1': '₁',
      '2': '₂',
      '3': '₃',
      '4': '₄',
      '5': '₅',
      '6': '₆',
      '7': '₇',
      '8': '₈',
      '9': '₉',
    };
    return formula.replace(/\d/g, (digit) => subscripts[digit]);
  }
}
