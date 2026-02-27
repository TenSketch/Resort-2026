import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-trek-booking-details',
  templateUrl: './trek-booking-details.component.html',
  styleUrls: ['./trek-booking-details.component.scss']
})
export class TrekBookingDetailsComponent implements OnInit {
  @Input() reservationDetails: any;

  constructor() { }

  ngOnInit(): void {
  }

}
