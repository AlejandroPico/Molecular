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
});
