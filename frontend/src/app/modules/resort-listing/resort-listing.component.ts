import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';

declare var bootstrap: any;

@Component({
  selector: 'app-resort-listing',
  templateUrl: './resort-listing.component.html',
  styleUrls: ['./resort-listing.component.scss']
})
export class ResortListingComponent implements AfterViewInit {
  constructor(private router: Router, private userService: UserService) {}

  isSidebarOpen: boolean = false;
  showBookingSummary: boolean = false;

  ngAfterViewInit(): void {
    // Initialize Bootstrap carousel manually for autoplay
    const carouselElement = document.getElementById('resortCarousel');
    if (carouselElement) {
      new bootstrap.Carousel(carouselElement, {
        interval: 6000,
        ride: 'carousel',
        pause: 'hover'
      });
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  addRoom() {
    this.showBookingSummary = true;
  }

  goToBooking() {
    this.router.navigate(['/booking-summary']);
  }
}
