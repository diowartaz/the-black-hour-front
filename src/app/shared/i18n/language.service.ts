import { Injectable, computed, effect, signal } from '@angular/core';
import { readStorage, StorageKey, writeStorage } from 'src/app/shared/utils/storage';
import { translate, translator } from './translator';
import { Language, TranslationKey, TranslationParams } from './types';

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
];

function isLanguage(value: string | null): value is Language {
  return LANGUAGES.some((l) => l.id === value);
}

// Langue du navigateur à la première visite : français pour fr-*, anglais sinon
function browserLanguage(): Language {
  try {
    return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

// Langue choisie par le joueur, mémorisée dans le navigateur et appliquée sur <html lang>.
// t() et translator() lisent le signal : un template ou un computed qui les appelle suit le changement de langue.
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private stored = readStorage(StorageKey.LANGUAGE);
  readonly language = signal<Language>(isLanguage(this.stored) ? this.stored : browserLanguage());
  readonly translator = computed(() => translator(this.language()));

  constructor() {
    effect(() => {
      document.documentElement.lang = this.language();
      writeStorage(StorageKey.LANGUAGE, this.language());
    });
  }

  setLanguage(language: Language) {
    this.language.set(language);
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    return translate(this.language(), key, params);
  }
}
