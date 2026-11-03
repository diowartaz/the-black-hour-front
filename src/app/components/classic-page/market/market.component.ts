import { LocalDatePipe } from 'src/app/shared/i18n/local-date.pipe';
import { Component, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogBuildingModel, ItemModel, MarketListingModel, Rarity } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { MarketService } from 'src/app/services/market/market.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { BuildingEmblemComponent } from 'src/app/shared/components/building-emblem/building-emblem.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { PlanFiltersComponent } from 'src/app/shared/components/plan-filters/plan-filters.component';
import { buildingEffectText } from 'src/app/shared/utils/building-effects';
import { byRarityDesc, filterPlans, PlanKind } from 'src/app/shared/utils/deck';
import { ClassicPageComponent } from '../classic-page.component';
import { SellDialogComponent } from './sell-dialog/sell-dialog.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { TranslationKey } from 'src/app/shared/i18n/types';
import { CatalogNamePipe } from 'src/app/shared/i18n/catalog-name.pipe';

type MarketTab = 'buy' | 'sell';
type MarketSort = 'rarity' | 'price-asc' | 'price-desc';

// Black Market : achat de la meilleure offre de chaque plan et taille de lot, et vente des doublons
@Component({
  selector: 'app-market',
  imports: [
    TPipe,
    CatalogNamePipe,
    FormatNumberPipe,
    LocalDatePipe,
    MatProgressSpinnerModule,
    ClassicPageComponent,
    IconComponent,
    BuildingCardComponent,
    BuildingEmblemComponent,
    PlanFiltersComponent,
    SellDialogComponent,
  ],
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss'],
})
export class MarketComponent {
  readonly cityService = inject(CityService);
  readonly marketService = inject(MarketService);
  private readonly languageService = inject(LanguageService);

  readonly sorts: { value: MarketSort; label: TranslationKey }[] = [
    { value: 'rarity', label: 'market.sortRarity' },
    { value: 'price-asc', label: 'market.sortPriceAsc' },
    { value: 'price-desc', label: 'market.sortPriceDesc' },
  ];

  tab = signal<MarketTab>('buy');
  sort = signal<MarketSort>('rarity');
  showUnavailable = signal(false);
  deckOnly = signal(false);
  search = signal('');
  rarityFilter = signal<Rarity | 'all'>('all');
  itemFilter = signal<ItemModel | 'all'>('all');
  kindFilter = signal<PlanKind>('all');

  selectedId = signal<number | null>(null);
  // Ouverture depuis le panneau d'amélioration : la pop-up de vente propose d'abord le plus gros lot possible
  sellLargestLot = signal(false);

  market = this.marketService.market;
  gamesLeft = computed(() => {
    const market = this.market();
    return market ? market.requiredGames - market.gamesPlayed : 0;
  });

  // Offres de chaque plan, une par taille de lot, du plus petit lot au plus grand
  private offers = computed(() => byPlan(this.market()?.offers ?? []));

  // Offre la moins chère du joueur pour chaque plan et taille de lot, affichée à part dans l'onglet Buy
  private myOffers = computed(() => {
    const cheapest = new Map<string, MarketListingModel>();
    for (const listing of this.market()?.myListings ?? []) {
      const key = `${listing.buildingId}:${listing.quantity}`;
      if (listing.price < (cheapest.get(key)?.price ?? Infinity)) {
        cheapest.set(key, listing);
      }
    }
    return byPlan([...cheapest.values()]);
  });

  private filteredPlans = computed(() =>
    filterPlans(
      this.cityService.catalogBuildings(),
      {
        search: this.search(),
        rarity: this.rarityFilter(),
        item: this.itemFilter(),
        kind: this.kindFilter(),
      },
      (effect) =>
        buildingEffectText(effect, {
          rules: this.cityService.defaultValues().effect_rules,
          i18n: this.languageService.translator(),
        }),
      (building) => this.languageService.translator().catalog('building', building.id, building.name),
    ).filter((b) => !this.deckOnly() || this.inDeck(b.id)),
  );

  // Options propres au marché, comptées dans le badge du bouton Filters
  extraFilters = computed(() => Number(this.deckOnly()) + Number(this.tab() === 'buy' && this.showUnavailable()));

  buyPlans = computed(() =>
    this.sorted(
      this.filteredPlans().filter(
        (b) => this.showUnavailable() || this.offers().has(b.id) || this.myOffers().has(b.id),
      ),
    ),
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
    // Arrivée depuis le panneau d'amélioration : ouvre directement la mise en vente de ce plan
    const sellBuildingId = window.history.state?.sellBuildingId;
    if (typeof sellBuildingId === 'number') {
      this.tab.set('sell');
      this.selectedId.set(sellBuildingId);
      this.sellLargestLot.set(true);
    }
  }

  offersOf(buildingId: number): MarketListingModel[] {
    return this.offers().get(buildingId) ?? [];
  }

  myOffersOf(buildingId: number): MarketListingModel[] {
    return this.myOffers().get(buildingId) ?? [];
  }

  // Les acheteurs ne voient que l'offre la moins chère de chaque taille de lot ; à prix égal, celle des autres,
  // plus ancienne, reste devant
  isShownToBuyers(listing: MarketListingModel): boolean {
    const other = this.offersOf(listing.buildingId).find((offer) => offer.quantity === listing.quantity);
    return !other || listing.price < other.price;
  }

  // Taille de lot présélectionnée dans la pop-up de vente
  initialSellQuantity(buildingId: number): number {
    const market = this.market();
    if (!this.sellLargestLot() || !market) {
      return 1;
    }
    const sellable = market.lotSizes.filter((size) => this.owned(buildingId) >= size + market.minCopiesToSell - 1);
    return sellable.length ? Math.max(...sellable) : 1;
  }

  // Prix le plus bas de chaque taille de lot. Les offres du marché excluent celles du joueur, qui peuvent
  // pourtant passer devant la sienne
  lowestPricesOf(buildingId: number): Record<number, number> {
    const lowest: Record<number, number> = {};
    const listings = [
      ...(this.market()?.myListings ?? []).filter((listing) => listing.buildingId === buildingId),
      ...this.offersOf(buildingId),
    ];
    for (const { quantity, price } of listings) {
      lowest[quantity] = Math.min(lowest[quantity] ?? Infinity, price);
    }
    return lowest;
  }

  owned(buildingId: number): number {
    return this.cityService.collection()[buildingId] ?? 0;
  }

  inDeck(buildingId: number): boolean {
    return this.cityService.deck().includes(buildingId);
  }

  // Nom affiché d'un plan du catalogue, dans la langue courante
  buildingName(buildingId: number): string {
    const building = this.buildingOf(buildingId);
    return building ? this.languageService.translator().catalog('building', building.id, building.name) : '';
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

  closeSellDialog(): void {
    this.selectedId.set(null);
    this.sellLargestLot.set(false);
  }

  clearExtraFilters(): void {
    this.showUnavailable.set(false);
    this.deckOnly.set(false);
  }

  private canSell(buildingId: number): boolean {
    return this.owned(buildingId) >= (this.market()?.minCopiesToSell ?? Infinity);
  }

  // Prix unitaire le plus bas, toutes tailles de lot confondues
  private bestUnitPrice(buildingId: number): number | undefined {
    const prices = this.offersOf(buildingId).map((offer) => offer.price / offer.quantity);
    return prices.length ? Math.min(...prices) : undefined;
  }

  // Les plans sans offre passent toujours après les autres
  private sorted(plans: CatalogBuildingModel[]): CatalogBuildingModel[] {
    const sort = this.sort();
    if (sort === 'rarity') {
      return [...plans].sort(byRarityDesc);
    }
    const direction = sort === 'price-asc' ? 1 : -1;
    return [...plans].sort((a, b) => {
      const [priceA, priceB] = [this.bestUnitPrice(a.id), this.bestUnitPrice(b.id)];
      if (priceA === undefined || priceB === undefined) {
        return Number(priceA === undefined) - Number(priceB === undefined) || byRarityDesc(a, b);
      }
      return direction * (priceA - priceB) || byRarityDesc(a, b);
    });
  }
}

const byPlan = (listings: MarketListingModel[]): Map<number, MarketListingModel[]> => {
  const plans = new Map<number, MarketListingModel[]>();
  for (const listing of listings) {
    plans.set(listing.buildingId, [...(plans.get(listing.buildingId) ?? []), listing]);
  }
  for (const list of plans.values()) {
    list.sort((a, b) => a.quantity - b.quantity);
  }
  return plans;
};
