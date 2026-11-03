import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from 'src/app/services/auth/auth.service';

import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let authService: AuthService;
  let tempAccount: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    tempAccount = signal(true);
    (authService as any).tempAccount = tempAccount;
    spyOn(authService, 'upgradeGuest');

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function form(): HTMLFormElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('form.upgrade-card');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('affiche le formulaire de conversion seulement pour un compte invité', async () => {
    expect(form()).not.toBeNull();

    tempAccount.set(false);
    await fixture.whenStable();
    expect(form()).toBeNull();
  });

  it("n'envoie rien si le formulaire est invalide", () => {
    component.upgradeForm.setValue({
      email: 'player@example.com',
      username: '',
      password: 'password1',
      confirmPassword: 'other-password',
    });
    component.upgradeAccount();

    expect(authService.upgradeGuest).not.toHaveBeenCalled();
    expect(component.passwordsMismatch()).toBeTrue();
  });

  it('envoie email et mot de passe, sans pseudo vide', () => {
    component.upgradeForm.setValue({
      email: 'player@example.com',
      username: '',
      password: 'password1',
      confirmPassword: 'password1',
    });
    component.upgradeAccount();

    expect(authService.upgradeGuest).toHaveBeenCalledWith({ email: 'player@example.com', password: 'password1' });
  });

  it('transmet le pseudo choisi', () => {
    component.upgradeForm.setValue({
      email: 'player@example.com',
      username: 'new_name',
      password: 'password1',
      confirmPassword: 'password1',
    });
    component.upgradeAccount();

    expect(authService.upgradeGuest).toHaveBeenCalledWith({
      email: 'player@example.com',
      username: 'new_name',
      password: 'password1',
    });
  });

  it('change le thème appliqué à la page', async () => {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.theme-option:not(.language-option)',
    );
    expect(buttons.length).toBe(component.themes.length);

    buttons[2].click();
    await fixture.whenStable();
    expect(document.documentElement.dataset['theme']).toBe(component.themes[2].id);
    expect(buttons[2].classList).toContain('active');

    component.themeService.setTheme('neon');
    await fixture.whenStable();
  });

  it('passe l’interface en français sans recharger la page', async () => {
    const page = fixture.nativeElement as HTMLElement;
    const buttons = page.querySelectorAll<HTMLButtonElement>('.language-option');
    expect(buttons.length).toBe(component.languages.length);

    buttons[1].click();
    await fixture.whenStable();
    expect(page.querySelector('h1')?.textContent).toContain('Paramètres');
    expect(buttons[1].classList).toContain('active');

    component.languageService.setLanguage('en');
    await fixture.whenStable();
  });
});
