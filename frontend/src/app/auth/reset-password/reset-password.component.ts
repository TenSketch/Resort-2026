import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnDestroy {
  form: FormGroup;
  showLoader = false;
  disableSubmit = false;
  api_url: any;
  message = '';
  countdown = 0;
  private countdownInterval: any;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.api_url = environment.API_URL;
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email_address: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onSubmit() {
    if (this.form.invalid || this.countdown > 0) {
      return;
    }

    this.showLoader = true;
    this.disableSubmit = true;

    const payload = {
      email_id: this.form.value.email_address,
    };

    this.http
      .post<any>(this.api_url + '/api/user/forgot-password', payload)
      .subscribe({
        next: (response) => {
          this.showLoader = false;
          if (response.code === 3000 && response.result.status === 'success') {
            this.message = response.result.msg;
            this.startCountdown(60);
          } else {
            this.message = response.result.msg || 'Failed to send reset email';
            this.disableSubmit = false;
          }
        },
        error: (err) => {
          this.showLoader = false;
          if (err.status === 429 && err.error?.result?.remainingSeconds) {
            this.message = err.error.result.msg;
            this.startCountdown(err.error.result.remainingSeconds);
          } else {
            this.message =
              err.error?.result?.msg ||
              'Failed to send reset email. Please try again.';
            this.disableSubmit = false;
          }
        },
      });
  }

  startCountdown(seconds: number) {
    this.countdown = seconds;
    this.disableSubmit = true;

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.disableSubmit = false;
      }
    }, 1000);
  }

  goToSignin() {
    this.router.navigate(['/sign-in']);
  }

  goToSignup() {
    this.router.navigate(['/sign-up']);
  }
}
