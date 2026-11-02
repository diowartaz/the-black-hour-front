import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { nightTime } from 'src/app/shared/utils/recap-radar';

// Événement de la nuit, repris sur le radar par son numéro
export interface NightEvent {
  name: string;
  text: string;
  // Couleur CSS du signal (token, ex. var(--cyan))
  color: string;
}

// Journal horodaté de la nuit : effets des bâtiments et découvertes, numérotés comme sur le radar
@Component({
  selector: 'app-night-log',
  templateUrl: './night-log.component.html',
  styleUrls: ['./night-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NightLogComponent {
  events = input.required<NightEvent[]>();

  lines = computed(() => {
    const events = this.events();
    return events.map((event, i) => ({ ...event, n: i + 1, time: nightTime(i, events.length) }));
  });
}
