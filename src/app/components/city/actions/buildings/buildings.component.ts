import { Component, DestroyRef, inject, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { CityService } from 'src/app/services/city/city.service';
import { AdvancedBuildingModel, ItemModel } from 'src/app/models/game';
import { BuildingEmblemComponent } from 'src/app/shared/components/building-emblem/building-emblem.component';
import { EffectTooltipComponent } from 'src/app/shared/components/effect-tooltip/effect-tooltip.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { ResourceGemComponent } from 'src/app/shared/components/resource-gem/resource-gem.component';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { CatalogNamePipe } from 'src/app/shared/i18n/catalog-name.pipe';
import { LanguageService } from 'src/app/shared/i18n/language.service';

@Component({
  selector: 'app-buildings',
  imports: [
    TPipe,
    CatalogNamePipe,
    FormatNumberPipe,
    KeyValuePipe,
    IconComponent,
    BuildingEmblemComponent,
    EffectTooltipComponent,
    ResourceGemComponent,
    RarityToColorPipe,
  ],
  templateUrl: './buildings.component.html',
  styleUrls: ['./buildings.component.scss'],
})
export class BuildingsComponent {
  cityService = inject(CityService);
  private languageService = inject(LanguageService);
  dialogMessage = signal('');
  snackBarOpened = signal(false);
  private snackBarTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.snackBarTimeout));
  }

  closeSnackBar() {
    clearTimeout(this.snackBarTimeout);
    this.snackBarOpened.set(false);
  }

  openSnackBar(message: string) {
    if (this.snackBarOpened()) {
      return;
    }
    this.dialogMessage.set(message);
    this.snackBarOpened.set(true);
    this.snackBarTimeout = setTimeout(() => this.closeSnackBar(), 1000);
  }

  build(building: AdvancedBuildingModel) {
    if (!building.enoughRessources) {
      this.openSnackBar(this.languageService.t('play.notEnoughResources'));
      return;
    } else if (this.isLate(building)) {
      this.openSnackBar(this.languageService.t('play.notEnoughTime'));
      return;
    } else if (!building.enoughLvlMax) {
      this.openSnackBar(this.languageService.t('play.maxLevel'));
      return;
    }

    this.cityService.build(building.id);
  }

  // La construction finirait après la tombée de la nuit
  isLate(building: AdvancedBuildingModel): boolean {
    return (this.cityService.cityTimeSeconds() || 0) > building.expirationCityTime;
  }

  castKey(key: string): ItemModel {
    return key as ItemModel;
  }
}
