import { LocalDatePipe } from 'src/app/shared/i18n/local-date.pipe';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RefereeModel } from 'src/app/models/game';
import { RoutesEnum } from 'src/app/models/router';
import { ReferralService } from 'src/app/services/referral/referral.service';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { invitationLink, normalizeReferralCode, pendingReferralCode } from 'src/app/shared/utils/referral';
import { ClassicPageComponent } from '../classic-page.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';
import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { LanguageService } from 'src/app/shared/i18n/language.service';

@Component({
  selector: 'app-referral',
  imports: [
    TPipe,
    FormatNumberPipe,
    ClassicPageComponent,
    IconComponent,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    LocalDatePipe,
  ],
  templateUrl: './referral.component.html',
  styleUrls: ['./referral.component.scss'],
})
export class ReferralComponent implements OnInit {
  referralService = inject(ReferralService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly languageService = inject(LanguageService);

  referral = this.referralService.referral;
  // Prérempli par un lien d'invitation reçu avant d'avoir un compte. Le FormGroup est nécessaire :
  // sans [formGroup], le <form> n'a pas de ngSubmit et l'envoi natif recharge la page
  sponsorForm = new FormGroup({
    code: new FormControl(pendingReferralCode(), { nonNullable: true, validators: [Validators.required] }),
  });
  sponsorCode = this.sponsorForm.controls.code;
  copied = signal(false);

  link = computed(() => {
    const referral = this.referral();
    return referral ? invitationLink(referral.code) : '';
  });
  dividendPercent = computed(() => Math.round((this.referral()?.dividendRate ?? 0) * 100));
  totalEarnings = computed(() => (this.referral()?.referees ?? []).reduce((sum, r) => sum + r.earnings, 0));

  ngOnInit(): void {
    this.referralService.load();
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.link());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.snackBar.open(this.languageService.t('errors.copyFailed'), this.languageService.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  regenerateCode() {
    const confirmed = window.confirm(this.languageService.t('referral.confirmRegenerate'));
    if (confirmed) {
      this.referralService.regenerateCode();
    }
  }

  removeReferee(referee: RefereeModel) {
    const confirmed = window.confirm(this.languageService.t('referral.confirmRemove', { name: referee.username }));
    if (confirmed) {
      this.referralService.removeReferee(referee.playerId);
    }
  }

  setSponsor() {
    this.sponsorCode.markAsTouched();
    const code = normalizeReferralCode(this.sponsorCode.value);
    if (!code) {
      return;
    }
    this.referralService.setSponsor(code);
  }

  goToProfil(user_id: string) {
    this.router.navigate([RoutesEnum.PROFIL], { queryParams: { user_id } });
  }
}
