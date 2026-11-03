import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoutesEnum } from 'src/app/models/router';
import { CityService } from 'src/app/services/city/city.service';
import { FeatureListComponent } from 'src/app/shared/components/feature-list/feature-list.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { ResourceSharesComponent } from 'src/app/shared/components/resource-shares/resource-shares.component';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { buildingsOf, rarityCounts } from 'src/app/shared/utils/deck';

@Component({
  selector: 'app-create-city',
  imports: [TPipe, FeatureListComponent, IconComponent, ResourceSharesComponent, RarityToColorPipe],
  templateUrl: './create-city.component.html',
  styleUrls: ['./create-city.component.scss'],
})
export class CreateCityComponent {
  private cityService = inject(CityService);

  public readonly router = inject(Router);
  public readonly RoutesEnum = RoutesEnum;

  deckBuildings = computed(() => buildingsOf(this.cityService.deck(), this.cityService.catalogBuildings()));
  deckRarities = computed(() =>
    Object.entries(rarityCounts(this.deckBuildings())).map(([rarity, count]) => ({ rarity, count })),
  );

  createCity(ranked: boolean) {
    this.cityService.newCity(ranked);
  }
}
