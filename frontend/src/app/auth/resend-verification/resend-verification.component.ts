import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-resend-verification',
  templateUrl: './resend-verification.component.html',
  styleUrls: ['./resend-verification.component.scss']
})
export class ResendVerificationComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isLoading: boolean = false;
  api_url: string = environment.API_URL;
  cooldownSeconds: number = 0;
  cooldownTimer: any;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email_id: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.valid && this.cooldownSeconds === 0) {
      this.isLoading = true;

      const payload = {
        email_id: this.form.value.email_id
      };

      this.http.post<any>(`${this.api_url}/api/user/resend-verification`, payload)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            
            if (response.code === 3000 && response.result.status === 'success') {
              this.showSuccessAlert(response.result.msg);
              // Start cooldown timer
              this.startCooldown(60);
              // Navigate to success message page after a delay
              setTimeout(() => {
                this.router.navigate(['/show-success-message'], {
                  queryParams: { id: this.form.value.email_id }
                });
              }, 2000);
            } else {
              this.showErrorAlert(response.result.msg || 'Failed to resend verification email.');
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Resend verification error:', err);
            
            if (err.error && err.error.result) {
              // Handle cooldown error
              if (err.error.result.remainingSeconds) {
                this.startCooldown(err.error.result.remainingSeconds);
              }
              this.showErrorAlert(err.error.result.msg);
            } else if (err.status === 429) {
              this.showErrorAlert('Please wait before requesting another verification email.');
            } else {
              this.showErrorAlert('Failed to resend verification email. Please try again.');
            }
          }
        });
    } else if (this.cooldownSeconds > 0) {
      this.showErrorAlert(`Please wait ${this.cooldownSeconds} seconds before trying again.`);
    } else {
      this.showErrorAlert('Please enter a valid email address.');
    }
  }

  startCooldown(seconds: number): void {
    this.cooldownSeconds = seconds;
    
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    
    this.cooldownTimer = setInterval(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownSeconds = 0;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }

  showSuccessAlert(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['success-snackbar']
    });
  }

  showErrorAlert(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }

  goToLogin(): void {
    this.router.navigate(['/sign-in']);
  }
}
