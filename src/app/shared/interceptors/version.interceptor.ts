import { HttpInterceptorFn } from '@angular/common/http';
import { CLIENT_VERSION, CLIENT_VERSION_HEADER } from 'src/app/shared/utils/client-version';
import { environment } from '../../../environments/environment';

// Annonce à l'API la version de contrat de ce build, pour qu'elle refuse un onglet resté ouvert après un changement incompatible
export const versionInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.API_URL)) {
    return next(req.clone({ headers: req.headers.set(CLIENT_VERSION_HEADER, String(CLIENT_VERSION)) }));
  }
  return next(req);
};
