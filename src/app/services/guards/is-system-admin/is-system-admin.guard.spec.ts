import { TestBed, async, inject } from '@angular/core/testing';

import { IsSystemAdminGuard } from './is-system-admin.guard';

describe('IsSystemAdminGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IsSystemAdminGuard]
    });
  });

  it('should ...', inject([IsSystemAdminGuard], (guard: IsSystemAdminGuard) => {
    expect(guard).toBeTruthy();
  }));
});
