import { readStorage, StorageKey } from '../shared/utils/storage';

export enum RoutesEnum {
  HOME = 'home',
  PLAY = 'play',
  SIGNIN = 'signin',
  SIGNUP = 'signup',
  LOAD_PLAYER = 'load-player',
  RECAP = 'recap',
  LEADERBOARD = 'leaderboard',
  SETTINGS = 'settings',
  WIKI = 'wiki',
  PROFIL = 'profil',
  CREATE_CITY = 'create-city',
  DEATH_RECAP = 'death-recap',
  SHOP = 'shop',
  DECK = 'deck',
  MARKET = 'market',
  REFERRAL = 'referral',
  GUILD = 'guild',
}

export enum UserState {
  NOT_LOADED_PLAYER = 'notLoadedPlayer',
  NO_CITY = 'noCity',
  PLAYING = 'playing',
  DEATH_RECAP = 'deathRecap',
  RECAP = 'recap',
}

export const PLAY_ROUTES = ['dig', 'learn', 'build'] as const;
export type PlayRoute = (typeof PLAY_ROUTES)[number];

export const statesToRoutes: Record<UserState, RoutesEnum> = {
  [UserState.NOT_LOADED_PLAYER]: RoutesEnum.LOAD_PLAYER,
  [UserState.NO_CITY]: RoutesEnum.CREATE_CITY,
  [UserState.PLAYING]: RoutesEnum.PLAY,
  [UserState.DEATH_RECAP]: RoutesEnum.DEATH_RECAP,
  [UserState.RECAP]: RoutesEnum.RECAP,
};

// Routes accessibles sans être connecté (premier segment : /guild garde son authGuard, seul /guild/:id est public)
export const PUBLIC_ROUTES: string[] = [
  RoutesEnum.PROFIL,
  RoutesEnum.GUILD,
  RoutesEnum.WIKI,
  RoutesEnum.LEADERBOARD,
  RoutesEnum.HOME,
  RoutesEnum.SIGNIN,
  RoutesEnum.SIGNUP,
];

// Routes qui ne dépendent pas de l'état de la partie (pas de redirection automatique au chargement).
// Toute page secondaire (ClassicPageComponent) doit y figurer : sinon ReturnUrlService la mémorise
// comme écran d'origine (son bouton retour ne fait rien) et un rechargement renvoie vers l'écran du jeu.
export const STATE_LESS_ROUTES: string[] = [
  RoutesEnum.PROFIL,
  RoutesEnum.WIKI,
  RoutesEnum.LEADERBOARD,
  RoutesEnum.SHOP,
  RoutesEnum.DECK,
  RoutesEnum.MARKET,
  RoutesEnum.REFERRAL,
  RoutesEnum.GUILD,
  RoutesEnum.SETTINGS,
];

export function readPlayRoute(): PlayRoute {
  const stored = readStorage(StorageKey.PLAY_ROUTE);
  return PLAY_ROUTES.includes(stored as PlayRoute) ? (stored as PlayRoute) : 'dig';
}

// URL complète correspondant à un état joueur (pour PLAYING, on reprend le dernier onglet utilisé)
export function routeForState(state: UserState): string {
  const route = '/' + statesToRoutes[state];
  return state === UserState.PLAYING ? `${route}/${readPlayRoute()}` : route;
}

// Premier segment d'une URL : '/play/dig?x=1' -> 'play'
export function firstSegment(url: string): string {
  return url.split(/[?#]/)[0].split('/')[1] ?? '';
}
