import { Component, OnInit, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TentSpotService } from '../../services/tent-spot.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-search-tent',
  templateUrl: './search-tent.component.html',
  styleUrls: ['./search-tent.component.scss']
})
export class SearchTentComponent implements OnInit, OnChanges {
  searchForm: FormGroup;
  tentSpots: any[] = [];
  minDate: Date;
  maxDate: Date;
  private lastAutoSearchKey: string = '';

  @Input() preselectedTentSpotId: string = '';
  @Output() searchSubmitted = new EventEmitter<{
    tentSpotId: string;
    checkinDate: string;
    checkoutDate: string;
  }>();

  constructor(
    private formBuilder: FormBuilder,
    private tentSpotService: TentSpotService,
    private authService: AuthService
  ) {
    this.searchForm = this.formBuilder.group({
      selectedTentSpot: [null, Validators.required],
      checkinDate: [null, Validators.required],
      checkoutDate: [null, Validators.required],
    });

    // Set min date to today
    this.minDate = new Date();
    
    // Set max date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxDate = maxDate;
  }

  ngOnInit(): void {
    this.loadTentSpots();
  }

  ngOnChanges(): void {
    // Auto-select tent spot when preselectedTentSpotId is provided or changes
    if (this.preselectedTentSpotId && this.tentSpots.length > 0) {
      this.searchForm.patchValue({
        selectedTentSpot: this.preselectedTentSpotId
      });
    }
  }

  loadTentSpots(): void {
    this.tentSpotService.getAllTentSpots().subscribe({
      next: (response) => {
        if (response.success) {
          // Filter out disabled tent spots
          this.tentSpots = (response.tentSpots || []).filter((spot: any) => !spot.isDisabled);
          
          // If preselected tent spot is set, apply it after loading spots
          if (this.preselectedTentSpotId) {
            this.searchForm.patchValue({
              selectedTentSpot: this.preselectedTentSpotId
            });
          }
          
          // Auto-fill dates from home page quick filter if available
          const previousCheckin = this.authService.getSearchData('checkin');
          const previousCheckout = this.authService.getSearchData('checkout');
          
          if (previousCheckin) {
            const checkinDate = new Date(previousCheckin);
            this.searchForm.patchValue({ checkinDate: checkinDate });
          }
          
          if (previousCheckout) {
            const checkoutDate = new Date(previousCheckout);
            this.searchForm.patchValue({ checkoutDate: checkoutDate });
          }
        }
      },
      error: (err) => console.error('Failed to load tent spots', err)
    });
  }

  onTentSpotChange(): void {
    // Reset dates when tent spot changes
    this.searchForm.patchValue({
      checkinDate: null,
      checkoutDate: null
    });
  }

  setMinCheckoutDate(): Date | null {
    const checkinDate = this.searchForm.get('checkinDate')?.value;
    if (checkinDate) {
      const minDate = new Date(checkinDate);
      minDate.setDate(minDate.getDate() + 1);
      return minDate;
    }
    return null;
  }

  submitSearch(): void {
    if (this.searchForm.valid) {
      const formValues = this.searchForm.value;
      const checkinDate = new Date(formValues.checkinDate);
      const checkoutDate = new Date(formValues.checkoutDate);
      
      // Adjust for timezone
      checkinDate.setMinutes(checkinDate.getMinutes() - checkinDate.getTimezoneOffset());
      checkoutDate.setMinutes(checkoutDate.getMinutes() - checkoutDate.getTimezoneOffset());

      this.searchSubmitted.emit({
        tentSpotId: formValues.selectedTentSpot,
        checkinDate: checkinDate.toISOString(),
        checkoutDate: checkoutDate.toISOString()
      });
    }
  }

  onDateSelectionChange(): void {
    if (this.searchForm.invalid) {
      return;
    }

    const formValues = this.searchForm.value;
    const autoSearchKey = `${formValues.selectedTentSpot}|${formValues.checkinDate}|${formValues.checkoutDate}`;

    if (this.lastAutoSearchKey === autoSearchKey) {
      return;
    }

    this.lastAutoSearchKey = autoSearchKey;
    this.submitSearch();
  }
}
