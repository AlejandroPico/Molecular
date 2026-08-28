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
    expect(fixture.nativeElement.textContent).toContain('Molecular');
    expect(fixture.nativeElement.textContent).toContain('v0.1.1');
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
});
