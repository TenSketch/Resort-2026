import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StayBookingDetailsComponent } from './stay-booking-details.component';

describe('StayBookingDetailsComponent', () => {
  let component: StayBookingDetailsComponent;
  let fixture: ComponentFixture<StayBookingDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StayBookingDetailsComponent]
    });
    fixture = TestBed.createComponent(StayBookingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
