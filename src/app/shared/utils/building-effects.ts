import {
  BuildingEffectModel,
  createDefaultDefaultValuesModel,
  EffectReportModel,
  EffectRulesModel,
  ItemModel,
} from 'src/app/models/game';

// Une décimale au plus : le rang d'un plan donne des valeurs comme 11.2%
const percent = (value: number) => `${Math.round(value * 1000) / 10}%`;
const minutes = (seconds: number) => `${Math.round(seconds / 60)} min`;
const decimal = (value: number) => Math.round(value * 100) / 100;
// Effet qui ne peut être qu'entier : le rang d'un plan s'applique au total, arrondi
const roundedNote = (value: number) => (Number.isInteger(value) ? '' : ' The total is rounded.');

// Description d'un effet de bâtiment spécial (règles dans the-black-hour-api, src/game/city/effects/handlers/).
// `day` : jour de la ville en cours, pour afficher la valeur actuelle des effets qui en dépendent.
// `rules` : paramètres secondaires des effets, venus du catalogue.
export function buildingEffectText(
  effect: BuildingEffectModel,
  day?: number,
  rules: EffectRulesModel = createDefaultDefaultValuesModel().effect_rules,
): string {
  const { value } = effect;
  switch (effect.kind) {
    case 'nightlyGrowth':
      return `Each night survived: +${value} permanent defense per level.`;
    case 'compoundGrowth':
      return `Each night survived: +${percent(value)} of your defense as permanent defense per level, up to +${rules.vault_max_defense_per_level} per level.`;
    case 'buildDayScaling':
      return (
        `Each level built gives ${value} × the current day in defense.` +
        (day ? ` Today: +${decimal(value * day)} per level.` : '')
      );
    case 'skillDefense':
      return `Each skill level learned gives +${value} defense per level of this building.`;
    case 'stockDefense':
      return `Tonight only: +${value} defense per resource in stock, per level.`;
    case 'randomNightDefense':
      return `Tonight only: random defense between 0 and ${value} per level.`;
    case 'survivalTrophy':
      return (
        `Each night survived earns a trophy, then gives +${value} permanent defense per level for every ${rules.trophy_nights_per_point} trophies.` +
        (day ? ` Tonight: +${decimal(value * Math.floor(day / rules.trophy_nights_per_point))} per level.` : '')
      );
    case 'otherBuildDefense':
      return `Each level you build on another building gives +${value} defense per level.`;
    case 'surplusDefense':
      return `Each night survived: +${value} permanent defense per level for every ${rules.carrion_surplus_step} defense above the zombies, up to +${decimal(value * rules.carrion_max_steps)} per level.`;
    case 'stockToDefense':
      return `Each night survived: uses ${rules.larder_items_per_level} of your most plentiful resource per level, +${value} permanent defense for each.`;
    case 'digDefense':
      return `Each dig gives +${value} permanent defense per level.`;
    case 'idleNightDefense':
      return `Tonight only: +${value} defense per level for each full hour left when you go to sleep.`;
    case 'extraAttackRolls':
      return `The horde size is rolled ${value} more time per level; the smallest roll is kept.${roundedNote(value)}`;
    case 'extraDigItem':
      return `Each dig has a ${percent(value)} chance per level to bring back one more resource.`;
    case 'buildRefund':
      return `Each build has a ${percent(value)} chance per level to give back one of the resources spent.`;
    case 'morningItems':
      return `Each night survived: ${value} random resource per level.`;
    case 'digTimeReduction':
      return `Digging takes ${percent(value)} less time per level.`;
    case 'buildTimeReduction':
      return `Building takes ${percent(value)} less time per level.`;
    case 'repeatBuildTimeReduction':
      return `Building the same building as your previous action takes ${percent(value)} less time per level.`;
    case 'earlierWakeUp':
      return `You wake up ${minutes(value)} earlier per level.`;
    case 'sleepRecovery':
      return `Going to sleep early gives back ${percent(value)} more of the remaining time per level, up to ${minutes(rules.dormitory_max_sleep_bonus_per_level)} more per level.`;
    case 'extraArchitectOffers':
      return `The Blueprint Workshop shows ${value} more building per level to choose from.${roundedNote(value)}`;
    case 'skillLevelCap':
      return `Every skill can be unlocked ${value} level higher per level.${roundedNote(value)}`;
    case 'nightLearning':
      return `Each night survived: ${percent(value)} chance per level to learn an unlocked skill level for free.`;
  }
}

function itemsText(items: EffectReportModel['itemsGained'], sign: '+' | '−'): string[] {
  return (Object.entries(items) as [ItemModel, number | undefined][])
    .filter(([, quantity]) => quantity)
    .map(([item, quantity]) => `${sign}${quantity} ${item}`);
}

// Résumé de ce qu'un bâtiment spécial a fait : « +4 defense, +1 wood, Digger +1 level »
export function effectReportText(report: EffectReportModel): string {
  return [
    ...(report.defense ? [`+${report.defense} defense`] : []),
    ...itemsText(report.itemsGained, '+'),
    ...itemsText(report.itemsSpent, '−'),
    ...report.skillLevels.map((s) => `${s.name} +${s.levels} level${s.levels > 1 ? 's' : ''}`),
  ].join(', ');
}
