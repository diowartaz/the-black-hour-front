import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { EffectReportModel } from 'src/app/models/game';
import { effectReportText } from '../../utils/building-effects';
import { IconComponent } from '../icon/icon.component';
import { LanguageService } from 'src/app/shared/i18n/language.service';

// Liste de ce que les bâtiments spéciaux ont fait automatiquement (récap de nuit, retour d'une action)
@Component({
  selector: 'app-effect-reports',
  imports: [IconComponent],
  template: `
    <ul class="reports">
      @for (line of lines(); track line.name) {
        <li>
          <app-icon name="sparkle" [size]="13" />
          <span class="name">{{ line.name }}</span>
          <span class="text">{{ line.text }}</span>
        </li>
      }
    </ul>
  `,
  styleUrls: ['./effect-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectReportsComponent {
  private languageService = inject(LanguageService);
  reports = input.required<EffectReportModel[]>();

  lines = computed(() => {
    const i18n = this.languageService.translator();
    return this.reports().map((report) => ({
      name: i18n.catalog('building', report.buildingId, report.name),
      text: effectReportText(report, i18n),
    }));
  });
}
