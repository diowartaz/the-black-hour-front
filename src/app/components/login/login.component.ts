import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SignInParams } from '../../models/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { RoutesEnum } from '../../models/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

interface SignInForm {
  login: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  imports: [TPipe, ReactiveFormsModule, MatProgressSpinnerModule, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);
  formgroup!: FormGroup<SignInForm>;
  loading = signal(false);
  invalidAuthentification = signal(false);

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToFormChanges();
  }

  private initializeForm(): void {
    // L'email technique d'un compte invité (<uuid>@temp.invalid) n'est pas un identifiant à proposer
    const savedLogin = this.authService.tempAccount() ? '' : (this.authService.email() ?? '');
    this.formgroup = new FormGroup<SignInForm>({
      login: new FormControl(savedLogin, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  private subscribeToFormChanges(): void {
    this.formgroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.invalidAuthentification.set(false);
    });
  }

  login() {
    if (this.loading()) {
      return;
    }
    this.formgroup.markAllAsTouched();
    if (this.formgroup.invalid) {
      this.invalidAuthentification.set(true);
      return;
    }
    this.loading.set(true);
    const params: SignInParams = {
      login: this.formgroup.controls.login.value,
      password: this.formgroup.controls.password.value,
    };
    this.authService
      .signIn(params)
      .pipe(
        take(1),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: () => this.invalidAuthentification.set(false),
        // 401/400 : identifiants refusés ; les autres erreurs sont déjà signalées par l'errorInterceptor
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 400) {
            this.invalidAuthentification.set(true);
          }
        },
      });
  }

  signUp() {
    this.router.navigate([RoutesEnum.SIGNUP]);
  }

  fieldHasError(field: keyof SignInForm): boolean {
    const control = this.formgroup.controls[field];
    return control.touched && control.invalid;
  }
}
