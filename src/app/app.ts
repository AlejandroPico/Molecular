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
  AtomSymbol,
  ArrowKind,
  Bond,
  BondKind,
  ELEMENTS,
  ELEMENT_BY_SYMBOL,
  MOLECULE_PRESETS,
  MoleculeDocument,
  QUICK_ELEMENTS,
  ReactionArrow,
  bondKindForOrder,
  bondKindOrder,
  calculateStats,
  cloneDocument,
  createAtom,
  createBond,
  createDocument,
  createReactionArrow,
  documentFromPreset,
  implicitHydrogensForAtom,
  validateBondChange,
  validateChargeChange,
  validateElementChange,
} from './core/chemistry.models';
import { generateStructure } from './core/formula-generator';
import { ENCYCLOPEDIA_CHAPTERS } from './core/encyclopedia.data';
import { resolveSolarTheme, SolarTheme } from './core/solar-theme';
import { IconComponent } from './shared/icon.component';
import { ThreeDViewerComponent } from './three-d-viewer/three-d-viewer.component';

type EditorTool = 'select' | 'pan' | 'atom' | 'bond' | 'fragment' | 'arrow' | 'erase';
type PanelName =
  'file' | 'formula' | 'layers' | 'encyclopedia' | 'theme' | 'export' | 'about' | null;
type ThemeMode = 'auto' | SolarTheme;
type SelectionMode = 'direct' | 'rectangle' | 'lasso';
type GridStyle = 'triangular' | 'dots';

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
  target: 'atoms' | 'bond' | 'arrow';
  id?: string;
}
interface StoredDocument {
  id: string;
  name: string;
  document: MoleculeDocument;
  savedAt: string;
}

interface PointerState {
  mode: 'drag' | 'pan' | 'select' | 'lasso' | 'bond' | 'arrow';
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

interface AnnotationPoint extends CanvasPoint {
  rotation?: number;
}

interface AtomAnnotationLayout {
  charge: CanvasPoint | null;
  hydrogen: CanvasPoint | null;
  lonePairs: AnnotationPoint[];
  radicals: CanvasPoint[];
}

interface FragmentTemplate {
  id:
    | 'benzene'
    | 'cyclopropane'
    | 'cyclobutane'
    | 'cyclopentane'
    | 'cyclohexane'
    | 'cyclooctane'
    | 'carbon-chain';
  label: string;
  sides: number;
  aromatic?: boolean;
  chain?: boolean;
}

interface PinchState {
  pointerIds: [number, number];
  startDistance: number;
  startZoom: number;
  moleculeAnchor: CanvasPoint;
}

interface LineDraft {
  start: CanvasPoint;
  end: CanvasPoint;
}

@Component({
  selector: 'app-root',
  imports: [IconComponent, ThreeDViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly version = '0.4.3';
  protected readonly elements = ELEMENTS;
  protected readonly quickElements = QUICK_ELEMENTS;
  protected readonly presets = MOLECULE_PRESETS;
  protected readonly elementBySymbol = ELEMENT_BY_SYMBOL;

  protected readonly molecule = signal<MoleculeDocument>(this.initialDocument());
  protected readonly selectedAtomIds = signal<Set<string>>(new Set());
  protected readonly selectedBondId = signal<string | null>(null);
  protected readonly modelAtomIds = signal<Set<string>>(new Set());
  protected readonly activeTool = signal<EditorTool>('select');
  protected readonly selectionMode = signal<SelectionMode>('direct');
  protected readonly activeElement = signal<AtomSymbol>('C');
  protected readonly bondOrder = signal<1 | 2 | 3>(1);
  protected readonly bondKind = signal<BondKind>('single');
  protected readonly activeBondColor = signal<string | null>(null);
  protected readonly activeArrowKind = signal<ArrowKind>('forward');
  protected readonly activeFragment = signal<FragmentTemplate['id']>('benzene');
  protected readonly bondStartId = signal<string | null>(null);
  protected readonly bondDraft = signal<LineDraft | null>(null);
  protected readonly arrowDraft = signal<LineDraft | null>(null);
  protected readonly lassoPoints = signal<CanvasPoint[]>([]);
  protected readonly activePanel = signal<PanelName>(null);
  protected readonly modelOpen = signal(false);
  protected readonly zoom = signal(1);
  protected readonly pan = signal<CanvasPoint>({ x: 0, y: 0 });
  protected readonly selectionBox = signal<SelectionBox | null>(null);
  protected readonly contextMenu = signal<ContextMenuState | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly searchOpen = signal(false);
  protected readonly encyclopediaQuery = signal('');
  protected readonly encyclopediaChapterId = signal(ENCYCLOPEDIA_CHAPTERS[0].id);
  protected readonly encyclopediaChapters = ENCYCLOPEDIA_CHAPTERS;
  protected readonly periodicQuery = signal('');
  protected readonly periodicPickerOpen = signal(false);
  protected readonly periodicTargetAtomId = signal<string | null>(null);
  protected readonly formulaInput = signal('');
  protected readonly formulaNotice = signal('');
  protected readonly themeMode = signal<ThemeMode>(this.initialTheme());
  protected readonly resolvedTheme = signal<SolarTheme>('morning');
  protected readonly themeLocationStatus = signal('Horario local aproximado');
  protected readonly toast = signal<string | null>(null);
  protected readonly savedDocuments = signal<StoredDocument[]>(this.loadStoredDocuments());
  protected readonly canUndo = signal(false);
  protected readonly canRedo = signal(false);
  protected readonly gridStyle = signal<GridStyle>('triangular');

  protected readonly fragmentTemplates: ReadonlyArray<FragmentTemplate> = [
    { id: 'benzene', label: 'Benceno', sides: 6, aromatic: true },
    { id: 'cyclopropane', label: 'Ciclopropano', sides: 3 },
    { id: 'cyclobutane', label: 'Ciclobutano', sides: 4 },
    { id: 'cyclopentane', label: 'Ciclopentano', sides: 5 },
    { id: 'cyclohexane', label: 'Ciclohexano', sides: 6 },
    { id: 'cyclooctane', label: 'Ciclooctano', sides: 8 },
    { id: 'carbon-chain', label: 'Cadena de carbono', sides: 6, chain: true },
  ];

  protected readonly bondOptions: ReadonlyArray<{ kind: BondKind; label: string; glyph: string }> =
    [
      { kind: 'single', label: 'Simple', glyph: '—' },
      { kind: 'double', label: 'Doble', glyph: '=' },
      { kind: 'triple', label: 'Triple', glyph: '≡' },
      { kind: 'up', label: 'Arriba', glyph: '▲' },
      { kind: 'down', label: 'Abajo', glyph: '▱' },
      { kind: 'delocalized', label: 'Deslocalizado', glyph: '┄' },
      { kind: 'hydrogen', label: 'Hidrógeno', glyph: '···' },
      { kind: 'aromatic', label: 'Aromático', glyph: '⌁' },
      { kind: 'dative', label: 'Dativo', glyph: '→' },
      { kind: 'any', label: 'Indeterminado', glyph: '∿' },
    ];

  protected readonly layers = {
    grid: signal(true),
    atomLabels: signal(true),
    atomIndexes: signal(false),
    bondOrders: signal(false),
    implicitHydrogens: signal(true),
    valenceWarnings: signal(true),
    skeletal: signal(false),
  };

  protected readonly stats = computed(() => calculateStats(this.molecule()));
  protected readonly formulaDisplay = computed(() => this.toSubscriptFormula(this.stats().formula));
  protected readonly selectedAtoms = computed(() =>
    this.molecule().atoms.filter((atom) => this.selectedAtomIds().has(atom.id)),
  );
  protected readonly selectedBond = computed(
    () => this.molecule().bonds.find((bond) => bond.id === this.selectedBondId()) ?? null,
  );
  protected readonly selectedBondAtoms = computed(() => {
    const bond = this.selectedBond();
    if (!bond) return null;
    const atomA = this.molecule().atoms.find((atom) => atom.id === bond.atomA);
    const atomB = this.molecule().atoms.find((atom) => atom.id === bond.atomB);
    return atomA && atomB ? { atomA, atomB } : null;
  });
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
  protected readonly filteredEncyclopediaChapters = computed(() => {
    const query = this.normalize(this.encyclopediaQuery());
    if (!query) return this.encyclopediaChapters;
    return this.encyclopediaChapters.filter((chapter) =>
      this.normalize(
        [
          chapter.title,
          chapter.eyebrow,
          chapter.summary,
          ...chapter.sections.flatMap((section) => [
            section.title,
            ...section.paragraphs,
            ...(section.points ?? []),
            section.example ?? '',
          ]),
        ].join(' '),
      ).includes(query),
    );
  });
  protected readonly activeEncyclopediaChapter = computed(
    () =>
      this.encyclopediaChapters.find((chapter) => chapter.id === this.encyclopediaChapterId()) ??
      this.encyclopediaChapters[0],
  );
  protected readonly filteredPeriodicElements = computed(() => {
    const query = this.normalize(this.periodicQuery());
    if (!query) return this.elements;
    return this.elements.filter((element) =>
      this.normalize(
        `${element.atomicNumber} ${element.name} ${element.symbol} ${element.group}`,
      ).includes(query),
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
  private readonly themeLocationKey = 'molecular.theme.location.v1';
  private undoStack: MoleculeDocument[] = [];
  private redoStack: MoleculeDocument[] = [];
  private pointerState: PointerState | null = null;
  private readonly touchPointers = new Map<number, CanvasPoint>();
  private pinchState: PinchState | null = null;
  private spacePressed = false;
  private toastTimer = 0;

  constructor() {
    this.applyTheme(this.themeMode());
  }

  protected setTool(tool: EditorTool): void {
    this.activeTool.set(tool);
    if (tool !== 'bond') this.bondStartId.set(null);
    if (tool !== 'bond') this.bondDraft.set(null);
    if (tool !== 'arrow') this.arrowDraft.set(null);
    if (tool !== 'select') this.lassoPoints.set([]);
    this.contextMenu.set(null);
  }

  protected setSelectionMode(mode: SelectionMode): void {
    this.selectionMode.set(mode);
    this.activeTool.set('select');
    this.selectionBox.set(null);
    this.lassoPoints.set([]);
  }

  protected setElement(symbol: AtomSymbol): boolean {
    if (this.selectedAtomIds().size && !this.applyElementToSelection(symbol)) return false;
    this.activeElement.set(symbol);
    this.activeTool.set('atom');
    return true;
  }

  protected setBondOrder(order: 1 | 2 | 3): void {
    this.bondOrder.set(order);
    this.bondKind.set(bondKindForOrder(order));
    this.activeTool.set('bond');
  }

  protected setBondKind(kind: BondKind): void {
    if (kind === 'wedge') kind = 'up';
    if (kind === 'hash') kind = 'down';
    this.bondKind.set(kind);
    this.bondOrder.set(bondKindOrder(kind));
    this.activeTool.set('bond');
    this.bondStartId.set(null);
  }

  protected setArrowKind(kind: ArrowKind): void {
    this.activeArrowKind.set(kind);
    this.activeTool.set('arrow');
    this.arrowDraft.set(null);
    this.contextMenu.set(null);
  }

  protected setGridStyle(style: GridStyle): void {
    this.gridStyle.set(style);
    if (!this.layers.grid()) this.layers.grid.set(true);
  }

  protected setFragment(fragment: FragmentTemplate['id']): void {
    this.activeFragment.set(fragment);
    this.activeTool.set('fragment');
    this.bondStartId.set(null);
    this.notify(
      'Haz clic en el lienzo para insertar ' + this.fragmentLabel(fragment).toLowerCase(),
    );
  }

  protected openPeriodicPicker(event?: Event, atomId?: string): void {
    event?.stopPropagation();
    this.periodicQuery.set('');
    this.periodicTargetAtomId.set(atomId ?? null);
    this.periodicPickerOpen.set(true);
    this.activePanel.set(null);
    this.contextMenu.set(null);
  }

  protected closePeriodicPicker(): void {
    this.periodicPickerOpen.set(false);
    this.periodicQuery.set('');
    this.periodicTargetAtomId.set(null);
  }

  protected selectPeriodicElement(symbol: AtomSymbol): void {
    const atomId = this.periodicTargetAtomId();
    if (atomId) {
      if (this.changeAtomElement(atomId, symbol)) this.closePeriodicPicker();
      return;
    }
    if (this.setElement(symbol)) this.closePeriodicPicker();
  }

  protected togglePanel(panel: Exclude<PanelName, null>): void {
    this.activePanel.update((current) => (current === panel ? null : panel));
    this.contextMenu.set(null);
  }

  protected toggleSearch(): void {
    this.searchOpen.update((value) => !value);
    if (!this.searchOpen()) this.searchQuery.set('');
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
      document.arrows = [];
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

  protected generateFromFormula(): void {
    try {
      const result = generateStructure(this.formulaInput());
      this.loadDocument(result.document);
      this.formulaNotice.set(result.notice);
      this.activePanel.set(null);
      this.notify(
        result.inputKind === 'smiles'
          ? 'Estructura SMILES generada'
          : 'Borrador molecular generado',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se ha podido interpretar la entrada.';
      this.formulaNotice.set(message);
      this.notify(message);
    }
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

  protected toggleModel(): void {
    if (this.modelOpen()) this.closeModel();
    else this.openModel();
  }

  protected openSelectedInModel(): void {
    this.openModel(new Set(this.selectedAtomIds()));
  }

  protected openBondInModel(): void {
    const bond = this.selectedBond();
    if (bond) this.openModel(new Set([bond.atomA, bond.atomB]));
  }
  protected closeModel(): void {
    this.modelOpen.set(false);
    this.modelAtomIds.set(new Set());
  }

  protected selectAll(): void {
    this.selectedBondId.set(null);
    this.selectedAtomIds.set(new Set(this.molecule().atoms.map((atom) => atom.id)));
    this.contextMenu.set(null);
  }

  protected clearSelection(): void {
    this.selectedAtomIds.set(new Set());
    this.selectedBondId.set(null);
  }

  protected deleteSelection(): void {
    const selectedBondId = this.selectedBondId();
    if (selectedBondId) {
      this.deleteBond(selectedBondId);
      this.selectedBondId.set(null);
      return;
    }
    const ids = this.selectedAtomIds();
    if (!ids.size) return;
    this.mutate((document) => {
      const affected = document.bonds
        .filter((bond) => ids.has(bond.atomA) || ids.has(bond.atomB))
        .flatMap((bond) => [bond.atomA, bond.atomB]);
      this.clearHydrogenOverrides(document, affected);
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
          copy.lonePairs = atom.lonePairs;
          copy.radicalElectrons = atom.radicalElectrons;
          copy.implicitHydrogenOverride = atom.implicitHydrogenOverride;
          idMap.set(atom.id, copy.id);
          newIds.add(copy.id);
          return copy;
        });
      const bonds = document.bonds
        .filter((bond) => ids.has(bond.atomA) && ids.has(bond.atomB))
        .map((bond) =>
          createBond(
            idMap.get(bond.atomA)!,
            idMap.get(bond.atomB)!,
            bond.order,
            bond.kind ?? bondKindForOrder(bond.order),
            bond.color,
          ),
        );
      document.atoms.push(...copies);
      document.bonds.push(...bonds);
    });
    this.selectedAtomIds.set(newIds);
    this.selectedBondId.set(null);
    this.contextMenu.set(null);
    this.notify('Fragmento duplicado');
  }

  protected applyElementToSelection(symbol: AtomSymbol): boolean {
    const ids = this.selectedAtomIds();
    if (!ids.size) return false;
    const invalid = this.molecule()
      .atoms.filter((atom) => ids.has(atom.id))
      .map((atom) => validateElementChange(this.molecule(), atom, symbol))
      .find((result) => !result.valid);
    if (invalid) {
      this.notify(invalid.message);
      return false;
    }
    this.mutate((document) => {
      document.atoms.forEach((atom) => {
        if (ids.has(atom.id)) {
          atom.element = symbol;
          atom.implicitHydrogenOverride = undefined;
        }
      });
    });
    this.notify('Selección convertida en ' + this.atomDefinition(symbol).name);
    return true;
  }

  protected changeAtomElement(atomId: string, symbol: AtomSymbol): boolean {
    const atom = this.molecule().atoms.find((candidate) => candidate.id === atomId);
    if (!atom) return false;
    const validation = validateElementChange(this.molecule(), atom, symbol);
    if (!validation.valid) {
      this.notify(validation.message);
      return false;
    }
    this.mutate((document) => {
      const target = document.atoms.find((candidate) => candidate.id === atomId)!;
      target.element = symbol;
      target.implicitHydrogenOverride = undefined;
    });
    return true;
  }

  protected changeCharge(delta: number): void {
    const ids = this.selectedAtomIds();
    if (!ids.size) {
      this.notify('Selecciona al menos un átomo para cambiar su carga');
      return;
    }
    const changes = this.molecule()
      .atoms.filter((atom) => ids.has(atom.id))
      .map((atom) => ({ atom, charge: Math.max(-4, Math.min(4, atom.charge + delta)) }));
    const invalid = changes
      .map(({ atom, charge }) => validateChargeChange(this.molecule(), atom, charge))
      .find((result) => !result.valid);
    if (invalid) {
      this.notify(invalid.message);
      return;
    }
    this.mutate((document) => {
      document.atoms.forEach((atom) => {
        if (ids.has(atom.id)) {
          atom.charge = Math.max(-4, Math.min(4, atom.charge + delta));
          atom.implicitHydrogenOverride = undefined;
        }
      });
    });
    this.notify(delta > 0 ? 'Carga formal aumentada' : 'Carga formal reducida');
  }

  protected changeLonePairs(delta: number): void {
    const ids = this.selectedAtomIds();
    if (!ids.size) {
      this.notify('Selecciona al menos un átomo para editar sus pares solitarios');
      return;
    }
    this.mutate((document) => {
      document.atoms.forEach((atom) => {
        if (ids.has(atom.id)) atom.lonePairs = Math.max(0, Math.min(4, atom.lonePairs + delta));
      });
    });
    this.notify(delta > 0 ? 'Par solitario añadido' : 'Par solitario retirado');
  }

  protected changeRadicals(delta: number): void {
    const ids = this.selectedAtomIds();
    if (!ids.size) {
      this.notify('Selecciona al menos un átomo para editar electrones desapareados');
      return;
    }
    this.mutate((document) => {
      document.atoms.forEach((atom) => {
        if (ids.has(atom.id))
          atom.radicalElectrons = Math.max(0, Math.min(2, atom.radicalElectrons + delta));
      });
    });
    this.notify(delta > 0 ? 'Electrón desapareado añadido' : 'Electrón desapareado retirado');
  }

  protected changeAtomCharge(atomId: string, delta: number): void {
    const atom = this.molecule().atoms.find((candidate) => candidate.id === atomId);
    if (!atom) return;
    const charge = Math.max(-4, Math.min(4, atom.charge + delta));
    if (charge === atom.charge) {
      this.notify('La carga formal del editor está limitada entre −4 y +4');
      return;
    }
    const validation = validateChargeChange(this.molecule(), atom, charge);
    if (!validation.valid) {
      this.notify(validation.message);
      return;
    }
    this.mutate((document) => {
      const target = document.atoms.find((candidate) => candidate.id === atomId)!;
      target.charge = charge;
      target.implicitHydrogenOverride = undefined;
    });
  }

  protected changeAtomLonePairs(atomId: string, delta: number): void {
    this.mutate((document) => {
      const atom = document.atoms.find((candidate) => candidate.id === atomId);
      if (atom) atom.lonePairs = Math.max(0, Math.min(4, atom.lonePairs + delta));
    });
  }

  protected changeAtomRadicals(atomId: string, delta: number): void {
    this.mutate((document) => {
      const atom = document.atoms.find((candidate) => candidate.id === atomId);
      if (atom) atom.radicalElectrons = Math.max(0, Math.min(2, atom.radicalElectrons + delta));
    });
  }

  protected setBondColor(color: string | null): void {
    this.activeBondColor.set(color);
    const bondId = this.selectedBondId();
    if (bondId) this.applyBondColor(bondId, color);
  }

  protected applyBondColor(bondId: string, color: string | null): void {
    this.mutate((document) => {
      const bond = document.bonds.find((candidate) => candidate.id === bondId);
      if (bond) bond.color = color ?? undefined;
    });
  }

  protected selectionValue(property: 'charge' | 'lonePairs' | 'radicalElectrons'): string {
    const atoms = this.selectedAtoms();
    if (!atoms.length) return '0';
    const value = atoms[0][property];
    if (!atoms.every((atom) => atom[property] === value)) return 'Mixto';
    if (property === 'charge') return value > 0 ? `+${value}` : String(value);
    return String(value);
  }

  protected changeZoom(delta: number): void {
    this.zoom.update((value) => Math.max(0.35, Math.min(3.2, Number((value + delta).toFixed(2)))));
  }

  protected resetView(): void {
    this.zoom.set(1);
    this.pan.set({ x: 0, y: 0 });
  }

  protected cleanLayout(): void {
    if (this.molecule().atoms.length < 2) return;
    this.mutate((document) => {
      const positions = new Map(document.atoms.map((atom) => [atom.id, { x: atom.x, y: atom.y }]));
      const targetLength = 112;
      for (let iteration = 0; iteration < 90; iteration += 1) {
        for (const bond of document.bonds) {
          const a = positions.get(bond.atomA);
          const b = positions.get(bond.atomB);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const correction = ((distance - targetLength) / distance) * 0.13;
          a.x += dx * correction * 0.5;
          a.y += dy * correction * 0.5;
          b.x -= dx * correction * 0.5;
          b.y -= dy * correction * 0.5;
        }
        for (let first = 0; first < document.atoms.length; first += 1) {
          for (let second = first + 1; second < document.atoms.length; second += 1) {
            const a = positions.get(document.atoms[first].id)!;
            const b = positions.get(document.atoms[second].id)!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.max(1, Math.hypot(dx, dy));
            if (distance > 86) continue;
            const force = ((86 - distance) / distance) * 0.06;
            a.x -= dx * force;
            a.y -= dy * force;
            b.x += dx * force;
            b.y += dy * force;
          }
        }
      }
      document.atoms.forEach((atom) => {
        const position = positions.get(atom.id)!;
        atom.x = position.x;
        atom.y = position.y;
      });
    });
    this.notify('Estructura ordenada localmente');
  }

  protected setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    localStorage.setItem(this.themeKey, mode);
    this.applyTheme(mode);
  }

  protected openEncyclopediaChapter(id: string): void {
    this.encyclopediaChapterId.set(id);
  }

  protected locateForTheme(): void {
    if (!navigator.geolocation) {
      this.themeLocationStatus.set('Ubicación no disponible en este navegador');
      return;
    }
    this.themeLocationStatus.set('Calculando la luz solar local…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = { latitude: coords.latitude, longitude: coords.longitude };
        localStorage.setItem(this.themeLocationKey, JSON.stringify(coordinates));
        this.themeLocationStatus.set('Amanecer y ocaso ajustados a tu ubicación');
        if (this.themeMode() === 'auto') this.applyTheme('auto');
      },
      () => this.themeLocationStatus.set('Sin permiso: se usa el horario local aproximado'),
      { enableHighAccuracy: false, maximumAge: 86_400_000, timeout: 8000 },
    );
  }

  protected toggleLayer(layer: keyof typeof this.layers): void {
    this.layers[layer].update((value) => !value);
  }
  protected atomDefinition(symbol: AtomSymbol) {
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

  protected bondVisualKind(bond: Bond): BondKind {
    if (bond.kind === 'wedge') return 'up';
    if (bond.kind === 'hash') return 'down';
    return bond.kind ?? bondKindForOrder(bond.order);
  }

  protected bondKindLabel(kind: BondKind): string {
    const labels: Record<BondKind, string> = {
      single: 'Enlace simple',
      double: 'Enlace doble',
      triple: 'Enlace triple',
      up: 'Enlace arriba',
      down: 'Enlace abajo',
      delocalized: 'Enlace deslocalizado',
      hydrogen: 'Puente de hidrógeno',
      aromatic: 'Enlace aromático',
      dative: 'Enlace dativo',
      any: 'Enlace indeterminado',
      wedge: 'Enlace arriba',
      hash: 'Enlace abajo',
    };
    return labels[kind];
  }

  protected arrowLines(arrow: ReactionArrow): BondLine[] {
    const dx = arrow.x2 - arrow.x1;
    const dy = arrow.y2 - arrow.y1;
    const length = Math.hypot(dx, dy) || 1;
    const nx = (-dy / length) * 5;
    const ny = (dx / length) * 5;
    if (arrow.kind !== 'equilibrium')
      return [{ x1: arrow.x1, y1: arrow.y1, x2: arrow.x2, y2: arrow.y2 }];
    return [
      { x1: arrow.x1 + nx, y1: arrow.y1 + ny, x2: arrow.x2 + nx, y2: arrow.y2 + ny },
      { x1: arrow.x2 - nx, y1: arrow.y2 - ny, x2: arrow.x1 - nx, y2: arrow.y1 - ny },
    ];
  }

  protected annotationLayout(atom: Atom): AtomAnnotationLayout {
    const neighbours = this.molecule()
      .bonds.filter((bond) => bond.atomA === atom.id || bond.atomB === atom.id)
      .map((bond) => {
        const otherId = bond.atomA === atom.id ? bond.atomB : bond.atomA;
        const other = this.molecule().atoms.find((candidate) => candidate.id === otherId);
        return other ? Math.atan2(other.y - atom.y, other.x - atom.x) : null;
      })
      .filter((angle): angle is number => angle != null);
    const candidates = Array.from({ length: 12 }, (_, index) => (index * Math.PI * 2) / 12);
    const used: number[] = [];
    const angularDistance = (a: number, b: number): number =>
      Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const choose = (preferred: number): number => {
      const available = candidates.filter(
        (angle) => !used.some((taken) => angularDistance(angle, taken) < 0.46),
      );
      const angle = (available.length ? available : candidates).sort((a, b) => {
        const penalty = (candidate: number): number =>
          neighbours.reduce(
            (sum, bondAngle) =>
              sum + Math.max(0, 0.82 - angularDistance(candidate, bondAngle)) * 18,
            0,
          ) +
          used.reduce(
            (sum, taken) => sum + Math.max(0, 0.72 - angularDistance(candidate, taken)) * 28,
            0,
          ) +
          angularDistance(candidate, preferred) * 0.7;
        return penalty(a) - penalty(b);
      })[0];
      used.push(angle);
      return angle;
    };
    const point = (angle: number, distance: number): CanvasPoint => ({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
    const radius = this.atomRadius(atom);
    const hydrogen = this.implicitHydrogenLabel(atom) ? point(choose(0), radius + 20) : null;
    const charge = atom.charge ? point(choose(-Math.PI / 4), radius + 18) : null;
    const lonePairs = Array.from({ length: atom.lonePairs ?? 0 }, (_, index) => {
      const angle = choose(-Math.PI / 2 + (index * Math.PI * 2) / Math.max(1, atom.lonePairs));
      return { ...point(angle, radius + 16), rotation: (angle * 180) / Math.PI + 90 };
    });
    const radicals = Array.from({ length: atom.radicalElectrons ?? 0 }, (_, index) =>
      point(choose(Math.PI / 4 + index * 0.7), radius + 19),
    );
    return { charge, hydrogen, lonePairs, radicals };
  }

  protected wedgePoints(bond: Bond): string {
    const endpoints = this.bondEndpoints(bond);
    if (!endpoints) return '';
    const { a, b } = endpoints;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = (-dy / length) * 10;
    const ny = (dx / length) * 10;
    return `${a.x},${a.y} ${b.x + nx},${b.y + ny} ${b.x - nx},${b.y - ny}`;
  }

  protected hashedBondLines(bond: Bond): BondLine[] {
    const endpoints = this.bondEndpoints(bond);
    if (!endpoints) return [];
    const { a, b } = endpoints;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    return Array.from({ length: 7 }, (_, index) => {
      const t = (index + 1) / 8;
      const halfWidth = t * 10;
      const x = a.x + dx * t;
      const y = a.y + dy * t;
      return {
        x1: x - nx * halfWidth,
        y1: y - ny * halfWidth,
        x2: x + nx * halfWidth,
        y2: y + ny * halfWidth,
      };
    });
  }

  protected wavyBondPath(bond: Bond): string {
    const endpoints = this.bondEndpoints(bond);
    if (!endpoints) return '';
    const { a, b } = endpoints;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const points = Array.from({ length: 13 }, (_, index) => {
      const t = index / 12;
      const wave = index === 0 || index === 12 ? 0 : index % 2 ? 4 : -4;
      return `${a.x + dx * t + nx * wave},${a.y + dy * t + ny * wave}`;
    });
    return 'M ' + points.join(' L ');
  }

  protected bondMidpoint(bond: Bond): CanvasPoint {
    const a = this.molecule().atoms.find((atom) => atom.id === bond.atomA);
    const b = this.molecule().atoms.find((atom) => atom.id === bond.atomB);
    return { x: ((a?.x ?? 0) + (b?.x ?? 0)) / 2, y: ((a?.y ?? 0) + (b?.y ?? 0)) / 2 };
  }

  protected isSelected(id: string): boolean {
    return this.selectedAtomIds().has(id);
  }

  protected isBondSelected(id: string): boolean {
    return this.selectedBondId() === id;
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

  protected lassoPath(): string {
    return this.lassoPoints()
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
  }

  protected onCanvasPointerDown(event: PointerEvent): void {
    this.contextMenu.set(null);
    if (this.registerTouchPointer(event)) return;
    const point = this.toMoleculePoint(event);
    if (event.button === 1 || this.activeTool() === 'pan' || this.spacePressed) {
      event.preventDefault();
      this.beginPointer(event, 'pan', point);
      return;
    }
    if (event.button !== 0) return;
    this.selectedBondId.set(null);
    if (this.activeTool() === 'atom') {
      this.mutate((document) =>
        document.atoms.push(createAtom(this.activeElement(), point.x, point.y)),
      );
      return;
    }
    if (this.activeTool() === 'bond') {
      const startId = this.bondStartId();
      if (startId) {
        const endpoint = createAtom('C', point.x, point.y);
        const validation = validateBondChange(
          { ...this.molecule(), atoms: [...this.molecule().atoms, endpoint] },
          startId,
          endpoint.id,
          this.bondOrder(),
          this.bondKind(),
        );
        if (!validation.valid) {
          this.notify(validation.message);
          this.bondStartId.set(null);
          return;
        }
        const bond = createBond(
          startId,
          endpoint.id,
          this.bondOrder(),
          this.bondKind(),
          this.activeBondColor() ?? undefined,
        );
        this.mutate((document) => {
          this.clearHydrogenOverrides(document, [startId]);
          document.atoms.push(endpoint);
          document.bonds.push(bond);
        });
        this.selectedAtomIds.set(new Set());
        this.selectedBondId.set(bond.id);
        this.bondStartId.set(null);
        return;
      }
      this.beginPointer(event, 'bond', point);
      this.bondDraft.set({ start: point, end: point });
      return;
    }
    if (this.activeTool() === 'arrow') {
      this.beginPointer(event, 'arrow', point);
      this.arrowDraft.set({ start: point, end: point });
      return;
    }
    if (this.activeTool() === 'fragment') {
      this.insertFragment(this.activeFragment(), point);
      return;
    }
    if (this.activeTool() === 'select') {
      if (this.selectionMode() === 'direct') {
        if (!event.shiftKey) this.selectedAtomIds.set(new Set());
        return;
      }
      if (this.selectionMode() === 'lasso') {
        this.beginPointer(event, 'lasso', point, event.shiftKey);
        this.lassoPoints.set([point]);
        if (!event.shiftKey) this.selectedAtomIds.set(new Set());
        return;
      }
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
    if (this.registerTouchPointer(event)) return;
    if (event.button !== 0) return;
    this.selectedBondId.set(null);
    if (this.activeTool() === 'erase') {
      this.deleteAtom(atom.id);
      return;
    }
    if (this.activeTool() === 'atom') {
      const symbol = this.activeElement();
      if (atom.element !== symbol) {
        const validation = validateElementChange(this.molecule(), atom, symbol);
        if (!validation.valid) {
          this.notify(validation.message);
          return;
        }
        this.mutate((document) => {
          const target = document.atoms.find((candidate) => candidate.id === atom.id)!;
          target.element = symbol;
          target.implicitHydrogenOverride = undefined;
        });
      }
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
    if (this.registerTouchPointer(event)) return;
    if (event.button !== 0) return;
    if (this.activeTool() === 'erase') {
      this.mutate((document) => {
        document.bonds = document.bonds.filter((candidate) => candidate.id !== bond.id);
      });
      return;
    }
    if (this.activeTool() === 'bond') {
      const order = this.bondOrder();
      const validation = validateBondChange(
        this.molecule(),
        bond.atomA,
        bond.atomB,
        order,
        this.bondKind(),
      );
      if (!validation.valid) {
        this.notify(validation.message);
        return;
      }
      this.mutate((document) => {
        this.clearHydrogenOverrides(document, [bond.atomA, bond.atomB]);
        const target = document.bonds.find((candidate) => candidate.id === bond.id)!;
        target.order = order;
        target.kind = this.bondKind();
      });
      return;
    }
    if (this.activeTool() === 'select') {
      this.selectedAtomIds.set(new Set());
      this.selectedBondId.set(bond.id);
    }
  }

  protected onArrowPointerDown(event: PointerEvent, arrow: ReactionArrow): void {
    event.stopPropagation();
    if (event.button !== 0) return;
    if (this.activeTool() === 'erase') {
      this.deleteArrow(arrow.id);
      return;
    }
    if (this.activeTool() === 'arrow') this.applyArrowKind(arrow.id, this.activeArrowKind());
  }

  protected onCanvasPointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch' && this.touchPointers.has(event.pointerId)) {
      this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.pinchState) {
        event.preventDefault();
        this.updatePinch();
        return;
      }
    }
    const state = this.pointerState;
    if (!state || state.pointerId !== event.pointerId) return;
    const point = this.toMoleculePoint(event);
    const clientDx = event.clientX - state.startClient.x;
    const clientDy = event.clientY - state.startClient.y;
    state.moved ||= Math.hypot(clientDx, clientDy) > 2;
    if (state.mode === 'pan') {
      const startCanvas = this.toCanvasPoint(state.startClient.x, state.startClient.y);
      const currentCanvas = this.toCanvasPoint(event.clientX, event.clientY);
      this.pan.set({
        x: state.startPan.x + currentCanvas.x - startCanvas.x,
        y: state.startPan.y + currentCanvas.y - startCanvas.y,
      });
      return;
    }
    if (state.mode === 'select') {
      const box = this.selectionBox();
      if (box) this.selectionBox.set({ ...box, x: point.x, y: point.y });
      return;
    }
    if (state.mode === 'lasso') {
      const points = this.lassoPoints();
      const previous = points[points.length - 1];
      if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 5)
        this.lassoPoints.set([...points, point]);
      return;
    }
    if (state.mode === 'bond') {
      const draft = this.bondDraft();
      if (draft) this.bondDraft.set({ ...draft, end: this.snapLineEnd(draft.start, point) });
      return;
    }
    if (state.mode === 'arrow') {
      const draft = this.arrowDraft();
      if (draft) this.arrowDraft.set({ ...draft, end: this.snapLineEnd(draft.start, point) });
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
    if (event.pointerType === 'touch' && this.touchPointers.has(event.pointerId)) {
      this.touchPointers.delete(event.pointerId);
      if (this.pinchState) {
        this.pinchState = null;
        this.pointerState = null;
        this.selectionBox.set(null);
        try {
          this.canvasRef.nativeElement.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
        return;
      }
    }
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
    if (state.mode === 'lasso') {
      const polygon = this.lassoPoints();
      if (polygon.length > 2) {
        const selected = state.additive ? new Set(this.selectedAtomIds()) : new Set<string>();
        this.molecule().atoms.forEach((atom) => {
          if (this.pointInPolygon({ x: atom.x, y: atom.y }, polygon)) selected.add(atom.id);
        });
        this.selectedAtomIds.set(selected);
      }
      this.lassoPoints.set([]);
    }
    if (state.mode === 'bond') {
      const draft = this.bondDraft();
      if (draft && Math.hypot(draft.end.x - draft.start.x, draft.end.y - draft.start.y) >= 28) {
        const first = createAtom('C', draft.start.x, draft.start.y);
        const second = createAtom('C', draft.end.x, draft.end.y);
        const bond = createBond(
          first.id,
          second.id,
          this.bondOrder(),
          this.bondKind(),
          this.activeBondColor() ?? undefined,
        );
        this.mutate((document) => {
          document.atoms.push(first, second);
          document.bonds.push(bond);
        });
        this.selectedAtomIds.set(new Set());
        this.selectedBondId.set(bond.id);
        this.notify(`${this.bondKindLabel(this.bondKind())} creado con extremos editables`);
      }
      this.bondDraft.set(null);
    }
    if (state.mode === 'arrow') {
      const draft = this.arrowDraft();
      if (draft && Math.hypot(draft.end.x - draft.start.x, draft.end.y - draft.start.y) >= 38) {
        this.mutate((document) =>
          document.arrows.push(
            createReactionArrow(
              this.activeArrowKind(),
              draft.start.x,
              draft.start.y,
              draft.end.x,
              draft.end.y,
            ),
          ),
        );
        this.notify('Flecha química insertada');
      }
      this.arrowDraft.set(null);
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
    const anchor = this.toCanvasPoint(event.clientX, event.clientY);
    const moleculePoint = this.toMoleculePoint(event);
    const factor = Math.exp(-event.deltaY * 0.0012);
    const nextZoom = Math.max(0.35, Math.min(3.2, this.zoom() * factor));
    this.zoom.set(Number(nextZoom.toFixed(3)));
    this.pan.set({
      x: anchor.x - moleculePoint.x * nextZoom,
      y: anchor.y - moleculePoint.y * nextZoom,
    });
  }

  protected openContextMenu(event: MouseEvent, atom?: Atom): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedBondId.set(null);
    if (atom && !this.selectedAtomIds().has(atom.id)) this.selectedAtomIds.set(new Set([atom.id]));
    if (!this.selectedAtomIds().size) return;
    this.contextMenu.set({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 274)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 438)),
      target: 'atoms',
    });
  }

  protected openBondContextMenu(event: MouseEvent, bond: Bond): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedAtomIds.set(new Set());
    this.selectedBondId.set(bond.id);
    this.contextMenu.set({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 306)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 472)),
      target: 'bond',
      id: bond.id,
    });
  }

  protected openArrowContextMenu(event: MouseEvent, arrow: ReactionArrow): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedAtomIds.set(new Set());
    this.selectedBondId.set(null);
    this.contextMenu.set({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 286)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 320)),
      target: 'arrow',
      id: arrow.id,
    });
  }

  protected applyBondKind(bondId: string | undefined, kind: BondKind): void {
    if (!bondId) return;
    const bond = this.molecule().bonds.find((candidate) => candidate.id === bondId);
    if (!bond) return;
    const order = bondKindOrder(kind);
    const validation = validateBondChange(this.molecule(), bond.atomA, bond.atomB, order, kind);
    if (!validation.valid) {
      this.notify(validation.message);
      return;
    }
    this.mutate((document) => {
      this.clearHydrogenOverrides(document, [bond.atomA, bond.atomB]);
      const target = document.bonds.find((candidate) => candidate.id === bondId)!;
      target.kind = kind;
      target.order = order;
    });
    this.contextMenu.set(null);
    this.notify(`${this.bondKindLabel(kind)} aplicado`);
  }

  protected deleteBond(bondId: string | undefined): void {
    if (!bondId) return;
    this.mutate((document) => {
      const bond = document.bonds.find((candidate) => candidate.id === bondId);
      if (bond) this.clearHydrogenOverrides(document, [bond.atomA, bond.atomB]);
      document.bonds = document.bonds.filter((candidate) => candidate.id !== bondId);
    });
    this.contextMenu.set(null);
    if (this.selectedBondId() === bondId) this.selectedBondId.set(null);
    this.notify('Enlace eliminado');
  }

  protected applyArrowKind(arrowId: string | undefined, kind: ArrowKind): void {
    if (!arrowId) return;
    this.mutate((document) => {
      const arrow = document.arrows.find((candidate) => candidate.id === arrowId);
      if (arrow) arrow.kind = kind;
    });
    this.contextMenu.set(null);
  }

  protected deleteArrow(arrowId: string | undefined): void {
    if (!arrowId) return;
    this.mutate((document) => {
      document.arrows = document.arrows.filter((candidate) => candidate.id !== arrowId);
    });
    this.contextMenu.set(null);
    this.notify('Flecha eliminada');
  }

  protected undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.redoStack.push(cloneDocument(this.molecule()));
    this.molecule.set(previous);
    this.selectedAtomIds.set(new Set());
    this.selectedBondId.set(null);
    this.updateHistoryFlags();
    this.persistAutosave();
  }

  protected redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(cloneDocument(this.molecule()));
    this.molecule.set(next);
    this.selectedAtomIds.set(new Set());
    this.selectedBondId.set(null);
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
      this.bondDraft.set(null);
      this.arrowDraft.set(null);
      this.lassoPoints.set([]);
      this.selectedAtomIds.set(new Set());
      this.selectedBondId.set(null);
      if (this.modelOpen()) this.closeModel();
      this.closePanels();
      return;
    }
    const shortcuts: Record<string, EditorTool> = {
      v: 'select',
      h: 'pan',
      a: 'atom',
      b: 'bond',
      f: 'arrow',
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

  @HostListener('window:focus')
  protected onWindowFocus(): void {
    if (this.themeMode() === 'auto') this.applyTheme('auto');
  }

  private initialDocument(): MoleculeDocument {
    try {
      const saved = localStorage.getItem('molecular.autosave.v1');
      if (saved) {
        const parsed = JSON.parse(saved) as MoleculeDocument;
        if (Array.isArray(parsed.atoms) && Array.isArray(parsed.bonds))
          return cloneDocument(parsed);
      }
    } catch {
      /* use starter molecule */
    }
    return documentFromPreset(MOLECULE_PRESETS[0]);
  }

  private initialTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem('molecular.theme.v1');
      if (stored === 'light') return 'morning';
      if (stored === 'dark') return 'night';
      if (stored === 'morning' || stored === 'afternoon' || stored === 'night' || stored === 'auto')
        return stored;
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
    let coordinates: { latitude: number; longitude: number } | null = null;
    try {
      coordinates = JSON.parse(localStorage.getItem(this.themeLocationKey) ?? 'null');
    } catch {
      /* fall back to local clock */
    }
    const resolved = mode === 'auto' ? resolveSolarTheme(new Date(), coordinates) : mode;
    this.resolvedTheme.set(resolved);
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
    this.selectedBondId.set(null);
    this.modelAtomIds.set(new Set());
    this.bondStartId.set(null);
    this.bondDraft.set(null);
    this.arrowDraft.set(null);
    this.lassoPoints.set([]);
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
    const canvas = this.toCanvasPoint(event.clientX, event.clientY);
    const pan = this.pan();
    const zoom = this.zoom();
    return { x: (canvas.x - pan.x) / zoom, y: (canvas.y - pan.y) / zoom };
  }

  private toCanvasPoint(clientX: number, clientY: number): CanvasPoint {
    const svg = this.canvasRef.nativeElement;
    const matrix = svg.getScreenCTM?.();
    if (matrix && typeof DOMPoint !== 'undefined') {
      const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
      return { x: point.x, y: point.y };
    }
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / this.viewWidth, rect.height / this.viewHeight) || 1;
    const offsetX = (rect.width - this.viewWidth * scale) / 2;
    const offsetY = (rect.height - this.viewHeight * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }

  private beginPinch(): void {
    const entries = [...this.touchPointers.entries()].slice(0, 2);
    if (entries.length < 2) return;
    const [first, second] = entries;
    const midpoint = {
      x: (first[1].x + second[1].x) / 2,
      y: (first[1].y + second[1].y) / 2,
    };
    const anchor = this.toCanvasPoint(midpoint.x, midpoint.y);
    const pan = this.pan();
    const zoom = this.zoom();
    this.pinchState = {
      pointerIds: [first[0], second[0]],
      startDistance: Math.max(1, Math.hypot(first[1].x - second[1].x, first[1].y - second[1].y)),
      startZoom: zoom,
      moleculeAnchor: { x: (anchor.x - pan.x) / zoom, y: (anchor.y - pan.y) / zoom },
    };
  }

  private registerTouchPointer(event: PointerEvent): boolean {
    if (event.pointerType !== 'touch') return false;
    this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try {
      this.canvasRef.nativeElement.setPointerCapture(event.pointerId);
    } catch {
      /* capture is best effort on touch browsers */
    }
    if (this.touchPointers.size < 2) return false;
    event.preventDefault();
    this.pointerState = null;
    this.selectionBox.set(null);
    this.lassoPoints.set([]);
    this.bondDraft.set(null);
    this.arrowDraft.set(null);
    this.beginPinch();
    return true;
  }

  private updatePinch(): void {
    const state = this.pinchState;
    if (!state) return;
    const first = this.touchPointers.get(state.pointerIds[0]);
    const second = this.touchPointers.get(state.pointerIds[1]);
    if (!first || !second) return;
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const anchor = this.toCanvasPoint(midpoint.x, midpoint.y);
    const nextZoom = Math.max(
      0.35,
      Math.min(3.2, state.startZoom * (distance / state.startDistance)),
    );
    this.zoom.set(Number(nextZoom.toFixed(3)));
    this.pan.set({
      x: anchor.x - state.moleculeAnchor.x * nextZoom,
      y: anchor.y - state.moleculeAnchor.y * nextZoom,
    });
  }

  private snapLineEnd(start: CanvasPoint, end: CanvasPoint): CanvasPoint {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);
    if (!distance) return end;
    const step = Math.PI / 12;
    const angle = Math.round(Math.atan2(dy, dx) / step) * step;
    return { x: start.x + Math.cos(angle) * distance, y: start.y + Math.sin(angle) * distance };
  }

  private pointInPolygon(point: CanvasPoint, polygon: CanvasPoint[]): boolean {
    let inside = false;
    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
      const currentPoint = polygon[index];
      const previousPoint = polygon[previous];
      const intersects =
        currentPoint.y > point.y !== previousPoint.y > point.y &&
        point.x <
          ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
            (previousPoint.y - currentPoint.y || 1) +
            currentPoint.x;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  private clearHydrogenOverrides(document: MoleculeDocument, atomIds: string[]): void {
    const ids = new Set(atomIds);
    document.atoms.forEach((atom) => {
      if (ids.has(atom.id)) atom.implicitHydrogenOverride = undefined;
    });
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
    const validation = validateBondChange(
      this.molecule(),
      startId,
      atomId,
      this.bondOrder(),
      this.bondKind(),
    );
    if (!validation.valid) {
      this.bondStartId.set(null);
      this.notify(validation.message);
      return;
    }
    const existing = this.molecule().bonds.find(
      (bond) =>
        (bond.atomA === startId && bond.atomB === atomId) ||
        (bond.atomA === atomId && bond.atomB === startId),
    );
    let selectedBondId = existing?.id ?? '';
    if (existing)
      this.mutate((document) => {
        this.clearHydrogenOverrides(document, [startId, atomId]);
        const target = document.bonds.find((bond) => bond.id === existing.id)!;
        target.order = this.bondOrder();
        target.kind = this.bondKind();
      });
    else {
      const bond = createBond(
        startId,
        atomId,
        this.bondOrder(),
        this.bondKind(),
        this.activeBondColor() ?? undefined,
      );
      selectedBondId = bond.id;
      this.mutate((document) => {
        this.clearHydrogenOverrides(document, [startId, atomId]);
        document.bonds.push(bond);
      });
    }
    this.selectedAtomIds.set(new Set());
    this.selectedBondId.set(selectedBondId);
    this.bondStartId.set(null);
  }

  private bondEndpoints(bond: Bond): { a: Atom; b: Atom } | null {
    const a = this.molecule().atoms.find((atom) => atom.id === bond.atomA);
    const b = this.molecule().atoms.find((atom) => atom.id === bond.atomB);
    return a && b ? { a, b } : null;
  }

  private fragmentLabel(id: FragmentTemplate['id']): string {
    return this.fragmentTemplates.find((template) => template.id === id)?.label ?? 'fragmento';
  }

  private insertFragment(id: FragmentTemplate['id'], center: CanvasPoint): void {
    const template = this.fragmentTemplates.find((candidate) => candidate.id === id);
    if (!template) return;
    const newIds = new Set<string>();
    this.mutate((document) => {
      const atoms = template.chain
        ? Array.from({ length: template.sides }, (_, index) =>
            createAtom(
              'C',
              center.x + (index - (template.sides - 1) / 2) * 92,
              center.y + (index % 2 ? 36 : -36),
            ),
          )
        : Array.from({ length: template.sides }, (_, index) => {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / template.sides;
            const radius = template.sides <= 4 ? 78 : template.sides >= 8 ? 118 : 98;
            return createAtom(
              'C',
              center.x + Math.cos(angle) * radius,
              center.y + Math.sin(angle) * radius,
            );
          });
      atoms.forEach((atom) => newIds.add(atom.id));
      document.atoms.push(...atoms);
      const limit = template.chain ? atoms.length - 1 : atoms.length;
      for (let index = 0; index < limit; index += 1) {
        const nextIndex = (index + 1) % atoms.length;
        const order: 1 | 2 = template.aromatic && index % 2 === 0 ? 2 : 1;
        document.bonds.push(
          createBond(atoms[index].id, atoms[nextIndex].id, order, bondKindForOrder(order)),
        );
      }
    });
    this.selectedAtomIds.set(newIds);
    this.selectedBondId.set(null);
    this.notify(this.fragmentLabel(id) + ' insertado');
  }

  private deleteAtom(id: string): void {
    this.mutate((document) => {
      const affected = document.bonds
        .filter((bond) => bond.atomA === id || bond.atomB === id)
        .flatMap((bond) => [bond.atomA, bond.atomB]);
      this.clearHydrogenOverrides(document, affected);
      document.atoms = document.atoms.filter((atom) => atom.id !== id);
      document.bonds = document.bonds.filter((bond) => bond.atomA !== id && bond.atomB !== id);
    });
    const selected = new Set(this.selectedAtomIds());
    selected.delete(id);
    this.selectedAtomIds.set(selected);
    if (!this.selectedBond()) this.selectedBondId.set(null);
  }

  private createSvgMarkup(): string {
    const molecule = this.molecule();
    const margin = 90;
    const allX = [
      ...molecule.atoms.map((atom) => atom.x),
      ...molecule.arrows.flatMap((arrow) => [arrow.x1, arrow.x2]),
    ];
    const allY = [
      ...molecule.atoms.map((atom) => atom.y),
      ...molecule.arrows.flatMap((arrow) => [arrow.y1, arrow.y2]),
    ];
    const minX = allX.length ? Math.min(...allX) - margin : 0;
    const minY = allY.length ? Math.min(...allY) - margin : 0;
    const maxX = allX.length ? Math.max(...allX) + margin : this.viewWidth;
    const maxY = allY.length ? Math.max(...allY) + margin : this.viewHeight;
    const width = Math.max(280, maxX - minX);
    const height = Math.max(220, maxY - minY);
    const bondMarkup = molecule.bonds.map((bond) => this.createBondSvgMarkup(bond)).join('');
    const arrowMarkup = molecule.arrows.map((arrow) => this.createArrowSvgMarkup(arrow)).join('');
    const atomMarkup = molecule.atoms
      .map((atom) => {
        const definition = ELEMENT_BY_SYMBOL.get(atom.element)!;
        const radius = this.atomRadius(atom);
        const charge = this.atomChargeLabel(atom);
        const annotations = this.annotationLayout(atom);
        const lonePairs = annotations.lonePairs
          .map((pair) => {
            const angle = (((pair.rotation ?? 0) - 90) * Math.PI) / 180;
            const tangentX = Math.cos(angle) * 2.7;
            const tangentY = Math.sin(angle) * 2.7;
            return `<circle cx="${atom.x + pair.x - tangentX}" cy="${atom.y + pair.y - tangentY}" r="1.7"/><circle cx="${atom.x + pair.x + tangentX}" cy="${atom.y + pair.y + tangentY}" r="1.7"/>`;
          })
          .join('');
        const radicals = annotations.radicals
          .map(
            (radical) => `<circle cx="${atom.x + radical.x}" cy="${atom.y + radical.y}" r="2.1"/>`,
          )
          .join('');
        const hydrogen = this.implicitHydrogenLabel(atom);
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
          (charge && annotations.charge
            ? `<text x="${atom.x + annotations.charge.x}" y="${atom.y + annotations.charge.y + 4}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700" fill="#c43f5a">${charge}</text>`
            : '') +
          (hydrogen &&
          annotations.hydrogen &&
          this.layers.implicitHydrogens() &&
          !this.layers.skeletal()
            ? `<text x="${atom.x + annotations.hydrogen.x}" y="${atom.y + annotations.hydrogen.y + 5}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#087c8c">${hydrogen}</text>`
            : '') +
          `<g fill="#6d3cc4">${lonePairs}</g>` +
          `<g fill="#c43f5a">${radicals}</g>` +
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
      '"><defs><marker id="export-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#263142"/></marker><marker id="export-arrow-start" markerWidth="9" markerHeight="9" refX="1" refY="4.5" orient="auto-start-reverse"><path d="M9,0 L0,4.5 L9,9 Z" fill="#263142"/></marker></defs><rect x="' +
      minX +
      '" y="' +
      minY +
      '" width="' +
      width +
      '" height="' +
      height +
      '" fill="#ffffff"/><g stroke="#58677b" stroke-width="4" stroke-linecap="round">' +
      bondMarkup +
      '</g>' +
      '<g fill="none" stroke="#263142" stroke-width="3" stroke-linecap="round">' +
      arrowMarkup +
      '</g>' +
      atomMarkup +
      '</svg>'
    );
  }

  private createBondSvgMarkup(bond: Bond): string {
    const kind = this.bondVisualKind(bond);
    const color = bond.color ?? '#58677b';
    if (kind === 'up')
      return `<polygon points="${this.wedgePoints(bond)}" fill="${color}" stroke="none"/>`;
    if (kind === 'down') {
      return this.hashedBondLines(bond)
        .map(
          (line) =>
            `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${color}"/>`,
        )
        .join('');
    }
    if (kind === 'any')
      return `<path d="${this.wavyBondPath(bond)}" fill="none" stroke="${color}"/>`;
    if (kind === 'dative') {
      const line = this.bondLines(bond)[0];
      return line
        ? `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${color}" marker-end="url(#export-arrow)"/>`
        : '';
    }
    const dash =
      kind === 'aromatic'
        ? ' stroke-dasharray="10 7"'
        : kind === 'delocalized'
          ? ' stroke-dasharray="13 5 2 5"'
          : kind === 'hydrogen'
            ? ' stroke-dasharray="2 8" stroke-width="2.5"'
            : '';
    return this.bondLines(bond)
      .map(
        (line) =>
          `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${color}"${dash}/>`,
      )
      .join('');
  }

  private createArrowSvgMarkup(arrow: ReactionArrow): string {
    return this.arrowLines(arrow)
      .map((line) => {
        const start = arrow.kind === 'resonance' ? ' marker-start="url(#export-arrow-start)"' : '';
        return `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" marker-end="url(#export-arrow)"${start}/>`;
      })
      .join('');
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
