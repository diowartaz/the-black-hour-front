import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanFiltersComponent } from './plan-filters.component';

describe('PlanFiltersComponent', () => {
  let fixture: ComponentFixture<PlanFiltersComponent>;
  let host: HTMLElement;

  const button = (label: string): HTMLButtonElement =>
    [...host.querySelectorAll('button')].find((b) => b.textContent!.trim() === label)!;

  async function click(label: string): Promise<void> {
    button(label).click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlanFiltersComponent] }).compileComponents();
    fixture = TestBed.createComponent(PlanFiltersComponent);
    fixture.componentRef.setInput('count', 2);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('garde le panneau fermé tant que le joueur ne le demande pas', async () => {
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    await click('Filters');
    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    expect(button('Show 2 plans')).toBeTruthy();
  });

  it('retire un filtre quand on le touche à nouveau', async () => {
    await click('Filters');
    await click('epic');
    expect(fixture.componentInstance.rarity()).toBe('epic');
    await click('epic');
    expect(fixture.componentInstance.rarity()).toBe('all');
  });

  it('compte les filtres actifs, options de la page comprises', async () => {
    fixture.componentInstance.rarity.set('epic');
    fixture.componentInstance.item.set('wood');
    fixture.componentRef.setInput('extraFilters', 1);
    await fixture.whenStable();
    expect(host.querySelector('.badge')!.textContent).toBe('3');
  });

  it('réinitialise les filtres et prévient la page, sans toucher à la recherche', async () => {
    const cleared = jasmine.createSpy();
    fixture.componentInstance.cleared.subscribe(cleared);
    fixture.componentInstance.search.set('scrap');
    await click('Filters');
    fixture.componentInstance.kind.set('special');
    await fixture.whenStable();
    await click('Reset');
    expect(fixture.componentInstance.kind()).toBe('all');
    expect(fixture.componentInstance.search()).toBe('scrap');
    expect(cleared).toHaveBeenCalled();
  });
});
