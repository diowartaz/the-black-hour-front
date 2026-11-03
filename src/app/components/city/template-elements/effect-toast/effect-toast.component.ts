import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { CityService } from 'src/app/services/city/city.service';
import { EffectReportsComponent } from 'src/app/shared/components/effect-reports/effect-reports.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

const DISPLAY_MS = 3500;

// Ce que les bâtiments spéciaux ont fait pendant la dernière action (construction, fouille, apprentissage)
@Component({
  selector: 'app-effect-toast',
  imports: [TPipe, EffectReportsComponent, IconComponent],
  template: `
    @if (cityService.actionEffects().length > 0) {
      <div class="dialog-class effect-toast" role="status">
        <app-effect-reports [reports]="cityService.actionEffects()" />
        <button type="button" class="close-toast" [attr.aria-label]="'common.close' | t" (click)="close()">
          <app-icon name="close" [size]="18" />
        </button>
      </div>
    }
  `,
  styleUrls: ['./effect-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectToastComponent {
  cityService = inject(CityService);
  private timeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timeout));
    // Chaque nouveau retour relance le délai d'affichage
    effect(() => {
      if (this.cityService.actionEffects().length > 0) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.close(), DISPLAY_MS);
      }
    });
  }

  close() {
    clearTimeout(this.timeout);
    this.cityService.actionEffects.set([]);
  }
}
