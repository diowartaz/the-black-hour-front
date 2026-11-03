import { formatDate, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

registerLocaleData(localeFr);

// {{ date | localDate }} : date courte (« 3 nov. 2026 ») dans la langue courante.
// Impur : dépend de la langue courante, lue dans un signal.
@Pipe({
  name: 'localDate',
  pure: false,
})
export class LocalDatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(value: string | number | Date): string {
    return formatDate(value, 'mediumDate', this.languageService.language());
  }
}
