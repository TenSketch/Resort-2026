import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-stay-booking-details',
  templateUrl: './stay-booking-details.component.html',
  styleUrls: ['./stay-booking-details.component.scss']
})
export class StayBookingDetailsComponent implements OnInit {
  @Input() reservationDetails: any;
  @Input() getRoomImages!: (roomName: string) => string[];

  constructor() { }

  ngOnInit(): void {
  }

}
