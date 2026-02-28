import { Component, Renderer2 } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserService } from '../../user.service';
import { GalleryService } from '@/app/gallery.service';
import { AuthService } from '@/app/auth.service';
import { SafeUrl } from '@angular/platform-browser';
import { environment } from '@/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss'],
})
export class MyBookingsComponent {
  bookingData: any[] = [];
  successData: any[] = [];
  message: any;
  formattedDate: { day: string; month: string };
  noBookings = false;
  showLoader = false;
  selectedResort: any;
  resortNumber: any;
  // pdfUrl: any;
  showPdfViewer: boolean = false;
  api_url: any;
  confirmCancel = false;
  pdfUrl: string = 'assets/PDF/Foodmenu.pdf'; // Path to your PDF file in the assets folder
  cancellationReason: string = '';
  currentDate: Date = new Date();

  // Modular UI Filtering State
  currentFilter: 'all' | 'resort' | 'trek' = 'all';

  get filteredBookings() {
    if (this.currentFilter === 'resort') {
      return this.bookingData.filter(item => item.booking_type === 'room' || item.booking_type === 'tent');
    } else if (this.currentFilter === 'trek') {
      return this.bookingData.filter(item => item.booking_type === 'trek');
    }
    return this.bookingData;
  }

  setFilter(filter: 'all' | 'resort' | 'trek') {
    this.currentFilter = filter;
  }

  days: { date: number; booked: boolean }[] = [];
  monthName: string = '';
  year: number = new Date().getFullYear();
  month: number = new Date().getMonth();

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private http: HttpClient,
    private userService: UserService,
    private galleryService: GalleryService,
    private router: Router
  ) {
    this.api_url = environment.API_URL;
  }

  ngOnInit(): void {
    this.generateCalendar(this.year, this.month);

    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);

    // Check if user is logged in
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['/sign-in'], {
        queryParams: { returnUrl: '/my-account/my-bookings' }
      });
      return;
    }

    this.showLoader = true;

    // Use new Node.js API endpoint
    const headers = {
      token: this.userService.getUserToken() ?? ''
    };

    // Fetch room, tent, and trek bookings
    Promise.all([
      this.http.get<any>(`${this.api_url}/api/reservations/my-bookings`, { headers }).toPromise(),
      this.http.get<any>(`${this.api_url}/api/tent-reservations/my-bookings`, { headers }).toPromise(),
      this.http.get<any>(`${this.api_url}/api/trek-reservations/my-bookings`, { headers }).toPromise()
    ]).then(([roomResponse, tentResponse, trekResponse]) => {
      let allBookings: any[] = [];

      // Process room bookings
      if (roomResponse?.success && roomResponse?.bookings) {
        const roomBookings = this.transformBookingData(roomResponse.bookings);
        allBookings = [...allBookings, ...roomBookings];
      }

      // Process tent bookings
      if (tentResponse?.success && tentResponse?.bookings) {
        const tentBookings = this.transformTentBookingData(tentResponse.bookings);
        allBookings = [...allBookings, ...tentBookings];
      }

      // Process trek bookings
      if (trekResponse?.success && trekResponse?.bookings) {
        const trekBookings = this.transformTrekBookingData(trekResponse.bookings);
        allBookings = [...allBookings, ...trekBookings];
      }

      this.bookingData = allBookings;
      this.showLoader = false;

      this.bookingData.forEach((item) => {
        if (item.pay_trans_id) {
          this.successData.push(item);
        }
      });

      if (this.bookingData.length == 0) {
        this.message = 'You have not made any bookings yet';
        this.noBookings = true;
      }

      // Sort by reservation date (newest first)
      this.bookingData.sort((a, b) => {
        // Use the original timestamp if available, otherwise parse the formatted date
        const dateA = a.reservation_timestamp || new Date(a.reservation_date).getTime();
        const dateB = b.reservation_timestamp || new Date(b.reservation_date).getTime();
        return dateB - dateA;
      });
    }).catch((err) => {
      console.error('Error fetching bookings:', err);
      this.noBookings = true;
      this.showLoader = false;
      this.message = 'Error loading bookings. Please try again later.';
    });
  }

  // Transform new MongoDB booking data to match old PHP API structure
  transformBookingData(bookings: any[]): any[] {
    return bookings.map(booking => {
      // Get room names - handle both array and null/undefined
      let roomNames = 'N/A';
      if (Array.isArray(booking.rooms) && booking.rooms.length > 0) {
        const names = booking.rooms
          .map((r: any) => r?.roomName || r?.roomId || r?.roomNumber)
          .filter((name: any) => name); // Remove null/undefined
        roomNames = names.length > 0 ? names.join(', ') : 'N/A';
      }
      
      // Get cottage type names - handle both array and null/undefined
      let cottageNames = 'N/A';
      if (Array.isArray(booking.cottageTypes) && booking.cottageTypes.length > 0) {
        const names = booking.cottageTypes
          .map((c: any) => c?.name)
          .filter((name: any) => name); // Remove null/undefined
        cottageNames = names.length > 0 ? names.join(', ') : 'N/A';
      }

      // Get resort name - handle null/undefined
      const resortName = booking.resort?.resortName || 'Unknown Resort';

      // Format dates
      const formatDate = (date: string) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        booking_id: booking.bookingId,
        booking_type: 'room', // Mark as room booking
        rooms: {
          name: roomNames,
          cottage: cottageNames,
          restort: resortName
        },
        checkin: formatDate(booking.checkIn),
        checkout: formatDate(booking.checkOut),
        noof_guest: booking.guests || 0,
        noof_children: booking.children || 0,
        noof_extra_guest: booking.extraGuests || 0,
        total_payable_amt: booking.totalPayable || 0,
        food_preference: booking.rawSource?.foodPreference || '',
        reservation_date: formatDate(booking.reservationDate),
        reservation_timestamp: new Date(booking.reservationDate).getTime(),
        status: booking.status || 'Reserved',
        pay_status: booking.paymentStatus || 'Not Paid',
        pay_trans_id: booking.rawSource?.transactionId || '',
        pay_trans_date: booking.rawSource?.transactionDate || '',
        pay_trans_amt: booking.totalPayable || 0
      };
    });
  }

  // Transform tent booking data to match the same structure
  transformTentBookingData(bookings: any[]): any[] {
    return bookings.map(booking => {
      // Get tent spot name
      const tentSpotName = booking.tentSpot?.spotName || 'Tent Spot';
      
      // Get tent names
      let tentNames = 'N/A';
      if (Array.isArray(booking.tents) && booking.tents.length > 0) {
        const names = booking.tents
          .map((t: any) => t?.tentId || t?.name)
          .filter((name: any) => name);
        tentNames = names.length > 0 ? names.join(', ') : 'N/A';
      }

      // Format dates
      const formatDate = (date: string) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        booking_id: booking.bookingId,
        booking_type: 'tent', // Mark as tent booking
        rooms: {
          name: tentNames,
          cottage: 'Tent Camping',
          restort: tentSpotName
        },
        checkin: formatDate(booking.checkinDate),
        checkout: formatDate(booking.checkoutDate),
        noof_guest: booking.guests || 0,
        noof_children: booking.children || 0,
        noof_extra_guest: 0,
        total_payable_amt: booking.totalPayable || 0,
        food_preference: '',
        reservation_date: formatDate(booking.reservationDate),
        reservation_timestamp: new Date(booking.reservationDate).getTime(),
        status: booking.status || 'Reserved',
        pay_status: booking.paymentStatus || 'Not Paid',
        pay_trans_id: booking.rawSource?.transactionId || '',
        pay_trans_date: booking.rawSource?.transactionDate || '',
        pay_trans_amt: booking.totalPayable || 0
      };
    });
  }

  // Transform trek booking data to match the same structure
  transformTrekBookingData(bookings: any[]): any[] {
    return bookings.map(booking => {
      // Get trek spot names
      let spotNames = 'N/A';
      if (Array.isArray(booking.touristSpots) && booking.touristSpots.length > 0) {
        const names = booking.touristSpots
          .map((s: any) => s?.name)
          .filter((name: any) => name);
        spotNames = names.length > 0 ? names.join(', ') : 'N/A';
      }

      // Calculate total guests (adults + children across all spots)
      const totalGuests = booking.touristSpots?.reduce((sum: number, s: any) => {
        const adults = s.counts?.adults || 0;
        const children = s.counts?.children || 0;
        const guests = s.counts?.guests || (adults + children);
        return sum + guests;
      }, 0) || 0;

      // Calculate total cameras across all spots
      const totalCameras = booking.touristSpots?.reduce((sum: number, s: any) => {
        const cameras = s.counts?.cameras || 0;
        return sum + cameras;
      }, 0) || 0;

      // Format dates
      const formatDate = (date: string) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Use first spot's visit date
      const visitDate = booking.touristSpots?.[0]?.visitDate || booking.createdAt;

      return {
        booking_id: booking.bookingId,
        booking_type: 'trek', // Mark as trek booking
        touristSpots: booking.touristSpots, // Include full touristSpots array with images
        rooms: {
          name: spotNames,
          cottage: 'Trek Entry',
          restort: 'Tourist Spots'
        },
        checkin: formatDate(visitDate),
        checkout: formatDate(visitDate),
        noof_guest: totalGuests,
        noof_cameras: totalCameras,
        noof_children: 0,
        noof_extra_guest: 0,
        total_payable_amt: booking.totalPayable || 0,
        food_preference: '',
        reservation_date: formatDate(booking.reservationDate || booking.bookingDate),
        reservation_timestamp: new Date(booking.reservationDate || booking.bookingDate).getTime(),
        status: booking.status || 'Reserved',
        pay_status: booking.paymentStatus || 'Not Paid',
        pay_trans_id: booking.rawSource?.transactionId || '',
        pay_trans_date: booking.rawSource?.transactionDate || '',
        pay_trans_amt: booking.totalPayable || 0
      };
    });
  }

  generateCalendar(year: number, month: number): void {
    const date = new Date(year, month, 1);
    this.monthName = date.toLocaleString('default', { month: 'long' });
    this.days = [];

    while (date.getMonth() === month) {
      this.days.push({ date: date.getDate(), booked: Math.random() > 0.5 }); // Randomly mark days as booked/not booked
      date.setDate(date.getDate() + 1);
    }
  }

  sendEmail(item: any) {
    console.log(item);
    console.log(item.rooms.restort);
    let email;
    if (item.rooms.restort == 'Jungle Star, Valamuru') {
      email = 'junglestarecocamp@gmail.com';
    } else {
      email = 'info@vanavihari.com';
    }
    const subject = 'Subject Text';
    const body = 'Body Text';

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  sendWhatsApp(item: any): void {
    console.log(item);
    let phoneNumber;
    if (item.rooms.restort == 'Jungle Star, Valamuru') {
      phoneNumber = '7382151617';
    } else {
      phoneNumber = '9494151617';
    }
    const message = 'Hello, this is a predefined message!';
    window.location.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
  }

  confirmCancelAction() {
    this.confirmCancel = true;
  }

  // initializing cancel request.

  submitCancellationRequest() {
    console.log(this.cancellationReason);
  }

  // Function to download PDF
  downloadPdf() {
    const link = document.createElement('a');
    link.href = 'assets/PDF/Foodmenu.pdf'; // Path to your PDF file in the assets folder
    link.download = 'Foodmenu.pdf'; // Name of the downloaded file
    link.click();
  }

  callSupport(resort: any) {
    this.selectedResort = resort;
    if (this.selectedResort == 'Vanavihari, Maredumilli') {
      this.resortNumber = '+919494151623';
    }
    if (this.selectedResort == 'Jungle Star, Valamuru') {
      this.resortNumber = '+9173821 51617';
    }
    window.location.href = 'tel:' + this.resortNumber;
  }

  getRoomImages(roomname: any, bookingItem?: any): string[] {
    // For trek bookings, use actual spot images from the booking data
    if (bookingItem?.booking_type === 'trek' && bookingItem?.touristSpots) {
      const spotImages: string[] = [];
      
      // Collect images from all tourist spots in the booking
      bookingItem.touristSpots.forEach((spot: any) => {
        if (spot.images && Array.isArray(spot.images) && spot.images.length > 0) {
          // Add the first image from each spot
          spotImages.push(spot.images[0].url);
        }
      });
      
      // If we found spot images, return them
      if (spotImages.length > 0) {
        return spotImages;
      }
      
      // Fallback to default trek images if no spot images found
      return ['assets/img/MAREDUMILLI-waterfalls.jpg', 'assets/img/Rampa-falls.jpg'];
    }
    
    const lowercaseRoomName = roomname.toLowerCase();

    // Check if it's a trek booking (contains "trek" in the name) - fallback
    if (lowercaseRoomName.includes('trek') || lowercaseRoomName.includes('jalatarangi') || lowercaseRoomName.includes('rampa') || lowercaseRoomName.includes('nellore')) {
      // Return default trek/nature images
      return ['assets/img/MAREDUMILLI-waterfalls.jpg', 'assets/img/Rampa-falls.jpg'];
    }

    switch (lowercaseRoomName) {
      case 'panther':
        return this.galleryService.panther();
      case 'bahuda':
        return this.galleryService.bahuda();
      case 'bear':
        return this.galleryService.bear();
      case 'bonnet':
        return this.galleryService.bonnet();
      case 'bulbul':
        return this.galleryService.bulbul();
      case 'chital':
        return this.galleryService.chital();
      case 'chousingha':
        return this.galleryService.chousingha();
      case 'hornbill':
        return this.galleryService.hornbill();
      case 'kingfisher':
        return this.galleryService.kingfisher();
      case 'pamuleru':
        return this.galleryService.pamuleru();
      case 'narmada':
        return this.galleryService.narmada();
      case 'peacock':
        return this.galleryService.peacock();
      case 'redjunglefowl':
        return this.galleryService.redjunglefowl();
      case 'sambar':
        return this.galleryService.sambar();
      case 'sokuleru':
        return this.galleryService.sokuleru();
      case 'bear':
        return this.galleryService.bear();
      case 'tapathi':
        return this.galleryService.tapathi();
      case 'tribal':
        return this.galleryService.tribal();
      case 'woodpecker':
        return this.galleryService.woodpecker();
      case 'ambara':
        return this.galleryService.ambara();
      case 'aditya':
        return this.galleryService.aditya();
      case 'avani':
        return this.galleryService.avani();
      case 'aranya':
        return this.galleryService.aranya();
      case 'prakruti':
        return this.galleryService.prakruti();
      case 'prana':
        return this.galleryService.prana();
      case 'vanya':
        return this.galleryService.vanya();
      case 'agathi':
        return this.galleryService.agathi();
      case 'vennela':
        return this.galleryService.vennela();
      case 'jabilli':
        return this.galleryService.jabilli();
      default:
        return this.galleryService.panther();

      // Add more cases for other rooms as needed
    }
  }

  formatDate(dateStr: string): { day: string; month: string; year: string } {
    const date = new Date(dateStr);
    const day = date.getDate().toString();
    const month = this.getMonthName(date.getMonth());
    const year = date.getFullYear().toString();
    return { day, month, year };
  }

  getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month];
  }

  fetchRoomList() {
    interface ReservationDetails {
      checkin: string;
      noof_guest: number;
      noof_adult: number;
      noof_child: number;
      checkout: string;
      noof_rooms: number;
      rooms: {
        name: string;
        cottage: string;
        restort: string;
      };
    }

    // // Sample JSON object with the defined type
    const json: { [key: string]: ReservationDetails } = {
      0: {
        rooms: {
          name: 'Bonnet',
          cottage: 'Hill Top Guest House',
          restort: 'Vanavihari, Maredumilli',
        },
        checkin: '2024-03-03',
        noof_guest: 0,
        noof_adult: 2,
        noof_child: 0,
        checkout: '2024-03-19',
        noof_rooms: 1,
      },
      1: {
        rooms: {
          name: 'Bear',
          cottage: 'Pre-Fabricated Cottages',
          restort: 'Vanavihari, Maredumilli',
        },
        checkin: '2024-03-19',
        noof_guest: 0,
        noof_adult: 1,
        noof_child: 0,
        checkout: '2024-03-19',
        noof_rooms: 0,
      },
      2: {
        rooms: {
          name: 'CHOUSINGHA',
          cottage: 'Pre-Fabricated Cottages',
          restort: 'Vanavihari, Maredumilli',
        },
        checkin: '2024-03-13',
        noof_guest: 1,
        noof_adult: 5,
        noof_child: 2,
        checkout: '2024-03-13',
        noof_rooms: 0,
      },
    };
    const jsonArray = Object.keys(json).map((key) => {
      return json[key];
      return {
        id: key,
        ...json[key],
      };
    });

    // this.roomCards = this.mapRoomData(jsonArray, this.roomIds);

    // setTimeout(() => {
    //    this.loadingRooms = false;
    // }, 2000);
  }

  InitiateCancel(item: any) {
    localStorage.setItem('current_id', item.booking_id);
    localStorage.setItem('Payment_Transaction_Id', item.pay_trans_id);
    localStorage.setItem('Payment_Transaction_Date', item.pay_trans_date);
    localStorage.setItem('Payment_Transaction_Amt', item.pay_trans_amt);
    localStorage.setItem('booking_checkin', item.checkin);
    // this.router.navigateByUrl('cancel-request');
    this.showLoader = true

    setTimeout(() => {
      this.showLoader = false
      this.router.navigateByUrl('cancel-request');
    }, 2000);
  }

  isCheckinDateValid(checkinDateStr: string): boolean {
    const [year, month, day] = checkinDateStr.split('-').map(Number);
    const checkinDate = new Date(year, month - 1, day);

    // Get the current date
    const currentDate = this.currentDate;

    // Return true if the checkin date is greater than the current date
    return checkinDate > currentDate;
  }
}
