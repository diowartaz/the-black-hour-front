import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NightLogComponent } from './night-log.component';

describe('NightLogComponent', () => {
  let fixture: ComponentFixture<NightLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NightLogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NightLogComponent);
  });

  it('annonce une nuit calme sans événement', () => {
    fixture.componentRef.setInput('events', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Quiet night');
  });

  it('numérote et horodate les événements dans l’ordre', () => {
    fixture.componentRef.setInput('events', [
      { name: 'Siege Larder', text: '+16 defense', color: 'var(--cyan)' },
      { name: 'Scavenging', text: 'Max level 4 → 5', color: 'var(--green)' },
    ]);
    fixture.detectChanges();
    const items = [...fixture.nativeElement.querySelectorAll('li')].map((li: HTMLElement) => li.textContent);
    expect(items.length).toBe(2);
    expect(items[0]).toContain('1');
    expect(items[0]).toContain('Siege Larder');
    expect(items[1]).toContain('Max level 4 → 5');
  });
});
