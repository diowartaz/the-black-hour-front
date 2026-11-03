import { Pipe, PipeTransform, inject } from '@angular/core';
import { CatalogKind } from './catalog.fr';
import { LanguageService } from './language.service';

// {{ building | catalogName }}, {{ skill | catalogName: 'skill' }}, {{ bonus | catalogName: 'bonusDescription' }}.
// Impur : dépend de la langue courante, lue dans un signal.
@Pipe({
  name: 'catalogName',
  pure: false,
})
export class CatalogNamePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(entry: { id: number; name: string; description?: string }, kind: CatalogKind = 'building'): string {
    const english = kind === 'bonusDescription' ? (entry.description ?? '') : entry.name;
    return this.languageService.translator().catalog(kind, entry.id, english);
  }
}
