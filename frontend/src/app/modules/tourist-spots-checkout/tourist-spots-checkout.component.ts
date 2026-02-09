import { Component, ElementRef, OnInit, Renderer2, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth.service';
import { UserService } from '../../user.service';
import { EnvService } from 'src/app/env.service';

@Component({
  selector: 'app-tourist-spots-checkout',
  templateUrl: './tourist-spots-checkout.component.html',
  styleUrls: ['./tourist-spots-checkout.component.scss']
})
export class TouristSpotsCheckoutComponent implements OnInit, OnDestroy {
  bookingData: any = null;
  form: FormGroup;
  showLoader = false;
  api_url = environment.API_URL;

  // Timer properties
  @ViewChild('minutes', { static: true }) minutes: ElementRef;
  @ViewChild('seconds', { static: true }) seconds: ElementRef;
  intervalId: any;
  targetTime: any;
  now: any;
  difference: number;

  // User details
  getFullUser: string;

  // Payment details
  billdeskkey: string;
  billdesksecurityid: any;
  billdeskmerchantid: any;

  isInfoModalVisible = false;
  isModalVisible = false;
  isDarkMode = false;

  // Date formatting
  formattedVisitDate: { day: number; month: string; year: number };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private envService: EnvService,
    private renderer: Renderer2
  ) {
    this.form = this.fb.group({
      gname: ['', Validators.required],
      gphone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      gemail: ['', [Validators.required, Validators.email]],
      gaddress: ['', Validators.required],
      gcity: ['', Validators.required],
      gstate: ['', Validators.required],
      gpincode: ['', Validators.required],
      gcountry: ['', Validators.required],
      // Optional fields if needed
      gstnumber: [''],
      companyname: ['']
    });
  }

  ngOnInit(): void {
    this.loadBookingData();
    this.startTimer();
    this.fetchEnvVars();
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);

    if (this.userService.isLoggedIn()) {
      this.getFullUser = this.userService.getFullUser();
      this.getUserDetails();
    } else {
      // Optional: Redirect to login or show notification
      // this.router.navigate(['/sign-in'], { queryParams: { returnUrl: '/tourist-spots-checkout' } });
    }
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  private loadBookingData(): void {
    const storedData = localStorage.getItem('touristSpotsBooking');
    if (storedData) {
      this.bookingData = JSON.parse(storedData);
      
      // Parse visit date for display
      if (this.bookingData.visitDate) {
        this.formattedVisitDate = this.parseDate(new Date(this.bookingData.visitDate));
      }
    } else {
      this.router.navigate(['/tourist-places']);
    }
  }

  parseDate(date: Date): { day: number; month: string; year: number } {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear()
    };
  }

  formatVisitDate(): string {
    if (!this.bookingData?.visitDate) return '';
    const date = new Date(this.bookingData.visitDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  private startTimer() {
    this.targetTime = new Date();
    this.targetTime.setMinutes(this.targetTime.getMinutes() + 5);
    let redirectDone = false;

    this.intervalId = setInterval(() => {
      this.now = new Date().getTime();
      this.difference = this.targetTime - this.now;

      const minutesLeft = Math.floor((this.difference % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((this.difference % (1000 * 60)) / 1000);

      if (this.difference <= 0 && !redirectDone) {
        redirectDone = true;
        clearInterval(this.intervalId);
        this.router.navigate(['/tourist-places']);
      }

      if (this.minutes && this.seconds) {
        this.minutes.nativeElement.innerText = minutesLeft < 10 ? `0${minutesLeft}` : minutesLeft;
        this.seconds.nativeElement.innerText = secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft;
      }
    }, 1000);
  }

  private fetchEnvVars() {
    this.envService.getEnvVars().subscribe(
      (envVars) => {
        this.billdeskkey = envVars.billdeskkey;
        this.billdesksecurityid = envVars.billdesksecurityid;
        this.billdeskmerchantid = envVars.billdeskmerchantid;
      },
      (error) => console.error('Error fetching environment variables:', error)
    );
  }

  getUserDetails() {
    this.showLoader = true;
    const headers = { token: this.authService.getAccessToken() ?? '' };

    this.http.get<any>(`${this.api_url}/api/user/profile`, { headers }).subscribe({
      next: (response) => {
        this.showLoader = false;
        if (response.code == 3000 && response.result.status == 'success') {
          const result = response.result;
          this.form.patchValue({
            gname: result.name || '',
            gphone: result.phone || '',
            gemail: result.email || '',
            gaddress: result.address1 || '',
            gcity: result.city || '',
            gstate: result.state || '',
            gpincode: result.pincode || '',
            gcountry: result.country || ''
          });
        }
      },
      error: (err) => {
        this.showLoader = false;
        console.error('Profile fetch error:', err);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  gotToLogin() {
    this.router.navigate(['/sign-in'], { queryParams: { returnUrl: '/tourist-spots-checkout' } });
  }

  triggerModal() {
    this.isModalVisible = true;
  }

  triggerInfoModal() {
    if (this.form.valid) {
      this.isInfoModalVisible = true;
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel() {
    this.isModalVisible = false;
    this.isInfoModalVisible = false;
  }

  onConfirm() {
    this.isModalVisible = false;
    localStorage.removeItem('touristSpotsBooking');
    this.router.navigate(['/tourist-places']);
  }

  onOk() {
    this.isInfoModalVisible = false;
    this.submitBooking();
  }

  getTotalGuests(): number {
    if (!this.bookingData?.spots) return 0;
    return this.bookingData.spots.reduce((sum: number, spot: any) => sum + (spot.counts?.adults || 0), 0);
  }

  submitBooking() {
    this.showLoader = true;

    if (!this.bookingData || !this.bookingData.spots || this.bookingData.spots.length === 0) {
      this.showLoader = false;
      this.showSnackBarAlert('No booking data found. Please try again.');
      return;
    }

    // Prepare reservation data matching backend createReservation expectations
    const reservationData = {
      spots: this.bookingData.spots.map((spot: any) => ({
        id: spot.id,
        name: spot.name,
        visitDate: this.bookingData.visitDate,
        counts: spot.counts,
        breakdown: spot.breakdown,
        addOns: spot.addOns || []
      })),
      total: this.bookingData.total,
      customer: {
        gname: this.form.value.gname,
        gemail: this.form.value.gemail,
        gphone: this.form.value.gphone,
        gaddress: this.form.value.gaddress,
        gcity: this.form.value.gcity,
        gstate: this.form.value.gstate,
        gpincode: this.form.value.gpincode,
        gcountry: this.form.value.gcountry
      }
    };

    const headers = { token: this.authService.getAccessToken() ?? '' };

    // Create trek reservation (status: pending, paymentStatus: unpaid)
    this.http.post<any>(`${this.api_url}/api/trek-reservations`, reservationData, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.bookingId) {
          this.initiatePayment(response.bookingId);
        } else {
          this.showLoader = false;
          this.showSnackBarAlert('Failed to create reservation. Please try again.');
        }
      },
      error: (err) => {
        console.error('Reservation error:', err);
        this.showLoader = false;
        this.handleReservationError(err);
      }
    });
  }

  handleReservationError(err: any) {
    let errorMessage = 'We are facing technical issues. Please try again later.';
    let shouldRedirect = false;

    if (err.status) {
      switch (err.status) {
        case 400:
          errorMessage = 'Invalid booking details. Please check your information and try again.';
          break;
        case 401:
          errorMessage = 'Session expired. Please login again.';
          setTimeout(() => {
            this.router.navigate(['/sign-in'], { queryParams: { returnUrl: '/tourist-spots-checkout' } });
          }, 3000);
          break;
        case 409:
          errorMessage = 'Sorry! The selected trek spot(s) are no longer available for your chosen date. Please select different spots or dates.';
          shouldRedirect = true;
          break;
        default:
          errorMessage = 'We are facing technical issues. Please try again later.';
      }
    }

    this.showSnackBarAlert(errorMessage);

    if (shouldRedirect) {
      setTimeout(() => {
        localStorage.removeItem('touristSpotsBooking');
        this.router.navigate(['/tourist-places']);
      }, 4000);
    }
  }

  initiatePayment(bookingId: string) {
    const headers = { token: this.authService.getAccessToken() ?? '' };

    this.http.post<any>(`${this.api_url}/api/trek-payment/initiate`, { bookingId }, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.paymentData) {
          console.log('Payment initiated:', response);
          localStorage.removeItem('touristSpotsBooking');
          this.submitPaymentForm(response.paymentData);
        } else {
          this.showLoader = false;
          this.showSnackBarAlert(
            'Failed to initiate payment. Your booking (ID: ' + bookingId + ') will expire in 15 minutes. Please contact support if needed.'
          );
        }
      },
      error: (err) => {
        console.error('Payment initiation error:', err);
        this.showLoader = false;
        this.handlePaymentError(err, bookingId);
      }
    });
  }

  handlePaymentError(err: any, bookingId?: string) {
    let errorMessage = 'We are facing technical issues. Please try again later.';
    let shouldShowBookingId = false;

    if (err.status) {
      switch (err.status) {
        case 400:
          errorMessage = 'Invalid payment request. Please try again or contact support.';
          shouldShowBookingId = true;
          break;
        case 401:
          errorMessage = 'Session expired. Please login again.';
          setTimeout(() => {
            this.router.navigate(['/sign-in'], { queryParams: { returnUrl: '/tourist-spots-checkout' } });
          }, 3000);
          break;
        case 500:
        default:
          errorMessage = 'Payment gateway is temporarily unavailable. Please try again later.';
          shouldShowBookingId = true;
      }
    }

    if (bookingId && shouldShowBookingId) {
      errorMessage += ` Your booking ID is: ${bookingId}. It will expire in 15 minutes.`;
    }

    this.showSnackBarAlert(errorMessage);
  }

  submitPaymentForm(paymentData: any) {
    const paymentRedirectData = {
      action: paymentData.formAction,
      parameters: {
        merchantid: paymentData.merchantid,
        bdorderid: paymentData.bdorderid,
        rdata: paymentData.rdata
      }
    };

    console.log('Redirecting to payment page with data:', paymentRedirectData);

    const encodedData = encodeURIComponent(JSON.stringify(paymentRedirectData));
    const redirectUrl = `/payment-redirect.html?data=${encodedData}`;
    window.location.href = redirectUrl;
  }

  showSnackBarAlert(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: ['error-snackbar'] // Ensure this class exists or use default
    });
  }

  // Helper to get form controls for template
  get f() { return this.form.controls; }
}