import { LocalDatePipe } from 'src/app/shared/i18n/local-date.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { GuildMemberModel } from 'src/app/models/game';
import { RoutesEnum } from 'src/app/models/router';
import { GuildService } from 'src/app/services/guild/guild.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { ClassicPageComponent } from '../classic-page.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { LanguageService } from 'src/app/shared/i18n/language.service';

// Bornes du nom, reprises de l'API (GUILD_NAME_MIN_LENGTH / GUILD_NAME_MAX_LENGTH)
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 24;

@Component({
  selector: 'app-guild',
  imports: [
    TPipe,
    FormatNumberPipe,
    ClassicPageComponent,
    IconComponent,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    RouterLink,
    LocalDatePipe,
  ],
  templateUrl: './guild.component.html',
  styleUrls: ['./guild.component.scss'],
})
export class GuildComponent implements OnInit {
  guildService = inject(GuildService);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);

  overview = this.guildService.overview;
  nameMaxLength = NAME_MAX_LENGTH;
  readonly guildRoute = RoutesEnum.GUILD;

  // FormGroup nécessaire : sans [formGroup], le <form> n'a pas de ngSubmit et l'envoi natif recharge la page
  createForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(NAME_MIN_LENGTH), Validators.maxLength(NAME_MAX_LENGTH)],
    }),
  });
  createPublic = signal(true);
  inviteForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  searchForm = new FormGroup({ text: new FormControl('', { nonNullable: true }) });

  ngOnInit(): void {
    this.guildService.load();
  }

  percent(rate: number): number {
    return Math.round(rate * 100);
  }

  create() {
    const name = this.createForm.controls.name;
    name.markAsTouched();
    if (this.createForm.invalid) {
      return;
    }
    this.guildService.create(name.value.trim(), this.createPublic(), () => this.createForm.reset());
  }

  invite() {
    const username = this.inviteForm.controls.username;
    username.markAsTouched();
    if (!username.value.trim()) {
      return;
    }
    this.guildService.invite(username.value.trim(), () => this.inviteForm.reset());
  }

  search() {
    this.guildService.search(this.searchForm.controls.text.value.trim());
  }

  kick(member: GuildMemberModel) {
    if (window.confirm(this.languageService.t('guild.confirmKick', { name: member.username }))) {
      this.guildService.kick(member.playerId);
    }
  }

  leave(isLeader: boolean) {
    const message = this.languageService.t(isLeader ? 'guild.confirmLeaveLeader' : 'guild.confirmLeave');
    if (window.confirm(message)) {
      this.guildService.leave();
    }
  }

  goToProfil(user_id: string) {
    this.router.navigate([RoutesEnum.PROFIL], { queryParams: { user_id } });
  }
}
