import { Component, computed, inject, input, output, signal } from '@angular/core';
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

  price = signal<number | null>(null);

  validPrice = computed(() => {
    const price = this.price();
    return price !== null && Number.isInteger(price) && price >= 1;
  });

  // Même calcul que listingTax côté API
  tax = computed(() => (this.validPrice() ? Math.ceil(this.price()! * this.taxRate()) : 0));

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
