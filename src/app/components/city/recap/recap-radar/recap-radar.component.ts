import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { blipPosition, radarLayout } from 'src/app/shared/utils/recap-radar';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

// Rayon du radar dans le viewBox (-120 -120 240 240)
const R = 110;

// Radar du récap d'attaque : la ville au centre, le cercle de défense, les zombies qui approchent
@Component({
  selector: 'app-recap-radar',
  imports: [TPipe, IconComponent, FormatNumberPipe],
  templateUrl: './recap-radar.component.html',
  styleUrls: ['./recap-radar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecapRadarComponent {
  defense = input.required<number>();
  zombies = input.required<number>();
  // Nuit racontée (jour de l'attaque), sert aussi de graine au dessin
  night = input.required<number>();
  // Couleur de chaque signal de la nuit, numérotés dans l'ordre
  blips = input<string[]>([]);

  readonly R = R;

  layout = computed(() => radarLayout(this.defense(), this.zombies(), this.night()));
  margin = computed(() => this.defense() - this.zombies());
  ring = computed(() => this.layout().ringRadius * R);

  blipPoints = computed(() => {
    const colors = this.blips();
    return colors.map((color, i) => {
      const { x, y } = blipPosition(i, colors.length, this.layout().ringRadius, this.night());
      return { n: i + 1, color, x: x * R, y: y * R };
    });
  });
}
