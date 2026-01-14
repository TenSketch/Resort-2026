import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../user.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth.service';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  form: FormGroup;
  isLoading: boolean = false;
  showAlert: boolean = false;
  returnUrl: string = '';
  disableSign = false;
  disableSubmit = false;
  lastRoute: string;
  api_url : any
  hide = true;
  showForgotPassword = false
  showLoader = false

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private userService:UserService
  ) {
    this.api_url = environment.API_URL
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    this.form = this.formBuilder.group({
      email_id: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility(event: MouseEvent): void {
    event.preventDefault(); // Prevent the default action (form submission)
    this.hide = !this.hide;
  }

  ngOnInit(): void {
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    let loginStatus = this.userService.isLoggedIn()
    if(loginStatus){
      
    }

    // this.route.queryParams.subscribe((params) => {
    //   if (params['message']) {
    //     const message = params['message'];
    //     this.showSnackBarAlert(message);
    //   }
    // });
  }

  onSubmit() {
    this.disableSign = true;
    if (this.form.valid) {
      this.isLoading = true;
      this.showAlert = true;

      // Prepare JSON payload for POST request
      const loginData = {
        email_id: this.form.value.email_id,
        password: this.form.value.password
      };

      // Make POST request to backend
      this.http
        .post<any>(`${this.api_url}/api/user/login`, loginData)
        .subscribe({
          next: (response) => {
            this.disableSign = false;
            if (response.code == 3000 && response.result.status == 'success') {
              this.isLoading = false;
              this.showAlert = false;
              this.showSnackBarAlert('Login Success', false);
              
              // Store user token and data
              if (response.result.token) {
                localStorage.setItem('userToken', response.result.token);
                localStorage.setItem('userData', JSON.stringify(response.result.user));
              }
              
              this.authService.setAccessToken(response.result.token);
              this.authService.setAccountUsername(response.result.user.email);
              this.authService.setAccountUserFullname(response.result.user.name);
              
              // Check if profile is completed
              if (response.result.profileCompleted === false) {
                // Redirect to settings page if profile is incomplete
                this.router.navigateByUrl('/my-account/settings');
                return;
              }
              
              let rooms = localStorage.getItem('booking_rooms');
              if (rooms == '[]' || rooms == null) {
                this.router.navigateByUrl('home');
              } else {
                this.router.navigateByUrl('booking-summary');
              }
            } else if (response.code == 3000) {
              this.isLoading = false;
              this.showAlert = false;
              this.showSnackBarAlert(response.result.msg);
            } else {
              this.isLoading = false;
              this.showAlert = false;
              this.showSnackBarAlert('Please check your credentials!');
            }
          },
          error: (err) => {
            this.disableSign = false;
            this.isLoading = false;
            this.showAlert = false;
            console.error('Login error:', err);
            
            // Handle different error scenarios
            if (err.error && err.error.result) {
              // Check if email is not verified
              if (err.error.result.emailNotVerified) {
                this.showSnackBarAlert(err.error.result.msg, false);
                // Redirect to resend verification page after 2 seconds
                setTimeout(() => {
                  this.router.navigate(['/resend-verification']);
                }, 2000);
              } else if (err.error.result.msg) {
                this.showSnackBarAlert(err.error.result.msg);
              } else {
                this.showSnackBarAlert('Login failed. Please try again.');
              }
            } else if (err.status === 0) {
              this.showSnackBarAlert('Unable to connect to server. Please check your connection.');
            } else {
              this.showSnackBarAlert('Login failed. Please try again.');
            }
          },
        });
    } else {
      this.disableSign = false;
      this.showSnackBarAlert('Please fill all fields correctly!');
    }
  }

  goToSignin() {
    this.router.navigate(['/sign-in']);
  }
  goToSignup() {
    this.router.navigate(['/sign-up'], {
      queryParams: { returnUrl: '/sign-in' },
    });
  }

  gotoResetPassword(){
    this.router.navigate(['/reset-password']);

  }

  toggleForgotPassword(){

     this.showForgotPassword = !this.showForgotPassword
  }

  forgotPassword(event:MouseEvent){
    event.preventDefault(); // Prevent the default action (form submission)
    this.disableSubmit = true
    this.showLoader = true;
  }

  showSnackBarAlert(msg = '', redirect = true) {
    var snackBar = this.snackBar.open(msg, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
    });
    if (redirect) {
      snackBar.afterDismissed().subscribe(() => {
        this.router.navigate(['/sign-in']);
      });
    }
  }
}
