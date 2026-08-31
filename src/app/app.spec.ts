import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('creates the Molecular workspace', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    const aboutButton = fixture.nativeElement.querySelector('[aria-label="Acerca de Molecular"]');
    aboutButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Acerca de Molecular');
    expect(fixture.nativeElement.textContent).toContain('0.7.1');
  });

  it('starts with an editable molecular canvas and a coherent example', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector(
      '[aria-label="Lienzo de edición molecular 2D"]',
    );
    expect(canvas).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('C₂H₆O');
    expect(fixture.nativeElement.textContent).toContain('Masa molar');
    expect(fixture.nativeElement.textContent).not.toContain('Motor local');
  });

  it('groups direct, area and pan modes under one selection control', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const selectionGroup = fixture.nativeElement.querySelector('.selection-flyout');
    expect(selectionGroup.textContent).toContain('Directa');
    expect(selectionGroup.textContent).toContain('Rectangular');
    expect(selectionGroup.textContent).toContain('Lazo');
    expect(selectionGroup.textContent).toContain('Desplazar');
    expect(fixture.nativeElement.querySelectorAll('.history-split button').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.history-undo')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.history-redo')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.erase-flyout').textContent).toContain(
      'Vaciar lienzo',
    );
  });

  it('exposes the seven priority capabilities through compact panels and tools', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.arrow-flyout')?.textContent).toContain('Par de electrones');
    expect(root.querySelector('.arrow-flyout')?.textContent).toContain('Electrón individual');

    (root.querySelector('[aria-label="Capas"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Componentes independientes');
    expect(root.querySelectorAll('.component-card').length).toBe(1);

    (root.querySelector('[aria-label="Editor de reacciones"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Editor de reacciones');
    expect(root.textContent).toContain('Coeficiente');

    (root.querySelector('[aria-label="Exportar"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.textContent).toContain('MDL Molfile V2000');
    expect(root.textContent).toContain('Chemical Markup Language');
  });

  it('exposes the scientific analysis suite for suggestions 8 through 14', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    (root.querySelector('[aria-label="Laboratorio científico"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Reconocimiento de grupos funcionales');
    expect(root.textContent).toContain('Alcohol');

    const tabs = root.querySelectorAll<HTMLButtonElement>('.science-tabs button');
    tabs[1].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Aromaticidad y resonancia formales');

    tabs[2].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('TPSA estimada');
    expect(root.textContent).toContain('Composición elemental en masa');

    tabs[4].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Comprobaciones activas');
    expect(root.textContent).toContain('Estricto');

    tabs[5].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Balanceador de ecuaciones');
  });

  it('appends several formulas without replacing the document and undoes the whole batch', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const initialAtomCount = fixture.nativeElement.querySelectorAll('.atom-node').length;

    fixture.nativeElement.querySelector('[aria-label="Generador de fórmulas"]').click();
    fixture.detectChanges();
    const input: HTMLTextAreaElement = fixture.nativeElement.querySelector(
      '.formula-generator textarea',
    );
    input.value = 'h2o, h2so4';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.formula-submit').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.atom-node').length).toBeGreaterThan(
      initialAtomCount,
    );
    const undo: HTMLButtonElement = fixture.nativeElement.querySelector('.history-undo');
    expect(undo.disabled).toBe(false);
    undo.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.atom-node').length).toBe(initialAtomCount);
  });

  it('pins independent movable atom information cards from the context menu', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const atoms = fixture.nativeElement.querySelectorAll('.atom-node');

    atoms[0].dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, clientX: 320, clientY: 180 }),
    );
    fixture.detectChanges();
    let pinButton = [...fixture.nativeElement.querySelectorAll('.context-menu button')].find(
      (button: Element) => button.textContent?.includes('Fijar ficha informativa'),
    ) as HTMLButtonElement;
    expect(fixture.nativeElement.querySelectorAll('.context-elements button').length).toBe(8);
    pinButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.pinned-atom-inspector').length).toBe(1);

    atoms[1].dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, clientX: 380, clientY: 220 }),
    );
    fixture.detectChanges();
    pinButton = [...fixture.nativeElement.querySelectorAll('.context-menu button')].find(
      (button: Element) => button.textContent?.includes('Fijar ficha informativa'),
    ) as HTMLButtonElement;
    pinButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.pinned-atom-inspector').length).toBe(2);
  });

  it('keeps the molecular canvas proportional and exposes all 118 elements', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('.molecular-canvas');
    expect(canvas.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');

    fixture.nativeElement.querySelector('[aria-label="Tabla periódica completa"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.periodic-cell').length).toBe(118);
  });

  it('anchors wheel zoom at the pointer instead of the upper-left corner', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const canvas: SVGSVGElement = fixture.nativeElement.querySelector('.molecular-canvas');
    const moleculeLayer = canvas.querySelector('g[transform]')!;
    const before = moleculeLayer.getAttribute('transform');
    canvas.dispatchEvent(new WheelEvent('wheel', { clientX: 420, clientY: 310, deltaY: -120 }));
    fixture.detectChanges();
    const after = moleculeLayer.getAttribute('transform');
    expect(after).not.toBe(before);
    expect(after).not.toContain('translate(0 0)');
  });

  it('uses a continuous zoom-aware grid behind the whole SVG stage', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.canvas-grid-surface');
    const canvas = fixture.nativeElement.querySelector('.molecular-canvas');
    expect(grid).toBeTruthy();
    expect(grid.classList.contains('triangular')).toBe(true);
    expect(grid.parentElement).toBe(canvas.parentElement);
    expect(canvas.querySelector('pattern')).toBeNull();
  });

  it('opens and closes the 3D viewer from controls outside the viewer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Construir modelo 3D"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.model-toolbar .model-close')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Cerrar modelo 3D"]')).toBeTruthy();

    fixture.nativeElement.querySelector('.model-toolbar .model-close').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.model-toolbar .model-close')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Construir modelo 3D"]')).toBeTruthy();
  });

  it('opens a chaptered encyclopedia instead of an element picker', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Enciclopedia química"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.encyclopedia-chapters button').length).toBe(18);
    expect(fixture.nativeElement.textContent).toContain('Cómo leer una estructura química');
    expect(fixture.nativeElement.textContent).toContain('Fuentes y ampliación');
    expect(fixture.nativeElement.querySelector('.element-cards')).toBeNull();
  });

  it('adds the curated library and identifies a known structure without replacing the canvas', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const initialAtoms = root.querySelectorAll('.atom-node').length;

    (root.querySelector('[aria-label="Archivo y biblioteca"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.structure-library-list article').length).toBe(36);
    const aspirin = [...root.querySelectorAll<HTMLElement>('.structure-library-list article')].find(
      (entry) => entry.textContent?.includes('Ácido acetilsalicílico'),
    )!;
    (aspirin.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.atom-node').length).toBeGreaterThan(initialAtoms);

    (root.querySelector('[aria-label="Laboratorio científico"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const tabs = root.querySelectorAll<HTMLButtonElement>('.science-tabs button');
    tabs[3].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Coincidencia exacta');
    expect(root.textContent).toContain('Ácido acetilsalicílico');
  });

  it('provides a five-exercise tutorial with an executable SMILES lesson', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    (root.querySelector('[aria-label="Enciclopedia química"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const learningTabs = root.querySelectorAll<HTMLButtonElement>('.learning-tabs button');
    learningTabs[1].click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.tutorial-grid > button').length).toBe(5);

    const smilesLesson = [
      ...root.querySelectorAll<HTMLButtonElement>('.tutorial-grid > button'),
    ].find((button) => button.textContent?.includes('SMILES desde cero'))!;
    smilesLesson.click();
    fixture.detectChanges();
    const input: HTMLInputElement = root.querySelector('.tutorial-smiles input')!;
    input.value = 'c1ccccc1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    (root.querySelector('.tutorial-smiles button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Completado');
  });

  it('opens contextual theory from a selected bond', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const bond = root.querySelector('.bond-hit-area') ?? root.querySelector('.bond-group');
    bond!.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, clientX: 360, clientY: 240 }),
    );
    fixture.detectChanges();
    const help = [...root.querySelectorAll<HTMLButtonElement>('.context-menu button')].find(
      (button) => button.textContent?.includes('Explicar este tipo de enlace'),
    )!;
    help.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Enlaces simple, doble y triple');
  });
});
