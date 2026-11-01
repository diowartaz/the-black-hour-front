import { createDefaultDefaultValuesModel } from 'src/app/models/game';
import { canUpgrade, cardRank, rankedDefense, rankedEffect, upgradeCopies } from './ranks';

describe('ranks', () => {
  const rules = createDefaultDefaultValuesModel().rank_rules;

  it('un plan sans rang enregistré est au rang 0', () => {
    expect(cardRank({}, 7)).toBe(0);
    expect(cardRank({ 7: 3 }, 7)).toBe(3);
  });

  it('ajoute 20 % de la valeur de base par rang', () => {
    expect(rankedDefense(180, 0, rules)).toBe(180);
    expect(rankedDefense(180, 1, rules)).toBe(216);
    expect(rankedDefense(180, 10, rules)).toBe(540);
  });

  it('applique le rang aux effets, sans décimales parasites', () => {
    expect(rankedEffect({ kind: 'digTimeReduction', value: 0.08 }, 2, rules).value).toBe(0.112);
    expect(rankedEffect({ kind: 'buildDayScaling', value: 3 }, 2, rules).value).toBe(4.2);
  });

  it("demande moins d'exemplaires pour les plans plus rares", () => {
    expect(upgradeCopies('common', 0, rules)).toBe(5);
    expect(upgradeCopies('rare', 0, rules)).toBe(3);
    expect(upgradeCopies('epic', 9, rules)).toBe(77);
    expect(upgradeCopies('epic', 10, rules)).toBeNull();
  });

  it('la carte gardée ne compte pas dans les exemplaires consommés', () => {
    expect(canUpgrade(5, 'common', 0, rules)).toBeFalse();
    expect(canUpgrade(6, 'common', 0, rules)).toBeTrue();
    expect(canUpgrade(999, 'common', 10, rules)).toBeFalse();
  });
});
