import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BuildingEffectModel, CatalogBuildingModel, ItemModel, Rarity } from 'src/app/models/game';
import { RoutesEnum } from 'src/app/models/router';
import { CityService } from 'src/app/services/city/city.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { BuildingEmblemComponent } from 'src/app/shared/components/building-emblem/building-emblem.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { PlanFiltersComponent } from 'src/app/shared/components/plan-filters/plan-filters.component';
import { ResourceSharesComponent } from 'src/app/shared/components/resource-shares/resource-shares.component';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { buildingEffectText } from 'src/app/shared/utils/building-effects';
import {
  autocompleteDeck,
  buildingsOf,
  byRarityDesc,
  deckProblems,
  filterPlans,
  PlanKind,
} from 'src/app/shared/utils/deck';
import { canUpgrade, cardRank, rankedEffect, rankMultiplier } from 'src/app/shared/utils/ranks';
import { ClassicPageComponent } from '../classic-page.component';
import { UpgradeDialogComponent } from './upgrade-dialog/upgrade-dialog.component';

// Éditeur de deck : le brouillon est local jusqu'à l'enregistrement
@Component({
  selector: 'app-deck',
  imports: [
    ClassicPageComponent,
    IconComponent,
    BuildingCardComponent,
    BuildingEmblemComponent,
    PlanFiltersComponent,
    ResourceSharesComponent,
    RarityToColorPipe,
    UpgradeDialogComponent,
  ],
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.scss'],
  host: {
    '(document:click)': 'closeOutside($event)',
    '(document:keydown.escape)': 'previewId.set(null)',
  },
})
export class DeckComponent {
  readonly cityService = inject(CityService);
  private readonly router = inject(Router);

  // Repart du deck enregistré à chaque fois que celui-ci change (chargement, enregistrement)
  draft = linkedSignal(() => this.cityService.deck());
  rarityFilter = signal<Rarity | 'all'>('all');
  itemFilter = signal<ItemModel | 'all'>('all');
  kindFilter = signal<PlanKind>('all');
  search = signal('');
  upgradableOnly = signal(false);
  upgradingId = signal<number | null>(null);
  // Emplacement survolé : sa carte complète s'affiche en bulle, ancrée à droite dans la moitié droite de l'écran
  previewId = signal<number | null>(null);
  previewAlign = signal<'left' | 'right'>('left');

  size = computed(() => this.cityService.defaultValues().DECK_SIZE);
  rules = computed(() => ({ size: this.size() }));
  // Affichées par rareté décroissante (l'ordre du deck n'a pas d'importance)
  draftBuildings = computed(() => buildingsOf(this.draft(), this.cityService.catalogBuildings()).sort(byRarityDesc));
  emptySlots = computed(() => Array.from({ length: Math.max(0, this.size() - this.draft().length) }));
  problems = computed(() => deckProblems(this.draft(), this.cityService.collection(), this.rules()));
  // Plans ajoutés et retirés par rapport au deck enregistré
  changes = computed(() => {
    const saved = new Set(this.cityService.deck());
    const draft = new Set(this.draft());
    return [...draft].filter((id) => !saved.has(id)).length + [...saved].filter((id) => !draft.has(id)).length;
  });
  dirty = computed(() => this.changes() > 0);

  autocompleted = computed(() =>
    autocompleteDeck(this.draft(), this.cityService.collection(), this.cityService.catalogBuildings(), this.size()),
  );
  canAutocomplete = computed(() => this.autocompleted().length > this.draft().length);

  ownedCount = computed(() => this.cityService.catalogBuildings().filter((b) => this.owned(b.id) > 0).length);

  // Plans possédés d'abord, puis par rareté décroissante et par nom
  collection = computed(() =>
    filterPlans(
      this.cityService.catalogBuildings(),
      {
        search: this.search(),
        rarity: this.rarityFilter(),
        item: this.itemFilter(),
        kind: this.kindFilter(),
      },
      (effect) => this.effectText(effect),
    )
      .filter((b) => !this.upgradableOnly() || this.canUpgrade(b))
      .sort((a, b) => Number(this.owned(b.id) > 0) - Number(this.owned(a.id) > 0) || byRarityDesc(a, b)),
  );

  upgrading = computed(() => this.cityService.catalogBuildings().find((b) => b.id === this.upgradingId()) ?? null);

  private rankRules = computed(() => this.cityService.defaultValues().rank_rules);

  owned(id: number): number {
    return this.cityService.collection()[id] ?? 0;
  }

  rank(id: number): number {
    return cardRank(this.cityService.buildingRanks(), id);
  }

  canUpgrade(building: CatalogBuildingModel): boolean {
    return canUpgrade(this.owned(building.id), building.rarity, this.rank(building.id), this.rankRules());
  }

  inDraft(id: number): boolean {
    return this.draft().includes(id);
  }

  toggle(id: number): void {
    if (this.inDraft(id)) {
      this.draft.update((ids) => ids.filter((other) => other !== id));
    } else if (this.owned(id) > 0 && this.draft().length < this.size()) {
      this.draft.update((ids) => [...ids, id]);
    }
  }

  // Ne réagit qu'au focus de la carte elle-même, pas à celui de ses boutons
  toggleFromKeyboard(id: number, event: Event): void {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      this.toggle(id);
    }
  }

  // Le clic ne remonte pas à la carte : améliorer ne touche pas au deck
  openUpgrade(id: number, event: Event): void {
    event.stopPropagation();
    this.upgradingId.set(id);
  }

  // Ouvre directement la mise en vente de ce plan (voir MarketComponent)
  sellCopy(id: number): void {
    this.router.navigate([RoutesEnum.MARKET], { state: { sellBuildingId: id } });
  }

  // Survol à la souris uniquement : un toucher émet aussi un pointerenter, qui ouvrirait la bulle
  // juste avant que le clic sur le bouton « i » la referme
  showPreview(id: number, event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.openPreview(id, event.currentTarget as HTMLElement);
    }
  }

  hidePreview(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.previewId.set(null);
    }
  }

  // Bouton « i » : seul moyen d'ouvrir la bulle au toucher ou au clavier
  togglePreview(id: number, event: Event): void {
    event.stopPropagation();
    if (this.previewId() === id) {
      this.previewId.set(null);
    } else {
      this.openPreview(id, (event.currentTarget as HTMLElement).closest('.slot-wrap') as HTMLElement);
    }
  }

  closeOutside(event: Event): void {
    if (this.previewId() !== null && !(event.target as HTMLElement).closest?.('.slot-wrap')) {
      this.previewId.set(null);
    }
  }

  private openPreview(id: number, slot: HTMLElement): void {
    const rect = slot.getBoundingClientRect();
    this.previewAlign.set(rect.left + rect.width / 2 > window.innerWidth / 2 ? 'right' : 'left');
    this.previewId.set(id);
  }

  // Le bouton « Effect » de la carte n'est pas cliquable dans la bulle : l'effet y est écrit en clair
  effectText(effect: BuildingEffectModel, rank = 0): string {
    return buildingEffectText(rankedEffect(effect, rank, this.rankRules()), {
      rules: this.cityService.defaultValues().effect_rules,
      rankMultiplier: rankMultiplier(rank, this.rankRules()),
    });
  }

  autocomplete(): void {
    this.draft.set(this.autocompleted());
  }

  clear(): void {
    this.draft.set([]);
  }

  reset(): void {
    this.draft.set(this.cityService.deck());
  }

  save(): void {
    this.cityService.saveDeck(this.draft());
  }

  goToShop(): void {
    this.router.navigate([RoutesEnum.SHOP]);
  }
}
