import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { GuildProfileModel } from 'src/app/models/game';
import { RoutesEnum } from 'src/app/models/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { GameApiService } from 'src/app/services/game-api/game-api.service';
import { GuildService } from 'src/app/services/guild/guild.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { ClassicPageComponent } from '../classic-page.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

// Fiche publique d'une guilde (/guild/:id), consultable sans en être membre ni connecté
@Component({
  selector: 'app-guild-view',
  imports: [FormatNumberPipe, ClassicPageComponent, IconComponent, MatProgressSpinnerModule, RouterLink, DatePipe],
  templateUrl: './guild-view.component.html',
  styleUrls: ['./guild-view.component.scss'],
})
export class GuildViewComponent implements OnInit {
  private readonly api = inject(GameApiService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  guildService = inject(GuildService);

  readonly profilRoute = '/' + RoutesEnum.PROFIL;
  readonly guildRoute = '/' + RoutesEnum.GUILD;

  loading = signal(false);
  guild = signal<GuildProfileModel | null>(null);

  // Guilde du joueur connecté, connue une fois GuildService chargé
  isOwnGuild = computed(() => {
    const own = this.guildService.overview()?.guild;
    return !!own && own.id === this.guild()?.id;
  });
  canJoin = computed(() => {
    const guild = this.guild();
    const overview = this.guildService.overview();
    return !!guild && !!overview && !overview.guild && guild.isPublic && guild.memberCount < guild.maxMembers;
  });

  ngOnInit(): void {
    if (this.authService.isConnected()) {
      this.guildService.load();
    }
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.guild.set(null);
          if (!id) {
            return EMPTY;
          }
          this.loading.set(true);
          return this.api.getGuildProfile(id).pipe(
            // l'erreur est affichée par l'errorInterceptor ; on garde l'écoute des paramètres active
            catchError(() => EMPTY),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((guild) => this.guild.set(guild));
  }

  percent(rate: number): number {
    return Math.round(rate * 100);
  }

  join(guildId: string) {
    this.guildService.join(guildId, () => this.router.navigate([RoutesEnum.GUILD]));
  }
}
