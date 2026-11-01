# The Black Hour — frontend

SPA Angular (standalone components, signals, `inject()`), Angular Material. Build de prod servi par `server.js` (Express) depuis `dist/website2/browser`.

## Commandes

```bash
npm start          # ng serve (http://localhost:4200, API the-black-hour-api sur http://localhost:3000/api/v1/)
npm run build      # build de prod
npm run express    # sert le build via server.js
npm run lint       # ng lint --fix
npm run prettier   # formatage
npm test           # Karma/Jasmine en ChromeHeadless, une seule passe
npm run api:types  # régénère src/app/models/api.ts depuis ../the-black-hour-api/openapi.json
```

- Un seul fichier de test : `npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/components/create-city/create-city.component.spec.ts`.
- `src/app/models/api.ts` est généré : ne jamais l'éditer à la main. Quand un DTO change côté API : `npm run openapi` dans `the-black-hour-api`, puis `npm run api:types` ici, puis adapter le mapping dans `GameApiService`.

## Conventions

- `CityService` (`src/app/services/city/city.service.ts`) est la source de vérité de l'état du jeu, exposée en `signal`/`computed`. Les appels HTTP typés sont dans `GameApiService`, les classements dans `LeaderboardService`.
- Mutations HTTP : `runRequest(loadingSignal, api.xxx(), onSuccess)` (`shared/utils/http.ts`) ignore les doubles requêtes. Les erreurs sont affichées par `errorInterceptor` (snackbar, déconnexion sur 401) : pas de `catchError` dans les services.
- Navigation liée à l'état (connexion, déconnexion, fin de journée…) : uniquement dans `RedirectionService`. Les services ne naviguent jamais ; les guards gèrent l'accès direct aux URL.
- `localStorage` uniquement via `shared/utils/storage.ts` (`StorageKey`).
- Calculs de jeu purs dans `src/app/shared/utils/` ; types dans `src/app/models/game.ts`.
- Routage piloté par l'état joueur (`UserState`) via `stateGuard` et `data.allowedStates` dans `app.routes.ts`.
- Page secondaire (écran en `ClassicPageComponent` qui ne dépend pas de l'état de la partie : profil, guilde, réglages…) : ajouter sa route à `STATE_LESS_ROUTES` (`src/app/models/router.ts`). Sinon `ReturnUrlService` la mémorise comme écran d'origine, son bouton retour ne fait rien, et un accès direct ou un rechargement renvoie vers l'écran du jeu.
- Application **zoneless** et composants en OnPush (défaut d'Angular 22) : tout état modifié de façon asynchrone (callback HTTP, `setTimeout`) doit être un `signal`. Ne jamais muter un objet contenu dans un signal (utiliser `set`/`update`).
- Écrans chargés à la demande (`loadComponent`) ; templates en control flow `@if`/`@for` ; pas de `CommonModule`, importer `NgClass`/`NgStyle`/`KeyValuePipe` au besoin.
- Sélecteurs de composants préfixés `app-` ; `any` autorisé par ESLint.
- Rangs de cartes : `shared/utils/ranks.ts` reprend les calculs de l'API. `app-building-card` montre un exemplaire de base sans son input `rank` (Black Market). En partie, `BuildingModel.rank`, sa défense et son effet viennent du serveur, déjà à la valeur du rang : ne pas réappliquer le rang.
- L'URL de l'API vient de `src/environments/environment*.ts`.
- Gestionnaire de paquets : npm uniquement (`package-lock.json`).
- Git : pas de branches pour le moment, tout se fait directement sur `rework` (branche principale).

Détails d'architecture : @.github/copilot-instructions.md
