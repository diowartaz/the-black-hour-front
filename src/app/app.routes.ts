import { Routes } from '@angular/router';
import { RoutesEnum, UserState } from './models/router';
import { notAuthenticatedGuard } from './shared/guards/not-authenticated.guard';
import { authGuard } from './shared/guards/auth.guard';
import { gameLoadedGuard } from './shared/guards/game-loaded.guard';
import { stateGuard } from './shared/guards/state.guard';

// Tous les écrans sont chargés à la demande pour alléger le bundle initial
export const routes: Routes = [
  {
    path: RoutesEnum.HOME,
    loadComponent: () => import('./components/home/home.component').then((m) => m.HomeComponent),
    canActivate: [notAuthenticatedGuard],
  },
  {
    path: RoutesEnum.SIGNIN,
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
    canActivate: [notAuthenticatedGuard],
  },
  {
    path: RoutesEnum.SIGNUP,
    loadComponent: () => import('./components/sign-up/sign-up.component').then((m) => m.SignUpComponent),
    canActivate: [notAuthenticatedGuard],
  },
  {
    path: RoutesEnum.LOAD_PLAYER,
    loadComponent: () => import('./components/load-player/load-player.component').then((m) => m.LoadPlayerComponent),
    canActivate: [authGuard],
  },
  {
    path: RoutesEnum.CREATE_CITY,
    loadComponent: () => import('./components/create-city/create-city.component').then((m) => m.CreateCityComponent),
    canActivate: [authGuard, gameLoadedGuard, stateGuard],
    data: { allowedStates: [UserState.NO_CITY] },
  },
  {
    path: RoutesEnum.RECAP,
    loadComponent: () =>
      import('./components/city/recap/alive-recap/alive-recap.component').then((m) => m.AliveRecapComponent),
    canActivate: [authGuard, gameLoadedGuard, stateGuard],
    data: { allowedStates: [UserState.RECAP] },
  },
  {
    path: RoutesEnum.DEATH_RECAP,
    loadComponent: () =>
      import('./components/city/recap/death-recap/death-recap.component').then((m) => m.DeathRecapComponent),
    canActivate: [authGuard, gameLoadedGuard, stateGuard],
    data: { allowedStates: [UserState.DEATH_RECAP] },
  },
  {
    path: RoutesEnum.SETTINGS,
    loadComponent: () =>
      import('./components/classic-page/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: RoutesEnum.LEADERBOARD,
    loadComponent: () =>
      import('./components/classic-page/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
  },
  {
    path: RoutesEnum.PROFIL,
    loadComponent: () => import('./components/classic-page/profil/profil.component').then((m) => m.ProfilComponent),
  },
  {
    path: RoutesEnum.WIKI,
    loadComponent: () => import('./components/classic-page/wiki/wiki.component').then((m) => m.WikiComponent),
  },
  {
    path: RoutesEnum.SHOP,
    loadComponent: () => import('./components/classic-page/shop/shop.component').then((m) => m.ShopComponent),
    canActivate: [authGuard],
  },
  {
    path: RoutesEnum.REFERRAL,
    loadComponent: () =>
      import('./components/classic-page/referral/referral.component').then((m) => m.ReferralComponent),
    canActivate: [authGuard],
  },
  {
    path: RoutesEnum.GUILD,
    loadComponent: () => import('./components/classic-page/guild/guild.component').then((m) => m.GuildComponent),
    canActivate: [authGuard],
  },
  {
    // Fiche publique d'une guilde : consultable sans compte, comme un profil
    path: `${RoutesEnum.GUILD}/:id`,
    loadComponent: () =>
      import('./components/classic-page/guild-view/guild-view.component').then((m) => m.GuildViewComponent),
  },
  {
    path: RoutesEnum.DECK,
    loadComponent: () => import('./components/classic-page/deck/deck.component').then((m) => m.DeckComponent),
    canActivate: [authGuard],
  },
  {
    path: RoutesEnum.MARKET,
    loadComponent: () => import('./components/classic-page/market/market.component').then((m) => m.MarketComponent),
    canActivate: [authGuard],
  },
  {
    path: RoutesEnum.PLAY,
    loadComponent: () => import('./components/city/city.component').then((m) => m.CityComponent),
    canActivate: [authGuard, gameLoadedGuard, stateGuard],
    data: { allowedStates: [UserState.PLAYING] },
    children: [
      {
        path: 'dig',
        loadComponent: () =>
          import('./components/city/actions/diggings/diggings.component').then((m) => m.DiggingsComponent),
      },
      {
        path: 'learn',
        loadComponent: () => import('./components/city/actions/skills/skills.component').then((m) => m.SkillsComponent),
      },
      {
        path: 'build',
        loadComponent: () =>
          import('./components/city/actions/buildings/buildings.component').then((m) => m.BuildingsComponent),
      },
      {
        path: '',
        redirectTo: 'dig',
        pathMatch: 'full',
      },
    ],
  },
  { path: '', redirectTo: RoutesEnum.PLAY, pathMatch: 'full' },
  { path: '**', redirectTo: RoutesEnum.PLAY },
];
