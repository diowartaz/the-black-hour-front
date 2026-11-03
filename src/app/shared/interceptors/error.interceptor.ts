import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CLIENT_OUTDATED_CODE, OutdatedClientNotifier } from 'src/app/shared/utils/client-version';
import { environment } from 'src/environments/environment';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { hasTranslation } from 'src/app/shared/i18n/translator';
import { TranslationKey } from 'src/app/shared/i18n/types';

// Endpoints dont les erreurs attendues sont affichées par le formulaire lui-même
const SELF_HANDLED: { path: string; status: number }[] = [
  { path: 'auth/signin', status: 401 },
  { path: 'auth/signin', status: 400 },
  { path: 'auth/signup', status: 409 },
  { path: 'auth/guest/upgrade', status: 409 },
];

function errorMessage(error: HttpErrorResponse, languageService: LanguageService): string {
  if (error.status === 0) {
    return languageService.t('errors.unreachable');
  }
  if (error.status === 401) {
    return languageService.t('errors.sessionExpired');
  }
  // Format de the-black-hour-api : { statusCode, code, message, details? }. Le message de l'API, en anglais et plus
  // précis, est gardé en anglais ; dans une autre langue, on traduit le code
  const backendMessage = error.error?.message;
  const key = `errors.${error.error?.code}`;
  if (languageService.language() !== 'en' && hasTranslation(key)) {
    return languageService.t(key as TranslationKey);
  }
  return typeof backendMessage === 'string' ? backendMessage : languageService.t('errors.generic');
}

// Affiche les erreurs HTTP de l'API et déconnecte le joueur si son token est refusé
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);
  const outdatedClient = inject(OutdatedClientNotifier);
  const languageService = inject(LanguageService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !req.url.startsWith(environment.API_URL)) {
        return throwError(() => error);
      }

      const path = req.url.slice(environment.API_URL.length);
      const selfHandled = SELF_HANDLED.some((rule) => rule.path === path && rule.status === error.status);
      console.error(`${req.method} ${req.url} -> ${error.status}`, error.error);

      // Build plus ancien que le contrat de l'API : proposer de recharger, sans déconnecter
      if (error.error?.code === CLIENT_OUTDATED_CODE) {
        outdatedClient.notify();
        return throwError(() => error);
      }

      if (!selfHandled) {
        if (error.status === 401 && authService.isConnected()) {
          authService.logOut();
        }
        snackBar.open(errorMessage(error, languageService), languageService.t('common.ok'), { duration: 4000 });
      }
      return throwError(() => error);
    }),
  );
};
