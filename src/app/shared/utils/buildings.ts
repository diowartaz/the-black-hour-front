import { AdvancedBuildingModel, CityModel, DefaultValuesModel, Rarity } from 'src/app/models/game';
import { contains } from './inventory';
import { formatTimeToString } from './time';

const rarityOrder: Record<Rarity, number> = {
  base: 1,
  legendary: 2,
  epic: 3,
  rare: 4,
  common: 5,
};

export function calculateAdvancedBuildings(
  city: CityModel,
  defaultValues: DefaultValuesModel,
): AdvancedBuildingModel[] {
  const advancedBuildings: AdvancedBuildingModel[] = [];
  for (const building of city.buildings) {
    // Durée calculée par le serveur : vitesses, bonus et bâtiments spéciaux compris
    const timeRequired = building.next_level_duration;

    const advancedBuilding: AdvancedBuildingModel = {
      ...building,
      enoughRessources: contains(city.inventory, building.inventory || {}),
      timeString: formatTimeToString(timeRequired),
      enoughLvlMax: building.lvl < building.lvl_max,
      expirationCityTime: defaultValues.day_end_time - timeRequired,
    };
    advancedBuildings.push(advancedBuilding);
  }

  // Les bâtiments terminés restent affichés en fin de liste : ils peuvent revenir dans la pioche
  advancedBuildings.sort((a, b) => {
    if (a.enoughLvlMax !== b.enoughLvlMax) {
      return a.enoughLvlMax ? -1 : 1;
    }
    const resA = a.enoughRessources ? 1 : 0;
    const resB = b.enoughRessources ? 1 : 0;

    if (resA !== resB) {
      return resB - resA;
    }
    if (a.expirationCityTime !== b.expirationCityTime) {
      return a.expirationCityTime - b.expirationCityTime;
    }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });
  return advancedBuildings;
}
