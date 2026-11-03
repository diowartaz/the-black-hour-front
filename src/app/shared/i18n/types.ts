import { EN } from './en';

export type Language = 'en' | 'fr';

// Même arbre que EN, chaque texte pouvant prendre n'importe quelle valeur : une clé oubliée ou en trop
// dans une autre langue est une erreur de compilation
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };
export type Translations = DeepStrings<typeof EN>;

// Chemins pointés de toutes les feuilles : 'settings.title'
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

type LeafKey = Leaves<typeof EN>;

// Clé plurielle : 'x_one' et 'x_other' s'appellent 'x' avec un paramètre count
type PluralKey = LeafKey extends infer K ? (K extends `${infer B}_other` ? B : never) : never;

export type TranslationKey = LeafKey | PluralKey;

export type TranslationParams = Record<string, string | number>;
