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
    expect(fixture.nativeElement.textContent).toContain('0.4.5');
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
    expect(fixture.nativeElement.querySelectorAll('.encyclopedia-chapters button').length).toBe(15);
    expect(fixture.nativeElement.textContent).toContain('Cómo leer una estructura química');
    expect(fixture.nativeElement.textContent).toContain('Fuentes y ampliación');
    expect(fixture.nativeElement.querySelector('.element-cards')).toBeNull();
  });
});
