import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorScreenComponent } from './doctor-screen.component';

describe('DoctorScreenComponent', () => {
  let component: DoctorScreenComponent;
  let fixture: ComponentFixture<DoctorScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DoctorScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
