import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogBuildingModel, ItemModel, MarketListingModel, Rarity } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { MarketService } from 'src/app/services/market/market.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { PlanFiltersComponent } from 'src/app/shared/components/plan-filters/plan-filters.component';
import { buildingEffectText } from 'src/app/shared/utils/building-effects';
import { byRarityDesc, filterPlans, PlanKind } from 'src/app/shared/utils/deck';
import { ClassicPageComponent } from '../classic-page.component';
import { SellDialogComponent } from './sell-dialog/sell-dialog.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

type MarketTab = 'buy' | 'sell';
type MarketSort = 'rarity' | 'price-asc' | 'price-desc';

// Black Market : achat de la meilleure offre de chaque plan et vente des doublons
@Component({
  selector: 'app-market',
  imports: [FormatNumberPipe, 
    DatePipe,
    MatProgressSpinnerModule,
    ClassicPageComponent,
    IconComponent,
    BuildingCardComponent,
    PlanFiltersComponent,
    SellDialogComponent,
  ],
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss'],
})
export class MarketComponent {
  readonly cityService = inject(CityService);
  readonly marketService = inject(MarketService);

  readonly sorts: { value: MarketSort; label: string }[] = [
    { value: 'rarity', label: 'Sorted by rarity' },
    { value: 'price-asc', label: 'Sorted by price: low to high price' },
    { value: 'price-desc', label: 'Sorted by price: high to low price' },
  ];

  tab = signal<MarketTab>('buy');
  sort = signal<MarketSort>('rarity');
  showUnavailable = signal(false);
  search = signal('');
  rarityFilter = signal<Rarity | 'all'>('all');
  itemFilter = signal<ItemModel | 'all'>('all');
  kindFilter = signal<PlanKind>('all');

  selectedId = signal<number | null>(null);

  market = this.marketService.market;
  gamesLeft = computed(() => {
    const market = this.market();
    return market ? market.requiredGames - market.gamesPlayed : 0;
  });

  private offers = computed(
    () =>
      new Map((this.market()?.offers ?? []).map((offer): [number, MarketListingModel] => [offer.buildingId, offer])),
  );

  private filteredPlans = computed(() =>
    filterPlans(
      this.cityService.catalogBuildings(),
      {
        search: this.search(),
        rarity: this.rarityFilter(),
        item: this.itemFilter(),
        kind: this.kindFilter(),
      },
      (effect) => buildingEffectText(effect, undefined, this.cityService.defaultValues().effect_rules),
    ),
  );

  buyPlans = computed(() =>
    this.sorted(this.filteredPlans().filter((b) => this.showUnavailable() || this.offers().has(b.id))),
  );

  sellPlans = computed(() => this.sorted(this.filteredPlans().filter((b) => this.canSell(b.id))));

  visiblePlans = computed(() => (this.tab() === 'buy' ? this.buyPlans() : this.sellPlans()));

  // La pop-up de vente se ferme dès qu'il ne reste plus assez d'exemplaires du plan choisi
  selected = computed(() => {
    const id = this.selectedId();
    return id !== null && this.canSell(id) ? (this.buildingOf(id) ?? null) : null;
  });

  constructor() {
    this.marketService.market.set(null);
    this.marketService.load();
  }

  offerOf(buildingId: number): MarketListingModel | undefined {
    return this.offers().get(buildingId);
  }

  owned(buildingId: number): number {
    return this.cityService.collection()[buildingId] ?? 0;
  }

  inDeck(buildingId: number): boolean {
    return this.cityService.deck().includes(buildingId);
  }

  buildingOf(buildingId: number): CatalogBuildingModel | undefined {
    return this.cityService.catalogBuildings().find((b) => b.id === buildingId);
  }

  canAfford(price: number): boolean {
    return this.cityService.stats().money >= price;
  }

  setSort(value: string): void {
    this.sort.set(value as MarketSort);
  }

  private canSell(buildingId: number): boolean {
    return this.owned(buildingId) >= (this.market()?.minCopiesToSell ?? Infinity);
  }

  // Les plans sans offre passent toujours après les autres
  private sorted(plans: CatalogBuildingModel[]): CatalogBuildingModel[] {
    const sort = this.sort();
    if (sort === 'rarity') {
      return [...plans].sort(byRarityDesc);
    }
    const direction = sort === 'price-asc' ? 1 : -1;
    return [...plans].sort((a, b) => {
      const [priceA, priceB] = [this.offerOf(a.id)?.price, this.offerOf(b.id)?.price];
      if (priceA === undefined || priceB === undefined) {
        return Number(priceA === undefined) - Number(priceB === undefined) || byRarityDesc(a, b);
      }
      return direction * (priceA - priceB) || byRarityDesc(a, b);
    });
  }
}
