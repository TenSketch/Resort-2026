import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-search-tourist-spot',
  templateUrl: './search-tourist-spot.component.html',
  styleUrls: ['./search-tourist-spot.component.scss']
})
export class SearchTouristSpotComponent implements OnInit {
  searchForm!: FormGroup;
  minDate!: Date;
  maxDate!: Date;
  private lastAutoSearchKey: string = '';

  @Output() searchSubmitted = new EventEmitter<{
    visitDate: string;
  }>();

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    // Initialize form
    this.searchForm = this.formBuilder.group({
      visitDate: [null, Validators.required],
    });

    // Set min date to today
    this.minDate = new Date();
    
    // Set max date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxDate = maxDate;
  }

  submitSearch(): void {
    if (this.searchForm.valid) {
      const formValues = this.searchForm.value;
      const visitDate = new Date(formValues.visitDate);
      
      // Adjust for timezone
      visitDate.setMinutes(visitDate.getMinutes() - visitDate.getTimezoneOffset());

      this.searchSubmitted.emit({
        visitDate: visitDate.toISOString()
      });
    }
  }

  onVisitDateChange(): void {
    if (this.searchForm.invalid) {
      return;
    }

    const visitDate = this.searchForm.get('visitDate')?.value;
    const autoSearchKey = `${visitDate}`;
    if (this.lastAutoSearchKey === autoSearchKey) {
      return;
    }

    this.lastAutoSearchKey = autoSearchKey;
    this.submitSearch();
  }
}
