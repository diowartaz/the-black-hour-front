import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { components } from 'src/app/models/api';
import {
  BonusWithoutLvl,
  BoosterCardModel,
  BoosterModel,
  CatalogBuildingModel,
  CityModel,
  DefaultValuesModel,
  EffectReportModel,
  GameHistoryModel,
  InventoryModel,
  ItemModel,
  LeaderboardBoard,
  LeaderboardPage,
  LeaderboardPosition,
  MarketModel,
  ProfilModel,
  ReferralModel,
  GuildOverviewModel,
  GuildProfileModel,
  GuildSummaryModel,
  StatsModel,
} from 'src/app/models/game';
import { UserState } from 'src/app/models/router';
import {
  ApiCatalog,
  ApiCity,
  ApiPlayer,
  ApiProfile,
  ApiReferral,
  ApiGuildOverview,
  ApiGuildProfile,
  stateFromCity,
  toBonusReferences,
  toBoosterCards,
  toBoosters,
  toCatalogBuildings,
  toCityModel,
  toDefaultValues,
  toGameHistory,
  toInventory,
  toLeaderboardPage,
  toProfil,
  toReferral,
  toGuildOverview,
  toGuildProfile,
  toStatsModel,
} from 'src/app/shared/utils/api-mappers';
import { environment } from 'src/environments/environment';

type Schemas = components['schemas'];

export interface PlayerSnapshot {
  accountId: string;
  username: string;
  state: UserState;
  stats: StatsModel;
  city: CityModel | null;
}

export interface GameCatalog {
  defaultValues: DefaultValuesModel;
  bonuses: Record<number, BonusWithoutLvl>;
  buildings: CatalogBuildingModel[];
  boosters: BoosterModel[];
}

export interface BoosterOpening {
  stats: StatsModel;
  cards: BoosterCardModel[];
}

// Résultat d'une action au Black Market : monnaie et collection du joueur, marché à jour
export interface MarketUpdate {
  stats: StatsModel;
  market: MarketModel;
}

const toMarketUpdate = (response: Schemas['MarketActionResponse']): MarketUpdate => ({
  stats: toStatsModel(response.player),
  market: response.market,
});

// Résultat d'une action de journée : la ville et ce que les bâtiments spéciaux ont fait pendant l'action
export interface ActionResult {
  city: CityModel;
  effects: EffectReportModel[];
}

const toActionResult = (response: Schemas['ActionResponse']): ActionResult => ({
  city: toCityModel(response.city),
  effects: response.effects,
});

// Choix du parrain : le don de bienvenue éventuel est crédité dans les stats
export interface SponsorLink {
  referral: ReferralModel;
  giftAwarded: number;
  stats: StatsModel;
}

export interface CityWithState {
  city: CityModel;
  state: UserState;
}

const toSnapshot = (me: Schemas['MeResponse']): PlayerSnapshot => ({
  accountId: me.account.id,
  username: me.account.username,
  state: stateFromCity(me.city),
  stats: toStatsModel(me.player),
  city: me.city ? toCityModel(me.city) : null,
});

const withState = (city: ApiCity): CityWithState => ({ city: toCityModel(city), state: stateFromCity(city) });

// Appels HTTP vers the-black-hour-api, sans état ni effet de bord. Les réponses sont converties
// vers les modèles du front (shared/utils/api-mappers.ts).
@Injectable({ providedIn: 'root' })
export class GameApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly API_URL = environment.API_URL;

  getMe(): Observable<PlayerSnapshot> {
    return this.httpClient.get<Schemas['MeResponse']>(this.API_URL + 'me').pipe(map(toSnapshot));
  }

  getCatalog(): Observable<GameCatalog> {
    return this.httpClient.get<ApiCatalog>(this.API_URL + 'catalog').pipe(
      map((catalog) => ({
        defaultValues: toDefaultValues(catalog),
        bonuses: toBonusReferences(catalog),
        buildings: toCatalogBuildings(catalog),
        boosters: toBoosters(catalog),
      })),
    );
  }

  loadPlayer(): Observable<{ player: PlayerSnapshot; catalog: GameCatalog }> {
    return forkJoin({ player: this.getMe(), catalog: this.getCatalog() });
  }

  // pick : ressource choisie dans la paire proposée pour la première fouille, sinon l'une des deux au hasard.
  // 'max' : autant de fouilles que possible avant l'attaque, calculé par le serveur au moment de la requête
  findItems(count: number | 'max', pick?: ItemModel): Observable<ActionResult & { found: InventoryModel }> {
    const body: Schemas['DigDto'] = count === 'max' ? { max: true, pick } : { count, pick };
    return this.httpClient.post<Schemas['DigResponse']>(this.API_URL + 'me/city/dig', body).pipe(
      map((response) => ({
        city: toCityModel(response.city),
        effects: response.effects,
        found: toInventory(response.found),
      })),
    );
  }

  newCity(ranked: boolean): Observable<CityWithState> {
    return this.httpClient.post<ApiCity>(this.API_URL + 'me/city', { ranked }).pipe(map(withState));
  }

  deleteCity(): Observable<unknown> {
    return this.httpClient.delete(this.API_URL + 'me/city');
  }

  build(id: number): Observable<ActionResult> {
    return this.httpClient
      .post<Schemas['ActionResponse']>(this.API_URL + `me/city/buildings/${id}/upgrade`, {})
      .pipe(map(toActionResult));
  }

  learn(id: number): Observable<ActionResult> {
    return this.httpClient
      .post<Schemas['ActionResponse']>(this.API_URL + `me/city/skills/${id}/upgrade`, {})
      .pipe(map(toActionResult));
  }

  // Fin de journée, puis relecture du joueur : gains et records changent si la ville tombe
  endDay(): Observable<PlayerSnapshot> {
    return this.httpClient.post<ApiCity>(this.API_URL + 'me/city/day/end', {}).pipe(switchMap(() => this.getMe()));
  }

  startDay(chosenBuildingIds: number[]): Observable<CityModel> {
    return this.httpClient
      .post<ApiCity>(this.API_URL + 'me/city/day/start', { chosenBuildingIds })
      .pipe(map(toCityModel));
  }

  buyBonus(id: number): Observable<StatsModel> {
    return this.httpClient.post<ApiPlayer>(this.API_URL + `me/bonuses/${id}/level-up`, {}).pipe(map(toStatsModel));
  }

  saveDeck(buildingIds: number[]): Observable<StatsModel> {
    return this.httpClient.put<ApiPlayer>(this.API_URL + 'me/deck', { buildingIds }).pipe(map(toStatsModel));
  }

  openBooster(id: number): Observable<BoosterOpening> {
    return this.httpClient
      .post<Schemas['BoosterOpeningResponse']>(this.API_URL + `me/boosters/${id}/open`, {})
      .pipe(map((response) => ({ stats: toStatsModel(response.player), cards: toBoosterCards(response.cards) })));
  }

  upgradeBuilding(id: number): Observable<StatsModel> {
    return this.httpClient.post<ApiPlayer>(this.API_URL + `me/buildings/${id}/upgrade`, {}).pipe(map(toStatsModel));
  }

  getMarket(): Observable<MarketModel> {
    return this.httpClient.get<Schemas['MarketResponse']>(this.API_URL + 'market');
  }

  createMarketListing(buildingId: number, quantity: number, price: number): Observable<MarketUpdate> {
    return this.httpClient
      .post<Schemas['MarketActionResponse']>(this.API_URL + 'market/listings', { buildingId, quantity, price })
      .pipe(map(toMarketUpdate));
  }

  buyMarketListing(listingId: string): Observable<MarketUpdate> {
    return this.httpClient
      .post<Schemas['MarketActionResponse']>(this.API_URL + `market/listings/${listingId}/buy`, {})
      .pipe(map(toMarketUpdate));
  }

  withdrawMarketListing(listingId: string): Observable<MarketUpdate> {
    return this.httpClient
      .delete<Schemas['MarketActionResponse']>(this.API_URL + `market/listings/${listingId}`)
      .pipe(map(toMarketUpdate));
  }

  getLeaderboard(board: LeaderboardBoard, page: number): Observable<LeaderboardPage> {
    return this.httpClient
      .get<Schemas['LeaderboardResponse']>(this.API_URL + `leaderboards/${board}`, { params: { page } })
      .pipe(map(toLeaderboardPage));
  }

  getMyLeaderboardPosition(board: LeaderboardBoard): Observable<LeaderboardPosition> {
    return this.httpClient.get<Schemas['LeaderboardPositionResponse']>(this.API_URL + `leaderboards/${board}/me`);
  }

  getProfil(id: string): Observable<ProfilModel> {
    return this.httpClient.get<ApiProfile>(this.API_URL + `players/${id}/profile`).pipe(map(toProfil));
  }

  getReferral(): Observable<ReferralModel> {
    return this.httpClient.get<ApiReferral>(this.API_URL + 'me/referral').pipe(map(toReferral));
  }

  setSponsor(code: string): Observable<SponsorLink> {
    return this.httpClient.put<Schemas['SponsorLinkResponse']>(this.API_URL + 'me/referral/sponsor', { code }).pipe(
      map((response) => ({
        referral: toReferral(response.referral),
        giftAwarded: response.giftAwarded,
        stats: toStatsModel(response.player),
      })),
    );
  }

  removeReferee(playerId: string): Observable<ReferralModel> {
    return this.httpClient.delete<ApiReferral>(this.API_URL + `me/referral/referees/${playerId}`).pipe(map(toReferral));
  }

  regenerateReferralCode(): Observable<ReferralModel> {
    return this.httpClient.post<ApiReferral>(this.API_URL + 'me/referral/code', {}).pipe(map(toReferral));
  }

  getGuild(): Observable<GuildOverviewModel> {
    return this.httpClient.get<ApiGuildOverview>(this.API_URL + 'guilds/me').pipe(map(toGuildOverview));
  }

  // Fiche publique d'une guilde, consultable sans en être membre
  getGuildProfile(id: string): Observable<GuildProfileModel> {
    return this.httpClient.get<ApiGuildProfile>(this.API_URL + `guilds/${id}`).pipe(map(toGuildProfile));
  }

  // Guildes publiques qui ont encore de la place
  searchGuilds(search: string): Observable<GuildSummaryModel[]> {
    return this.httpClient
      .get<Schemas['GuildListResponse']>(this.API_URL + 'guilds', { params: search ? { search } : {} })
      .pipe(map((response) => response.guilds));
  }

  createGuild(name: string, isPublic: boolean): Observable<GuildOverviewModel> {
    return this.httpClient
      .post<ApiGuildOverview>(this.API_URL + 'guilds', { name, isPublic })
      .pipe(map(toGuildOverview));
  }

  setGuildPublic(isPublic: boolean): Observable<GuildOverviewModel> {
    return this.httpClient.patch<ApiGuildOverview>(this.API_URL + 'guilds/me', { isPublic }).pipe(map(toGuildOverview));
  }

  joinGuild(guildId: string): Observable<GuildOverviewModel> {
    return this.httpClient
      .post<ApiGuildOverview>(this.API_URL + `guilds/${guildId}/join`, {})
      .pipe(map(toGuildOverview));
  }

  leaveGuild(): Observable<GuildOverviewModel> {
    return this.httpClient.post<ApiGuildOverview>(this.API_URL + 'guilds/me/leave', {}).pipe(map(toGuildOverview));
  }

  kickGuildMember(playerId: string): Observable<GuildOverviewModel> {
    return this.httpClient
      .delete<ApiGuildOverview>(this.API_URL + `guilds/me/members/${playerId}`)
      .pipe(map(toGuildOverview));
  }

  inviteToGuild(username: string): Observable<GuildOverviewModel> {
    return this.httpClient
      .post<ApiGuildOverview>(this.API_URL + 'guilds/me/invitations', { username })
      .pipe(map(toGuildOverview));
  }

  acceptGuildInvitation(invitationId: string): Observable<GuildOverviewModel> {
    return this.httpClient
      .post<ApiGuildOverview>(this.API_URL + `guilds/invitations/${invitationId}/accept`, {})
      .pipe(map(toGuildOverview));
  }

  declineGuildInvitation(invitationId: string): Observable<GuildOverviewModel> {
    return this.httpClient
      .delete<ApiGuildOverview>(this.API_URL + `guilds/invitations/${invitationId}`)
      .pipe(map(toGuildOverview));
  }

  // Dernière partie terminée du joueur (écran de fin de partie)
  getLastGame(playerId: string): Observable<GameHistoryModel | undefined> {
    return this.httpClient
      .get<ApiProfile>(this.API_URL + `players/${playerId}/profile`)
      .pipe(map((profile) => (profile.matches[0] ? toGameHistory(profile.matches[0], profile) : undefined)));
  }
}
