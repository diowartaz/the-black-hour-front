import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { GameApiService } from 'src/app/services/game-api/game-api.service';
import { GameComponent } from './game/game.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClassicPageComponent } from '../classic-page.component';
import { ProfilModel } from 'src/app/models/game';
import { RoutesEnum } from 'src/app/models/router';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { XPToLVLandXP } from 'src/app/shared/utils/xp';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

@Component({
  selector: 'app-profil',
  imports: [FormatNumberPipe, GameComponent, MatProgressSpinnerModule, ClassicPageComponent, IconComponent, RouterLink],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss'],
})
export class ProfilComponent implements OnInit {
  private api = inject(GameApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly guildRoute = RoutesEnum.GUILD;

  getProfilLoading = signal(false);
  profil = signal<ProfilModel | null>(null);

  level = computed(() => XPToLVLandXP(this.profil()?.xp ?? 0));

  // Historique du plus récent au plus ancien
  matchHistory = computed(() => [...(this.profil()?.match_history ?? [])].reverse());

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const id = params.get('user_id') || this.authService.userId();
          this.profil.set(null);
          if (!id) {
            return EMPTY;
          }
          this.getProfilLoading.set(true);
          return this.api.getProfil(id).pipe(
            // l'erreur est affichée par l'errorInterceptor ; on garde l'écoute des paramètres active
            catchError(() => EMPTY),
            finalize(() => this.getProfilLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profil) => this.profil.set(profil));
  }
}
