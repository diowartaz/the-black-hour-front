import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { MarketModel } from 'src/app/models/game';
import { runRequest } from 'src/app/shared/utils/http';
import { CityService } from '../city/city.service';
import { GameApiService, MarketUpdate } from '../game-api/game-api.service';

// Black Market du joueur connecté : meilleures offres, ses offres et ses ventes
@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly api = inject(GameApiService);
  private readonly cityService = inject(CityService);

  market = signal<MarketModel | null>(null);

  loadLoading = signal<boolean>(false);
  actionLoading = signal<boolean>(false);

  load(): void {
    runRequest(this.loadLoading, this.api.getMarket(), (market) => this.market.set(market));
  }

  createListing(buildingId: number, quantity: number, price: number, onListed: () => void): void {
    this.runAction(this.api.createMarketListing(buildingId, quantity, price), onListed);
  }

  buy(listingId: string): void {
    this.runAction(this.api.buyMarketListing(listingId));
  }

  withdraw(listingId: string): void {
    this.runAction(this.api.withdrawMarketListing(listingId));
  }

  // Un 409 veut dire que l'écran est périmé (offre déjà partie) : le joueur voit l'offre suivante et
  // décide lui-même, l'achat n'est jamais relancé
  private runAction(request: ReturnType<GameApiService['buyMarketListing']>, onSuccess?: () => void): void {
    runRequest(
      this.actionLoading,
      request,
      (update) => {
        this.apply(update);
        onSuccess?.();
      },
      (error) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.load();
        }
      },
    );
  }

  private apply({ stats, market }: MarketUpdate): void {
    this.cityService.stats.set(stats);
    this.market.set(market);
  }
}
