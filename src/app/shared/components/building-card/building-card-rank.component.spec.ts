import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogBuildingModel } from 'src/app/models/game';

import { BuildingCardComponent } from './building-card.component';

describe('BuildingCardComponent, rang du plan', () => {
  let fixture: ComponentFixture<BuildingCardComponent>;

  const wall: CatalogBuildingModel = {
    id: 1,
    name: 'Scrap Wall',
    rarity: 'common',
    defense: 100,
    lvl_max: 3,
    time: 3600,
    inventory: { wood: 4 },
  };
  const totem: CatalogBuildingModel = { ...wall, defense: 0, effect: { kind: 'digTimeReduction', value: 0.08 } };

  async function render(building: CatalogBuildingModel, rank?: number): Promise<HTMLElement> {
    fixture = TestBed.createComponent(BuildingCardComponent);
    fixture.componentRef.setInput('building', building);
    if (rank) {
      fixture.componentRef.setInput('rank', rank);
    }
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('sans rang, montre un exemplaire de base', async () => {
    const host = await render(wall);
    expect(host.querySelector('.def')?.textContent).toContain('100');
    expect(host.querySelector('.pips')).toBeNull();
  });

  it('affiche la défense au rang du plan', async () => {
    const host = await render(wall, 4);
    expect(host.querySelector('.def')?.textContent).toContain('180');
    expect(host.querySelectorAll('.pip.on').length).toBe(4);
  });

  it("met l'effet à la valeur du rang", async () => {
    await render(totem, 2);
    expect(fixture.componentInstance.effect()?.value).toBe(0.112);
  });
});
