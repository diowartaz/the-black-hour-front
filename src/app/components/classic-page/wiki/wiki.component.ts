import { Component, computed, inject } from '@angular/core';
import { CityService } from 'src/app/services/city/city.service';
import { ClassicPageComponent } from '../classic-page.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';

@Component({
  selector: 'app-wiki',
  imports: [ClassicPageComponent, IconComponent],
  templateUrl: './wiki.component.html',
  styleUrls: ['./wiki.component.scss'],
})
export class WikiComponent {
  private readonly cityService = inject(CityService);

  // Exemplaires consommés pour atteindre chaque rang : une ligne par rang, il y en a trop pour des colonnes sur mobile
  rankRows = computed(() => {
    const { common, rare, epic } = this.cityService.defaultValues().rank_rules.upgrade_copies;
    return common.map((copies, index) => ({
      rank: index + 1,
      common: copies,
      rare: rare[index],
      epic: epic[index],
    }));
  });
}
