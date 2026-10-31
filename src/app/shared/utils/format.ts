const fullFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

// Espace insécable : un nombre n'est jamais coupé en fin de ligne (l'espace fine ne se voit pas en Orbitron)
const GROUP_SEPARATOR = ' ';

/** Nombre complet : 950, 2 575, 23 400, 4 565 787 867, 12.5 */
export function formatNumber(value: number): string {
  return fullFormat.format(value).replaceAll(',', GROUP_SEPARATOR);
}
