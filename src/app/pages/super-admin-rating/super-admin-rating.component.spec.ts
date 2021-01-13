import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminRatingComponent } from './super-admin-rating.component';

describe('SuperAdminRatingComponent', () => {
  let component: SuperAdminRatingComponent;
  let fixture: ComponentFixture<SuperAdminRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuperAdminRatingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
