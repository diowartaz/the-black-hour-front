import { IconName } from '../components/icon/icon.component';

// Couleurs néon associées aux éléments du jeu (ressources, raretés, compétences)

export const ITEM_THEME: Record<string, { color: string }> = {
  metal: { color: 'var(--orange)' },
  patch: { color: 'var(--yellow)' },
  screw: { color: 'var(--cyan)' },
  stone: { color: 'var(--violet-light)' },
  wood: { color: 'var(--green)' },
};

export const RARITY_COLOR: Record<string, string> = {
  base: 'var(--silver)',
  common: 'var(--green)',
  rare: 'var(--cyan)',
  epic: 'var(--violet-light)',
  legendary: 'var(--yellow)',
};

export const SKILL_THEME: Record<number, { icon: IconName; color: string }> = {
  1: { icon: 'dig', color: 'var(--yellow)' },
  2: { icon: 'bolt', color: 'var(--cyan)' },
  3: { icon: 'build', color: 'var(--orange)' },
  4: { icon: 'moon', color: 'var(--violet-light)' },
};

// Les bonus arrivent de l'API avec un emoji comme icône
export const BONUS_THEME: Record<string, { icon: IconName; color: string }> = {
  '💰': { icon: 'money', color: 'var(--yellow)' },
  '🛡️': { icon: 'shield-plus', color: 'var(--cyan)' },
  '👷': { icon: 'build', color: 'var(--orange)' },
  '⛏️': { icon: 'dig', color: 'var(--green)' },
  '🎓': { icon: 'book', color: 'var(--violet-light)' },
};
