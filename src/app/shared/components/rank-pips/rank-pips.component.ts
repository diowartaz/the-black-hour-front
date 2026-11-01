import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Rang d'un plan : une pastille allumée par rang, à la couleur (--c) de sa rareté
@Component({
  selector: 'app-rank-pips',
  template: `
    <span class="pips" role="img" [attr.aria-label]="'Rank ' + rank() + ' of ' + max()">
      @for (pip of pips(); track $index) {
        <span class="pip" [class.on]="pip"></span>
      }
    </span>
  `,
  styles: `
    .pips {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .pip {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
      transition:
        background 0.3s,
        box-shadow 0.3s;
      &.on {
        background: var(--c);
        box-shadow: 0 0 5px color-mix(in srgb, var(--c) 70%, transparent);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankPipsComponent {
  rank = input.required<number>();
  max = input.required<number>();

  pips = computed(() => Array.from({ length: this.max() }, (_, i) => i < this.rank()));
}
