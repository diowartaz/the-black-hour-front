import { effect, Injectable, inject, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  firstSegment,
  PUBLIC_ROUTES,
  RoutesEnum,
  routeForState,
  STATE_LESS_ROUTES,
  statesToRoutes,
  UserState,
} from 'src/app/models/router';
import { CityService } from '../city/city.service';
import { AuthService } from '../auth/auth.service';

// Pages réservées aux visiteurs non connectés : on les quitte dès que le joueur se connecte
const LOGGED_OUT_ONLY_ROUTES = PUBLIC_ROUTES.filter((route) => !STATE_LESS_ROUTES.includes(route));

/**
 * Seul endroit qui navigue en réaction à l'état (connexion, état du joueur).
 * L'accès direct à une URL est contrôlé par les guards ; ce service gère les transitions.
 */
@Injectable({
  providedIn: 'root',
})
export class RedirectionService {
  private cityService = inject(CityService);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const connected = this.authService.isConnected();
      const state = this.cityService.state();
      untracked(() => this.onChange(connected, state));
    });

    // Si le joueur est chargé avant la fin de la première navigation, le gameLoadedGuard
    // envoie quand même sur l'écran d'attente : on en repart dès qu'on y arrive
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const state = this.cityService.state();
      const waiting = firstSegment(this.router.url) === RoutesEnum.LOAD_PLAYER;
      if (waiting && this.authService.isConnected() && state !== UserState.NOT_LOADED_PLAYER) {
        this.router.navigateByUrl(routeForState(state));
      }
    });
  }

  private onChange(connected: boolean, state: UserState): void {
    const current = this.currentSegment();

    if (!connected) {
      if (!PUBLIC_ROUTES.includes(current)) {
        this.router.navigate([RoutesEnum.HOME]);
      }
      return;
    }

    if (state === UserState.NOT_LOADED_PLAYER) {
      this.cityService.loadPlayer();
      if (LOGGED_OUT_ONLY_ROUTES.includes(current)) {
        this.router.navigate([RoutesEnum.LOAD_PLAYER]);
      }
      return;
    }

    // Les pages qui ne dépendent pas de l'état (boutique, deck, guilde…) ne sont jamais quittées d'office :
    // un changement d'état (fin de journée, mort…) s'applique quand le joueur revient vers l'écran du jeu (stateGuard).
    if (STATE_LESS_ROUTES.includes(current)) {
      return;
    }
    if (current !== statesToRoutes[state]) {
      this.router.navigateByUrl(routeForState(state));
    }
  }

  // Avant la fin de la première navigation, router.url vaut encore '/'
  private currentSegment(): string {
    return firstSegment(this.router.navigated ? this.router.url : window.location.pathname);
  }
}
