import { TestBed } from '@angular/core/testing';

import { NotUserGuard } from './not-user-guard.service';

describe('NotUserGuardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NotUserGuard = TestBed.get(NotUserGuard);
    expect(service).toBeTruthy();
  });
});
