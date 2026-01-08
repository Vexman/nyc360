import { TestBed } from '@angular/core/testing';

import { CommunityRequests } from './community-requests';

describe('CommunityRequests', () => {
  let service: CommunityRequests;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityRequests);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
