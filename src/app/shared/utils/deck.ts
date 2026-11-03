import { BuildingEffectModel, CatalogBuildingModel, ItemModel, Rarity } from 'src/app/models/game';
import { ENGLISH, Translator } from 'src/app/shared/i18n/translator';

export const ITEMS: ItemModel[] = ['wood', 'metal', 'stone', 'screw', 'patch'];

// De la plus rare à la plus commune
export const RARITIES_DESC: Rarity[] = ['legendary', 'epic', 'rare', 'common'];

// Spécial = plan à effet
export const PLAN_KINDS = ['all', 'normal', 'special'] as const;
export type PlanKind = (typeof PLAN_KINDS)[number];

export interface PlanFilters {
  search: string;
  rarity: Rarity | 'all';
  item: ItemModel | 'all';
  kind: PlanKind;
}

// Minuscules sans accents, pour une recherche tolérante
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

// Filtres de la collection et du Black Market ; la recherche porte sur le nom ou le texte de l'effet,
// dans la langue affichée
export function filterPlans(
  buildings: CatalogBuildingModel[],
  filters: PlanFilters,
  effectText: (effect: BuildingEffectModel) => string,
  nameOf: (building: CatalogBuildingModel) => string = (building) => building.name,
): CatalogBuildingModel[] {
  const query = normalize(filters.search.trim());
  return buildings
    .filter((b) => filters.rarity === 'all' || b.rarity === filters.rarity)
    .filter((b) => filters.item === 'all' || (b.inventory[filters.item] ?? 0) > 0)
    .filter((b) => filters.kind === 'all' || !!b.effect === (filters.kind === 'special'))
    .filter(
      (b) =>
        !query ||
        normalize(nameOf(b)).includes(query) ||
        (!!b.effect && normalize(effectText(b.effect)).includes(query)),
    );
}

const rarityRank = (rarity: Rarity): number => {
  const index = RARITIES_DESC.indexOf(rarity);
  return index === -1 ? RARITIES_DESC.length : index;
};

// Tri par rareté décroissante, puis par nom
export function byRarityDesc(a: CatalogBuildingModel, b: CatalogBuildingModel): number {
  return rarityRank(a.rarity) - rarityRank(b.rarity) || a.name.localeCompare(b.name);
}

export interface DeckRules {
  size: number;
}

// Plans du catalogue correspondant à des ids, dans l'ordre des ids (les ids inconnus sont ignorés)
export function buildingsOf(ids: number[], catalog: CatalogBuildingModel[]): CatalogBuildingModel[] {
  return ids.flatMap((id) => catalog.find((b) => b.id === id) ?? []);
}

// Raisons pour lesquelles un deck ne peut pas être enregistré (vide si le deck est valide) ;
// mêmes règles que validateDeck côté API
export function deckProblems(
  deck: number[],
  collection: Record<number, number>,
  rules: DeckRules,
  { t }: Translator = ENGLISH,
): string[] {
  const problems: string[] = [];
  if (deck.length < rules.size) {
    problems.push(t('deck.moreNeeded', { count: rules.size - deck.length }));
  } else if (deck.length > rules.size) {
    problems.push(t('deck.tooMany', { count: deck.length - rules.size }));
  }
  if (deck.some((id) => !collection[id])) {
    problems.push(t('deck.notInCollection'));
  }
  return problems;
}

// Part de chaque ressource dans le coût total des plans construits jusqu'à leur niveau max (0 à 1).
// Les fouilles donnant chaque ressource avec la même probabilité, un deck équilibré est proche de 20 % partout.
export function resourceShares(buildings: CatalogBuildingModel[]): Record<ItemModel, number> {
  const totals = Object.fromEntries(ITEMS.map((item) => [item, 0])) as Record<ItemModel, number>;
  for (const building of buildings) {
    for (const item of ITEMS) {
      totals[item] += (building.inventory[item] ?? 0) * building.lvl_max;
    }
  }
  const sum = ITEMS.reduce((total, item) => total + totals[item], 0);
  return Object.fromEntries(ITEMS.map((item) => [item, sum ? totals[item] / sum : 0])) as Record<ItemModel, number>;
}

// Écart total des parts de ressources à une répartition parfaite (20 % chacune) : 0 = équilibré
function imbalance(buildings: CatalogBuildingModel[]): number {
  const shares = resourceShares(buildings);
  return ITEMS.reduce((total, item) => total + Math.abs(shares[item] - 1 / ITEMS.length), 0);
}

// Complète le deck jusqu'à `size` plans parmi ceux possédés, un par un : le plus rare d'abord,
// puis à rareté égale celui qui équilibre le mieux les ressources, puis le plus défensif.
// Les bâtiments spéciaux (à effet) ne sont jamais ajoutés : leur valeur dépend du reste du deck,
// c'est au joueur de les choisir
export function autocompleteDeck(
  deck: number[],
  collection: Record<number, number>,
  catalog: CatalogBuildingModel[],
  size: number,
): number[] {
  const result = [...deck];
  const chosen = buildingsOf(result, catalog);
  const candidates = catalog.filter((b) => collection[b.id] && !b.effect && !result.includes(b.id));
  while (result.length < size && candidates.length > 0) {
    const scored = candidates.map((b) => ({ b, imbalance: imbalance([...chosen, b]) }));
    scored.sort(
      (x, y) =>
        rarityRank(x.b.rarity) - rarityRank(y.b.rarity) ||
        x.imbalance - y.imbalance ||
        y.b.defense - x.b.defense ||
        x.b.id - y.b.id,
    );
    const best = scored[0].b;
    result.push(best.id);
    chosen.push(best);
    candidates.splice(candidates.indexOf(best), 1);
  }
  return result;
}

export function rarityCounts(buildings: CatalogBuildingModel[]): Partial<Record<Rarity, number>> {
  const counts: Partial<Record<Rarity, number>> = {};
  for (const building of buildings) {
    counts[building.rarity] = (counts[building.rarity] ?? 0) + 1;
  }
  return counts;
}
