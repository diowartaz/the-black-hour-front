import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CLIENT_VERSION, CLIENT_VERSION_HEADER } from 'src/app/shared/utils/client-version';
import { environment } from 'src/environments/environment';
import { versionInterceptor } from './version.interceptor';

describe('versionInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([versionInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("envoie la version du contrat à l'API", () => {
    http.get(environment.API_URL + 'me').subscribe();
    const req = httpTesting.expectOne(environment.API_URL + 'me');
    expect(req.request.headers.get(CLIENT_VERSION_HEADER)).toBe(String(CLIENT_VERSION));
    req.flush({});
  });

  it("ne l'envoie pas aux autres domaines", () => {
    http.get('https://example.com/data').subscribe();
    const req = httpTesting.expectOne('https://example.com/data');
    expect(req.request.headers.has(CLIENT_VERSION_HEADER)).toBeFalse();
    req.flush({});
  });
});
