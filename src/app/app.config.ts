import { ApplicationConfig, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { errorInterceptor } from './shared/interceptors/error.interceptor';
import { versionInterceptor } from './shared/interceptors/version.interceptor';
import { wakeUpInterceptor } from './shared/interceptors/wake-up.interceptor';
import { captureReferralCode } from './shared/utils/referral';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // Avant la première navigation : les guards peuvent rediriger et perdre le paramètre ?ref=
    provideAppInitializer(captureReferralCode),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, versionInterceptor, wakeUpInterceptor, errorInterceptor])),
  ],
};
