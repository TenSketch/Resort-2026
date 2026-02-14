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
    const previousCheckin = this.authService.getSearchData('checkin');
    const previousCheckout = this.authService.getSearchData('checkout');
    
    // Set default resort if none stored
    const defaultResort = previousResort || this.resortLocations[0];
    this.searchForm.patchValue({ selectedResort: defaultResort });
    this.setMinDate(); // Set min date based on resort
    
    // Auto-fill dates if available from home page quick filter
    if (previousCheckin) {
      const checkinDate = new Date(previousCheckin);
      this.searchForm.patchValue({ checkinDate: checkinDate });
      this.updateMinCheckoutDate(checkinDate);
    }
    
    // If no checkin, trigger logic to default dates
    if (!previousCheckin) {
      // For Jungle Star, we force logic even if checkin was present (based on user request)
      // Actually, let's just call onResortChange logic which handles existing date check for Vanavihari
      this.onResortChange();
    } else {
       // If checkin exists, just ensure checkout logic
       if (previousCheckout) {
         const checkoutDate = new Date(previousCheckout);
         this.searchForm.patchValue({ checkoutDate: checkoutDate });
       } else {
         // Auto-calculate checkout if checkin present but checkout missing
         this.updateMinCheckoutDate(new Date(previousCheckin));
       }
       
       // Special case for Jungle Star: Force T+1 logic? 
       // User requested: "for jungle-star it should be next day".
       // If I restore a past date, maybe I should respect it?
       // Let's assume onResortChange logic is the source of truth
       if (defaultResort && defaultResort.includes('Jungle Star')) {
          this.onResortChange(); // This will force T+1 for Jungle Star as per previous logic
       }
    }
  }

  /**
   * Handle resort selection change
   */
  onResortChange(): void {
    this.selectionChanged = true;
    this.setMinDate();
    
    // Autofill check-in date logic
    const selectedResort = this.searchForm.get('selectedResort')?.value;
    const currentCheckin = this.searchForm.get('checkinDate')?.value;
    const today = new Date();
    let autoDate = new Date();
    let shouldAutofill = false;

    if (selectedResort && selectedResort.includes('Vanavihari')) {
      // For Vanavihari: Only autofill if empty, otherwise keep user selection
      if (!currentCheckin) {
        autoDate = today;
        shouldAutofill = true;
      }
    } else if (selectedResort && selectedResort.includes('Jungle Star')) {
      // For Jungle Star: Always force to T+1 (Tomorrow)
      autoDate.setDate(today.getDate() + 1);
      shouldAutofill = true;
    }

    if (shouldAutofill) {
      // Format to YYYY-MM-DD for native date input (if used) or Date object for mat-datepicker
      // Ideally keeping it as Date object for consistency with reactive forms and material
      // But the existing code used string formatting, let's stick to Date object if possible or format if needed.
      // Looking at previous code, it patched formattedDate string. Material datepicker usually handles Date objects.
      // Let's use Date objects to be safe, or strings if the form controls expect strings.
      // The previous code formatted to YYYY-MM-DD. I will respect that pattern but also try to just pass the Date object
      // if the control handles it. Howerver, to match previous code style:
      
      // const year = autoDate.getFullYear();
      // const month = ('0' + (autoDate.getMonth() + 1)).slice(-2);
      // const day = ('0' + autoDate.getDate()).slice(-2);
      // const formattedDate = `${year}-${month}-${day}`;
      
      // Actually, passing Date object is usually better for Angular Material.
      // Let's try passing the Date object directly.
      this.searchForm.patchValue({
        checkinDate: autoDate
      });
      // Checkout date will be handled by the valueChanges subscription or updated explicitly here?
      // valueChanges handles minCheckoutDate, let's also update checkoutDate there or here.
      // trigger update manually just in case
      this.updateMinCheckoutDate(autoDate);
    } else {
       // If we switched to Vanavihari and had a date, we might want to ensure checkout is valid
       if (currentCheckin) {
           this.updateMinCheckoutDate(currentCheckin);
       }
    }
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
      
      // Auto-set checkout date to next day
      this.searchForm.patchValue({
        checkoutDate: minDate
      });
    } else {
      this.minCheckoutDate = null;
      this.searchForm.patchValue({
        checkoutDate: null
      });
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
