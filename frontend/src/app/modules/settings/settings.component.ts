import { Component, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
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

  showLoader = false;
  api_url: any
  isModalVisible = false
  isDarkMode = false



  constructor(
    private renderer: Renderer2,
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.api_url = environment.API_URL

    this.form = this.formBuilder.group({
      full_name: [''],
      mobile_number: [''],
      email: ['', Validators.email],
      dob: ['', Validators.required],
      nationality: [''],
      address1: [''],
      address2: [''],
      city: [''],
      state: [''],
      pincode: [''],
      country: [''],
    });
  }

  ngOnInit(): void {
    this.showLoader = true;
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    
    // Get user profile using the new API endpoint
    const headers = {
      'token': this.authService.getAccessToken() ?? ''
    };
    
    this.http
      .get<any>(`${this.api_url}/api/user/profile`, { headers })
      .subscribe({
        next: (response) => {
          if (response.code == 3000 && response.result.status == 'success') {
            this.showLoader = false;
            const result = response.result;
            
            this.form = this.formBuilder.group({
              full_name: [result.name],
              mobile_number: [result.phone],
              email: [result.email, Validators.email],
              dob: [result.dob ? new Date(result.dob) : '', Validators.required],
              nationality: [result.nationality || ''],
              address1: [result.address1 || ''],
              address2: [result.address2 || ''],
              city: [result.city || ''],
              state: [result.state || ''],
              pincode: [result.pincode || ''],
              country: [result.country || ''],
            });
          } else {
            this.showLoader = false;
            this.userService.clearUser();
            this.router.navigate(['/sign-in']);
          }
        },
        error: (err) => {
          this.showLoader = false;
          console.error('Profile fetch error:', err);
          this.userService.clearUser();
          this.router.navigate(['/sign-in']);
        },
      });
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
  

  onSubmit() {
    this.showLoader = true
    if (this.form.valid) {
      const headers = {
        'token': this.authService.getAccessToken() ?? '',
        'Content-Type': 'application/json'
      };

      const formData = this.form.value;
      const updateData: any = {};

      // Only include fields that have values
      if (formData.full_name) updateData.full_name = formData.full_name;
      if (formData.mobile_number) updateData.mobile_number = formData.mobile_number;
      if (formData.dob) updateData.dob = formData.dob;
      if (formData.nationality) updateData.nationality = formData.nationality;
      if (formData.address1) updateData.address1 = formData.address1;
      if (formData.address2 !== undefined) updateData.address2 = formData.address2; // Allow empty string
      if (formData.city) updateData.city = formData.city;
      if (formData.state) updateData.state = formData.state;
      if (formData.pincode) updateData.pincode = formData.pincode;
      if (formData.country) updateData.country = formData.country;

      this.http
        .put<any>(`${this.api_url}/api/user/profile`, updateData, { headers })
        .subscribe({
          next: (response) => {
            this.showLoader = false
            if (response.code == 3000 && response.result.status == 'success') {
              this.isModalVisible = true
            } else {
              this.showErrorAlert(response.result.msg || 'Update failed');
            }
          },
          error: (err) => {
            this.showLoader = false;
            console.error('Profile update error:', err);
            if (err.error && err.error.result && err.error.result.msg) {
              this.showErrorAlert(err.error.result.msg);
            } else {
              this.showErrorAlert('Profile update failed. Please try again.');
            }
          },
        });
    } else {
      this.showLoader = false;
      this.showErrorAlert('Please fill all required fields correctly!');
    }
  }

  closeModal(){
    this.isModalVisible = false
    this.router.navigate(['/home']);
  }

  onCancel() {
    this.isModalVisible = false
  }

  showErrorAlert(message: string) {
    // You can implement a snackbar or alert here
    alert(message);
  }



  goToSignin() {
    this.router.navigate(['/sign-in']);
  }

  goToSignup() {
    this.router.navigate(['/sign-up']);
  }
}
