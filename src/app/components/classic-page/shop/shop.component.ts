import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BoosterModel } from 'src/app/models/game';
import { RoutesEnum } from 'src/app/models/router';
import { ClassicPageComponent } from '../classic-page.component';
import { CityService } from 'src/app/services/city/city.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { BonusToColorPipe, BonusToIconPipe } from 'src/app/shared/pipes/bonus-to-icon.pipe';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { BoosterOpeningComponent } from './booster-opening/booster-opening.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

type ShopTab = 'boosters' | 'bonuses';

@Component({
  selector: 'app-shop',
  imports: [
    FormatNumberPipe,
    KeyValuePipe,
    ClassicPageComponent,
    IconComponent,
    BonusToIconPipe,
    BonusToColorPipe,
    RarityToColorPipe,
    BoosterOpeningComponent,
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent {
  cityService = inject(CityService);
  private readonly router = inject(Router);

  tab = signal<ShopTab>('boosters');
  // Booster en cours d'ouverture (révélation affichée tant que lastBoosterCards est renseigné)
  openedBooster = signal<BoosterModel | null>(null);

  ownedCount = computed(() => Object.values(this.cityService.collection()).filter((count) => count > 0).length);
  duplicates = computed(() =>
    Object.values(this.cityService.collection()).reduce((sum, count) => sum + Math.max(0, count - 1), 0),
  );

  // Une case de jauge par niveau
  pipsOf(count: number): number[] {
    return Array.from({ length: count });
  }

  oddsOf(booster: BoosterModel): { rarity: string; percent: number }[] {
    return Object.entries(booster.odds)
      .filter(([, odds]) => odds > 0)
      .map(([rarity, odds]) => ({ rarity, percent: Math.round(odds * 100) }));
  }

  buyItem(id: number) {
    this.cityService.buyBonus(id);
  }

  openBooster(booster: BoosterModel) {
    this.openedBooster.set(booster);
    this.cityService.openBooster(booster.id);
  }

  closeBooster() {
    this.openedBooster.set(null);
    this.cityService.lastBoosterCards.set(null);
  }

  goToDeck() {
    this.router.navigate([RoutesEnum.DECK]);
  }

  goToMarket() {
    this.router.navigate([RoutesEnum.MARKET]);
  }
}
