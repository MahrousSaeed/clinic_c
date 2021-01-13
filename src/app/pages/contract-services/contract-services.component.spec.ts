import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractServicesComponent } from './contract-services.component';

describe('ContractServicesComponent', () => {
  let component: ContractServicesComponent;
  let fixture: ComponentFixture<ContractServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContractServicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
