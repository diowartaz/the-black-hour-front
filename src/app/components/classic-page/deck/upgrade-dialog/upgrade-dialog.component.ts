import { Component, computed, inject, input, OnDestroy, output, signal } from '@angular/core';
import { CatalogBuildingModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { buildingEffectText } from 'src/app/shared/utils/building-effects';
import {
  canUpgrade,
  cardRank,
  rankedDefense,
  rankedEffect,
  rankMultiplier,
  upgradeCopies,
} from 'src/app/shared/utils/ranks';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { CatalogNamePipe } from 'src/app/shared/i18n/catalog-name.pipe';

// Balayage (1 s) puis éclat de la carte (0,5 s) : durées de upgrade-dialog.component.scss
const ANIMATION_MS = 1500;

// Amélioration d'un plan : panneau du bas, comme la mise en vente. Il reste ouvert pour enchaîner les rangs.
@Component({
  selector: 'app-upgrade-dialog',
  imports: [TPipe, CatalogNamePipe, BuildingCardComponent, FormatNumberPipe, IconComponent, RarityToColorPipe],
  templateUrl: './upgrade-dialog.component.html',
  styleUrls: ['./upgrade-dialog.component.scss'],
  host: {
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class UpgradeDialogComponent implements OnDestroy {
  readonly cityService = inject(CityService);
  private readonly languageService = inject(LanguageService);

  building = input.required<CatalogBuildingModel>();
  inDeck = input(false);
  closed = output<void>();
  // Vendre un exemplaire au lieu de l'utiliser : l'autre choix du joueur
  sell = output<void>();

  // Carte d'avant l'amélioration, effacée par le balayage de l'animation en cours (null : pas d'animation)
  previous = signal<{ count: number; rank: number } | null>(null);
  private animationTimer?: ReturnType<typeof setTimeout>;

  private rankRules = computed(() => this.cityService.defaultValues().rank_rules);

  owned = computed(() => this.cityService.collection()[this.building().id] ?? 0);
  rank = computed(() => cardRank(this.cityService.buildingRanks(), this.building().id));
  nextRank = computed(() => this.rank() + 1);
  copies = computed(() => upgradeCopies(this.building().rarity, this.rank(), this.rankRules()));
  // Exemplaires utilisables : le joueur garde toujours sa carte
  spare = computed(() => this.owned() - 1);
  ready = computed(() => canUpgrade(this.owned(), this.building().rarity, this.rank(), this.rankRules()));
  animating = computed(() => this.previous() !== null);

  defenseAt(rank: number): number {
    return rankedDefense(this.building().defense, rank, this.rankRules());
  }

  effectAt(rank: number): string {
    const effect = this.building().effect;
    return effect
      ? buildingEffectText(rankedEffect(effect, rank, this.rankRules()), {
          rules: this.cityService.defaultValues().effect_rules,
          rankMultiplier: rankMultiplier(rank, this.rankRules()),
          i18n: this.languageService.translator(),
        })
      : '';
  }

  upgrade(): void {
    if (this.copies() === null || !this.ready() || this.animating()) {
      return;
    }
    const previous = { count: this.owned(), rank: this.rank() };
    this.cityService.upgradeBuilding(this.building().id, () => {
      this.previous.set(previous);
      this.animationTimer = setTimeout(() => this.previous.set(null), ANIMATION_MS);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.animationTimer);
  }
}
