import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createDefaultCityModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';

import { AliveRecapComponent } from './alive-recap.component';

describe('AliveRecapComponent', () => {
  let component: AliveRecapComponent;
  let fixture: ComponentFixture<AliveRecapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AliveRecapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AliveRecapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reporte au journal et sur le radar ce que les bâtiments spéciaux ont fait pendant la nuit', () => {
    expect(fixture.nativeElement.textContent).toContain('Quiet night');

    const city = createDefaultCityModel();
    TestBed.inject(CityService).city.set({
      ...city,
      attackRecap: {
        ...city.attackRecap,
        effects: [
          {
            buildingId: 114,
            name: 'Siege Larder',
            defense: 16,
            itemsGained: {},
            itemsSpent: { screw: 2 },
            skillLevels: [],
          },
        ],
      },
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Quiet night');
    expect(fixture.nativeElement.querySelectorAll('.blip').length).toBe(1);
    expect(text).toContain('Siege Larder');
    expect(text).toContain('+16 defense, −2 screw');
  });

  it('annonce sur le bouton le jour qui commence', () => {
    TestBed.inject(CityService).city.set({ ...createDefaultCityModel(), day: 8 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.cta').textContent).toContain('Start day 8');
  });
});
