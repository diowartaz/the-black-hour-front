import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogBuildingModel, MarketModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { GameApiService, MarketUpdate } from 'src/app/services/game-api/game-api.service';

import { MarketComponent } from './market.component';

describe('MarketComponent', () => {
  let fixture: ComponentFixture<MarketComponent>;
  let host: HTMLElement;
  let cityService: CityService;

  const wall: CatalogBuildingModel = {
    id: 1,
    name: 'Scrap Wall',
    rarity: 'common',
    defense: 12,
    lvl_max: 3,
    time: 3600,
    inventory: { wood: 4 },
  };
  const totem: CatalogBuildingModel = { ...wall, id: 2, name: 'Night Totem', rarity: 'epic', inventory: { metal: 2 } };
  const tower: CatalogBuildingModel = { ...wall, id: 3, name: 'Tin Tower', rarity: 'rare', inventory: { stone: 2 } };

  const open: MarketModel = {
    unlocked: true,
    gamesPlayed: 6,
    requiredGames: 5,
    minCopiesToSell: 2,
    taxRate: 0.05,
    offers: [
      { listingId: 'a', buildingId: 1, price: 300 },
      { listingId: 'b', buildingId: 2, price: 100 },
    ],
    myListings: [{ listingId: 'c', buildingId: 3, price: 500 }],
    sales: [{ buildingId: 3, price: 450, soldAt: '2026-10-20T10:00:00.000Z' }],
  };

  async function setup(market: MarketModel, api: Partial<Record<keyof GameApiService, unknown>> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MarketComponent],
      providers: [
        provideRouter([]),
        { provide: GameApiService, useValue: { getMarket: jasmine.createSpy().and.returnValue(of(market)), ...api } },
      ],
    }).compileComponents();

    cityService = TestBed.inject(CityService);
    cityService.catalogBuildings.set([wall, totem, tower]);
    cityService.stats.update((stats) => ({ ...stats, money: 1000, deck: [], collection: { 1: 2, 2: 1 } }));

    fixture = TestBed.createComponent(MarketComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  }

  const update = (market: MarketModel): MarketUpdate => ({ stats: cityService.stats(), market });
  const names = (selector: string) => [...host.querySelectorAll(`${selector} .name`)].map((el) => el.textContent);

  async function openSellTab(): Promise<void> {
    fixture.componentInstance.tab.set('sell');
    await fixture.whenStable();
  }

  it('reste verrouillé tant que le joueur n’a pas assez de parties', async () => {
    await setup({ ...open, unlocked: false, gamesPlayed: 4, offers: [], myListings: [], sales: [] });
    expect(host.querySelector('.locked')?.textContent).toContain('Finish 1 more game to unlock');
    expect(host.querySelector('.tabs')).toBeNull();
  });

  it('ne montre que les plans en vente, sauf demande contraire', async () => {
    await setup(open);
    expect(names('.market-card')).toEqual(['Night Totem', 'Scrap Wall']);

    fixture.componentInstance.showUnavailable.set(true);
    await fixture.whenStable();
    expect(names('.market-card')).toContain('Tin Tower');
    expect(host.textContent).toContain('No offer');
  });

  it('place le bouton d’achat dans la carte, sans badge pour un exemplaire unique', async () => {
    await setup(open);
    const card = host.querySelector('.market-card app-building-card');
    expect(card?.querySelector('.buy-btn')?.textContent).toContain('100');
    expect(card?.querySelector('.head .count')).toBeNull();
  });

  it('montre les doublons dans le badge de la carte', async () => {
    await setup(open);
    const card = host.querySelectorAll('.market-card app-building-card')[1];
    expect(card.querySelector('.name')?.textContent).toContain('Scrap Wall');
    expect(card.querySelector('.head .count')?.textContent).toContain('+1');
  });

  it('grise les tuiles sans offre', async () => {
    await setup(open);
    fixture.componentInstance.showUnavailable.set(true);
    await fixture.whenStable();

    const unavailable = [...host.querySelectorAll('.market-card.unavailable .name')].map((el) => el.textContent);
    expect(unavailable).toEqual(['Tin Tower']);
  });

  it('laisse normal un plan non possédé mais en vente', async () => {
    await setup({ ...open, offers: [{ listingId: 'e', buildingId: 3, price: 50 }] });
    const card = host.querySelector('.market-card')!;
    expect(card.querySelector('.name')?.textContent).toContain('Tin Tower');
    expect(card.querySelector('.head .count')?.textContent).toContain('New');
    expect(card.classList).not.toContain('unavailable');
    expect(card.querySelector('.card.locked')).toBeNull();
  });

  it('trie par prix, les plans sans offre en dernier', async () => {
    await setup(open);
    const market = fixture.componentInstance;
    market.showUnavailable.set(true);

    market.sort.set('price-asc');
    expect(market.buyPlans().map((b) => b.id)).toEqual([2, 1, 3]);
    market.sort.set('price-desc');
    expect(market.buyPlans().map((b) => b.id)).toEqual([1, 2, 3]);
  });

  it('applique les filtres de la collection', async () => {
    await setup(open);
    const market = fixture.componentInstance;
    market.search.set('scrap');
    expect(market.buyPlans().map((b) => b.id)).toEqual([1]);
    market.search.set('');
    market.rarityFilter.set('epic');
    expect(market.buyPlans().map((b) => b.id)).toEqual([2]);
  });

  it('ne garde que les plans du deck, sur les deux onglets', async () => {
    await setup(open);
    const market = fixture.componentInstance;
    cityService.stats.update((stats) => ({ ...stats, deck: [1, 3] }));
    market.deckOnly.set(true);
    expect(market.buyPlans().map((b) => b.id)).toEqual([1]);

    market.showUnavailable.set(true);
    expect(market.buyPlans().map((b) => b.id)).toEqual([3, 1]);

    expect(market.sellPlans().map((b) => b.id)).toEqual([1]);
    cityService.stats.update((stats) => ({ ...stats, deck: [2] }));
    expect(market.sellPlans()).toEqual([]);
  });

  it('compte le filtre du deck dans le badge et le retire avec Reset', async () => {
    await setup(open);
    const market = fixture.componentInstance;
    market.deckOnly.set(true);
    market.showUnavailable.set(true);
    expect(market.extraFilters()).toBe(2);

    market.clearExtraFilters();
    expect(market.deckOnly()).toBeFalse();
    expect(market.showUnavailable()).toBeFalse();
    expect(market.extraFilters()).toBe(0);
  });

  it('achète l’offre affichée et désactive celles qui sont trop chères', async () => {
    const buyMarketListing = jasmine.createSpy().and.callFake(() => of(update(open)));
    await setup(open, { buyMarketListing });
    cityService.stats.update((stats) => ({ ...stats, money: 200 }));
    await fixture.whenStable();

    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.buy-btn')];
    expect(buttons.map((b) => b.disabled)).toEqual([false, true]);
    buttons[0].click();
    expect(buyMarketListing).toHaveBeenCalledOnceWith('b');
  });

  it('recharge le marché sans relancer l’achat si l’offre est déjà partie', async () => {
    const conflict = new HttpErrorResponse({ status: 409 });
    const buyMarketListing = jasmine.createSpy().and.returnValue(throwError(() => conflict));
    const refreshed = { ...open, offers: [{ listingId: 'd', buildingId: 2, price: 120 }] };
    const getMarket = jasmine.createSpy().and.returnValues(of(open), of(refreshed));
    await setup(open, { buyMarketListing, getMarket });

    host.querySelector<HTMLButtonElement>('.buy-btn')!.click();
    await fixture.whenStable();

    expect(getMarket).toHaveBeenCalledTimes(2);
    expect(buyMarketListing).toHaveBeenCalledTimes(1);
    expect(host.querySelector('.buy-btn')?.textContent).toContain('120');
  });

  it('ne propose à la vente que les plans en plusieurs exemplaires', async () => {
    await setup(open);
    await openSellTab();
    expect(names('.market-card')).toEqual(['Scrap Wall']);
  });

  it('ouvre la pop-up avec le bouton Sell, pas en cliquant sur la tuile', async () => {
    await setup(open);
    await openSellTab();

    host.querySelector<HTMLElement>('.market-card app-building-card')!.click();
    await fixture.whenStable();
    expect(host.querySelector('app-sell-dialog')).toBeNull();

    host.querySelector<HTMLButtonElement>('.sell-btn')!.click();
    await fixture.whenStable();
    const dialog = host.querySelector('app-sell-dialog');
    expect(dialog?.textContent).toContain('Scrap Wall');
    expect(dialog?.querySelector<HTMLInputElement>('.price')?.value).toBe('299');

    dialog!.querySelector<HTMLButtonElement>('.close')!.click();
    await fixture.whenStable();
    expect(host.querySelector('app-sell-dialog')).toBeNull();
  });

  it('prend pour référence l’offre du joueur si elle est la moins chère', async () => {
    await setup({ ...open, myListings: [{ listingId: 'c', buildingId: 1, price: 200 }] });
    expect(fixture.componentInstance.lowestPriceOf(1)).toBe(200);
    expect(fixture.componentInstance.lowestPriceOf(2)).toBe(100);
    expect(fixture.componentInstance.lowestPriceOf(3)).toBeUndefined();
  });

  it('ferme la pop-up quand il ne reste plus assez d’exemplaires', async () => {
    await setup(open);
    await openSellTab();
    host.querySelector<HTMLButtonElement>('.sell-btn')!.click();
    await fixture.whenStable();
    expect(host.querySelector('app-sell-dialog')).not.toBeNull();

    cityService.stats.update((stats) => ({ ...stats, collection: { 1: 1, 2: 1 } }));
    await fixture.whenStable();
    expect(host.querySelector('app-sell-dialog')).toBeNull();
  });

  it('liste les offres du joueur et les retire', async () => {
    const withdrawMarketListing = jasmine.createSpy().and.callFake(() => of(update({ ...open, myListings: [] })));
    await setup(open, { withdrawMarketListing });
    await openSellTab();

    expect(host.textContent).toContain('Sales history');
    expect(host.querySelector('.row')?.textContent).toContain('Tin Tower');
    host.querySelector<HTMLButtonElement>('.row .text-btn')!.click();
    await fixture.whenStable();

    expect(withdrawMarketListing).toHaveBeenCalledOnceWith('c');
    expect(host.textContent).toContain('You have no plan on sale');
  });
});
