import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SearchService } from 'src/app/search.service';

@Component({
  selector: 'app-search-resort-only',
  templateUrl: './search-resort-only.component.html',
  styleUrls: ['./search-resort-only.component.scss'],
  providers: [DatePipe],
})
export class SearchResortOnlyComponent implements OnInit {
  searchForm: FormGroup;
  @ViewChild('modal') modal: ElementRef;
  @ViewChild('confirmationModal') confirmationModal: ElementRef;

  // Resort locations
  resortLocations = ['Vanavihari, Maredumilli', 'Jungle Star, Valamuru'];

  // Date constraints
  minDate: Date;
  maxDate: Date;
  minCheckoutDate: Date | null = null;

  // State
  selectionChanged = false;
  isModalVisible = false;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    // Initialize form with validators
    this.searchForm = this.formBuilder.group({
      selectedResort: [null, Validators.required],
      checkinDate: [null, Validators.required],
      checkoutDate: [null, Validators.required],
    });

    // Set max date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxDate = maxDate;

    // Initialize minDate
    this.minDate = new Date();

    // Listen to checkinDate changes to update minCheckoutDate
    this.searchForm.get('checkinDate')?.valueChanges.subscribe((value) => {
      this.updateMinCheckoutDate(value);
    });
  }

  ngOnInit(): void {
    // Restore previous search data if available
    const previousResort = this.authService.getSearchData('resort');
    if (previousResort) {
      this.searchForm.patchValue({ selectedResort: previousResort });
    }
  }

  /**
   * Handle resort selection change
   */
  onResortChange(): void {
    this.selectionChanged = true;
    this.setMinDate();
    
    // Reset dates when resort changes
    this.searchForm.patchValue({
      checkinDate: null,
      checkoutDate: null
    });
    this.minCheckoutDate = null;
  }

  /**
   * Set minimum date based on selected resort
   * Some resorts require T+1 booking constraint
   */
  setMinDate(): void {
    const currentDate = new Date();
    const selectedResort = this.searchForm.get('selectedResort')?.value;
    
    // T+1 constraint for specific locations
    if (selectedResort === 'Jungle Star, Valamuru') {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.minDate = currentDate;
  }

  /**
   * Update minimum checkout date based on check-in date
   */
  updateMinCheckoutDate(checkinDate: Date | null): void {
    if (checkinDate) {
      const minDate = new Date(checkinDate);
      minDate.setDate(minDate.getDate() + 1);
      this.minCheckoutDate = minDate;
    } else {
      this.minCheckoutDate = null;
    }
  }

  /**
   * Handle search form submission
   */
  submitSearch(): void {
    if (this.searchForm.invalid) {
      return;
    }

    const bookingRooms = localStorage.getItem('booking_rooms');
    const array = bookingRooms ? JSON.parse(bookingRooms) : null;

    if (array != null && this.selectionChanged && array.length !== 2) {
      this.triggerModal();
    } else {
      this.proceedWithSearch();
    }
  }

  triggerModal(): void {
    this.onConfirm();
    this.selectionChanged = false;
  }

  onCancel(): void {
    this.isModalVisible = false;
  }

  onConfirm(): void {
    this.isModalVisible = false;
    this.proceedWithSearch();
  }

  /**
   * Execute search and navigate to rooms page
   */
  proceedWithSearch(): void {
    const selectedResort = this.searchForm.get('selectedResort')?.value;
    const checkinDate = this.searchForm.get('checkinDate')?.value;
    const checkoutDate = this.searchForm.get('checkoutDate')?.value;

    let checkinDateString = '';
    let checkoutDateString = '';

    if (checkinDate && checkoutDate) {
      const date1 = new Date(checkinDate);
      const date2 = new Date(checkoutDate);
      
      date1.setMinutes(date1.getMinutes() - date1.getTimezoneOffset());
      date2.setMinutes(date2.getMinutes() - date2.getTimezoneOffset());
      
      checkinDateString = date1.toISOString();
      checkoutDateString = date2.toISOString();
    }

    // Set search data
    this.authService.setSearchData([
      {
        resort: selectedResort,
        checkin: checkinDateString,
        checkout: checkoutDateString,
      },
    ]);
    this.searchService.setSearchCriteria(selectedResort);
    this.authService.refreshRoomsComponent();
    this.authService.buttonClick$.next();

    // Navigate to rooms page
    localStorage.setItem('booking_rooms', JSON.stringify([]));
    this.router.navigate(['resorts/rooms'], {
      queryParams: { bookingTypeResort: selectedResort },
      queryParamsHandling: 'merge',
    });
  }
}
