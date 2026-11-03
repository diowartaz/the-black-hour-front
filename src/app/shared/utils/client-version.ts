import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

// Version du contrat d'API connue de ce build, envoyée dans l'en-tête X-Client-Version.
// À incrémenter avec MIN_CLIENT_VERSION de l'API (the-black-hour-api/src/common/client-version/client-version.middleware.ts)
// à chaque changement incompatible du contrat.
export const CLIENT_VERSION = 1;

export const CLIENT_VERSION_HEADER = 'X-Client-Version';

// Code renvoyé par l'API (426) quand ce build est plus ancien que MIN_CLIENT_VERSION
export const CLIENT_OUTDATED_CODE = 'CLIENT_OUTDATED';

// Propose de recharger la page quand l'API refuse ce build, une seule fois quel que soit le nombre de requêtes refusées
@Injectable({ providedIn: 'root' })
export class OutdatedClientNotifier {
  private readonly snackBar = inject(MatSnackBar);
  private notified = false;

  notify(): void {
    if (this.notified) {
      return;
    }
    this.notified = true;
    this.snackBar
      .open('A new version of the game is available', 'Refresh')
      .onAction()
      .subscribe(() => window.location.reload());
  }
}
