import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrekBookingDetailsComponent } from './trek-booking-details.component';

describe('TrekBookingDetailsComponent', () => {
  let component: TrekBookingDetailsComponent;
  let fixture: ComponentFixture<TrekBookingDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TrekBookingDetailsComponent]
    });
    fixture = TestBed.createComponent(TrekBookingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
