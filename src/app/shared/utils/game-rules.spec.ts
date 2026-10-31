import {
  AdvancedBonus,
  BonusWithoutLvl,
  BuildingModel,
  CityModel,
  createDefaultBuildingModel,
  createDefaultCityModel,
  createDefaultDefaultValuesModel,
  createDefaultStatsModel,
  SkillModel,
} from 'src/app/models/game';
import { bonusEffect, bonusPrice, computeBonuses } from './bonuses';
import { calculateAdvancedBuildings } from './buildings';
import { contains } from './inventory';
import { calculateAdvancedSkills } from './skills';
import { enoughTime, formatTimeToString } from './time';
import { lvlToXp, xpToLvl, XPToLVLandXP } from './xp';

function bonus(id: number, value: number, lvl: number): AdvancedBonus {
  return {
    id,
    name: 'b' + id,
    description: '',
    icon: '',
    price: 100,
    lvl,
    lvl_max: 20,
    value,
    nextPrice: 0,
    enoughMoney: false,
    enoughLvlMax: true,
  };
}

function building(overrides: Partial<BuildingModel>): BuildingModel {
  return { ...createDefaultBuildingModel(), lvl: 0, lvl_max: 5, inventory: {}, ...overrides };
}

function skill(overrides: Partial<SkillModel>): SkillModel {
  return {
    id: 1,
    name: 'Digger',
    speed_name: 'dig',
    lvl: 0,
    lvl_max: 3,
    lvl_max_max: 5,
    time: 3600,
    avantage_per_lvl: 0.1,
    reduce_time_seconds: 600,
    next_level_duration: 3600,
    ...overrides,
  };
}

describe('time', () => {
  it('formate des secondes en HHhMM', () => {
    expect(formatTimeToString(0)).toBe('00h00');
    expect(formatTimeToString(3 * 3600 + 5 * 60 + 59)).toBe('03h05');
    expect(formatTimeToString(23 * 3600 + 59 * 60)).toBe('23h59');
  });

  it("vérifie qu'une action se termine avant la fin de journée", () => {
    expect(enoughTime(100, 900, 1000)).toBeTrue();
    expect(enoughTime(101, 900, 1000)).toBeFalse();
    expect(enoughTime(1000, undefined, 1000)).toBeTrue();
  });
});

describe('inventory', () => {
  it('contient toutes les ressources demandées', () => {
    expect(contains({ wood: 3, stone: 1 }, { wood: 3 })).toBeTrue();
    expect(contains({ wood: 2, stone: 1 }, { wood: 3 })).toBeFalse();
    expect(contains({ wood: 3 }, { metal: 1 })).toBeFalse();
    expect(contains({ wood: 3 }, {})).toBeTrue();
  });
});

describe('xp', () => {
  it('lvlToXp et xpToLvl sont cohérents', () => {
    for (const lvl of [1, 5, 10, 25]) {
      expect(xpToLvl(lvlToXp(lvl) + 10)).toBe(lvl);
    }
  });

  it('renvoie un ratio de progression entre 0 et 100', () => {
    const { ratio } = XPToLVLandXP(12345);
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(100);
  });
});

describe('bonuses', () => {
  const defaultValues = { ...createDefaultDefaultValuesModel(), BONUS_PRICE_GROWTH: 1.5 };
  const references: Record<number, BonusWithoutLvl> = {
    1: { id: 1, name: 'Money Maker', description: '', icon: '', price: 500, lvl_max: 20, value: 0.05 },
    2: { id: 2, name: 'Defenser', description: '', icon: '', price: 1000, lvl_max: 2, value: 1 },
  };

  it('calcule le prix comme l’API (prix × croissance ^ niveau, arrondi à la dizaine)', () => {
    expect(bonusPrice(references[1], 0, defaultValues)).toBe(500);
    // 500 × 1,5 = 750 ; 500 × 1,5 ^ 3 = 1687,5
    expect(bonusPrice(references[1], 1, defaultValues)).toBe(750);
    expect(bonusPrice(references[1], 3, defaultValues)).toBe(1690);
  });

  it('associe chaque bonus à son niveau par id', () => {
    const stats = { ...createDefaultStatsModel(), money: 1130, bonuses: { 1: 2, 2: 2 } };
    const bonuses = computeBonuses(stats, defaultValues, references);

    expect(bonuses[1].lvl).toBe(2);
    // 500 × 1,5 ^ 2 = 1125
    expect(bonuses[1].nextPrice).toBe(1130);
    expect(bonuses[1].enoughMoney).toBeTrue();
    expect(bonuses[2].enoughLvlMax).toBeFalse();
    expect(bonuses[2].enoughMoney).toBeFalse();
  });

  it('liste tout le catalogue au niveau 0 pour un joueur sans bonus', () => {
    const stats = { ...createDefaultStatsModel(), money: 0, bonuses: {} };
    const bonuses = computeBonuses(stats, defaultValues, references);

    expect(Object.keys(bonuses).length).toBe(2);
    expect(bonuses[1].lvl).toBe(0);
    expect(bonuses[1].nextPrice).toBe(500);
  });

  it('renvoie un objet vide tant que les références ne sont pas chargées', () => {
    expect(computeBonuses(createDefaultStatsModel(), defaultValues, {})).toEqual({});
  });

  it('vaut 0 pour un bonus absent et valeur × niveau sinon', () => {
    expect(bonusEffect(undefined)).toBe(0);
    expect(bonusEffect(bonus(5, 0.02, 3))).toBeCloseTo(0.06);
  });
});

describe('buildings', () => {
  const defaultValues = createDefaultDefaultValuesModel();

  it('reprend la durée du prochain niveau calculée par le serveur', () => {
    const city: CityModel = {
      ...createDefaultCityModel(),
      buildings: [building({ time: 3600, next_level_duration: 3120 })],
    };
    const [result] = calculateAdvancedBuildings(city, defaultValues);

    expect(result.timeString).toBe('00h52');
    expect(result.expirationCityTime).toBe(defaultValues.day_end_time - 3120);
  });

  it('trie les constructibles en premier et garde les bâtiments au niveau max en fin de liste', () => {
    const city: CityModel = {
      ...createDefaultCityModel(),
      inventory: { wood: 5, stone: 0, screw: 0, metal: 0, patch: 0 },
      buildings: [
        building({ id: 1, name: 'too expensive', inventory: { wood: 10 } }),
        building({ id: 2, name: 'affordable', inventory: { wood: 5 } }),
        building({ id: 3, name: 'maxed', lvl: 5, lvl_max: 5 }),
      ],
    };
    const result = calculateAdvancedBuildings(city, defaultValues);

    expect(result.map((b) => b.name)).toEqual(['affordable', 'too expensive', 'maxed']);
    expect(result[0].enoughRessources).toBeTrue();
  });
});

describe('skills', () => {
  const defaultValues = createDefaultDefaultValuesModel();

  it('reprend la durée du prochain niveau calculée par le serveur et ignore les compétences non débloquées', () => {
    const city: CityModel = {
      ...createDefaultCityModel(),
      skills: [skill({ id: 1, lvl: 2, next_level_duration: 8100 }), skill({ id: 2, lvl_max: 0 })],
    };
    const result = calculateAdvancedSkills(city, defaultValues);

    expect(result.length).toBe(1);
    expect(result[0].timeString).toBe('02h15');
    expect(result[0].expirationCityTime).toBe(defaultValues.day_end_time - 8100);
    expect(result[0].percentageEfficacityStringBefore).toBe('80%');
    expect(result[0].percentageEfficacityStringAfter).toBe('70%');
  });
});
