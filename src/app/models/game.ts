import { components } from './api';

// ---------- Modèles du jeu ----------

export function createDefaultStatsModel(): StatsModel {
  return {
    personal_best_day: 0,
    personal_best_zb: 0,
    xp: 0,
    money: 0,
    bonuses: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 0])),
    ranked_points: 500,
    collection: {},
    deck: [],
  };
}

export interface StatsModel {
  personal_best_day: number;
  personal_best_zb: number;
  xp: number;
  money: number;
  bonuses: Record<number, number>;
  ranked_points: number;
  // Plans possédés : nombre d'exemplaires par id de bâtiment
  collection: Record<number, number>;
  // Ids des plans du deck joué à chaque partie
  deck: number[];
}

export type ItemModel = 'wood' | 'stone' | 'screw' | 'metal' | 'patch';

export type InventoryModel = Record<ItemModel, number>;

export function createEmptyInventory(): InventoryModel {
  return { wood: 0, stone: 0, screw: 0, metal: 0, patch: 0 };
}

export function createDefaultCityModel(): CityModel {
  return {
    day: 0,
    defense: 0,
    time: 0,
    nb_zb_next_attack_max: 0,
    nb_zb_next_attack_min: 0,
    nb_zb_previous_attack: 0,
    buildings: [],
    skills: [],
    nb_zb_history: [],
    inventory: createEmptyInventory(),
    dig_offer: [],
    speeds: {
      build: 1,
      dig: 1,
      learn: 1,
      insomniac: 1,
    },
    last_timestamp_request: new Date().getTime(),
    state: 'noCity',
    attackRecap: {
      architect_shelter_buildings: [],
      building_picks: 0,
      library_discoveries: {},
      nb_zb: 0,
      defense: 0,
      base_money: 0,
      bonus_money: 0,
      ranked_money: 0,
      total_money: 0,
      day: 0,
      effects: [],
    },
    ranked: false,
    ranked_deadline: null,
    deck_status: { size: 0, unseen: 0, completed: 0, recycle_threshold: 0, recycling: false },
    night_defense: { min: 0, max: 0, per_idle_hour: 0 },
    dig_duration: 0,
    defaultCity: true,
  };
}

export interface CityModel {
  day: number;
  defense: number;
  time: number;
  nb_zb_next_attack_max: number;
  nb_zb_next_attack_min: number;
  nb_zb_previous_attack: number;
  buildings: BuildingModel[];
  skills: SkillModel[];
  nb_zb_history: number[];
  last_timestamp_request: number;
  inventory: InventoryModel;
  // Deux ressources distinctes proposées pour la prochaine fouille
  dig_offer: ItemModel[];
  speeds: SpeedsModel;
  state: string;
  attackRecap: AttackRecapModel;
  defaultCity?: boolean;
  ranked: boolean;
  // Échéance (timestamp) du joueur d'une ranked : passé ce moment, abandon s'il est second, sinon partie annulée
  ranked_deadline: number | null;
  deck_status: DeckStatusModel;
  // Défense ajoutée pour la prochaine nuit seulement (Armory, Gambler's Gate), plus per_idle_hour par heure
  // de jeu entière non utilisée au moment de dormir (Night Owl Perch)
  night_defense: { min: number; max: number; per_idle_hour: number };
  // Durée d'une fouille en secondes de jeu, calculée par le serveur (vitesses, bonus, bâtiments spéciaux)
  dig_duration: number;
}

// Ce qu'un bâtiment spécial a fait automatiquement (pendant une action ou après la nuit)
export type EffectReportModel = components['schemas']['EffectReportResponse'];

// Pioche de la ville : plans jamais tirés et recyclage des bâtiments terminés
export interface DeckStatusModel {
  size: number;
  unseen: number;
  completed: number;
  recycle_threshold: number;
  recycling: boolean;
}

export interface AttackRecapModel {
  architect_shelter_buildings: BuildingModel[];
  // Nombre maximum de bâtiments à garder parmi architect_shelter_buildings
  building_picks: number;
  library_discoveries: Record<number, number>;
  nb_zb: number;
  defense: number;
  base_money: number;
  bonus_money: number;
  ranked_money: number;
  total_money: number;
  day: number;
  // Effets des bâtiments spéciaux après la nuit survécue
  effects: EffectReportModel[];
}

export interface SpeedsModel {
  build: number;
  dig: number;
  learn: number;
  insomniac: number;
}

export function createDefaultBuildingModel(): BuildingModel {
  return {
    id: 1,
    defense: 50,
    time: 3600,
    lvl: 2,
    lvl_max: 5,
    name: 'Wooden Shelter',
    inventory: {
      wood: 10,
      stone: 5,
      metal: 2,
    },
    rarity: 'common',
    selected: false,
    defense_ratio_percentage: -22,
    recycled: false,
    next_level_duration: 3600,
  };
}

export type Rarity = 'base' | 'common' | 'rare' | 'epic' | 'legendary';

// Effet d'un bâtiment spécial (défense 0), proportionnel à son niveau construit
export type BuildingEffectModel = components['schemas']['BuildingEffectResponse'];

export interface BuildingModel {
  id: number;
  defense: number;
  time: number;
  lvl: number;
  lvl_max: number;
  name: string;
  inventory: Record<string, number>;
  rarity: Rarity;
  selected: boolean;
  defense_ratio_percentage: number;
  // Offre de l'architecte : bâtiment terminé revenu dans la pioche (lvl_max inclut déjà les niveaux gagnés)
  recycled: boolean;
  effect?: BuildingEffectModel;
  // Durée du prochain niveau en secondes de jeu, calculée par le serveur
  next_level_duration: number;
}

// Plan du catalogue, hors partie (collection, deck, boosters)
export interface CatalogBuildingModel {
  id: number;
  name: string;
  rarity: Rarity;
  defense: number;
  lvl_max: number;
  time: number;
  inventory: Record<string, number>;
  effect?: BuildingEffectModel;
}

export type BoosterRarity = 'common' | 'rare' | 'epic';

export interface BoosterModel {
  id: number;
  name: string;
  price: number;
  cards: number;
  odds: Record<BoosterRarity, number>;
}

export interface BoosterCardModel {
  building_id: number;
  is_new: boolean;
}

export interface MarketListingModel {
  listingId: string;
  buildingId: number;
  price: number;
}

export interface MarketSaleModel {
  buildingId: number;
  price: number;
  soldAt: string;
}

export interface MarketModel {
  unlocked: boolean;
  gamesPlayed: number;
  requiredGames: number;
  minCopiesToSell: number;
  taxRate: number;
  // Offre la moins chère de chaque plan, hors offres du joueur
  offers: MarketListingModel[];
  myListings: MarketListingModel[];
  sales: MarketSaleModel[];
}

export interface AdvancedBuildingModel {
  id: number;
  defense: number;
  time: number;
  lvl: number;
  lvl_max: number;
  name: string;
  inventory: Record<string, number>;
  timeString: string;
  rarity: Rarity;
  selected: boolean;
  enoughRessources: boolean;
  enoughLvlMax: boolean;
  expirationCityTime: number;
  defense_ratio_percentage: number;
  effect?: BuildingEffectModel;
}

export interface SkillModel {
  id: number;
  name: string;
  speed_name: string;
  lvl: number;
  lvl_max: number;
  lvl_max_max: number;
  time: number;
  avantage_per_lvl: number;
  reduce_time_seconds: number;
  // Durée du prochain niveau en secondes de jeu, calculée par le serveur
  next_level_duration: number;
}

export interface AdvancedSkillModel {
  id: number;
  name: string;
  speed_name: string;
  lvl: number;
  lvl_max: number;
  lvl_max_max: number;
  time: number;
  avantage_per_lvl: number;
  reduce_time_seconds: number;
  timeString: string;
  enoughLvlMax: boolean;
  percentageEfficacityStringBefore: string;
  percentageEfficacityStringAfter: string;
  expirationCityTime: number;
}

export interface XPToLVL {
  lvl: string;
  xpString: string;
  ratio: number;
}
export interface ProfilModel {
  username: string;
  // null tant que le joueur n'a terminé aucune partie
  rank: number | null;
  ranked_points: number;
  xp: number;
  creation_date: string;
  personal_best_day: number;
  personal_best_zb: number;
  // Guilde du joueur, null s'il n'en a pas
  guild: GuildRefModel | null;
  today: TodayEarningsModel;
  match_history: GameHistoryModel[];
}

export interface GameHistoryPlayerModel {
  day: number;
  defense: number;
  id: string;
  nb_zb: number;
  username: string;
}

/** Issue d'une partie ranked, calculée par l'API */
export type GameOutcome = 'win' | 'loss' | 'draw';

export interface GameHistoryModel {
  date: string;
  player1: GameHistoryPlayerModel;
  player2: GameHistoryPlayerModel | null;
  ranked: boolean;
  ranked_points: number | null;
  /** Issue pour player1 ; null hors ranked ou tant que l'adversaire n'a pas terminé */
  outcome: GameOutcome | null;
  /** Partie réglée par l'inactivité d'un des deux joueurs */
  forfeit: boolean;
}

export interface DefaultValuesModel {
  items: string[];
  day_start_time: number;
  day_end_time: number;
  digging_time: number;
  coef_realtime_to_ingametime: number;
  nb_buildings_start: number;
  nb_skills_start: number;
  probaBuildingDiscovery: number;
  probaSkillDiscovery: number;
  randomPercentageDefBuilding: number;
  bonuses: Record<string, BonusWithoutLvl>;
  SKILL_TIME_MULTIPLIER: number;
  BONUS_PRICE_GROWTH: number;
  ZOMBIE_COEF_MIN: number;
  ZOMBIE_COEF_MAX: number;
  ARCHITECT_DISCOVERY_CHOICES: number;
  DECK_SIZE: number;
  // Paramètres secondaires des bâtiments spéciaux (la valeur par niveau est dans l'effet)
  effect_rules: EffectRulesModel;
}

export interface EffectRulesModel {
  larder_items_per_level: number;
  dormitory_max_sleep_bonus_per_level: number;
  trophy_nights_per_point: number;
  carrion_surplus_step: number;
  carrion_max_steps: number;
  vault_max_defense_per_level: number;
}

export function createDefaultDefaultValuesModel(): DefaultValuesModel {
  return {
    items: ['wood', 'metal', 'stone', 'screw', 'patch'],
    day_start_time: 28800,
    day_end_time: 86459,
    digging_time: 7200,
    coef_realtime_to_ingametime: 192,
    nb_buildings_start: 7,
    nb_skills_start: 9,
    probaBuildingDiscovery: 0.7,
    probaSkillDiscovery: 0.5,
    randomPercentageDefBuilding: 20,
    bonuses: {},
    SKILL_TIME_MULTIPLIER: 1.5,
    BONUS_PRICE_GROWTH: 1.5,
    ZOMBIE_COEF_MIN: 2,
    ZOMBIE_COEF_MAX: 4,
    ARCHITECT_DISCOVERY_CHOICES: 2,
    DECK_SIZE: 20,
    effect_rules: {
      larder_items_per_level: 1,
      dormitory_max_sleep_bonus_per_level: 3600,
      trophy_nights_per_point: 2,
      carrion_surplus_step: 25,
      carrion_max_steps: 8,
      vault_max_defense_per_level: 30,
    },
  };
}

export interface BonusWithoutLvl {
  id: number;
  name: string;
  description: string;
  icon: string;
  price: number;
  lvl_max: number;
  value: number;
}

export interface AdvancedBonus {
  id: number;
  name: string;
  description: string;
  icon: string;
  price: number;
  lvl: number;
  lvl_max: number;
  value: number;
  nextPrice: number;
  enoughMoney: boolean;
  enoughLvlMax: boolean;
}

export interface LeaderboardElement {
  username: string;
  username_truncated: string;
  user_id: string;
  personal_best_day: number;
  personal_best_zb: number;
  rank: number;
  ranked_points: number;
}

export type LeaderboardBoard = 'best-day' | 'ranked';

export interface LeaderboardPage {
  entries: LeaderboardElement[];
  // Page affichée, à partir de 1
  page: number;
  page_size: number;
  // Nombre de joueurs classés
  total: number;
  // Premier du classement, quelle que soit la page
  leader: LeaderboardElement | null;
}

// Parrainage du joueur connecté : son code, son parrain et ses filleuls
export interface ReferralSponsorModel {
  playerId: string;
  username: string;
  since: string;
}

export interface RefereeModel extends ReferralSponsorModel {
  // Total versé au parrain par ce filleul depuis le lien
  earnings: number;
}

export interface ReferralModel {
  code: string;
  maxReferees: number;
  // 0.1 pour 10 %
  dividendRate: number;
  welcomeGift: number;
  welcomeGiftReceived: boolean;
  sponsor: ReferralSponsorModel | null;
  referees: RefereeModel[];
}

export interface GuildMemberModel {
  playerId: string;
  username: string;
  isLeader: boolean;
  // Part de ses gains versée à la guilde au prochain versement (avant arrondi)
  contribution: number;
  // A terminé une partie depuis le dernier versement : touchera la cagnotte
  eligible: boolean;
}

export interface GuildModel {
  id: string;
  name: string;
  isPublic: boolean;
  isLeader: boolean;
  memberCount: number;
  maxMembers: number;
  // 0.01 pour 1 %
  contributionRate: number;
  // Versé à chaque membre éligible au prochain versement
  pot: number;
  members: GuildMemberModel[];
}

export interface GuildInvitationModel {
  id: string;
  guildId: string;
  guildName: string;
  memberCount: number;
  maxMembers: number;
  expiresAt: Date;
}

export interface GuildOverviewModel {
  guild: GuildModel | null;
  invitations: GuildInvitationModel[];
  // Touché au versement d'aujourd'hui (gains de la veille)
  lastPayout: number;
}

export interface GuildRefModel {
  id: string;
  name: string;
}

// Gains de fin de partie du jour d'un joueur, guilde ou non
export interface TodayEarningsModel {
  coins: number;
  games: number;
  // Part versée à la cagnotte de sa guilde (1 % des gains, avant arrondi), perdue sans guilde à minuit
  contribution: number;
}

// Fiche publique d'une guilde, consultable sans en être membre
export interface GuildProfileModel {
  id: string;
  name: string;
  isPublic: boolean;
  memberCount: number;
  maxMembers: number;
  createdAt: Date;
  // 0.01 pour 1 %
  contributionRate: number;
  // Cagnotte du jour, versée après minuit à chaque membre éligible
  pot: number;
  // Meneur en premier
  members: GuildMemberModel[];
}

export interface GuildSummaryModel {
  id: string;
  name: string;
  memberCount: number;
  maxMembers: number;
  leaderUsername: string;
  // Cagnotte du jour, versée après minuit à chaque membre éligible
  pot: number;
}

// Rang du joueur connecté, null tant qu'il n'a pas terminé de partie dans ce mode
export interface LeaderboardPosition {
  rank: number | null;
  page: number | null;
}
