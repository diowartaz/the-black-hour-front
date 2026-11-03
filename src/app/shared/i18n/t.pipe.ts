import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';
import { TranslationKey, TranslationParams } from './types';

// {{ 'settings.title' | t }} ou {{ 'createCity.deck' | t: { count: n } }}.
// Impur : le résultat dépend aussi de la langue courante, lue dans un signal.
// Accepte une clé construite dans le template ('rarity.' + r) : les clés littérales sont vérifiées par npm run i18n:check.
@Pipe({
  name: 't',
  pure: false,
})
export class TPipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(key: string, params?: TranslationParams): string {
    return this.languageService.t(key as TranslationKey, params);
  }
}
