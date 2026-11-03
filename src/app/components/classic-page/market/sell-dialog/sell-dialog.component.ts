import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { CatalogBuildingModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { MarketService } from 'src/app/services/market/market.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { CatalogNamePipe } from 'src/app/shared/i18n/catalog-name.pipe';

// Mise en vente d'un plan, à l'unité ou en lot : panneau du bas, comme les filtres
@Component({
  selector: 'app-sell-dialog',
  imports: [TPipe, CatalogNamePipe, FormatNumberPipe, BuildingCardComponent, IconComponent],
  templateUrl: './sell-dialog.component.html',
  styleUrls: ['./sell-dialog.component.scss'],
  host: {
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class SellDialogComponent {
  private readonly cityService = inject(CityService);
  private readonly marketService = inject(MarketService);
  private readonly languageService = inject(LanguageService);

  building = input.required<CatalogBuildingModel>();
  count = input(1);
  inDeck = input(false);
  // Prix le plus bas de chaque taille de lot ; une taille absente quand personne d'autre n'en vend
  lowestPrices = input<Record<number, number>>({});
  lotSizes = input([1]);
  minCopiesToSell = input(2);
  initialQuantity = input(1);
  taxRate = input.required<number>();
  closed = output<void>();

  quantity = linkedSignal(() => this.initialQuantity());

  // Le vendeur garde toujours un exemplaire : un lot de n en demande n − 1 de plus qu'une vente à l'unité
  lots = computed(() =>
    this.lotSizes().map((size) => ({ size, available: this.count() >= size + this.minCopiesToSell() - 1 })),
  );

  isLot = computed(() => this.quantity() > 1);

  lowestPrice = computed<number | undefined>(() => this.lowestPrices()[this.quantity()]);

  // Sans lot concurrent de cette taille, la référence est l'offre unitaire la plus basse, multipliée
  private reference = computed<{ price: number; label: string } | undefined>(() => {
    const lowest = this.lowestPrice();
    if (lowest !== undefined) {
      return { price: lowest - 1, label: this.languageService.t('sell.lowestMinus') };
    }
    const unit = this.lowestPrices()[1];
    return this.isLot() && unit !== undefined
      ? { price: unit * this.quantity(), label: this.languageService.t('sell.timesLowest', { count: this.quantity() }) }
      : undefined;
  });

  // Prérempli juste sous l'offre la plus basse : à prix égal, l'offre la plus ancienne reste devant
  price = linkedSignal<number | null>(() => {
    const reference = this.reference();
    return reference && reference.price >= 1 ? reference.price : null;
  });

  validPrice = computed(() => {
    const price = this.price();
    return price !== null && Number.isInteger(price) && price >= 1;
  });

  presets = computed(() => {
    const reference = this.reference();
    if (!reference) {
      return [];
    }
    const base = this.lowestPrice() ?? reference.price;
    const presets = [
      reference,
      { label: '−5%', price: Math.floor((base * 95) / 100) },
      { label: '−10%', price: Math.floor((base * 90) / 100) },
    ];
    return presets.filter(
      (preset, index) => preset.price >= 1 && presets.findIndex((p) => p.price === preset.price) === index,
    );
  });

  // Les acheteurs ne voient que l'offre la moins chère de chaque plan et taille de lot
  visible = computed(() => {
    const lowest = this.lowestPrice();
    return lowest === undefined || (this.validPrice() && this.price()! < lowest);
  });

  offerName = computed(() =>
    this.isLot()
      ? this.languageService.t('sell.lot', { count: this.quantity() })
      : this.languageService.t('sell.offer'),
  );

  unitPrice = computed(() => (this.validPrice() ? Math.round(this.price()! / this.quantity()) : 0));

  // Même calcul que listingTax côté API, sur le prix du lot entier
  tax = computed(() => (this.validPrice() ? Math.ceil(this.price()! * this.taxRate()) : 0));

  net = computed(() => (this.validPrice() ? this.price()! - this.tax() : 0));

  canList = computed(
    () =>
      this.validPrice() &&
      this.lots().some((lot) => lot.size === this.quantity() && lot.available) &&
      this.tax() <= this.cityService.stats().money &&
      !this.marketService.actionLoading(),
  );

  setPrice(value: string): void {
    this.price.set(value === '' ? null : Number(value));
  }

  list(): void {
    if (this.canList()) {
      this.marketService.createListing(this.building().id, this.quantity(), this.price()!, () => this.closed.emit());
    }
  }
}
