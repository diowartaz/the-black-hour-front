import { createDefaultDefaultValuesModel } from 'src/app/models/game';
import { buildingEffectText, effectReportText } from './building-effects';

describe('building effects', () => {
  it('décrit un effet avec ses paramètres du catalogue', () => {
    const rules = { ...createDefaultDefaultValuesModel().effect_rules, larder_items_per_level: 2 };
    expect(buildingEffectText({ kind: 'stockToDefense', value: 8 }, { rules })).toContain('uses 2 of');
    expect(buildingEffectText({ kind: 'digTimeReduction', value: 0.08 })).toBe('Digging takes 8% less time per level.');
    expect(buildingEffectText({ kind: 'earlierWakeUp', value: 1200 })).toBe('You wake up 20 min earlier per level.');
  });

  it('relève les plafonds avec le rang du plan', () => {
    // Rang 2 : × 1,4, valeur déjà au rang
    expect(buildingEffectText({ kind: 'compoundGrowth', value: 0.07 }, { rankMultiplier: 1.4 })).toBe(
      'Each night survived: +7% of your defense as permanent defense per level, up to +42 per level.',
    );
    expect(buildingEffectText({ kind: 'sleepRecovery', value: 0.1 }, { rankMultiplier: 1.4 })).toContain(
      'up to 84 min more per level',
    );
  });

  it('inclut le bonus de défense du joueur dans les valeurs de défense, plafonds compris', () => {
    expect(
      buildingEffectText({ kind: 'compoundGrowth', value: 0.07 }, { rankMultiplier: 1.4, defenseMultiplier: 1.3 }),
    ).toBe(
      'Each night survived: +9.1% of your defense as permanent defense per level, up to +54.6 per level. Your defense bonus is included.',
    );
    expect(buildingEffectText({ kind: 'nightlyGrowth', value: 4 }, { defenseMultiplier: 1.3 })).toBe(
      'Each night survived: +5.2 permanent defense per level. Your defense bonus is included.',
    );
    // Pas de défense : le bonus ne change rien
    expect(buildingEffectText({ kind: 'digTimeReduction', value: 0.08 }, { defenseMultiplier: 1.3 })).toBe(
      'Digging takes 8% less time per level.',
    );
  });

  it('décrit les effets qui grandissent avec la partie sans formule', () => {
    expect(buildingEffectText({ kind: 'survivalTrophy', value: 1 }, { day: 7 })).toBe(
      'Each night survived earns a trophy, then gives +1 permanent defense per level for every 2 trophies. Tonight: +3 per level.',
    );
    expect(buildingEffectText({ kind: 'surplusDefense', value: 1 })).toBe(
      'Each night survived: +1 permanent defense per level for every 25 defense above the zombies, up to +8 per level.',
    );
    expect(buildingEffectText({ kind: 'compoundGrowth', value: 0.05 })).toBe(
      'Each night survived: +5% of your defense as permanent defense per level, up to +30 per level.',
    );
  });

  it('résume ce qu’un bâtiment spécial a fait', () => {
    expect(
      effectReportText({
        buildingId: 1,
        name: 'x',
        defense: 4,
        itemsGained: { wood: 1 },
        itemsSpent: { screw: 2 },
        skillLevels: [{ skillId: 2, name: 'Digger', levels: 1 }],
      }),
    ).toBe('+4 defense, +1 wood, −2 screw, Digger +1 level');
  });
});
