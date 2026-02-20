import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { environment } from '@/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  form: FormGroup;

  countries: string[] = [
    'Afghanistan',
    'Åland Islands',
    'Albania',
    'Algeria',
    'American Samoa',
    'Andorra',
    'Angola',
    'Anguilla',
    'Antarctica',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Aruba',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas (the)',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bermuda',
    'Bhutan',
    'Bolivia (Plurinational State of)',
    'Bonaire, Sint Eustatius and Saba',
    'Bosnia and Herzegovina',
    'Botswana',
    'Bouvet Island',
    'Brazil',
    'British Indian Ocean Territory (the)',
    'Brunei Darussalam',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cabo Verde',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Cayman Islands (the)',
    'Central African Republic (the)',
    'Chad',
    'Chile',
    'China',
    'Christmas Island',
    'Cocos (Keeling) Islands (the)',
    'Colombia',
    'Comoros (the)',
    'Congo (the Democratic Republic of the)',
    'Congo (the)',
    'Cook Islands (the)',
    'Costa Rica',
    'Croatia',
    'Cuba',
    'Curaçao',
    'Cyprus',
    'Czechia',
    "Côte d'Ivoire",
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic (the)',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Eswatini',
    'Ethiopia',
    'Falkland Islands (the) [Malvinas]',
    'Faroe Islands (the)',
    'Fiji',
    'Finland',
    'France',
    'French Guiana',
    'French Polynesia',
    'French Southern Territories (the)',
    'Gabon',
    'Gambia (the)',
    'Georgia',
    'Germany',
    'Ghana',
    'Gibraltar',
    'Greece',
    'Greenland',
    'Grenada',
    'Guadeloupe',
    'Guam',
    'Guatemala',
    'Guernsey',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Heard Island and McDonald Islands',
    'Holy See (the)',
    'Honduras',
    'Hong Kong',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran (Islamic Republic of)',
    'Iraq',
    'Ireland',
    'Isle of Man',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jersey',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    "Korea (the Democratic People's Republic of)",
    'Korea (the Republic of)',
    'Kuwait',
    'Kyrgyzstan',
    "Lao People's Democratic Republic (the)",
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Macao',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands (the)',
    'Martinique',
    'Mauritania',
    'Mauritius',
    'Mayotte',
    'Mexico',
    'Micronesia (Federated States of)',
    'Moldova (the Republic of)',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Montserrat',
    'Morocco',
    'Mozambique',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands (the)',
    'New Caledonia',
    'New Zealand',
    'Nicaragua',
    'Niger (the)',
    'Nigeria',
    'Niue',
    'Norfolk Island',
    'Northern Mariana Islands (the)',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Palestine, State of',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines (the)',
    'Pitcairn',
    'Poland',
    'Portugal',
    'Puerto Rico',
    'Qatar',
    'Republic of North Macedonia',
    'Romania',
    'Russian Federation (the)',
    'Rwanda',
    'Réunion',
    'Saint Barthélemy',
    'Saint Helena, Ascension and Tristan da Cunha',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Martin (French part)',
    'Saint Pierre and Miquelon',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Sint Maarten (Dutch part)',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Georgia and the South Sandwich Islands',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan (the)',
    'Suriname',
    'Svalbard and Jan Mayen',
    'Sweden',
    'Switzerland',
    'Syrian Arab Republic',
    'Taiwan (Province of China)',
    'Tajikistan',
    'Tanzania, United Republic of',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tokelau',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Turks and Caicos Islands (the)',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates (the)',
    'United Kingdom of Great Britain and Northern Ireland (the)',
    'United States Minor Outlying Islands (the)',
    'United States of America (the)',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Venezuela (Bolivarian Republic of)',
    'Viet Nam',
    'Virgin Islands (British)',
    'Virgin Islands (U.S.)',
    'Wallis and Futuna',
    'Western Sahara',
    'Yemen',
    'Zambia',
    'Zimbabwe',
  ];

  idCardTypes: string[] = [
    'Aadhar Card',
    'PAN Card',
    'Driving License',
    'Passport',
    'Voter ID'
  ];

  showLoader = false;
  api_url: any;
  maxDate: Date;
  isDarkMode = false;

  // ID card format hints for display in UI
  idCardFormats: { [key: string]: string } = {
    'Aadhar Card': '12-digit number (e.g. 1234 5678 9012)',
    'PAN Card': '10-character alphanumeric (e.g. ABCDE1234F)',
    'Driving License': 'State code + 13 digits (e.g. MH0120210000001)',
    'Passport': '1 letter + 7 digits (e.g. A1234567)',
    'Voter ID': '3 letters + 7 digits (e.g. ABC1234567)'
  };

  get selectedIdCardHint(): string {
    const type = this.form.get('id_card_type')?.value;
    return type ? this.idCardFormats[type] || '' : 'Select an ID card type first';
  }



  constructor(
    private renderer: Renderer2,
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.api_url = environment.API_URL;

    // Calculate max date for 18+ years validation
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear() - 18);

    this.form = this.formBuilder.group({
      full_name: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]{2,50}$')]],
      mobile_number: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]],
      dob: ['', Validators.required],
      nationality: ['Indian', Validators.required],
      address1: ['', Validators.required],
      address2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[1-9][0-9]{5}$')]],
      country: ['India', Validators.required],
      id_card_type: ['', Validators.required],
      id_card_number: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.showLoader = true;
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    this.fetchUserProfile();

    // Dynamically update id_card_number validators when type changes
    this.form.get('id_card_type')?.valueChanges.subscribe((type: string) => {
      const idControl = this.form.get('id_card_number');
      if (idControl) {
        idControl.setValidators([Validators.required, this.getIdCardValidator(type)]);
        idControl.updateValueAndValidity();
      }
    });
  }

  getIdCardValidator(type: string): ValidatorFn {
    const patterns: { [key: string]: RegExp } = {
      'Aadhar Card': /^[2-9]{1}[0-9]{11}$/,
      'PAN Card': /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      'Driving License': /^[A-Z]{2}[0-9]{13}$/,
      'Passport': /^[A-Z]{1}[0-9]{7}$/,
      'Voter ID': /^[A-Z]{3}[0-9]{7}$/
    };
    const pattern = patterns[type];
    return (control) => {
      if (!control.value || !pattern) return null;
      return pattern.test(control.value.toUpperCase()) ? null : { invalidIdFormat: true };
    };
  }

  fetchUserProfile() {
    const headers = {
      'token': this.authService.getAccessToken() ?? ''
    };
    
    this.http
      .get<any>(`${this.api_url}/api/user/profile`, { headers })
      .subscribe({
        next: (response) => {
          this.showLoader = false;
          if (response.code == 3000 && response.result.status == 'success') {
            const result = response.result;
            
            this.form.patchValue({
              full_name: result.name,
              mobile_number: result.phone,
              email: result.email,
              dob: result.dob ? new Date(result.dob) : '',
              nationality: result.nationality || 'Indian',
              address1: result.address1 || '',
              address2: result.address2 || '',
              city: result.city || '',
              state: result.state || '',
              pincode: result.pincode || '',
              country: result.country || 'India',
              id_card_type: result.id_card_type || '',
              id_card_number: result.id_card_number || ''
            });
          } else {
            this.handleAuthError();
          }
        },
        error: (err) => {
          this.showLoader = false;
          console.error('Profile fetch error:', err);
          this.handleAuthError();
        },
      });
  }

  handleAuthError() {
    this.userService.clearUser();
    this.router.navigate(['/sign-in']);
  }

  get isNationalityDisabled(): boolean {
    return !!this.form.get('nationality')?.value;
  }

  formatDateToDDMMMYYYY(dateString: any) {
    if (!dateString) {
      return ''; // Return an empty string if dateString is undefined
    }

    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getUTCFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    return formattedDate;
  }
  

  fetchAddressByPincode() {
    const pincode = this.form.get('pincode')?.value;
    if (pincode && pincode.length === 6) {
      this.showLoader = true;
      this.http.get<any>(`https://api.postalpincode.in/pincode/${pincode}`).subscribe({
        next: (response) => {
          this.showLoader = false;
          if (response && response[0] && response[0].Status === 'Success') {
            const details = response[0].PostOffice[0];
            this.form.patchValue({
              city: details.District,
              state: details.State,
              country: 'India'
            });
            this.showSnackBar('Address details fetched successfully!', 'success-snackbar');
          } else {
            this.showSnackBar('Invalid Pincode or data not found.', 'error-snackbar');
          }
        },
        error: (err) => {
          this.showLoader = false;
          console.error('Pincode fetch error:', err);
          this.showSnackBar('Failed to fetch address details.', 'error-snackbar');
        }
      });
    }
  }

onSubmit() {
    if (this.form.valid) {
      this.showLoader = true;
      const headers = {
        'token': this.authService.getAccessToken() ?? '',
        'Content-Type': 'application/json'
      };

      const formData = this.form.value;
      const updateData: any = { ...formData };

      this.http
        .put<any>(`${this.api_url}/api/user/profile`, updateData, { headers })
        .subscribe({
          next: (response) => {
            this.showLoader = false;
            if (response.code == 3000 && response.result.status == 'success') {
              this.showSnackBar('Profile updated successfully!', 'success-snackbar');
            } else {
              this.showSnackBar(response.result.msg || 'Update failed', 'error-snackbar');
            }
          },
          error: (err) => {
            this.showLoader = false;
            console.error('Profile update error:', err);
            const msg = err.error?.result?.msg || 'Profile update failed. Please try again.';
            this.showSnackBar(msg, 'error-snackbar');
          },
        });
    } else {
      this.form.markAllAsTouched();
      this.showValidationErrors();
    }
  }

  showValidationErrors() {
    for (const key in this.form.controls) {
      if (this.form.controls.hasOwnProperty(key)) {
        const control = this.form.controls[key];
        if (control.invalid) {
          const fieldName = this.getFieldName(key);
          if (control.errors?.['required']) {
            this.showSnackBar(`${fieldName} is required`, 'error-snackbar');
            return;
          }
          if (control.errors?.['pattern']) {
            const patternMessages: { [k: string]: string } = {
              full_name: 'Full Name should contain only letters and spaces (2-50 chars)',
              mobile_number: 'Enter a valid 10-digit Indian Mobile Number (starts with 6-9)',
              pincode: 'Enter a valid 6-digit Pincode (should not start with 0)'
            };
            this.showSnackBar(patternMessages[key] || `Invalid format for ${fieldName}`, 'error-snackbar');
            return;
          }
          if (control.errors?.['email']) {
            this.showSnackBar('Please enter a valid Email Address', 'error-snackbar');
            return;
          }
          if (control.errors?.['matDatepickerParse'] || control.errors?.['matDatepickerFilter']) {
            this.showSnackBar('Invalid Date of Birth', 'error-snackbar');
            return;
          }
          if (control.errors?.['invalidIdFormat']) {
            const cardType = this.form.get('id_card_type')?.value || 'ID';
            const hint = this.idCardFormats[cardType] || '';
            this.showSnackBar(`Invalid ${cardType} format. Expected: ${hint}`, 'error-snackbar');
            return;
          }
        }
      }
    }
    this.showSnackBar('Please fill all required fields correctly!', 'error-snackbar');
  }

  getFieldName(key: string): string {
    const names: { [key: string]: string } = {
      full_name: 'Full Name',
      mobile_number: 'Mobile Number',
      email: 'Email',
      dob: 'Date of Birth',
      nationality: 'Nationality',
      address1: 'Address Line 1',
      address2: 'Address Line 2',
      city: 'City',
      state: 'State',
      pincode: 'Pincode',
      country: 'Country',
      id_card_type: 'ID Card Type',
      id_card_number: 'ID Card Number'
    };
    return names[key] || key;
  }

  showSnackBar(message: string, panelClass: string = 'info-snackbar') {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: [panelClass]
    });
  }

  onCancel() {
    this.router.navigate(['/home']);
  }

  goToSignin() {
    this.router.navigate(['/sign-in']);
  }

  goToSignup() {
    this.router.navigate(['/sign-up']);
  }
}
