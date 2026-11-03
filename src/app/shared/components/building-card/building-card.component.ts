import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { CatalogNamePipe } from 'src/app/shared/i18n/catalog-name.pipe';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CatalogBuildingModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { RarityToColorPipe } from '../../pipes/rarity-to-color.pipe';
import { rankedDefense, rankedEffect } from '../../utils/ranks';
import { formatTimeToString } from '../../utils/time';
import { BuildingEmblemComponent } from '../building-emblem/building-emblem.component';
import { EffectTooltipComponent } from '../effect-tooltip/effect-tooltip.component';
import { IconComponent } from '../icon/icon.component';
import { RankPipsComponent } from '../rank-pips/rank-pips.component';
import { ResourceGemComponent } from '../resource-gem/resource-gem.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

// Carte d'un plan du catalogue (collection, deck, boosters). Le contenu projeté s'affiche en pied de carte.
@Component({
  selector: 'app-building-card',
  imports: [
    TPipe,
    CatalogNamePipe,
    FormatNumberPipe,
    KeyValuePipe,
    NgTemplateOutlet,
    IconComponent,
    BuildingEmblemComponent,
    EffectTooltipComponent,
    RankPipsComponent,
    ResourceGemComponent,
    RarityToColorPipe,
  ],
  templateUrl: './building-card.component.html',
  styleUrls: ['./building-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildingCardComponent {
  private readonly cityService = inject(CityService);

  building = input.required<CatalogBuildingModel>();
  // Rang du plan : défense et effet s'affichent à sa valeur. Sans ce champ, la carte montre un exemplaire de base
  rank = input(0);
  // Affiche les pastilles de rang même au rang 1 (collection)
  showRank = input(false);
  // Exemplaires possédés : 0 = plan pas encore obtenu. Le badge montre les doublons, seuls utilisables
  count = input(1);
  // Signale un plan non possédé comme nouveau au lieu de griser la carte (Black Market)
  showNew = input(false);
  inDeck = input(false);
  // Version resserrée (éditeur de deck) : nom plus petit
  compact = input(false);
  // Coûts sous les stats plutôt qu'en pied de carte (Black Market, pied de carte long)
  costsOnTop = input(false);

  locked = computed(() => this.count() === 0 && !this.showNew());
  time = computed(() => formatTimeToString(this.building().time));
  rankRules = computed(() => this.cityService.defaultValues().rank_rules);
  defense = computed(() => rankedDefense(this.building().defense, this.rank(), this.rankRules()));
  effect = computed(() => {
    const effect = this.building().effect;
    return effect && rankedEffect(effect, this.rank(), this.rankRules());
  });
}
