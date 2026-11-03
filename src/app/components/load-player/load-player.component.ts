import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CityService } from 'src/app/services/city/city.service';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

// Écran d'attente : le chargement est lancé par RedirectionService, la redirection suit le changement d'état
@Component({
  selector: 'app-load-player',
  imports: [TPipe, MatProgressSpinnerModule],
  templateUrl: './load-player.component.html',
  styleUrl: './load-player.component.scss',
})
export class LoadPlayerComponent {
  cityService = inject(CityService);
}
