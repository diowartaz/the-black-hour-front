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
npm run i18n:check # vérifie que les clés de traduction des templates existent
```

- Un seul fichier de test : `npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/components/create-city/create-city.component.spec.ts`.
- `src/app/models/api.ts` est généré : ne jamais l'éditer à la main. Quand un DTO change côté API : `npm run openapi` dans `the-black-hour-api`, puis `npm run api:types` ici, puis adapter le mapping dans `GameApiService`.
- Version de contrat : `versionInterceptor` envoie `CLIENT_VERSION` (`shared/utils/client-version.ts`) ; une réponse `CLIENT_OUTDATED` (426) affiche une seule fois le snackbar « Refresh » (`OutdatedClientNotifier`), sans déconnexion. Changement incompatible de l'API : incrémenter `CLIENT_VERSION` avec `MIN_CLIENT_VERSION` de l'API et le signaler à l'utilisateur (règle complète dans le `CLAUDE.md` racine).

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
- Traductions (anglais, français) dans `shared/i18n/` : aucun texte joueur en dur.
  - Template : `{{ 'zone.cle' | t }}`, avec paramètres `{{ 'deck.unsaved' | t: { count: n } }}` (pluriel par `_one` / `_other`). Attributs : `[placeholder]="'auth.email' | t"`, `[attr.aria-label]="..."`. Le pipe est impur : il suit la langue sans recharger.
  - TypeScript : `languageService.t('cle')` (clé typée), dans un `computed` pour suivre la langue ; fonctions pures de `shared/utils` : paramètre `Translator` (`languageService.translator()`), anglais par défaut pour les specs.
  - Noms du catalogue renvoyés par l'API (en anglais) : pipe `catalogName` ou `translator().catalog(kind, id, nom)`, traductions par id dans `catalog.fr.ts`. Erreurs de l'API : traduites par leur `code` (`errors.<CODE>`) dans `errorInterceptor`. Dates : pipe `localDate`.
  - `fr.ts` doit avoir les mêmes clés que `en.ts` (erreur de compilation sinon) ; `npm run i18n:check` vérifie que les clés littérales des templates existent. Les specs tournent en anglais (`beforeEach` global de `language.service.spec.ts`).
- L'URL de l'API vient de `src/environments/environment*.ts`.
- Gestionnaire de paquets : npm uniquement (`package-lock.json`).
- Git : pas de branches pour le moment, tout se fait directement sur `rework` (branche principale).

Détails d'architecture : @.github/copilot-instructions.md
