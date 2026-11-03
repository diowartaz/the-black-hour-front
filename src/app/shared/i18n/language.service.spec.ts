import { TestBed } from '@angular/core/testing';
import { readStorage, removeStorage, StorageKey, writeStorage } from 'src/app/shared/utils/storage';
import { EN } from './en';
import { FR } from './fr';
import { LanguageService } from './language.service';
import { translate, translator } from './translator';

// Hors de tout describe : s'applique à tous les tests de l'application. Les specs vérifient les textes anglais,
// quelle que soit la langue du navigateur qui les lance et le choix enregistré par un test précédent.
beforeEach(() => {
  removeStorage(StorageKey.LANGUAGE);
  spyOnProperty(navigator, 'language').and.returnValue('en-US');
});

// Clés de toutes les feuilles d'un dictionnaire
function keys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : keys(value, `${prefix}${key}.`),
  );
}

describe('LanguageService', () => {
  it('prend la langue du navigateur à la première visite', () => {
    (Object.getOwnPropertyDescriptor(navigator, 'language')?.get as jasmine.Spy).and.returnValue('fr-FR');
    expect(TestBed.inject(LanguageService).language()).toBe('fr');
  });

  it('garde le choix du joueur plutôt que la langue du navigateur', () => {
    writeStorage(StorageKey.LANGUAGE, 'fr');
    expect(TestBed.inject(LanguageService).language()).toBe('fr');
  });

  it('mémorise la langue choisie et la met sur <html lang>', () => {
    const service = TestBed.inject(LanguageService);
    service.setLanguage('fr');
    TestBed.tick();
    expect(readStorage(StorageKey.LANGUAGE)).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(service.t('settings.title')).toBe('Paramètres');
  });
});

describe('translate', () => {
  it('remplace les paramètres', () => {
    expect(translate('en', 'guild.kickName', { name: 'Zed' })).toBe('Kick Zed');
  });

  it('choisit la forme du pluriel selon count, 0 et 1 au singulier en français', () => {
    expect(translate('en', 'deck.unsaved', { count: 1 })).toBe('1 unsaved change');
    expect(translate('en', 'deck.unsaved', { count: 0 })).toBe('0 unsaved changes');
    expect(translate('fr', 'deck.unsaved', { count: 0 })).toBe('0 modification non enregistrée');
    expect(translate('fr', 'deck.unsaved', { count: 2 })).toBe('2 modifications non enregistrées');
  });

  it('traduit le catalogue par id et garde le nom anglais de l’API pour un id inconnu', () => {
    expect(translator('fr').catalog('building', 1, 'Scrap Fence')).toBe('Clôture de ferraille');
    expect(translator('fr').catalog('building', 9999, 'New Thing')).toBe('New Thing');
    expect(translator('en').catalog('building', 1, 'Scrap Fence')).toBe('Scrap Fence');
  });

  it('a les mêmes paramètres dans les deux langues', () => {
    const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of keys(EN)) {
      const en = translate('en', key);
      const fr = keys(FR).includes(key) ? translate('fr', key) : en;
      expect(params(fr)).withContext(key).toEqual(params(en));
    }
  });
});
