import { CATALOG_FR, CatalogKind } from './catalog.fr';
import { EN } from './en';
import { FR } from './fr';
import { Language, TranslationKey, TranslationParams, Translations } from './types';

// Traduction dans une langue donnée, utilisable dans les fonctions pures de shared/utils.
// Dans un composant, passer LanguageService.translator() : il change avec la langue choisie.
export interface Translator {
  language: Language;
  t(key: TranslationKey, params?: TranslationParams): string;
  // Nom d'un élément du catalogue, l'anglais de l'API en repli
  catalog(kind: CatalogKind, id: number, english: string): string;
}

const DICTIONARIES: Record<Language, Translations> = { en: EN, fr: FR };

// Aplatit un dictionnaire en { 'settings.title': 'Settings' }
function flatten(tree: object, prefix = '', out = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') {
      out.set(prefix + key, value);
    } else {
      flatten(value, `${prefix}${key}.`, out);
    }
  }
  return out;
}

const FLAT: Record<Language, Map<string, string>> = { en: flatten(DICTIONARIES.en), fr: flatten(DICTIONARIES.fr) };

const PLURAL_RULES: Record<Language, Intl.PluralRules> = {
  en: new Intl.PluralRules('en'),
  fr: new Intl.PluralRules('fr'),
};

export function interpolate(text: string, params?: TranslationParams): string {
  return params ? text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match)) : text;
}

function lookup(language: Language, key: string, params?: TranslationParams): string | undefined {
  const flat = FLAT[language];
  const text = flat.get(key);
  if (text !== undefined || !params || typeof params['count'] !== 'number') {
    return text;
  }
  // Pluriel : 'x' devient 'x_one' ou 'x_other' selon count
  const category = PLURAL_RULES[language].select(params['count']) === 'one' ? 'one' : 'other';
  return flat.get(`${key}_${category}`) ?? flat.get(`${key}_other`);
}

export function translate(language: Language, key: string, params?: TranslationParams): string {
  const text = lookup(language, key, params) ?? lookup('en', key, params);
  if (text === undefined) {
    console.warn(`Missing translation: ${key}`);
  }
  return interpolate(text ?? key, params);
}

export function hasTranslation(key: string): boolean {
  return FLAT.en.has(key);
}

export function translator(language: Language): Translator {
  return {
    language,
    t: (key, params) => translate(language, key, params),
    catalog: (kind, id, english) => (language === 'fr' ? (CATALOG_FR[kind][id] ?? english) : english),
  };
}

export const ENGLISH = translator('en');
