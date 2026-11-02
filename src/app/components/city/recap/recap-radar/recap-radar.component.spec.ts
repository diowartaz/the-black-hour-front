import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecapRadarComponent } from './recap-radar.component';

describe('RecapRadarComponent', () => {
  let fixture: ComponentFixture<RecapRadarComponent>;

  function render(defense: number, zombies: number, blips: string[] = []) {
    fixture.componentRef.setInput('defense', defense);
    fixture.componentRef.setInput('zombies', zombies);
    fixture.componentRef.setInput('night', 7);
    fixture.componentRef.setInput('blips', blips);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecapRadarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecapRadarComponent);
  });

  it('raconte une nuit survécue avec la marge', () => {
    const el = render(530, 412, ['var(--cyan)', 'var(--green)']);
    expect(el.querySelectorAll('.dot').length).toBe(60);
    expect(el.querySelectorAll('.blip').length).toBe(2);
    expect(el.textContent).toContain('You survived!');
    expect(el.textContent).toContain('118 m from the wall');
    expect(el.textContent).toContain('Day 8 begins');
    expect(el.textContent).toContain('1 dot ≈ 7');
  });

  it('montre la brèche quand la horde gagne', () => {
    const el = render(200, 412);
    expect(el.querySelector('.radar-recap')?.classList).toContain('breached');
    expect(el.textContent).toContain('You died!');
    expect(el.textContent).toContain('on day 7');
  });
});
