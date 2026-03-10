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
  selector: 'app-tent-checkout',
  templateUrl: './tent-checkout.component.html',
  styleUrls: ['./tent-checkout.component.scss']
})
export class TentCheckoutComponent implements OnInit, OnDestroy {
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

  // Date formatting
  formattedCheckinDate: { day: number; month: string; year: number };
  formattedCheckoutDate: { day: number; month: string; year: number };
  durationOfStay: number = 1;

  // User details
  getFullUser: string;

  // Payment details
  billdeskkey: string;
  billdesksecurityid: any;
  billdeskmerchantid: any;

  isInfoModalVisible = false;
  isModalVisible = false;
  isDarkMode = false;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private envService: EnvService,
    private renderer: Renderer2
  ) {
    this.form = this.fb.group({
      gname: ['', Validators.required],
      gphone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gemail: ['', [Validators.required, Validators.email]],
      gaddress: ['', Validators.required],
      gcity: ['', Validators.required],
      gstate: ['', Validators.required],
      gpincode: ['', Validators.required],
      gcountry: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    
    // Check if user is logged in
    if (!this.userService.isLoggedIn()) {
      this.showSnackBarAlert('Please login to continue booking');
      this.router.navigate(['/sign-in'], {
        queryParams: { returnUrl: '/tent-checkout' }
      });
      return;
    }

    this.loadBookingData();
    this.startTimer();
    this.fetchEnvVars();
    
    this.getFullUser = this.userService.getFullUser();
    this.getUserDetails();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  private loadBookingData(): void {
    const storedData = localStorage.getItem('tentsBooking');
    if (storedData) {
      this.bookingData = JSON.parse(storedData);
      
      // Ensure we have the required data
      if (!this.bookingData.tents || this.bookingData.tents.length === 0) {
        this.router.navigate(['/vanavihari/book-tent']);
        return;
      }
      
      // Parse dates for display - get from booking data
      if (this.bookingData.checkinDate) {
        this.formattedCheckinDate = this.parseDate(new Date(this.bookingData.checkinDate));
      }
      if (this.bookingData.checkoutDate) {
        this.formattedCheckoutDate = this.parseDate(new Date(this.bookingData.checkoutDate));
      }
      
      // Calculate duration
      this.calculateDurationOfStay();
    } else {
      this.router.navigate(['/vanavihari/book-tent']);
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

  calculateDurationOfStay(): number {
    if (this.bookingData?.checkinDate && this.bookingData?.checkoutDate) {
      const checkinDate = new Date(this.bookingData.checkinDate);
      const checkoutDate = new Date(this.bookingData.checkoutDate);
      checkinDate.setHours(0, 0, 0, 0);
      checkoutDate.setHours(0, 0, 0, 0);
      const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
      this.durationOfStay = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    return this.durationOfStay;
  }

  private startTimer() {
    this.targetTime = new Date();
    this.targetTime.setMinutes(this.targetTime.getMinutes() + 3);
    let redirectDone = false;

    this.intervalId = setInterval(() => {
      this.now = new Date().getTime();
      this.difference = this.targetTime - this.now;

      const minutesLeft = Math.floor((this.difference % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((this.difference % (1000 * 60)) / 1000);

      if (this.difference <= 0 && !redirectDone) {
        redirectDone = true;
        clearInterval(this.intervalId);
        localStorage.removeItem('tentsBooking');
        this.router.navigate(['/vanavihari/book-tent']);
      }

      if (this.minutes && this.seconds) {
        this.minutes.nativeElement.innerText = minutesLeft < 10 ? `0${minutesLeft}` : minutesLeft;
        this.seconds.nativeElement.innerText = secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft;
      }
    }, 1000);
  }

  private fetchEnvVars() {
    this.envService.getEnvVars().subscribe({
      next: (envVars) => {
        this.billdeskkey = envVars.billdeskkey;
        this.billdesksecurityid = envVars.billdesksecurityid;
        this.billdeskmerchantid = envVars.billdeskmerchantid;
      },
      error: (error) => console.error('Error fetching environment variables:', error)
    });
  }

  getUserDetails() {
    this.showLoader = true;
    const headers = { token: this.authService.getAccessToken() ?? '' };

    this.http.get<any>(`${this.api_url}/api/user/profile`, { headers }).subscribe({
      next: (response) => {
        this.showLoader = false;
        if (response.code == 3000 && (response.result.status === 'Success' || response.result.status === 'success')) {
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
        } else {
          this.userService.clearUser();
          this.router.navigate(['/sign-in']);
        }
      },
      error: (err) => {
        this.showLoader = false;
        console.error('Profile fetch error:', err);
        this.userService.clearUser();
        this.router.navigate(['/sign-in']);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  gotToLogin() {
    this.router.navigate(['/sign-in'], { queryParams: { returnUrl: '/tent-checkout' } });
  }

  isMobileOrTablet(): boolean {
    return window.innerWidth < 992;
  }

  getModalStyles(): object {
    if (this.isMobileOrTablet()) {
      return {
        display: 'block',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
    return { display: 'block' };
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
    localStorage.removeItem('tentsBooking');
    this.router.navigate(['/vanavihari/book-tent']);
  }

  onOk() {
    this.isInfoModalVisible = false;
    this.submitBooking();
  }

  submitBooking() {
    this.showLoader = true;

    if (!this.bookingData) {
      this.showLoader = false;
      this.showSnackBarAlert('Booking data not found. Please try again.');
      return;
    }

    // Calculate duration of stay
    const nights = this.calculateDurationOfStay();
    
    // Calculate total guests and children from tents
    const totalGuests = this.bookingData.tents.reduce((sum: number, t: any) => sum + (t.selectedGuests || 1), 0);
    const totalChildren = this.bookingData.tents.reduce((sum: number, t: any) => sum + (t.selectedChildren || 0), 0);

    // Prepare reservation data for tent booking API
    const reservationData = {
      tentSpotId: this.bookingData.tentSpotId,
      tentIds: this.bookingData.tents.map((t: any) => t.id),
      checkinDate: this.bookingData.checkinDate,
      checkoutDate: this.bookingData.checkoutDate,
      guests: totalGuests,
      children: totalChildren,
      numberOfTents: this.bookingData.tents.length,
      totalPayable: this.bookingData.total,
      tentPrice: this.bookingData.total,
      fullName: this.form.value.gname,
      phone: this.form.value.gphone,
      email: this.form.value.gemail,
      address1: this.form.value.gaddress,
      address2: '',
      city: this.form.value.gcity,
      state: this.form.value.gstate,
      postalCode: this.form.value.gpincode,
      country: this.form.value.gcountry
    };

    const headers = { token: this.authService.getAccessToken() ?? '' };

    this.http.post<any>(`${this.api_url}/api/tent-reservations`, reservationData, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.reservation) {
          const bookingId = response.reservation.bookingId;
          this.initiatePayment(bookingId);
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
            this.router.navigate(['/sign-in'], { queryParams: { returnUrl: '/tent-checkout' } });
          }, 3000);
          break;
        case 409:
          errorMessage = 'Sorry! The selected tent(s) are no longer available for your chosen dates. Please select different tents or dates.';
          shouldRedirect = true;
          break;
        default:
          errorMessage = 'We are facing technical issues. Please try again later.';
      }
    }

    this.showSnackBarAlert(errorMessage);

    if (shouldRedirect) {
      setTimeout(() => {
        localStorage.removeItem('tentsBooking');
        this.router.navigate(['/vanavihari/book-tent']);
      }, 4000);
    }
  }

  initiatePayment(bookingId: string) {
    const headers = { token: this.authService.getAccessToken() ?? '' };

    this.http.post<any>(`${this.api_url}/api/tent-payment/initiate`, { bookingId }, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.paymentData) {
          console.log('Payment initiated:', response);
          localStorage.removeItem('tentsBooking');
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
            this.router.navigate(['/sign-in'], { queryParams: { returnUrl: '/tent-checkout' } });
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
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  get f() { return this.form.controls; }

  getTotalGuestsFromBooking(): number {
    if (!this.bookingData?.tents) return 0;
    return this.bookingData.tents.reduce((sum: number, t: any) => sum + (t.selectedGuests || 1), 0);
  }

  getTotalChildrenFromBooking(): number {
    if (!this.bookingData?.tents) return 0;
    return this.bookingData.tents.reduce((sum: number, t: any) => sum + (t.selectedChildren || 0), 0);
  }
}
