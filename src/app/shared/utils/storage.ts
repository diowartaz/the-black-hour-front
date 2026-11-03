// Accès centralisé au localStorage : toutes les clés persistées par l'application sont listées ici
export enum StorageKey {
  TOKEN = 'token',
  LOGIN = 'login',
  PLAY_ROUTE = 'play-route',
  DIG_MODE = 'dig-mode',
  THEME = 'theme',
  LANGUAGE = 'language',
  // Code de parrainage reçu par un lien d'invitation, en attente de l'inscription ou du choix du parrain
  REFERRAL_CODE = 'referral-code',
}

export function readStorage(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // stockage indisponible (navigation privée, quota) : on ignore
  }
}

export function removeStorage(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // stockage indisponible : rien à supprimer
  }
}
