import { Component, Input, inject } from '@angular/core';
import { ReturnUrlService } from 'src/app/services/navigation/return-url.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

@Component({
  selector: 'app-classic-page',
  imports: [TPipe, IconComponent],
  templateUrl: './classic-page.component.html',
  styleUrls: ['./classic-page.component.scss'],
})
export class ClassicPageComponent {
  private returnUrlService = inject(ReturnUrlService);

  @Input() title = '';
  @Input() subtitle = '';
  // Couleur du halo du titre
  @Input() glow = 'var(--pink)';

  // Retour direct à l'écran d'origine, sans repasser par les pages secondaires enchaînées
  goBack() {
    this.returnUrlService.back();
  }
}
