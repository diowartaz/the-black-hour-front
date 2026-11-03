import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LanguageService } from 'src/app/shared/i18n/language.service';

// Version du contrat d'API connue de ce build, envoyée dans l'en-tête X-Client-Version.
// À incrémenter avec MIN_CLIENT_VERSION de l'API (the-black-hour-api/src/common/client-version/client-version.middleware.ts)
// à chaque changement incompatible du contrat.
export const CLIENT_VERSION = 2;

export const CLIENT_VERSION_HEADER = 'X-Client-Version';

// Code renvoyé par l'API (426) quand ce build est plus ancien que MIN_CLIENT_VERSION
export const CLIENT_OUTDATED_CODE = 'CLIENT_OUTDATED';

// Propose de recharger la page quand l'API refuse ce build, une seule fois quel que soit le nombre de requêtes refusées
@Injectable({ providedIn: 'root' })
export class OutdatedClientNotifier {
  private readonly snackBar = inject(MatSnackBar);
  private readonly languageService = inject(LanguageService);
  private notified = false;

  notify(): void {
    if (this.notified) {
      return;
    }
    this.notified = true;
    this.snackBar
      .open(this.languageService.t('errors.newVersion'), this.languageService.t('errors.refresh'))
      .onAction()
      .subscribe(() => window.location.reload());
  }
}
