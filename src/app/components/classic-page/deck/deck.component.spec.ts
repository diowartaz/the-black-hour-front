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
    expect(preview.textContent).toContain('common');
    expect(preview.textContent).toContain('×2');
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
