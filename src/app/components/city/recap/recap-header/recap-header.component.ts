import { Component, computed, inject } from '@angular/core';
import { CityService } from 'src/app/services/city/city.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

@Component({
  selector: 'app-recap-header',
  imports: [FormatNumberPipe, IconComponent],
  templateUrl: './recap-header.component.html',
  styleUrls: ['./recap-header.component.scss'],
})
export class RecapHeaderComponent {
  public cityService = inject(CityService);

  defense = computed(() => this.cityService.city().defense);
  attackers = computed(() => this.cityService.city().attackRecap.nb_zb);
  margin = computed(() => this.defense() - this.attackers());

  // Part de la défense dans la barre d'équilibre (en %)
  defenseRatio = computed(() => {
    const total = this.defense() + this.attackers();
    return total === 0 ? 50 : Math.round((this.defense() / total) * 100);
  });
}
