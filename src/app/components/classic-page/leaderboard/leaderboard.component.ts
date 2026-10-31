import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LeaderboardBoard, LeaderboardElement } from 'src/app/models/game';
import { RoutesEnum } from 'src/app/models/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LeaderboardService } from 'src/app/services/leaderboard/leaderboard.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { formatNumber } from 'src/app/shared/utils/format';
import { pageWindow } from 'src/app/shared/utils/pagination';
import { ClassicPageComponent } from '../classic-page.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

@Component({
  selector: 'app-leaderboard',
  imports: [FormatNumberPipe, ClassicPageComponent, IconComponent],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  leaderboardService = inject(LeaderboardService);
  authService = inject(AuthService);

  // Onglet et page viennent de l'URL (?ranked=true&page=3) : un lien ou un retour arrière restaure la vue
  private queryParams = toSignal(this.route.queryParamMap);
  ranked = computed(() => this.queryParams()?.get('ranked') === 'true');
  private board = computed<LeaderboardBoard>(() => (this.ranked() ? 'ranked' : 'best-day'));
  currentPage = computed(() => {
    const page = Number(this.queryParams()?.get('page'));
    return Number.isInteger(page) && page >= 1 ? page : 1;
  });

  private data = this.leaderboardService.page;
  // Faux tant qu'aucune page n'a été reçue (chargement ou erreur) : ne pas annoncer un classement vide
  loaded = computed(() => this.data() !== null);
  leaderboard = computed(() => this.data()?.entries ?? []);
  total = computed(() => this.data()?.total ?? 0);
  lastPage = computed(() => Math.ceil(this.total() / (this.data()?.page_size ?? 1)));
  pages = computed(() => pageWindow(this.currentPage(), this.lastPage()));

  // Podium affiché dans l'ordre 2 - 1 - 3, en première page seulement
  podium = computed(() => {
    if (this.currentPage() !== 1) {
      return [];
    }
    const [first, second, third] = this.leaderboard();
    return [second, first, third].filter((user): user is LeaderboardElement => !!user);
  });
  others = computed(() => (this.currentPage() === 1 ? this.leaderboard().slice(3) : this.leaderboard()));
  myPosition = computed(() => this.leaderboardService.positions()[this.board()]);
  // Ligne du joueur connecté si elle figure sur la page affichée (pour son score)
  me = computed(() => this.leaderboard().find((user) => user.user_id === this.authService.userId()));

  // Jauges relatives au premier du classement, quelle que soit la page
  private bestScore = computed(() => {
    const leader = this.data()?.leader;
    return Math.max(1, leader ? this.rawScore(leader) : 0);
  });

  constructor() {
    // untracked : seuls l'onglet, la page et la connexion relancent les requêtes, pas les signaux de chargement
    effect(() => {
      const [board, page] = [this.board(), this.currentPage()];
      untracked(() => this.leaderboardService.loadPage(board, page));
    });
    effect(() => {
      const board = this.board();
      if (this.authService.isConnected()) {
        untracked(() => this.leaderboardService.loadMyPosition(board));
      }
    });
  }

  private rawScore(user: LeaderboardElement): number {
    return this.ranked() ? user.ranked_points : user.personal_best_day;
  }

  scoreOf(user: LeaderboardElement): string {
    return this.ranked()
      ? `${formatNumber(user.ranked_points)} pts`
      : `${user.personal_best_day} d · ${formatNumber(user.personal_best_zb)}`;
  }

  ratioOf(user: LeaderboardElement): number {
    return Math.round((this.rawScore(user) / this.bestScore()) * 100);
  }

  goToProfil(user_id: string) {
    this.router.navigate([RoutesEnum.PROFIL], { queryParams: { user_id } });
  }

  changeRanked(ranked: boolean): void {
    this.navigate({ ranked, page: null });
  }

  goToPage(page: number | null | undefined): void {
    if (page && page !== this.currentPage()) {
      this.navigate({ page: page === 1 ? null : page });
    }
  }

  private navigate(queryParams: Record<string, unknown>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
