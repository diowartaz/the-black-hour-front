import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { RoutesEnum } from 'src/app/models/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { FeatureListComponent } from 'src/app/shared/components/feature-list/feature-list.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

@Component({
  selector: 'app-home',
  imports: [TPipe, MatProgressSpinnerModule, FeatureListComponent, IconComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  authService = inject(AuthService);

  public readonly router = inject(Router);
  public readonly RoutesEnum = RoutesEnum;

  useYourAccount() {
    this.router.navigate([RoutesEnum.SIGNIN]);
  }
  createAnAccount() {
    this.router.navigate([RoutesEnum.SIGNUP]);
  }
}
