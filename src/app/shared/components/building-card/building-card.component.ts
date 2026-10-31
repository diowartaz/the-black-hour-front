import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CatalogBuildingModel } from 'src/app/models/game';
import { RarityToColorPipe } from '../../pipes/rarity-to-color.pipe';
import { formatTimeToString } from '../../utils/time';
import { EffectTooltipComponent } from '../effect-tooltip/effect-tooltip.component';
import { IconComponent } from '../icon/icon.component';
import { ResourceGemComponent } from '../resource-gem/resource-gem.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

// Carte d'un plan du catalogue (collection, deck, boosters). Le contenu projeté s'affiche en pied de carte.
@Component({
  selector: 'app-building-card',
  imports: [
    FormatNumberPipe,
    KeyValuePipe,
    IconComponent,
    EffectTooltipComponent,
    ResourceGemComponent,
    RarityToColorPipe,
  ],
  templateUrl: './building-card.component.html',
  styleUrls: ['./building-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildingCardComponent {
  building = input.required<CatalogBuildingModel>();
  // Exemplaires possédés : 0 = plan pas encore obtenu
  count = input(1);
  // Affiche toujours le nombre d'exemplaires, même 0 ou 1, sans griser la carte (Black Market)
  showCount = input(false);
  inDeck = input(false);
  // Version resserrée (éditeur de deck) : nom plus petit, rareté indiquée par la seule bordure
  compact = input(false);

  locked = computed(() => this.count() === 0 && !this.showCount());
  time = computed(() => formatTimeToString(this.building().time));
}
