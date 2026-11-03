import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ITEM_THEME } from '../../utils/theme';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { TranslationKey } from 'src/app/shared/i18n/types';

// Losange lumineux représentant une ressource
@Component({
  selector: 'app-resource-gem',
  template: '',
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[style.--c]': 'color()',
    '[style.--s.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-block;
      flex: none;
      width: var(--s);
      height: var(--s);
      border-radius: calc(var(--s) / 4);
      background: var(--c);
      box-shadow: 0 0 calc(var(--s) * 0.7) var(--c);
      transform: rotate(45deg) scale(0.78);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceGemComponent {
  item = input.required<string>();
  size = input(10);

  color = computed(() => ITEM_THEME[this.item()]?.color ?? 'var(--text-mute)');
  private languageService = inject(LanguageService);
  label = computed(() => this.languageService.t(`items.${this.item()}` as TranslationKey));
}
