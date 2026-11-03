import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';
import { TranslationKey } from 'src/app/shared/i18n/types';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

// Titre du jeu et liste des fonctionnalités (accueil, création de ville)
@Component({
  selector: 'app-feature-list',
  imports: [TPipe, IconComponent],
  template: `
    <header class="brand">
      <app-icon name="skull" [size]="44" />
      <h1 class="neon-title">The Black Hour</h1>
      <span class="label">{{ 'features.tagline' | t }}</span>
    </header>
    <ul class="features">
      @for (feature of features; track feature.icon) {
        <li [style.--c]="feature.color">
          <span class="icon-tile"><app-icon [name]="feature.icon" [size]="18" /></span>
          {{ feature.text | t }}
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 18px;
      width: 100%;
    }
    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding-top: 12px;
      color: var(--pink);
      app-icon {
        filter: drop-shadow(0 0 10px var(--pink));
      }
      .neon-title {
        font-size: 34px;
        text-align: center;
      }
    }
    .features {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
      gap: 8px;
      li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px 8px 8px;
        border-radius: var(--radius-m);
        background: var(--surface-2);
        border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
        font-size: 16px;
        font-weight: 700;
      }
      .icon-tile {
        width: 34px;
        height: 34px;
        border-radius: var(--radius-m);
        box-shadow: 0 0 10px var(--c);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureListComponent {
  readonly features: { icon: IconName; color: string; text: TranslationKey }[] = [
    { icon: 'skull', color: 'var(--pink)', text: 'features.survive' },
    { icon: 'dig', color: 'var(--yellow)', text: 'features.search' },
    { icon: 'build', color: 'var(--orange)', text: 'features.build' },
    { icon: 'book', color: 'var(--cyan)', text: 'features.learn' },
    { icon: 'zombie', color: 'var(--danger)', text: 'features.defeat' },
    { icon: 'sparkle', color: 'var(--violet-light)', text: 'features.experience' },
    { icon: 'trophy', color: 'var(--green)', text: 'features.leaderboard' },
  ];
}
