import { Component, computed, inject, signal } from '@angular/core';
import { EffectReportModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { effectReportText } from 'src/app/shared/utils/building-effects';
import { NightEvent, NightLogComponent } from '../night-log/night-log.component';
import { RecapRadarComponent } from '../recap-radar/recap-radar.component';
import { BuildingRecapComponent } from './building-recap/building-recap.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

// Couleur du signal d'un effet : défense, puis compétences, puis objets
function effectColor(report: EffectReportModel): string {
  if (report.defense > 0) return 'var(--cyan)';
  if (report.skillLevels.length > 0) return 'var(--green)';
  if (Object.values(report.itemsGained).some((n) => (n ?? 0) > 0)) return 'var(--yellow)';
  return 'var(--violet-light)';
}

@Component({
  selector: 'app-alive-recap',
  imports: [TPipe, RecapRadarComponent, NightLogComponent, BuildingRecapComponent, IconComponent],
  templateUrl: './alive-recap.component.html',
  styleUrls: ['./alive-recap.component.scss'],
})
export class AliveRecapComponent {
  public cityService = inject(CityService);
  private languageService = inject(LanguageService);

  // Index des bâtiments de l'abri de l'architecte choisis par le joueur
  selectedBuildings = signal<ReadonlySet<number>>(new Set());

  architectBuildings = computed(() => this.cityService.city().attackRecap.architect_shelter_buildings);
  nbChoicesAvailable = computed(() => this.architectBuildings().length);
  nbMaxChoices = computed(() => this.cityService.city().attackRecap.building_picks);

  // Effets des bâtiments spéciaux puis découvertes de compétences, dans l'ordre du journal
  nightEvents = computed<NightEvent[]>(() => {
    const city = this.cityService.city();
    const i18n = this.languageService.translator();
    const effects = city.attackRecap.effects.map((report) => ({
      name: i18n.catalog('building', report.buildingId, report.name),
      text: effectReportText(report, i18n),
      color: effectColor(report),
    }));
    const discoveries: NightEvent[] = [];
    for (const [skillId, nbNewLevels] of Object.entries(city.attackRecap.library_discoveries)) {
      const skill = city.skills.find((s) => String(s.id) === skillId);
      if (skill) {
        discoveries.push({
          name: i18n.catalog('skill', skill.id, skill.name),
          text: i18n.t('recap.maxLevel', { from: skill.lvl_max - nbNewLevels, to: skill.lvl_max }),
          color: 'var(--green)',
        });
      }
    }
    return [...effects, ...discoveries];
  });
  blipColors = computed(() => this.nightEvents().map((event) => event.color));

  startDay() {
    this.cityService.startDay([...this.selectedBuildings()].sort((a, b) => a - b));
  }

  toggleBuilding(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const selected = new Set(this.selectedBuildings());

    if (input.checked && selected.size >= this.nbMaxChoices()) {
      input.checked = false; // limite atteinte : on annule le clic
      return;
    }
    if (input.checked) {
      selected.add(index);
    } else {
      selected.delete(index);
    }
    this.selectedBuildings.set(selected);
  }
}
