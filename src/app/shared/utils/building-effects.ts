import {
  BuildingEffectModel,
  createDefaultDefaultValuesModel,
  EffectReportModel,
  EffectRulesModel,
  ItemModel,
} from 'src/app/models/game';
import { ENGLISH, Translator } from 'src/app/shared/i18n/translator';

// Une décimale au plus : le rang d'un plan donne des valeurs comme 11.2%
const percent = (value: number) => `${Math.round(value * 1000) / 10}%`;
const minutes = (seconds: number) => `${Math.round(seconds / 60)} min`;
const decimal = (value: number) => Math.round(value * 100) / 100;

export interface EffectTextOptions {
  // Jour de la ville en cours, pour afficher la valeur actuelle des effets qui en dépendent
  day?: number;
  // Paramètres secondaires des effets, venus du catalogue
  rules?: EffectRulesModel;
  // Rang du plan appliqué aux plafonds ; `effect.value` doit déjà être au rang
  rankMultiplier?: number;
  // Bonus de défense du joueur, appliqué à toutes les valeurs de défense (en partie seulement)
  defenseMultiplier?: number;
  // Langue du texte (LanguageService.translator()), anglais par défaut
  i18n?: Translator;
}

// Effets qui donnent de la défense : le bonus de défense du joueur s'y applique
const DEFENSE_KINDS = new Set<BuildingEffectModel['kind']>([
  'nightlyGrowth',
  'compoundGrowth',
  'buildDayScaling',
  'skillDefense',
  'stockDefense',
  'randomNightDefense',
  'survivalTrophy',
  'otherBuildDefense',
  'surplusDefense',
  'stockToDefense',
  'digDefense',
  'idleNightDefense',
]);

// Description d'un effet de bâtiment spécial (règles dans the-black-hour-api, src/game/city/effects/handlers/).
// Les plafonds suivent le rang du plan et, comme toute défense, le bonus de défense du joueur.
export function buildingEffectText(effect: BuildingEffectModel, options: EffectTextOptions = {}): string {
  const {
    day,
    rules = createDefaultDefaultValuesModel().effect_rules,
    rankMultiplier = 1,
    defenseMultiplier = 1,
    i18n = ENGLISH,
  } = options;
  const text = effectText(i18n, effect, day, rules, rankMultiplier, defenseMultiplier);
  return defenseMultiplier > 1 && DEFENSE_KINDS.has(effect.kind) ? text + i18n.t('effects.defenseBonus') : text;
}

function effectText(
  { t }: Translator,
  effect: BuildingEffectModel,
  day: number | undefined,
  rules: EffectRulesModel,
  rankMultiplier: number,
  defenseMultiplier: number,
): string {
  const { value } = effect;
  const def = (defense: number) => decimal(defense * defenseMultiplier);
  // Effet qui ne peut être qu'entier : le rang d'un plan s'applique au total, arrondi
  const roundedNote = Number.isInteger(value) ? '' : t('effects.rounded');
  switch (effect.kind) {
    case 'nightlyGrowth':
      return t('effects.nightlyGrowth', { def: def(value) });
    case 'compoundGrowth':
      return t('effects.compoundGrowth', {
        pct: percent(value * defenseMultiplier),
        max: def(rules.vault_max_defense_per_level * rankMultiplier),
      });
    case 'buildDayScaling':
      return (
        t('effects.buildDayScaling', { def: def(value) }) +
        (day ? t('effects.buildDayScalingToday', { today: def(value * day) }) : '')
      );
    case 'skillDefense':
      return t('effects.skillDefense', { def: def(value) });
    case 'stockDefense':
      return t('effects.stockDefense', { def: def(value) });
    case 'randomNightDefense':
      return t('effects.randomNightDefense', { def: def(value) });
    case 'survivalTrophy':
      return (
        t('effects.survivalTrophy', { def: def(value), nights: rules.trophy_nights_per_point }) +
        (day
          ? t('effects.survivalTrophyTonight', {
              tonight: def(value * Math.floor(day / rules.trophy_nights_per_point)),
            })
          : '')
      );
    case 'otherBuildDefense':
      return t('effects.otherBuildDefense', { def: def(value) });
    case 'surplusDefense':
      return t('effects.surplusDefense', {
        def: def(value),
        step: rules.carrion_surplus_step,
        max: def(value * rules.carrion_max_steps),
      });
    case 'stockToDefense':
      return t('effects.stockToDefense', { items: rules.larder_items_per_level, def: def(value) });
    case 'digDefense':
      return t('effects.digDefense', { def: def(value) });
    case 'idleNightDefense':
      return t('effects.idleNightDefense', { def: def(value) });
    case 'extraAttackRolls':
      return t('effects.extraAttackRolls', { value }) + roundedNote;
    case 'extraDigItem':
      return t('effects.extraDigItem', { pct: percent(value) });
    case 'buildRefund':
      return t('effects.buildRefund', { pct: percent(value) });
    case 'morningItems':
      return t('effects.morningItems', { value });
    case 'digTimeReduction':
      return t('effects.digTimeReduction', { pct: percent(value) });
    case 'buildTimeReduction':
      return t('effects.buildTimeReduction', { pct: percent(value) });
    case 'repeatBuildTimeReduction':
      return t('effects.repeatBuildTimeReduction', { pct: percent(value) });
    case 'earlierWakeUp':
      return t('effects.earlierWakeUp', { min: minutes(value) });
    case 'sleepRecovery':
      return t('effects.sleepRecovery', {
        pct: percent(value),
        max: minutes(rules.dormitory_max_sleep_bonus_per_level * rankMultiplier),
      });
    case 'extraArchitectOffers':
      return t('effects.extraArchitectOffers', { value }) + roundedNote;
    case 'skillLevelCap':
      return t('effects.skillLevelCap', { value }) + roundedNote;
    case 'nightLearning':
      return t('effects.nightLearning', { pct: percent(value) });
  }
}

function itemsText({ t }: Translator, items: EffectReportModel['itemsGained'], sign: '+' | '−'): string[] {
  return (Object.entries(items) as [ItemModel, number | undefined][])
    .filter(([, quantity]) => quantity)
    .map(([item, quantity]) => `${sign}${quantity} ${t(`items.${item}`)}`);
}

// Résumé de ce qu'un bâtiment spécial a fait : « +4 defense, +1 wood, Digger +1 level »
export function effectReportText(report: EffectReportModel, i18n: Translator = ENGLISH): string {
  return [
    ...(report.defense ? [i18n.t('effects.reportDefense', { count: report.defense })] : []),
    ...itemsText(i18n, report.itemsGained, '+'),
    ...itemsText(i18n, report.itemsSpent, '−'),
    ...report.skillLevels.map((s) =>
      i18n.t('effects.reportSkillLevels', {
        name: i18n.catalog('skill', s.skillId, s.name),
        count: s.levels,
      }),
    ),
  ].join(', ');
}
