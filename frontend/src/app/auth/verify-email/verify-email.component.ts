import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  verificationStatus: 'loading' | 'success' | 'error' = 'loading';
  message: string = 'Verifying your email...';
  token: string = '';
  api_url: string = environment.API_URL;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        this.verificationStatus = 'error';
        this.message = 'Invalid verification link. No token provided.';
        return;
      }

      // Verify the email
      this.verifyEmail();
    });
  }

  verifyEmail(): void {
    this.http.get<any>(`${this.api_url}/api/user/verify-email/${this.token}`)
      .subscribe({
        next: (response) => {
          if (response.code === 3000 && response.result.status === 'success') {
            this.verificationStatus = 'success';
            this.message = response.result.msg;

            // Store user token and data
            if (response.result.token) {
              localStorage.setItem('userToken', response.result.token);
              localStorage.setItem('userData', JSON.stringify(response.result.user));
              
              // Set auth service data
              this.authService.setAccessToken(response.result.token);
              this.authService.setAccountUsername(response.result.user.email);
              this.authService.setAccountUserFullname(response.result.user.name);
            }

            // Redirect to settings page to complete profile after 3 seconds
            setTimeout(() => {
              this.router.navigate(['/my-account/settings']);
            }, 3000);
          } else {
            this.verificationStatus = 'error';
            this.message = response.result.msg || 'Email verification failed.';
          }
        },
        error: (err) => {
          console.error('Verification error:', err);
          this.verificationStatus = 'error';
          
          if (err.error && err.error.result && err.error.result.msg) {
            this.message = err.error.result.msg;
          } else {
            this.message = 'Email verification failed. The link may be invalid or expired.';
          }
        }
      });
  }

  goToLogin(): void {
    this.router.navigate(['/sign-in']);
  }

  goToResendVerification(): void {
    this.router.navigate(['/resend-verification']);
  }
}
