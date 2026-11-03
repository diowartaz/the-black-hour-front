import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { PLAY_ROUTES, PlayRoute, readPlayRoute, RoutesEnum } from 'src/app/models/router';
import { CityService } from 'src/app/services/city/city.service';
import { IconComponent, IconName } from 'src/app/shared/components/icon/icon.component';
import { StorageKey, writeStorage } from 'src/app/shared/utils/storage';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { TranslationKey } from 'src/app/shared/i18n/types';

@Component({
  selector: 'app-city-footer',
  imports: [TPipe, IconComponent],
  templateUrl: './city-footer.component.html',
  styleUrls: ['./city-footer.component.scss'],
})
export class CityFooterComponent {
  private router = inject(Router);
  cityService = inject(CityService);

  // Onglet actif déduit de l'URL (/play/<onglet>)
  private url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  content = computed<PlayRoute>(() => {
    const segment = this.url().split(/[?#]/)[0].split('/')[2] as PlayRoute;
    return PLAY_ROUTES.includes(segment) ? segment : readPlayRoute();
  });

  readonly tabs: { route: PlayRoute; label: TranslationKey; icon: IconName; color: string }[] = [
    { route: 'dig', label: 'footer.dig', icon: 'dig', color: 'var(--yellow)' },
    { route: 'learn', label: 'footer.learn', icon: 'book', color: 'var(--cyan)' },
    { route: 'build', label: 'footer.build', icon: 'build', color: 'var(--orange)' },
  ];

  changeContent(content: PlayRoute) {
    writeStorage(StorageKey.PLAY_ROUTE, content);
    this.router.navigate([RoutesEnum.PLAY, content]);
  }
}
