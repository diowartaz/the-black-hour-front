import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogBuildingModel, MarketModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { GameApiService } from 'src/app/services/game-api/game-api.service';

import { SellDialogComponent } from './sell-dialog.component';

describe('SellDialogComponent', () => {
  let fixture: ComponentFixture<SellDialogComponent>;
  let host: HTMLElement;
  let cityService: CityService;
  let closed: jasmine.Spy;

  const wall: CatalogBuildingModel = {
    id: 1,
    name: 'Scrap Wall',
    rarity: 'common',
    defense: 12,
    lvl_max: 3,
    time: 3600,
    inventory: { wood: 4 },
  };

  async function setup(createMarketListing: jasmine.Spy = jasmine.createSpy(), lowestPrice?: number): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SellDialogComponent],
      providers: [provideRouter([]), { provide: GameApiService, useValue: { createMarketListing } }],
    }).compileComponents();

    cityService = TestBed.inject(CityService);
    cityService.stats.update((stats) => ({ ...stats, money: 1000 }));

    fixture = TestBed.createComponent(SellDialogComponent);
    fixture.componentRef.setInput('building', wall);
    fixture.componentRef.setInput('count', 3);
    fixture.componentRef.setInput('taxRate', 0.05);
    fixture.componentRef.setInput('lowestPrice', lowestPrice);
    closed = jasmine.createSpy();
    fixture.componentInstance.closed.subscribe(closed);
    host = fixture.nativeElement;
    await fixture.whenStable();
  }

  async function typePrice(value: string): Promise<void> {
    const input = host.querySelector<HTMLInputElement>('.price')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  const cta = () => host.querySelector<HTMLButtonElement>('.mini-cta')!;

  it('affiche la tuile complète du plan', async () => {
    await setup();
    const tile = host.querySelector('app-building-card');
    expect(tile?.textContent).toContain('Scrap Wall');
    expect(tile?.textContent).toContain('common');
    expect(tile?.textContent).toContain('×3');
  });

  it('indique l’offre la plus basse, ou son absence', async () => {
    await setup(undefined, 300);
    expect(host.querySelector('.lowest')?.textContent).toContain('300');

    fixture.componentRef.setInput('lowestPrice', undefined);
    await fixture.whenStable();
    expect(host.querySelector('.lowest')?.textContent).toContain('No other offer');
  });

  it('calcule la taxe et n’accepte qu’un prix valide et payable', async () => {
    await setup();
    expect(cta().disabled).toBeTrue();

    await typePrice('210');
    expect(host.querySelector('.tax')?.textContent).toContain('11 coins');
    expect(cta().disabled).toBeFalse();

    await typePrice('10.5');
    expect(cta().disabled).toBeTrue();

    await typePrice('21000');
    expect(cta().disabled).toBeTrue();
  });

  it('met le plan en vente au prix saisi puis se ferme', async () => {
    const update = { stats: {} as any, market: {} as MarketModel };
    const createMarketListing = jasmine.createSpy().and.callFake(() => {
      update.stats = cityService.stats();
      return of(update);
    });
    await setup(createMarketListing);

    await typePrice('210');
    cta().click();

    expect(createMarketListing).toHaveBeenCalledOnceWith(1, 210);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('reste ouverte si la mise en vente échoue', async () => {
    await setup(jasmine.createSpy().and.returnValue(throwError(() => new Error('refused'))));

    await typePrice('210');
    cta().click();
    await fixture.whenStable();

    expect(closed).not.toHaveBeenCalled();
    expect(host.querySelector('.sheet')).not.toBeNull();
  });

  it('se ferme au clic sur le fond, pas au clic dans le panneau', async () => {
    await setup();
    host.querySelector<HTMLElement>('.sheet')!.click();
    expect(closed).not.toHaveBeenCalled();

    host.querySelector<HTMLElement>('.backdrop')!.click();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('se ferme avec la croix et avec Échap', async () => {
    await setup();
    host.querySelector<HTMLButtonElement>('.close')!.click();
    expect(closed).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toHaveBeenCalledTimes(2);
  });
});
