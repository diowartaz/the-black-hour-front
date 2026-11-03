import { Component, inject, Input } from '@angular/core';
import { CityService } from 'src/app/services/city/city.service';
import { formatTimeToString } from 'src/app/shared/utils/time';
import { BuildingModel, createDefaultBuildingModel } from 'src/app/models/game';
import { BuildingEmblemComponent } from 'src/app/shared/components/building-emblem/building-emblem.component';
import { EffectTooltipComponent } from 'src/app/shared/components/effect-tooltip/effect-tooltip.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { RankPipsComponent } from 'src/app/shared/components/rank-pips/rank-pips.component';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { BuildingRecapInventoryComponent } from './building-recap-inventory/building-recap-inventory.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { CatalogNamePipe } from 'src/app/shared/i18n/catalog-name.pipe';

@Component({
  selector: 'app-building-recap',
  imports: [
    TPipe,
    CatalogNamePipe,
    FormatNumberPipe,
    RarityToColorPipe,
    IconComponent,
    BuildingEmblemComponent,
    EffectTooltipComponent,
    RankPipsComponent,
    BuildingRecapInventoryComponent,
  ],
  templateUrl: './building-recap.component.html',
  styleUrls: ['./building-recap.component.scss'],
})
export class BuildingRecapComponent {
  @Input() building: BuildingModel = createDefaultBuildingModel();

  cityService = inject(CityService);

  getTimeBuildingString() {
    return formatTimeToString(this.building.time * this.cityService.city().speeds.build);
  }
}
