import { components } from 'src/app/models/api';
import {
  AttackRecapModel,
  BonusWithoutLvl,
  BoosterCardModel,
  BoosterModel,
  BuildingModel,
  CatalogBuildingModel,
  CityModel,
  createDefaultCityModel,
  DefaultValuesModel,
  GameHistoryModel,
  GuildOverviewModel,
  GuildProfileModel,
  InventoryModel,
  LeaderboardElement,
  LeaderboardPage,
  ProfilModel,
  ReferralModel,
  SkillModel,
  StatsModel,
} from 'src/app/models/game';
import { UserState } from 'src/app/models/router';

// Conversion des réponses de the-black-hour-api (types générés depuis openapi.json) vers les modèles du front.
// Les composants ne manipulent que les modèles de src/app/models/game.ts.

type Schemas = components['schemas'];
export type ApiCity = Schemas['CityResponse'];
export type ApiPlayer = Schemas['PlayerResponse'];
export type ApiCatalog = Schemas['CatalogResponse'];
export type ApiProfile = Schemas['ProfileResponse'];
export type ApiMatch = Schemas['MatchResponse'];
export type ApiLeaderboardEntry = Schemas['LeaderboardEntryResponse'];
export type ApiReferral = Schemas['ReferralResponse'];
export type ApiGuildOverview = Schemas['GuildOverviewResponse'];
export type ApiGuildProfile = Schemas['GuildProfileResponse'];
type ApiBuilding = Schemas['BuildingResponse'];
type ApiBuildingOffer = Schemas['BuildingOfferResponse'];
type ApiBoosterCard = Schemas['BoosterCardResponse'];
type ApiSkill = Schemas['SkillResponse'];
type ApiAttackRecap = Schemas['AttackRecapResponse'];
type ApiItemQuantities = Schemas['ItemQuantitiesResponse'];

const PHASE_TO_STATE: Record<ApiCity['phase'], UserState> = {
  playing: UserState.PLAYING,
  dayRecap: UserState.RECAP,
  deathRecap: UserState.DEATH_RECAP,
};

export function stateFromCity(city: ApiCity | null): UserState {
  return city ? PHASE_TO_STATE[city.phase] : UserState.NO_CITY;
}

export function toInventory(items: ApiItemQuantities): InventoryModel {
  return {
    wood: items.wood ?? 0,
    stone: items.stone ?? 0,
    screw: items.screw ?? 0,
    metal: items.metal ?? 0,
    patch: items.patch ?? 0,
  };
}

function toBuildingModel(building: ApiBuilding | ApiBuildingOffer): BuildingModel {
  return {
    id: building.id,
    name: building.name,
    rarity: building.rarity,
    rank: building.rank,
    defense: building.defense,
    time: building.buildTime,
    lvl: building.level,
    lvl_max: building.maxLevel,
    inventory: { ...building.cost },
    selected: false,
    recycled: 'recycled' in building && building.recycled,
    effect: building.effect,
    next_level_duration: building.nextLevelDuration,
  };
}

function toSkillModel(skill: ApiSkill): SkillModel {
  return {
    id: skill.id,
    name: skill.name,
    speed_name: skill.speed,
    lvl: skill.level,
    lvl_max: skill.maxLevel,
    lvl_max_max: skill.levelCap,
    time: skill.learnTime,
    avantage_per_lvl: skill.speedGainPerLevel,
    reduce_time_seconds: skill.wakeUpEarlierSeconds ?? 0,
    next_level_duration: skill.nextLevelDuration,
  };
}

function toAttackRecap(recap: ApiAttackRecap | null): AttackRecapModel {
  if (!recap) {
    return createDefaultCityModel().attackRecap;
  }
  return {
    architect_shelter_buildings: recap.buildingOffers.map(toBuildingModel),
    building_picks: recap.buildingPicks,
    library_discoveries: Object.fromEntries(recap.skillDiscoveries.map((d) => [d.skillId, d.levels])),
    nb_zb: recap.zombies,
    defense: recap.defense,
    base_money: recap.rewards?.baseMoney ?? 0,
    ranked_money: recap.rewards?.rankedMoney ?? 0,
    bonus_money: recap.rewards?.bonusMoney ?? 0,
    total_money: recap.rewards?.totalMoney ?? 0,
    day: recap.day,
    effects: recap.effects,
  };
}

export function toCityModel(city: ApiCity): CityModel {
  return {
    day: city.day,
    defense: city.defense,
    time: city.time,
    nb_zb_previous_attack: city.zombies.lastAttack,
    nb_zb_next_attack_min: city.zombies.nextAttackMin,
    nb_zb_next_attack_max: city.zombies.nextAttackMax,
    nb_zb_history: city.zombies.history,
    buildings: city.buildings.map(toBuildingModel),
    skills: city.skills.map(toSkillModel),
    last_timestamp_request: Date.parse(city.lastActivityAt),
    inventory: { ...city.inventory },
    dig_offer: [...city.digOffer],
    speeds: { ...city.speeds },
    state: stateFromCity(city),
    attackRecap: toAttackRecap(city.attackRecap),
    ranked: city.ranked,
    ranked_deadline: city.rankedDeadline ? Date.parse(city.rankedDeadline) : null,
    deck_status: {
      size: city.deckStatus.size,
      unseen: city.deckStatus.unseen,
      completed: city.deckStatus.completed,
      recycle_threshold: city.deckStatus.recycleThreshold,
      recycling: city.deckStatus.recycling,
    },
    night_defense: {
      min: city.nightDefense.min,
      max: city.nightDefense.max,
      per_idle_hour: city.nightDefense.perIdleHour,
    },
    dig_duration: city.digDuration,
  };
}

export function toStatsModel(player: ApiPlayer): StatsModel {
  return {
    personal_best_day: player.personalBest.day,
    personal_best_zb: player.personalBest.zombies,
    xp: player.xp,
    money: player.money,
    bonuses: Object.fromEntries(Object.entries(player.bonusLevels).map(([id, lvl]) => [Number(id), lvl])),
    ranked_points: player.rankedPoints,
    collection: Object.fromEntries(Object.entries(player.collection).map(([id, count]) => [Number(id), count])),
    building_ranks: Object.fromEntries(Object.entries(player.buildingRanks).map(([id, rank]) => [Number(id), rank])),
    deck: [...player.deck],
  };
}

export function toCatalogBuildings(catalog: ApiCatalog): CatalogBuildingModel[] {
  return catalog.buildings.map((building) => ({
    id: building.id,
    name: building.name,
    rarity: building.rarity,
    defense: building.defense,
    lvl_max: building.maxLevel,
    time: building.buildTime,
    inventory: { ...building.cost },
    effect: building.effect,
  }));
}

export function toBoosters(catalog: ApiCatalog): BoosterModel[] {
  return catalog.boosters.map((booster) => ({ ...booster, odds: { ...booster.odds } }));
}

export function toBoosterCards(cards: ApiBoosterCard[]): BoosterCardModel[] {
  return cards.map((card) => ({ building_id: card.buildingId, copies: card.copies, is_new: card.isNew }));
}

export function toBonusReferences(catalog: ApiCatalog): Record<number, BonusWithoutLvl> {
  return Object.fromEntries(
    catalog.bonuses.map((bonus) => [
      bonus.id,
      {
        id: bonus.id,
        name: bonus.name,
        description: bonus.description,
        icon: bonus.icon,
        price: bonus.price,
        lvl_max: bonus.maxLevel,
        value: bonus.value,
      },
    ]),
  );
}

export function toDefaultValues(catalog: ApiCatalog): DefaultValuesModel {
  const rules = catalog.rules;
  return {
    items: catalog.items,
    day_start_time: rules['DAY_START_TIME'],
    day_end_time: rules['DAY_END_TIME'],
    digging_time: rules['DIG_TIME'],
    coef_realtime_to_ingametime: rules['GAME_SECONDS_PER_REAL_SECOND'],
    nb_buildings_start: rules['STARTING_BUILDING_PLANS'],
    nb_skills_start: rules['STARTING_SKILL_LEVELS'],
    probaBuildingDiscovery: rules['ARCHITECT_DISCOVERY_PROBABILITY'],
    probaSkillDiscovery: rules['LIBRARY_DISCOVERY_PROBABILITY'],
    bonuses: toBonusReferences(catalog),
    SKILL_TIME_MULTIPLIER: rules['SKILL_TIME_MULTIPLIER'],
    BONUS_PRICE_GROWTH: rules['BONUS_PRICE_GROWTH'],
    ZOMBIE_COEF_MIN: rules['ZOMBIE_COEF_MIN'],
    ZOMBIE_COEF_MAX: rules['ZOMBIE_COEF_MAX'],
    ARCHITECT_DISCOVERY_CHOICES: rules['ARCHITECT_EXTRA_OFFERS'],
    DECK_SIZE: rules['DECK_SIZE'],
    effect_rules: {
      larder_items_per_level: rules['LARDER_ITEMS_PER_LEVEL'],
      dormitory_max_sleep_bonus_per_level: rules['DORMITORY_MAX_SLEEP_BONUS_PER_LEVEL'],
      trophy_nights_per_point: rules['TROPHY_NIGHTS_PER_POINT'],
      carrion_surplus_step: rules['CARRION_SURPLUS_STEP'],
      carrion_max_steps: rules['CARRION_MAX_STEPS'],
      vault_max_defense_per_level: rules['VAULT_MAX_DEFENSE_PER_LEVEL'],
    },
    rank_rules: {
      max_rank: rules['CARD_MAX_RANK'],
      rank_bonus: rules['CARD_RANK_BONUS'],
      upgrade_copies: catalog.upgradeCopies,
    },
  };
}

const USERNAME_DISPLAY_MAX = 22;

export function toLeaderboardPage(response: Schemas['LeaderboardResponse']): LeaderboardPage {
  return {
    entries: toLeaderboard(response.entries),
    page: response.page,
    page_size: response.pageSize,
    total: response.total,
    leader: response.leader ? toLeaderboard([response.leader])[0] : null,
  };
}

export function toLeaderboard(entries: ApiLeaderboardEntry[]): LeaderboardElement[] {
  return entries.map((entry) => ({
    user_id: entry.playerId,
    username: entry.username,
    username_truncated:
      entry.username.length > USERNAME_DISPLAY_MAX ? `${entry.username.substring(0, 19)}...` : entry.username,
    personal_best_day: entry.bestDay,
    personal_best_zb: entry.bestZombies,
    ranked_points: entry.rankedPoints,
    rank: entry.rank,
  }));
}

// Dans l'historique du front, player1 est toujours le joueur du profil
export function toGameHistory(match: ApiMatch, player: { id: string; username: string }): GameHistoryModel {
  return {
    date: match.playedAt,
    ranked: match.ranked,
    ranked_points: match.rankedPointsDelta === null ? null : Math.abs(match.rankedPointsDelta),
    player1: { id: player.id, username: player.username, day: match.day, defense: match.defense, nb_zb: match.zombies },
    player2: match.opponent
      ? {
          id: match.opponent.playerId,
          username: match.opponent.username,
          day: match.opponent.day,
          defense: match.opponent.defense,
          nb_zb: match.opponent.zombies,
        }
      : null,
    outcome: match.outcome,
    forfeit: match.forfeit,
  };
}

export function toProfil(profile: ApiProfile): ProfilModel {
  return {
    username: profile.username,
    rank: profile.rank,
    ranked_points: profile.rankedPoints,
    xp: profile.xp,
    creation_date: profile.createdAt,
    personal_best_day: profile.personalBest.day,
    personal_best_zb: profile.personalBest.zombies,
    guild: profile.guild ? { ...profile.guild } : null,
    today: { ...profile.today },
    // L'API renvoie la plus récente en premier, le profil affiche l'historique du plus ancien au plus récent
    match_history: profile.matches.map((match) => toGameHistory(match, profile)).reverse(),
  };
}

export function toReferral(referral: ApiReferral): ReferralModel {
  return {
    ...referral,
    sponsor: referral.sponsor ? { ...referral.sponsor } : null,
    referees: referral.referees.map((referee) => ({ ...referee })),
  };
}

export function toGuildOverview(overview: ApiGuildOverview): GuildOverviewModel {
  return {
    guild: overview.guild ? { ...overview.guild, members: overview.guild.members.map((m) => ({ ...m })) } : null,
    invitations: overview.invitations.map((i) => ({ ...i, expiresAt: new Date(i.expiresAt) })),
    lastPayout: overview.lastPayout,
  };
}

export function toGuildProfile(guild: ApiGuildProfile): GuildProfileModel {
  return {
    ...guild,
    createdAt: new Date(guild.createdAt),
    members: guild.members.map((m) => ({ ...m })),
  };
}
