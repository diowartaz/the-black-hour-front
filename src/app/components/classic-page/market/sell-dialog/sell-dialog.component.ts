import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { CatalogBuildingModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { MarketService } from 'src/app/services/market/market.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

// Mise en vente d'un plan : panneau du bas, comme les filtres
@Component({
  selector: 'app-sell-dialog',
  imports: [FormatNumberPipe, BuildingCardComponent, IconComponent],
  templateUrl: './sell-dialog.component.html',
  styleUrls: ['./sell-dialog.component.scss'],
  host: {
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class SellDialogComponent {
  private readonly cityService = inject(CityService);
  private readonly marketService = inject(MarketService);

  building = input.required<CatalogBuildingModel>();
  count = input(1);
  inDeck = input(false);
  // Absent quand personne d'autre ne vend ce plan
  lowestPrice = input<number | undefined>(undefined);
  taxRate = input.required<number>();
  closed = output<void>();

  // Prérempli juste sous l'offre la plus basse : à prix égal, l'offre la plus ancienne reste devant
  price = linkedSignal<number | null>(() => {
    const lowest = this.lowestPrice();
    return lowest !== undefined && lowest > 1 ? lowest - 1 : null;
  });

  validPrice = computed(() => {
    const price = this.price();
    return price !== null && Number.isInteger(price) && price >= 1;
  });

  presets = computed(() => {
    const lowest = this.lowestPrice();
    if (lowest === undefined) {
      return [];
    }
    const presets = [
      { label: 'Lowest −1', price: lowest - 1 },
      { label: '−5%', price: Math.floor((lowest * 95) / 100) },
      { label: '−10%', price: Math.floor((lowest * 90) / 100) },
    ];
    return presets.filter(
      (preset, index) => preset.price >= 1 && presets.findIndex((p) => p.price === preset.price) === index,
    );
  });

  // Les acheteurs ne voient que l'offre la moins chère de chaque plan
  visible = computed(() => {
    const lowest = this.lowestPrice();
    return lowest === undefined || (this.validPrice() && this.price()! < lowest);
  });

  // Même calcul que listingTax côté API
  tax = computed(() => (this.validPrice() ? Math.ceil(this.price()! * this.taxRate()) : 0));

  net = computed(() => (this.validPrice() ? this.price()! - this.tax() : 0));

  canList = computed(
    () => this.validPrice() && this.tax() <= this.cityService.stats().money && !this.marketService.actionLoading(),
  );

  setPrice(value: string): void {
    this.price.set(value === '' ? null : Number(value));
  }

  list(): void {
    if (this.canList()) {
      this.marketService.createListing(this.building().id, this.price()!, () => this.closed.emit());
    }
  }
}
