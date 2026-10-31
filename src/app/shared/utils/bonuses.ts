import { AdvancedBonus, BonusWithoutLvl, DefaultValuesModel, StatsModel } from 'src/app/models/game';

// Prix du prochain niveau, même formule que l'API (bonusLevelPrice) : prix × croissance ^ niveau, arrondi à la dizaine
export function bonusPrice(bonus: BonusWithoutLvl, lvl: number, defaultValues: DefaultValuesModel): number {
  return Math.round((bonus.price * defaultValues.BONUS_PRICE_GROWTH ** lvl) / 10) * 10;
}

// Effet total d'un bonus (valeur × niveau), 0 tant que les références ne sont pas chargées
export function bonusEffect(bonus: AdvancedBonus | undefined): number {
  return bonus ? bonus.value * bonus.lvl : 0;
}

export function computeBonuses(
  stats: StatsModel,
  defaultValues: DefaultValuesModel,
  referencesBonuses: Record<number, BonusWithoutLvl>,
): Record<number, AdvancedBonus> {
  // Un joueur sans aucun niveau acheté (bonusLevels vide) doit quand même voir tout le catalogue
  if (Object.keys(referencesBonuses).length === 0) {
    return {};
  }

  const bonuses: Record<number, AdvancedBonus> = {};
  for (const reference of Object.values(referencesBonuses)) {
    const lvl = stats.bonuses[reference.id] ?? 0;
    const price = bonusPrice(reference, lvl, defaultValues);
    bonuses[reference.id] = {
      ...reference,
      lvl,
      nextPrice: price,
      enoughMoney: price <= stats.money,
      enoughLvlMax: lvl < reference.lvl_max,
    };
  }

  return bonuses;
}
