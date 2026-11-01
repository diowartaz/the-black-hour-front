import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Emblème d'un bâtiment : assets/emblems/{id}.svg. Décoratif, le nom est toujours affiché à côté
@Component({
  selector: 'app-building-emblem',
  template: `<img
    [src]="'assets/emblems/' + id() + '.svg'"
    alt=""
    loading="lazy"
    [attr.width]="size()"
    [attr.height]="size()"
  />`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildingEmblemComponent {
  id = input.required<number>();
  size = input(28);
}
