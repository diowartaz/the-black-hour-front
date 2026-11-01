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

  const cta = () => host.querySelector<HTMLButtonElement>('.cta')!;
  const status = () => host.querySelector('.status')!;

  it('affiche la tuile complète du plan', async () => {
    await setup();
    const tile = host.querySelector('app-building-card');
    expect(tile?.textContent).toContain('Scrap Wall');
    expect(tile?.textContent).not.toContain('common');
    expect(tile?.textContent).toContain('+2');
  });

  it('ne répète pas le nom du bâtiment dans le titre', async () => {
    await setup();
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('Sell');
  });

  it('n’affiche pas les copies nécessaires au rang suivant', async () => {
    await setup();
    expect(host.textContent).not.toContain('copies for Rank');
  });

  it('préremplit juste sous l’offre la plus basse', async () => {
    await setup(undefined, 300);
    expect(host.querySelector<HTMLInputElement>('.price')?.value).toBe('299');
    expect(cta().textContent).toContain('List for 299');
  });

  it('propose les prix rapides et les applique', async () => {
    await setup(undefined, 300);
    const presets = [...host.querySelectorAll<HTMLButtonElement>('.preset')];
    expect(presets.map((b) => b.querySelector('strong')?.textContent)).toEqual(['299', '285', '270']);
    expect(presets[0].getAttribute('aria-pressed')).toBe('true');

    presets[2].click();
    await fixture.whenStable();
    expect(host.querySelector<HTMLInputElement>('.price')?.value).toBe('270');
    expect(presets[2].classList).toContain('active');
    expect(presets[0].classList).not.toContain('active');
  });

  it('retire les prix rapides impossibles ou en double', async () => {
    await setup(undefined, 2);
    const prices = [...host.querySelectorAll('.preset strong')].map((el) => el.textContent);
    expect(prices).toEqual(['1']);
  });

  it('ne préremplit rien sous une offre à 1 pièce', async () => {
    await setup(undefined, 1);
    expect(host.querySelector<HTMLInputElement>('.price')?.value).toBe('');
    expect(host.querySelector('.preset')).toBeNull();
  });

  it('dit si les acheteurs verront l’offre', async () => {
    await setup(undefined, 300);
    expect(status().textContent).toContain('buyers will see yours');
    expect(status().classList).toContain('visible');

    // À prix égal, l'offre la plus ancienne reste devant
    await typePrice('300');
    expect(status().textContent).toContain('Hidden while 300');
    expect(status().classList).toContain('hidden');

    await typePrice('');
    expect(status().textContent).toContain('Lowest offer: 300');
    expect(status().classList).not.toContain('hidden');
  });

  it('sans offre concurrente, ne préremplit rien et n’affiche pas de prix rapides', async () => {
    await setup();
    expect(host.querySelector<HTMLInputElement>('.price')?.value).toBe('');
    expect(host.querySelector('.preset')).toBeNull();
    expect(status().textContent).toContain('No other offer');
  });

  it('calcule la taxe et n’accepte qu’un prix valide et payable', async () => {
    await setup();
    expect(cta().disabled).toBeTrue();
    expect(cta().textContent).toContain('Enter a price');

    await typePrice('210');
    expect(host.querySelector('.tax')?.textContent).toContain('11');
    expect(host.querySelector('.net')?.textContent).toContain('199 coins');
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
