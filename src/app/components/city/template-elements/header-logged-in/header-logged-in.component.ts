import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Params, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { RoutesEnum } from 'src/app/models/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CityService } from 'src/app/services/city/city.service';
import { IconComponent, IconName } from 'src/app/shared/components/icon/icon.component';
import { formatNumber } from 'src/app/shared/utils/format';

interface TopBarLink {
  label: string;
  icon: IconName;
  link: string[];
  queryParams?: Params;
}

// Sous le bouton « ⋯ », aligné à droite, ou au-dessus s'il n'y a pas la place
const MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
];

@Component({
  selector: 'app-header-logged-in',
  imports: [RouterLink, RouterLinkActive, IconComponent, CdkConnectedOverlay, CdkOverlayOrigin],
  templateUrl: './header-logged-in.component.html',
  styleUrls: ['./header-logged-in.component.scss'],
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class HeaderLoggedInComponent {
  public readonly cityService = inject(CityService);
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);
  readonly menuPositions = MENU_POSITIONS;

  money = computed(() => formatNumber(this.cityService.stats().money));

  links = computed<TopBarLink[]>(() => {
    const leaderboard: TopBarLink = { label: 'Leaderboard', icon: 'trophy', link: ['/', RoutesEnum.LEADERBOARD] };
    const guide: TopBarLink = { label: 'Guide', icon: 'bookmark', link: ['/', RoutesEnum.WIKI] };
    if (!this.authService.isConnected()) {
      return [leaderboard, guide];
    }
    return [
      { label: 'Shop', icon: 'sparkle', link: ['/', RoutesEnum.SHOP] },
      { label: 'Deck', icon: 'cards', link: ['/', RoutesEnum.DECK] },
      { label: 'Black Market', icon: 'money', link: ['/', RoutesEnum.MARKET] },
      { label: 'Guild', icon: 'shield', link: ['/', RoutesEnum.GUILD] },
      { label: 'Invite friends', icon: 'user-plus', link: ['/', RoutesEnum.REFERRAL] },
      {
        label: 'Profile',
        icon: 'friends',
        link: ['/', RoutesEnum.PROFIL],
        queryParams: { user_id: this.authService.userId() },
      },
      leaderboard,
      guide,
      { label: 'Settings', icon: 'settings', link: ['/', RoutesEnum.SETTINGS] },
    ];
  });

  menuOpen = signal(false);

  private url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  // Le bouton « ⋯ » s'allume quand la page affichée est rangée dans le menu
  menuLinkActive = computed(() => {
    this.url();
    return this.links().some((link) =>
      this.router.isActive(this.router.createUrlTree(link.link, { queryParams: link.queryParams }), {
        paths: 'subset',
        queryParams: 'subset',
        fragment: 'ignored',
        matrixParams: 'ignored',
      }),
    );
  });

  toggleMenu() {
    this.menuOpen.update((open) => !open);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  // Le clic sur le bouton est déjà traité par toggleMenu() : ne pas fermer pour rouvrir aussitôt
  closeMenuOutside(event: MouseEvent, button: HTMLElement) {
    if (!button.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
