import { Component, computed, inject, input, OnDestroy, output, signal } from '@angular/core';
import { CatalogBuildingModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { buildingEffectText } from 'src/app/shared/utils/building-effects';
import { canUpgrade, cardRank, rankedDefense, rankedEffect, upgradeCopies } from 'src/app/shared/utils/ranks';

const ANIMATION_MS = 1000;
// Au-delà, les exemplaires animés ne se distinguent plus
const MAX_GHOSTS = 5;

// Amélioration d'un plan : panneau du bas, comme la mise en vente. Il reste ouvert pour enchaîner les rangs.
@Component({
  selector: 'app-upgrade-dialog',
  imports: [BuildingCardComponent, FormatNumberPipe, IconComponent, RarityToColorPipe],
  templateUrl: './upgrade-dialog.component.html',
  styleUrls: ['./upgrade-dialog.component.scss'],
  host: {
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class UpgradeDialogComponent implements OnDestroy {
  readonly cityService = inject(CityService);

  building = input.required<CatalogBuildingModel>();
  inDeck = input(false);
  closed = output<void>();
  // Vendre un exemplaire au lieu de l'utiliser : l'autre choix du joueur
  sell = output<void>();

  // Exemplaires consommés affichés par l'animation en cours (vide : pas d'animation)
  ghosts = signal<number[]>([]);
  private animationTimer?: ReturnType<typeof setTimeout>;

  private rankRules = computed(() => this.cityService.defaultValues().rank_rules);

  owned = computed(() => this.cityService.collection()[this.building().id] ?? 0);
  rank = computed(() => cardRank(this.cityService.buildingRanks(), this.building().id));
  nextRank = computed(() => this.rank() + 1);
  copies = computed(() => upgradeCopies(this.building().rarity, this.rank(), this.rankRules()));
  // Exemplaires utilisables : le joueur garde toujours sa carte
  spare = computed(() => this.owned() - 1);
  ready = computed(() => canUpgrade(this.owned(), this.building().rarity, this.rank(), this.rankRules()));
  animating = computed(() => this.ghosts().length > 0);

  defenseAt(rank: number): number {
    return rankedDefense(this.building().defense, rank, this.rankRules());
  }

  effectAt(rank: number): string {
    const effect = this.building().effect;
    return effect
      ? buildingEffectText(
          rankedEffect(effect, rank, this.rankRules()),
          undefined,
          this.cityService.defaultValues().effect_rules,
        )
      : '';
  }

  upgrade(): void {
    const copies = this.copies();
    if (copies === null || !this.ready() || this.animating()) {
      return;
    }
    this.cityService.upgradeBuilding(this.building().id, () => {
      this.ghosts.set(Array.from({ length: Math.min(copies, MAX_GHOSTS) }, (_, i) => i));
      this.animationTimer = setTimeout(() => this.ghosts.set([]), ANIMATION_MS);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.animationTimer);
  }
}
