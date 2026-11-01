import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createDefaultBuildingModel } from 'src/app/models/game';

import { BuildingRecapComponent } from './building-recap.component';

describe('BuildingRecapComponent, rang du plan', () => {
  let fixture: ComponentFixture<BuildingRecapComponent>;

  async function render(rank: number): Promise<HTMLElement> {
    fixture = TestBed.createComponent(BuildingRecapComponent);
    fixture.componentInstance.building = { ...createDefaultBuildingModel(), rank };
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it("affiche le rang d'un plan amélioré", async () => {
    const host = await render(3);
    expect(host.querySelector('.pips')?.getAttribute('aria-label')).toBe('Rank 3 of 10');
    expect(host.querySelectorAll('.pip.on').length).toBe(3);
  });

  it("n'affiche rien au rang 0", async () => {
    const host = await render(0);
    expect(host.querySelector('.pips')).toBeNull();
  });
});
