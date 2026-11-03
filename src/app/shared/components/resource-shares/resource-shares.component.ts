import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { CatalogBuildingModel } from 'src/app/models/game';
import { ITEMS, resourceShares } from '../../utils/deck';
import { ITEM_THEME } from '../../utils/theme';
import { ResourceGemComponent } from '../resource-gem/resource-gem.component';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Au-delà de cette part, une ressource demande nettement plus de fouilles que les autres (20 % chacune)
const OVERWEIGHT_SHARE = 0.3;

// Besoins en ressources d'un ensemble de plans, comparés aux fouilles équiprobables
@Component({
  selector: 'app-resource-shares',
  imports: [TPipe, ResourceGemComponent],
  template: `
    <div class="bars">
      @for (share of shares(); track share.item) {
        <div class="bar-row" [class.heavy]="share.value > overweight" [style.--c]="share.color">
          <app-resource-gem [item]="share.item" [size]="10" />
          <span class="name">{{ share.label }}</span>
          <span class="track"><span class="fill" [style.width.%]="share.value * 100"></span></span>
          <span class="value">{{ (share.value * 100).toFixed(0) }}%</span>
        </div>
      }
    </div>
    @if (heaviest(); as heavy) {
      <p class="warning">{{ 'resources.heavy' | t: { items: heavy } }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .bars {
      display: grid;
      gap: 4px;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 12px 52px 1fr 40px;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-dim);
    }
    .track {
      height: 6px;
      border-radius: 3px;
      background: color-mix(in srgb, var(--text-mute) 15%, transparent);
      overflow: hidden;
    }
    .fill {
      display: block;
      height: 100%;
      border-radius: 3px;
      background: var(--c);
    }
    .value {
      text-align: right;
      font-weight: 700;
    }
    .heavy .value {
      color: var(--danger-light);
    }
    .warning {
      font-size: 13px;
      color: var(--danger-light);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceSharesComponent {
  private languageService = inject(LanguageService);
  buildings = input.required<CatalogBuildingModel[]>();

  readonly overweight = OVERWEIGHT_SHARE;
  shares = computed(() => {
    const shares = resourceShares(this.buildings());
    const i18n = this.languageService.translator();
    return ITEMS.map((item) => ({
      item,
      value: shares[item],
      label: capitalize(i18n.t(`items.${item}`)),
      color: ITEM_THEME[item].color,
    }));
  });
  heaviest = computed(() =>
    this.shares()
      .filter((share) => share.value > OVERWEIGHT_SHARE)
      .map((share) => share.label.toLowerCase())
      .join(this.languageService.t('resources.and')),
  );
}
