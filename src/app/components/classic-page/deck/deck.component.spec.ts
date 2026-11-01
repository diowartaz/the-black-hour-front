import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogBuildingModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';

import { DeckComponent } from './deck.component';

describe('DeckComponent', () => {
  let fixture: ComponentFixture<DeckComponent>;
  let host: HTMLElement;

  const wall: CatalogBuildingModel = {
    id: 1,
    name: 'Scrap Wall',
    rarity: 'common',
    defense: 12,
    lvl_max: 3,
    time: 3600,
    inventory: { wood: 4 },
  };
  const totem: CatalogBuildingModel = {
    id: 2,
    name: 'Night Totem',
    rarity: 'epic',
    defense: 0,
    lvl_max: 2,
    time: 7200,
    inventory: { metal: 2 },
    effect: { kind: 'nightlyGrowth', value: 3 } as any,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeckComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const cityService = TestBed.inject(CityService);
    cityService.catalogBuildings.set([wall, totem]);
    cityService.stats.update((stats) => ({ ...stats, deck: [1, 2], collection: { 1: 2, 2: 1 } }));

    fixture = TestBed.createComponent(DeckComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  function slotWrap(name: string): HTMLElement {
    return [...host.querySelectorAll<HTMLElement>('.slot-wrap')].find((el) => el.textContent?.includes(name))!;
  }

  function pointer(name: string, type: 'pointerenter' | 'pointerleave', pointerType = 'mouse'): Promise<void> {
    slotWrap(name).dispatchEvent(new PointerEvent(type, { pointerType }));
    return fixture.whenStable();
  }

  function clickInfo(name: string): Promise<void> {
    slotWrap(name).querySelector<HTMLButtonElement>('.slot-info')!.click();
    return fixture.whenStable();
  }

  it('affiche la carte complète du plan survolé, et la masque à la sortie', async () => {
    expect(host.querySelector('.preview')).toBeNull();

    await pointer('Scrap Wall', 'pointerenter');
    const preview = host.querySelector('.preview')!;
    expect(preview.querySelector('app-building-card')?.textContent).toContain('Scrap Wall');
    expect(preview.textContent).toContain('+1');
    expect(preview.querySelector('.preview-effect')).toBeNull();

    await pointer('Scrap Wall', 'pointerleave');
    expect(host.querySelector('.preview')).toBeNull();
  });

  it("n'ouvre rien au simple toucher d'un emplacement", async () => {
    await pointer('Scrap Wall', 'pointerenter', 'touch');
    expect(host.querySelector('.preview')).toBeNull();
  });

  it("écrit en clair l'effet d'un bâtiment spécial", async () => {
    await pointer('Night Totem', 'pointerenter');
    expect(host.querySelector('.preview-effect')?.textContent).toContain('+3 permanent defense');
  });

  it('le bouton « i » ouvre et ferme la bulle sans retirer le bâtiment', async () => {
    await clickInfo('Scrap Wall');
    expect(host.querySelector('.preview')?.textContent).toContain('Scrap Wall');
    expect(fixture.componentInstance.draft()).toEqual([1, 2]);

    await clickInfo('Scrap Wall');
    expect(host.querySelector('.preview')).toBeNull();
  });

  it("n'affiche la barre qu'avec des changements, et compte ceux-ci", async () => {
    const cityService = TestBed.inject(CityService);
    cityService.catalogBuildings.update((buildings) => [...buildings, { ...wall, id: 3, name: 'Tin Tower' }]);
    cityService.stats.update((stats) => ({ ...stats, collection: { 1: 2, 2: 1, 3: 1 } }));
    cityService.defaultValues.update((values) => ({ ...values, DECK_SIZE: 2 }));
    await fixture.whenStable();
    expect(host.querySelector('.deck-foot')).toBeNull();

    fixture.componentInstance.toggle(1);
    fixture.componentInstance.toggle(3);
    await fixture.whenStable();
    expect(host.querySelector('.unsaved')?.textContent).toContain('2 unsaved changes');

    host.querySelector<HTMLButtonElement>('.deck-foot .text-btn')!.click();
    await fixture.whenStable();
    expect(host.querySelector('.deck-foot')).toBeNull();
    expect(fixture.componentInstance.draft()).toEqual([1, 2]);
  });

  it('seule la poubelle retire le bâtiment, pas un clic sur son nom', async () => {
    slotWrap('Scrap Wall').querySelector<HTMLElement>('.slot')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.draft()).toEqual([1, 2]);

    await clickInfo('Scrap Wall');
    slotWrap('Scrap Wall').querySelector<HTMLButtonElement>('.slot-remove')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.draft()).toEqual([2]);
    expect(host.querySelector('.preview')).toBeNull();
  });

  it('la bulle se ferme au toucher ailleurs et avec Échap', async () => {
    await clickInfo('Scrap Wall');
    document.body.click();
    await fixture.whenStable();
    expect(host.querySelector('.preview')).toBeNull();

    await clickInfo('Scrap Wall');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(host.querySelector('.preview')).toBeNull();
  });

  function collectionNames(): string[] {
    return fixture.componentInstance.collection().map((b) => b.name);
  }

  it('filtre la collection entre plans normaux et spéciaux', () => {
    const deck = fixture.componentInstance;
    deck.kindFilter.set('special');
    expect(collectionNames()).toEqual(['Night Totem']);
    deck.kindFilter.set('normal');
    expect(collectionNames()).toEqual(['Scrap Wall']);
    deck.kindFilter.set('all');
    expect(collectionNames().length).toBe(2);
  });

  it('le bouton Upgrade ouvre le panneau sans toucher au deck', async () => {
    host.querySelector<HTMLButtonElement>('.upgrade-btn')!.click();
    await fixture.whenStable();
    expect(host.querySelector('app-upgrade-dialog')).not.toBeNull();
    expect(fixture.componentInstance.draft()).toEqual([1, 2]);
  });

  function cardActions(name: string): HTMLElement {
    const cards = [...host.querySelectorAll<HTMLElement>('.card-btn')];
    return cards.find((el) => el.textContent?.includes(name))!.querySelector<HTMLElement>('.card-actions')!;
  }

  it('Remove retire un plan du deck, Add le remet', async () => {
    cardActions('Scrap Wall').querySelector<HTMLButtonElement>('.toggle-btn.remove')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.draft()).toEqual([2]);

    cardActions('Scrap Wall').querySelector<HTMLButtonElement>('.toggle-btn')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.draft()).toEqual([2, 1]);
  });

  it('grise Add quand le deck est plein', async () => {
    const cityService = TestBed.inject(CityService);
    cityService.catalogBuildings.update((buildings) => [...buildings, { ...wall, id: 3, name: 'Tin Tower' }]);
    cityService.stats.update((stats) => ({ ...stats, collection: { 1: 2, 2: 1, 3: 1 } }));
    cityService.defaultValues.update((values) => ({ ...values, DECK_SIZE: 2 }));
    await fixture.whenStable();

    const add = cardActions('Tin Tower').querySelector<HTMLButtonElement>('.toggle-btn')!;
    expect(add.disabled).toBeTrue();
    expect(add.textContent).toContain('Add');
  });

  it('filtre les plans améliorables', () => {
    const deck = fixture.componentInstance;
    TestBed.inject(CityService).stats.update((stats) => ({ ...stats, collection: { 1: 6, 2: 1 } }));
    deck.upgradableOnly.set(true);
    expect(collectionNames()).toEqual(['Scrap Wall']);
  });

  it("recherche dans le nom (sans casse) ou dans le texte de l'effet", () => {
    const deck = fixture.componentInstance;
    deck.search.set('  scrap ');
    expect(collectionNames()).toEqual(['Scrap Wall']);
    deck.search.set('PERMANENT');
    expect(collectionNames()).toEqual(['Night Totem']);
    deck.search.set('nothing like this');
    expect(collectionNames()).toEqual([]);
  });
});
