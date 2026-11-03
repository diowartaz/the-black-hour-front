import { BuildingEffectModel, Rarity, RankRulesModel } from 'src/app/models/game';

// Rangs des plans : mêmes calculs que src/game/collection/upgrade.ts dans the-black-hour-api

export function cardRank(ranks: Record<number, number>, buildingId: number): number {
  return ranks[buildingId] ?? 0;
}

export function rankMultiplier(rank: number, rules: RankRulesModel): number {
  return 1 + rules.rank_bonus * rank;
}

// Défense de catalogue au rang, sans la variation tirée en partie
export function rankedDefense(defense: number, rank: number, rules: RankRulesModel): number {
  return Math.round(defense * rankMultiplier(rank, rules));
}

export function rankedEffect(effect: BuildingEffectModel, rank: number, rules: RankRulesModel): BuildingEffectModel {
  return { ...effect, value: Math.round(effect.value * rankMultiplier(rank, rules) * 1e6) / 1e6 };
}

// Exemplaires à consommer pour passer au rang suivant, en plus de la carte gardée (null : rang max ou plan non concerné)
export function upgradeCopies(rarity: Rarity, rank: number, rules: RankRulesModel): number | null {
  if (rarity === 'base' || rarity === 'legendary' || rank >= rules.max_rank) {
    return null;
  }
  return rules.upgrade_copies[rarity][rank];
}

export function canUpgrade(owned: number, rarity: Rarity, rank: number, rules: RankRulesModel): boolean {
  const copies = upgradeCopies(rarity, rank, rules);
  return copies !== null && owned >= copies + 1;
}
