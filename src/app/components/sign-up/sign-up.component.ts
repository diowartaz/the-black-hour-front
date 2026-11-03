import { Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroup,
  FormControl,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { RoutesEnum } from '../../models/router';
import { AuthService, SignUpResult } from 'src/app/services/auth/auth.service';
import { SignUpParams } from 'src/app/models/auth';
import { clearPendingReferralCode, normalizeReferralCode, pendingReferralCode } from 'src/app/shared/utils/referral';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

interface SignUpForm {
  email: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  referralCode: FormControl<string>;
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  imports: [TPipe, ReactiveFormsModule, MatProgressSpinnerModule, IconComponent],
  styleUrl: './sign-up.component.scss',
})
export class SignUpComponent implements OnInit {
  private router = inject(Router);
  authService = inject(AuthService);

  private readonly destroyRef = inject(DestroyRef);

  formgroup!: FormGroup<SignUpForm>;

  loading = signal(false);
  emailAlreadyExists = signal(false);
  usernameAlreadyExists = signal(false);

  ngOnInit(): void {
    this.setUpFormGroup();
    this.formgroup.controls.password.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formgroup.controls.confirmPassword.updateValueAndValidity();
    });
  }

  setUpFormGroup(): void {
    this.formgroup = new FormGroup<SignUpForm>({
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')],
      }),
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, this.usernameCustomValidator(), this.lessThan15Characters()],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, this.min8Characters()],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, this.confirmPasswordMatchValidator()],
      }),
      // Facultatif, prérempli par un lien d'invitation (?ref=CODE)
      referralCode: new FormControl(pendingReferralCode(), {
        nonNullable: true,
        validators: [Validators.maxLength(32)],
      }),
    });
  }

  signUp() {
    if (this.loading()) {
      return;
    }
    this.formgroup.markAllAsTouched();
    if (this.formgroup.invalid) {
      return;
    }
    this.loading.set(true);
    const params: SignUpParams = {
      email: this.formgroup.controls.email.value,
      username: this.formgroup.controls.username.value,
      password: this.formgroup.controls.password.value,
    };
    const referralCode = normalizeReferralCode(this.formgroup.controls.referralCode.value);
    if (referralCode) {
      params.referralCode = referralCode;
    }
    this.authService
      .signUp(params)
      .pipe(
        take(1),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (result: SignUpResult) => {
          if ('error' in result) {
            this.emailAlreadyExists.set(result.error.emailAlreadyExists);
            this.usernameAlreadyExists.set(result.error.usernameAlreadyExists);
          } else {
            clearPendingReferralCode();
            this.router.navigate([RoutesEnum.SIGNIN]);
          }
        },
        // les autres erreurs sont affichées par l'errorInterceptor
        error: () => undefined,
      });
  }

  goToSignIn() {
    this.router.navigate([RoutesEnum.SIGNIN]);
  }

  min8Characters(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      const has8Characters = value.length >= 8;

      return !has8Characters ? { min8: true } : null;
    };
  }
  lessThan15Characters(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      const has15CharactersOrless = value.length <= 15;
      return !has15CharactersOrless ? { max15: true } : null;
    };
  }

  usernameCustomValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const username = control.value;
      if (!username) {
        return null;
      }
      const has3Characters = username.length >= 3;
      const usernameValid = has3Characters;
      return !usernameValid ? { notValid: true } : null;
    };
  }

  confirmPasswordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const confirmPassword = control.value;
      if (!confirmPassword) {
        return null;
      }

      const confirmPasswordValid = this.formgroup.controls.password.value == confirmPassword;

      return !confirmPasswordValid ? { noMatchPassword: true } : null;
    };
  }

  fieldHasError(field: keyof SignUpForm): boolean {
    const control = this.formgroup.controls[field];
    return control.touched && control.invalid;
  }
}
