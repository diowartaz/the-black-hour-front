import { DatePipe } from '@angular/common';
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

@Component({
  selector: 'app-referral',
  imports: [
    FormatNumberPipe,
    ClassicPageComponent,
    IconComponent,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './referral.component.html',
  styleUrls: ['./referral.component.scss'],
})
export class ReferralComponent implements OnInit {
  referralService = inject(ReferralService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

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
      this.snackBar.open('Copy failed, select the link to copy it', 'OK', { duration: 4000 });
    }
  }

  regenerateCode() {
    const confirmed = window.confirm(
      'Generate a new code? Your current code and the invite links you already shared will stop working. ' +
        'Your referees stay with you.',
    );
    if (confirmed) {
      this.referralService.regenerateCode();
    }
  }

  removeReferee(referee: RefereeModel) {
    const confirmed = window.confirm(
      `Remove ${referee.username} from your referees? They can join you again with your current code, ` +
        'unless you generate a new one.',
    );
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
