import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { Component, computed, inject } from '@angular/core';
import { UserState } from 'src/app/models/router';
import { CityService } from 'src/app/services/city/city.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { formatCountdown } from 'src/app/shared/utils/time';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

@Component({
  selector: 'app-city-header',
  imports: [TPipe, FormatNumberPipe, IconComponent],
  templateUrl: './city-header.component.html',
  styleUrls: ['./city-header.component.scss'],
})
export class CityHeaderComponent {
  cityService = inject(CityService);
  // Sous 30 minutes, le compte à rebours ranked passe au rouge
  readonly rankedUrgentMs = 30 * 60 * 1000;
  formatCountdown = formatCountdown;
  headerIsDisplayed = computed(() => {
    return this.cityService.state() === UserState.PLAYING;
  });
}
