import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// Tracés SVG (viewBox 24×24, trait currentColor) repris des maquettes néon
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  money:
    '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9c0-1.2-1.3-2-3-2s-3 .8-3 2 1.3 1.8 3 2.2 3 1 3 2.3-1.3 2-3 2-3-.8-3-2"/>',
  friends: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-6"/>',
  user: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.8a7 7 0 0 1 11.6 0"/>',
  'user-plus': '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6"/>',
  trophy:
    '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  book: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
  bookmark: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v18H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M10 3v8l2.5-2 2.5 2V3"/>',
  cards: '<rect x="3" y="7" width="12" height="15" rx="2"/><path d="M8 3.5h11a2 2 0 0 1 2 2V18"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6l2-8H6.3"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  recycle: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2l1.8 2.6 3.1-.7.7 3.1L20.2 9 19 12l1.2 3-2.6 2-.7 3.1-3.1-.7L12 22l-1.8-2.6-3.1.7-.7-3.1L3.8 15 5 12 3.8 9l2.6-2 .7-3.1 3.1.7z"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  'shield-check': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  'shield-plus': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 8v8M8 12h8"/>',
  zombie:
    '<path d="M5 10a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3v4H8v-4a3 3 0 0 1-3-3z"/><path d="M8 9l2 2M10 9l-2 2"/><circle cx="15" cy="10" r="1.2"/><path d="M9 14h6M11 14v1.5M13 14v1.5"/>',
  skull:
    '<path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 20v-2M14 20v-2"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  dig: '<path d="M17 3l4 4M19 5l-8.5 8.5"/><path d="M8 11l5 5-4 4c-1.5 1.5-4 1.5-5 .5s-1-3.5.5-5z"/>',
  build:
    '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9.3h18M3 14.6h18M12 4v5.3M7.5 9.3v5.3M16.5 9.3v5.3M12 14.6V20"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  sliders: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="3"/><circle cx="8" cy="17" r="3"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  sparkle: '<path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off':
    '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 12h.01"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>',
  rocket:
    '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4.5-9 12-9 0 7.5-5 11-9 12z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
  ranked: '<path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  google:
    '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7z"/><path d="M12 21c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-2 .9-3.2.9-2.5 0-4.6-1.7-5.3-3.9H3.5v2.5A9.5 9.5 0 0 0 12 21z"/><path d="M6.7 13.3a5.7 5.7 0 0 1 0-3.6V7.2H3.5a9.5 9.5 0 0 0 0 8.6z"/><path d="M12 6.4c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.5 9.5 0 0 0 3.5 7.2l3.2 2.5C7.4 7.6 9.5 6.4 12 6.4z"/>',
  // Silhouette au trait d'après Tabler Icons « brand-discord » (licence MIT)
  discord:
    '<path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0-2 0M14 12a1 1 0 1 0 2 0a1 1 0 0 0-2 0"/><path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.8-1.7 3.5-3 .7-1.7.5-5.8-1.5-11.5-1.5-1-3-1.3-4.5-1.5l-1 1.9a12 12 0 0 0-4 0l-1-1.9c-1.5.2-3 .5-4.5 1.5-2 5.7-2.2 9.8-1.5 11.5.7 1.3 2 3 3.5 3 .5 0 2-2 2-3"/><path d="M7 16.5c3.5 1 6.5 1 10 0"/>',
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  template: `<svg
    [attr.width]="size()"
    [attr.height]="size()"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    [attr.stroke-width]="stroke()"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    [innerHTML]="paths()"
  ></svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);

  name = input.required<IconName>();
  size = input(20);
  stroke = input(2);

  // Les tracés sont des constantes internes : on peut les déclarer sûrs
  paths = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()] ?? ''));
}
