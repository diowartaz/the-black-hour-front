import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogBuildingModel, createDefaultStatsModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { GameApiService } from 'src/app/services/game-api/game-api.service';

import { UpgradeDialogComponent } from './upgrade-dialog.component';

describe('UpgradeDialogComponent', () => {
  let fixture: ComponentFixture<UpgradeDialogComponent>;
  let host: HTMLElement;
  let cityService: CityService;
  const upgradeBuilding = jasmine.createSpy('upgradeBuilding');

  const wall: CatalogBuildingModel = {
    id: 1,
    name: 'Scrap Wall',
    rarity: 'common',
    defense: 100,
    lvl_max: 3,
    time: 3600,
    inventory: { wood: 4 },
  };

  async function setup(collection: number, rank: number): Promise<void> {
    cityService.stats.update((stats) => ({ ...stats, collection: { 1: collection }, building_ranks: { 1: rank } }));
    fixture = TestBed.createComponent(UpgradeDialogComponent);
    fixture.componentRef.setInput('building', wall);
    host = fixture.nativeElement;
    await fixture.whenStable();
  }

  const button = (label: string) =>
    [...host.querySelectorAll<HTMLButtonElement>('.sheet-actions button')].find((b) => b.textContent?.includes(label));

  beforeEach(async () => {
    upgradeBuilding.calls.reset();
    await TestBed.configureTestingModule({
      imports: [UpgradeDialogComponent],
      providers: [{ provide: GameApiService, useValue: { upgradeBuilding } }],
    }).compileComponents();
    cityService = TestBed.inject(CityService);
  });

  it('ne répète pas le nom du bâtiment dans le titre', async () => {
    await setup(2, 0);
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('Upgrade');
  });

  it('donne la même hauteur aux deux boutons du bas', async () => {
    await setup(7, 0);
    const heights = ['Sell a copy', 'Upgrade'].map((label) => button(label)!.getBoundingClientRect().height);
    expect(heights).toEqual([42, 42]);
  });

  it('compare le rang actuel et le suivant', async () => {
    await setup(6, 0);
    expect(host.querySelector('.compare')?.textContent).toContain('Rank 0');
    expect(host.querySelector('.compare')?.textContent).toContain('120');
    expect(host.querySelector('.usage')?.textContent).toContain('5 copies');
    expect(button('Upgrade')?.disabled).toBeFalse();
  });

  it("refuse sans assez d'exemplaires : la carte gardée ne compte pas", async () => {
    await setup(5, 0);
    expect(host.querySelector('.usage')?.textContent).toContain('4/5 copies');
    expect(button('Upgrade')?.disabled).toBeTrue();
  });

  it('améliore puis reste ouvert sur le rang suivant', async () => {
    await setup(7, 0);
    upgradeBuilding.and.returnValue(
      of({ ...createDefaultStatsModel(), collection: { 1: 2 }, building_ranks: { 1: 1 } }),
    );
    button('Upgrade')!.click();
    await fixture.whenStable();
    expect(upgradeBuilding).toHaveBeenCalledOnceWith(1);
    expect(fixture.componentInstance.rank()).toBe(1);
    expect(fixture.componentInstance.animating()).toBeTrue();
    expect(host.querySelectorAll('.ghost').length).toBe(5);
  });

  it("propose de vendre tant qu'il reste un doublon", async () => {
    await setup(2, 0);
    expect(button('Sell a copy')).toBeDefined();
    fixture.destroy();
    await setup(1, 0);
    expect(button('Sell a copy')).toBeUndefined();
  });

  it('au rang max, plus de bouton Upgrade', async () => {
    await setup(9, 10);
    expect(host.querySelector('.usage')?.textContent).toContain('Max rank');
    expect(button('Upgrade')).toBeUndefined();
  });
});
