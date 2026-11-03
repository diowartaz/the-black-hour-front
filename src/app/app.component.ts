import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderLoggedInComponent } from './components/city/template-elements/header-logged-in/header-logged-in.component';
import { CityHeaderComponent } from './components/city/template-elements/city-header/city-header.component';
import { CityService } from './services/city/city.service';
import { RedirectionService } from './services/redirection/redirection.service';

import { WakeUpService } from './services/wake-up/wake-up.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { IconComponent } from './shared/components/icon/icon.component';
import { ThemeService } from './services/theme/theme.service';
import { ReturnUrlService } from './services/navigation/return-url.service';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

@Component({
  selector: 'app-root',
  imports: [TPipe, CityHeaderComponent, HeaderLoggedInComponent, RouterOutlet, MatProgressSpinner, IconComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private cityService = inject(CityService);
  private redirectionService = inject(RedirectionService);
  wakeUpService = inject(WakeUpService);
  // Instancié dès le démarrage pour appliquer le thème mémorisé
  private themeService = inject(ThemeService);
  // Instancié dès le démarrage pour suivre l'écran d'origine des pages secondaires
  private returnUrlService = inject(ReturnUrlService);

  ngOnInit(): void {
    this.cityService.loadReferencesBonuses();
  }
}
