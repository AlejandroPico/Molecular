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
    expect(fixture.nativeElement.textContent).toContain('0.3.0');
  });

  it('starts with an editable molecular canvas and a coherent example', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector(
      '[aria-label="Lienzo de edición molecular 2D"]',
    );
    expect(canvas).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('C₂H₆O');
    expect(fixture.nativeElement.textContent).toContain('Estructura coherente');
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
    expect(fixture.nativeElement.querySelector('.model-close-safety')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Cerrar modelo 3D"]')).toBeTruthy();

    fixture.nativeElement.querySelector('.model-close-safety').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.model-close-safety')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Construir modelo 3D"]')).toBeTruthy();
  });
});
