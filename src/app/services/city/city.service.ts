import { computed, inject, Injectable, Injector, Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, interval, map, of, startWith, switchMap, takeWhile, tap } from 'rxjs';
import {
  AdvancedBonus,
  AdvancedBuildingModel,
  AdvancedSkillModel,
  BonusWithoutLvl,
  BoosterCardModel,
  BoosterModel,
  BuildingModel,
  CatalogBuildingModel,
  CityModel,
  createDefaultCityModel,
  createDefaultDefaultValuesModel,
  createDefaultStatsModel,
  createEmptyInventory,
  DefaultValuesModel,
  GameHistoryModel,
  EffectReportModel,
  InventoryModel,
  ItemModel,
  SkillModel,
  StatsModel,
} from 'src/app/models/game';
import { UserState } from 'src/app/models/router';
import { computeBonuses, defenseMultiplier } from 'src/app/shared/utils/bonuses';
import { calculateAdvancedBuildings } from 'src/app/shared/utils/buildings';
import { runRequest } from 'src/app/shared/utils/http';
import { calculateAdvancedSkills } from 'src/app/shared/utils/skills';
import { StorageKey, writeStorage } from 'src/app/shared/utils/storage';
import { formatTimeToString } from 'src/app/shared/utils/time';
import { ActionResult, GameApiService, GameCatalog, PlayerSnapshot } from '../game-api/game-api.service';

// Source de vérité de l'état de la partie. La navigation qui découle d'un changement de `state`
// est gérée par RedirectionService, jamais ici.
@Injectable({
  providedIn: 'root',
})
export class CityService {
  private readonly api = inject(GameApiService);
  private readonly appInjector = inject(Injector);

  state = signal<UserState>(UserState.NOT_LOADED_PLAYER);
  // Compte chargé par loadPlayer (sert à retrouver la dernière partie terminée)
  accountId = signal<string | undefined>(undefined);
  lastGame = signal<GameHistoryModel | undefined>(undefined);
  playerLoaded = computed<boolean>(() => this.state() !== UserState.NOT_LOADED_PLAYER);

  referencesBonuses = signal<Record<number, BonusWithoutLvl>>({});
  catalogBuildings = signal<CatalogBuildingModel[]>([]);
  boosters = signal<BoosterModel[]>([]);
  // Plans du dernier booster ouvert, affichés jusqu'à fermeture de la révélation
  lastBoosterCards = signal<BoosterCardModel[] | null>(null);
  defaultValues = signal<DefaultValuesModel>(createDefaultDefaultValuesModel());
  stats = signal<StatsModel>(createDefaultStatsModel());
  city = signal<CityModel>(createDefaultCityModel());
  inventoryItemFound = signal<InventoryModel>(createEmptyInventory());
  // Ce que les bâtiments spéciaux ont fait pendant la dernière action, affiché puis effacé par EffectToastComponent
  actionEffects = signal<EffectReportModel[]>([]);

  bonuses = computed<Record<number, AdvancedBonus>>(() =>
    computeBonuses(this.stats(), this.defaultValues(), this.referencesBonuses()),
  );
  defenseMultiplier = computed<number>(() => defenseMultiplier(this.bonuses()));

  buildings = computed<BuildingModel[]>(() => this.city().buildings);
  advancedBuildings = computed<AdvancedBuildingModel[]>(() =>
    calculateAdvancedBuildings(this.city(), this.defaultValues()),
  );

  collection = computed<Record<number, number>>(() => this.stats().collection);
  buildingRanks = computed<Record<number, number>>(() => this.stats().building_ranks);
  deck = computed<number[]>(() => this.stats().deck);

  skills = computed<SkillModel[]>(() => this.city().skills);
  advancedSkills = computed<AdvancedSkillModel[]>(() => calculateAdvancedSkills(this.city(), this.defaultValues()));

  public cityTimeSeconds: Signal<number | undefined>;
  public cityTimeString = computed(() => formatTimeToString(this.cityTimeSeconds() || 0));

  // Défense ajoutée pour la nuit si le joueur dort maintenant : les heures entières non utilisées
  // comptent pour Night Owl Perch, le reste vient du serveur
  nightDefenseNow = computed<{ min: number; max: number }>(() => {
    const { min, max, per_idle_hour } = this.city().night_defense;
    const remaining = Math.max(0, this.defaultValues().day_end_time - (this.cityTimeSeconds() || 0));
    const idle = Math.floor(remaining / 3600) * per_idle_hour;
    return { min: min + idle, max: max + idle };
  });

  // Temps réel restant au joueur d'une ranked avant son échéance (null sans échéance).
  // À l'échéance, le joueur est rechargé : l'API constate l'abandon (second joueur) ou l'annulation (premier joueur,
  // contre un bot) et la ville devient une partie normale.
  rankedTimeLeftMs: Signal<number | null>;

  buildLoading = signal<boolean>(false);
  learnLoading = signal<boolean>(false);
  endDayLoading = signal<boolean>(false);
  startDayLoading = signal<boolean>(false);
  deleteCityLoading = signal<boolean>(false);
  newCityLoading = signal<boolean>(false);
  digLoading = signal<boolean>(false);
  playerLoading = signal<boolean>(false);
  buyBonusLoading = signal<boolean>(false);
  referencesBonusesLoading = signal<boolean>(false);
  saveDeckLoading = signal<boolean>(false);
  openBoosterLoading = signal<boolean>(false);
  upgradeLoading = signal<boolean>(false);

  constructor() {
    this.cityTimeSeconds = this.setCityTimeSeconds();
    this.rankedTimeLeftMs = this.setRankedTimeLeftMs();
  }

  // Horloge de jeu : extrapole l'heure de la ville depuis la dernière réponse du serveur
  setCityTimeSeconds() {
    return toSignal(
      toObservable(this.city, { injector: this.appInjector }).pipe(
        filter((city) => city !== null),
        switchMap((city) => {
          const coef = this.defaultValues().coef_realtime_to_ingametime;
          const realTimeRefreshRateMs = Math.floor((60 * 1000) / coef);

          // Utilise l'intervalle calculé pour mettre à jour l'horloge
          return interval(realTimeRefreshRateMs).pipe(
            startWith(0),
            map(() => {
              const realTimeDeltaMs = new Date().getTime() - city.last_timestamp_request;
              const ingameTimeDeltaSeconds = Math.floor((realTimeDeltaMs / 1000) * coef);
              const newIngameTimeSeconds = city.time + ingameTimeDeltaSeconds;
              const dayEndTime = this.defaultValues().day_end_time;

              // Vérification de la fin de journée
              const isEndOfDay = newIngameTimeSeconds >= dayEndTime;
              if (isEndOfDay && this.state() === UserState.PLAYING) {
                this.endDay();
              }
              return isEndOfDay ? dayEndTime : newIngameTimeSeconds;
            }),
            takeWhile(
              (cityTimeSeconds) =>
                this.state() === UserState.PLAYING && cityTimeSeconds < this.defaultValues().day_end_time,
              true,
            ),
          );
        }),
      ),
    );
  }

  setRankedTimeLeftMs(): Signal<number | null> {
    const deadline = computed(() => this.city().ranked_deadline);
    return toSignal(
      toObservable(deadline, { injector: this.appInjector }).pipe(
        switchMap((at) =>
          at === null
            ? of(null)
            : interval(1000).pipe(
                startWith(0),
                map(() => Math.max(0, at - Date.now())),
                takeWhile((left) => left > 0, true),
                tap((left) => {
                  if (left === 0) {
                    this.loadPlayer();
                  }
                }),
              ),
        ),
      ),
      { injector: this.appInjector, initialValue: null },
    );
  }

  // Remet l'état du joueur à zéro (déconnexion, changement de compte)
  reset(): void {
    this.state.set(UserState.NOT_LOADED_PLAYER);
    this.city.set(createDefaultCityModel());
    this.stats.set(createDefaultStatsModel());
    this.inventoryItemFound.set(createEmptyInventory());
    this.actionEffects.set([]);
    this.accountId.set(undefined);
    this.lastGame.set(undefined);
  }

  loadPlayer(): void {
    runRequest(this.playerLoading, this.api.loadPlayer(), ({ player, catalog }) => {
      this.defaultValues.set(catalog.defaultValues);
      this.applyCatalog(catalog);
      this.applyPlayer(player);
    });
  }

  findItems(nb: number | 'max', pick?: ItemModel): void {
    runRequest(this.digLoading, this.api.findItems(nb, pick), (response) => {
      this.city.set(response.city);
      this.inventoryItemFound.set(response.found);
      this.actionEffects.set(response.effects);
    });
  }

  newCity(ranked: boolean): void {
    runRequest(this.newCityLoading, this.api.newCity(ranked), (response) => {
      writeStorage(StorageKey.PLAY_ROUTE, 'dig');
      this.inventoryItemFound.set(createEmptyInventory());
      this.city.set(response.city);
      this.state.set(response.state);
    });
  }

  deleteCity(): void {
    runRequest(this.deleteCityLoading, this.api.deleteCity(), () => {
      this.city.set(createDefaultCityModel());
      this.state.set(UserState.NO_CITY);
    });
  }

  build(id: number): void {
    runRequest(this.buildLoading, this.api.build(id), (result) => this.applyAction(result));
  }

  learn(id: number): void {
    runRequest(this.learnLoading, this.api.learn(id), (result) => this.applyAction(result));
  }

  private applyAction({ city, effects }: ActionResult): void {
    this.city.set(city);
    this.actionEffects.set(effects);
  }

  endDay(): void {
    runRequest(this.endDayLoading, this.api.endDay(), (player) => this.applyPlayer(player));
  }

  // Les choix sont des index dans attackRecap.architect_shelter_buildings ; l'API attend des ids
  startDay(chosenBuildings: number[]): void {
    const offers = this.city().attackRecap.architect_shelter_buildings;
    const ids = chosenBuildings.map((index) => offers[index]?.id).filter((id) => id !== undefined);
    runRequest(this.startDayLoading, this.api.startDay(ids), (city) => {
      this.inventoryItemFound.set(createEmptyInventory());
      this.city.set(city);
      this.state.set(UserState.PLAYING);
    });
  }

  loadReferencesBonuses(): void {
    runRequest(this.referencesBonusesLoading, this.api.getCatalog(), (catalog) => this.applyCatalog(catalog));
  }

  saveDeck(buildingIds: number[]): void {
    runRequest(this.saveDeckLoading, this.api.saveDeck(buildingIds), (stats) => this.stats.set(stats));
  }

  openBooster(id: number): void {
    runRequest(this.openBoosterLoading, this.api.openBooster(id), ({ stats, cards }) => {
      this.stats.set(stats);
      this.lastBoosterCards.set(cards);
    });
  }

  upgradeBuilding(id: number, onUpgraded: () => void): void {
    runRequest(this.upgradeLoading, this.api.upgradeBuilding(id), (stats) => {
      this.stats.set(stats);
      onUpgraded();
    });
  }

  buyBonus(id: number): void {
    runRequest(this.buyBonusLoading, this.api.buyBonus(id), (stats) => this.stats.set(stats));
  }

  private applyCatalog(catalog: GameCatalog): void {
    this.referencesBonuses.set(catalog.bonuses);
    this.catalogBuildings.set(catalog.buildings);
    this.boosters.set(catalog.boosters);
  }

  private applyPlayer(player: PlayerSnapshot): void {
    this.accountId.set(player.accountId);
    this.stats.set(player.stats);
    this.city.set(player.city ?? createDefaultCityModel());
    this.state.set(player.state);
    this.lastGame.set(undefined);
    if (player.state === UserState.DEATH_RECAP) {
      this.api
        .getLastGame(player.accountId)
        .subscribe({ next: (game) => this.lastGame.set(game), error: () => undefined });
    }
  }
}
