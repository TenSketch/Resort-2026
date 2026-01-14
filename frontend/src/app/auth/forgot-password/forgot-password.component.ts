import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  form: FormGroup;
  password_hide = true;
  repeate_password_hide = true;
  api_url: any;
  showLoader = false;
  token: any;
  message = '';

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.api_url = environment.API_URL;

    // Get token from route params
    this.route.params.subscribe((params) => {
      this.token = params['token'];
      console.log('Reset token:', this.token);
    });
  }

  ngOnInit() {
    this.form = this.formBuilder.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/
            ),
          ],
        ],
        repeat_password: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  togglePasswordVisibility(): void {
    this.password_hide = !this.password_hide;
  }

  toggleRepeatPasswordVisibility(): void {
    this.repeate_password_hide = !this.repeate_password_hide;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const repeatPassword = form.get('repeat_password')?.value;
    if (password !== repeatPassword) {
      form.get('repeat_password')?.setErrors({ passwordsNotMatch: true });
    } else {
      form.get('repeat_password')?.setErrors(null);
    }
    return null;
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.showLoader = true;

    const payload = {
      password: this.form.value.password,
    };

    this.http
      .post<any>(
        `${this.api_url}/api/user/reset-password/${this.token}`,
        payload
      )
      .subscribe({
        next: (response) => {
          this.showLoader = false;
          if (response.code === 3000 && response.result.status === 'success') {
            this.showSnackBarAlert(response.result.msg);
            setTimeout(() => {
              this.router.navigate(['/sign-in']);
            }, 2000);
          } else {
            this.message = response.result.msg || 'Failed to reset password';
            this.showSnackBarAlert(this.message);
          }
        },
        error: (err) => {
          this.showLoader = false;
          this.message =
            err.error?.result?.msg ||
            'Failed to reset password. Please try again.';
          this.showSnackBarAlert(this.message);
        },
      });
  }

  showSnackBarAlert(msg = '') {
    this.snackBar.open(msg, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
    });
  }
}
