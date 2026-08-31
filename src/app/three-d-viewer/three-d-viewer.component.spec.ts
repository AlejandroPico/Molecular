import { TestBed } from '@angular/core/testing';
import { documentFromPreset, MOLECULE_PRESETS } from '../core/chemistry.models';
import { ThreeDViewerComponent } from './three-d-viewer.component';

describe('ThreeDViewerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ThreeDViewerComponent] }).compileComponents();
  });

  it('offers five icon-driven molecular representations', () => {
    const fixture = TestBed.createComponent(ThreeDViewerComponent);
    const benzene = documentFromPreset(MOLECULE_PRESETS.find((preset) => preset.id === 'benzene')!);
    fixture.componentRef.setInput('molecule', benzene);
    expect(fixture.componentInstance.representationOptions.map((option) => option.id)).toEqual([
      'ball-stick',
      'licorice',
      'spacefill',
      'sticks',
      'wireframe',
    ]);
  });

  it('embeds a connected ring with genuine depth instead of copying flat 2D coordinates', () => {
    const fixture = TestBed.createComponent(ThreeDViewerComponent);
    const benzene = documentFromPreset(MOLECULE_PRESETS.find((preset) => preset.id === 'benzene')!);
    fixture.componentRef.setInput('molecule', benzene);
    const positions = (fixture.componentInstance as any).layoutExplicitAtoms(benzene) as Map<
      string,
      { z: number }
    >;
    const depths = [...positions.values()].map((position) => position.z);
    expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(0.5);
  });

  it('offers distance, angle and dihedral measurements plus four conformations', () => {
    const fixture = TestBed.createComponent(ThreeDViewerComponent);
    const benzene = documentFromPreset(MOLECULE_PRESETS.find((preset) => preset.id === 'benzene')!);
    fixture.componentRef.setInput('molecule', benzene);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Mediciones 3D"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Conformaciones tridimensionales"]'),
    ).toBeTruthy();
    fixture.componentInstance.webglError.set(null);
    fixture.componentInstance.toggleMeasurementPanel();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Distancia');
    expect(fixture.nativeElement.textContent).toContain('Diedro');
    fixture.componentInstance.toggleConformationPanel();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Optimizada');
    expect(fixture.nativeElement.textContent).toContain('Compacta');
  });

  it('keeps planar conformations flat and generates distinct optimized proposals', () => {
    const fixture = TestBed.createComponent(ThreeDViewerComponent);
    const benzene = documentFromPreset(MOLECULE_PRESETS.find((preset) => preset.id === 'benzene')!);
    fixture.componentRef.setInput('molecule', benzene);
    fixture.componentInstance.setConformation('planar');
    const planar = (fixture.componentInstance as any).layoutExplicitAtoms(benzene) as Map<
      string,
      { z: number }
    >;
    expect([...planar.values()].every((point) => point.z === 0)).toBe(true);

    fixture.componentInstance.nextConformer();
    expect(fixture.componentInstance.conformation()).toBe('optimized');
    expect(fixture.componentInstance.conformerIndex()).toBe(1);
  });
});
