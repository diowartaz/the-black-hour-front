import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CLIENT_OUTDATED_CODE, OutdatedClientNotifier } from 'src/app/shared/utils/client-version';
import { environment } from 'src/environments/environment';

// Endpoints dont les erreurs attendues sont affichées par le formulaire lui-même
const SELF_HANDLED: { path: string; status: number }[] = [
  { path: 'auth/signin', status: 401 },
  { path: 'auth/signin', status: 400 },
  { path: 'auth/signup', status: 409 },
  { path: 'auth/guest/upgrade', status: 409 },
];

function errorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Server unreachable, please check your connection';
  }
  if (error.status === 401) {
    return 'Your session has expired, please log in again';
  }
  // Format de the-black-hour-api : { statusCode, code, message, details? }
  const backendMessage = error.error?.message;
  return typeof backendMessage === 'string' ? backendMessage : 'Something went wrong, please try again';
}

// Affiche les erreurs HTTP de l'API et déconnecte le joueur si son token est refusé
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);
  const outdatedClient = inject(OutdatedClientNotifier);

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
        snackBar.open(errorMessage(error), 'OK', { duration: 4000 });
      }
      return throwError(() => error);
    }),
  );
};
