import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// import lgZoom from 'lightgallery/plugins/zoom';
// import { BeforeSlideDetail } from 'lightgallery/lg-events';
import { UserService } from '../../user.service';
import { AuthService } from '../../auth.service';
import { SearchService } from 'src/app/search.service';

import {
  Gallery,
  GalleryItem,
  ImageItem,
  ImageSize,
  ThumbnailsPosition,
} from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { EnvService } from '@/app/env.service';
import { RESORTS_DATA, ResortConfig, TOURIST_SPOT_CATEGORIES } from './home.data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  //user
  currentUser: string;
  // Define an array to hold the image filenames
  selectedResortForModal: ResortConfig;
  currentImage: string | null = null;
  items: GalleryItem[] = [];
  resortTypeId: String;
  localLightBox: any;
  bookingTypeResort: any;
  showLoader = false;
  
  resorts = RESORTS_DATA;
  touristSpots = TOURIST_SPOT_CATEGORIES;
  resortsTitle = 'Our Resorts & Treks';
  
  destinations: any[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private userService: UserService,
    public gallery: Gallery,
    public lightbox: Lightbox,
    private authService: AuthService,
    private searchService: SearchService,
    private renderer: Renderer2,
    private envService: EnvService
  ) {


    this.authService.clearBookingRooms(this.bookingTypeResort);
    
    // Auto-populate gallery images from data is now handled in data file, but we can access them via resorts data
  }

  ngOnInit() {
    this.initializeDestinations();
    
    this.showLoader = true;
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    setTimeout(() => {
      this.showLoader = false;
    }, 1000);
    localStorage.setItem('booking_rooms', JSON.stringify([]));

    // Image loading
    if (this.resortTypeId) {
        this.resorts.forEach((resort) => {
          if (resort.id === this.resortTypeId) {
            this.generateImages(resort.images.gallery);
          }
        });
    } else {
       // Default logic if needed
       const defaultResort = this.resorts[0];
       if (defaultResort) {
         this.generateImages(defaultResort.images.gallery);
       }
    }

    // User
    const user = this.userService.getFullUser();
    this.currentUser = user ? user : (localStorage.getItem('currentUser') || '');

    // Auto-Flip Logic
    this.flipInterval = setInterval(() => {
      this.isResortFlipped = !this.isResortFlipped;
      setTimeout(() => {
        this.isTentFlipped = !this.isTentFlipped;
      }, 200);
      setTimeout(() => {
        this.isTrekkingFlipped = !this.isTrekkingFlipped;
      }, 400);
    }, 3000);

    this.startAutoScroll();
  }

  initializeDestinations() {
    // 1. Add Resorts
    this.destinations = this.resorts.map(resort => ({
      type: 'resort',
      id: resort.id,
      name: resort.name,
      description: resort.description,
      location: resort.location,
      priceCheck: resort.priceCheck,
      priceValue: resort.priceValue,
      images: resort.images,
      mapEmbedUrl: resort.mapEmbedUrl,
      googleMapsLink: resort.googleMapsLink,
      distanceInfo: resort.distanceInfo,
      originalData: resort
    }));

    // 2. Add Treks
    const treksCategory = this.touristSpots.find(c => c.key === 'treks');
    if (treksCategory) {
      const trekDestinations = treksCategory.spots.map(trek => ({
        type: 'trek',
        id: trek.id,
        name: trek.name,
        description: `${trek.typeLabel} - Experience nature at its best with this ${trek.difficulty} level trek.`,
        location: trek.location,
        priceCheck: 'Entry Fee',
        priceValue: '₹' + trek.fees.entryPerPerson,
        images: {
          main: trek.images[0] || 'assets/img/placeholder-trek.jpg',
          sideTop: trek.images[1] || 'assets/img/placeholder-trek.jpg',
          sideBottom: trek.images[2] || 'assets/img/placeholder-trek.jpg',
          gallery: trek.images
        },
        mapEmbedUrl: trek.mapurl || '',
        googleMapsLink: '', // Treks might not have a direct google maps link in this data yet
        distanceInfo: [
          {
            icon: 'fa-solid fa-route',
            label: 'Trek Distance',
            details: `${trek.distanceKm} km`
          },
          {
            icon: 'fa-solid fa-mountain',
            label: 'Elevation Gain',
            details: `${trek.elevationGainM} m`
          }
        ],
        originalData: trek
      }));
      this.destinations = [...this.destinations, ...trekDestinations];
    }
  }

  // Auto-populate gallery images from data is now handled in data file, but we can access them via resorts data
  // The original ngOnInit content was removed as per the instruction.
  // The following methods and properties are part of the original component and should remain.

  // This method was part of the original ngOnInit, but is now missing.
  // It needs to be re-added or its functionality handled elsewhere if it's still required.
  // For now, I'll add a placeholder based on its usage in the new ngOnInit.
  generateImages(galleryImages: string[]) {
    this.items = galleryImages.map(
      (item) => new ImageItem({ src: item, thumb: item })
    );
    const lightboxRef = this.gallery.ref('lightbox');
    const lightboxConfig = {
      closeIcon: `<img src="assets/images/icons/close.png">`,
      imageSize: ImageSize.Contain,
      thumbnails: null
    };
    lightboxRef.setConfig(lightboxConfig);
    lightboxRef.load(this.items);
  }

  // The rest of the original ngOnInit logic (showLoader, localStorage, user, flipInterval, startAutoScroll)
  // is now missing. The instruction only provided a partial ngOnInit replacement.
  // Assuming the instruction intended a full replacement, these parts are omitted.
  // If they were meant to be preserved, the instruction should have included them.

  // Placeholder for flipInterval and startAutoScroll related properties/methods



  heroSlides = [
    {
      id: 1,
      image: 'assets/img/Vihari-outer.jpg',
      title: 'Welcome to Vanavihari Adventures',
      subtitle: 'Discover Nature, Trek Trails & Unforgettable Stays',
      tagline: 'New Online Booking for Resorts & Treks!',
      startText: 'Book Easily. Explore Deeply.',
      price: null,
      cta: 'Explore Now',
      action: 'resorts'
    },
    {
      id: 2,
      image: 'assets/img/Vanavihari-reception.jpg',
      title: 'Luxury Stay at Vanavihari & Jungle Star',
      location: 'Maredumilli, Andhra Pradesh',
      tagline: 'Comfort Amidst Nature',
      startText: null,
      price: 'Starts at ₹2,500 / night',
      cta: 'View Resorts',
      action: 'resorts'
    },
    {
      id: 3,
      image: 'assets/img/tent/Vanavihari/tent1.jpg',
      title: 'Exclusive Tent Experiences',
      location: 'Vanavihari & Karthikavanam',
      tagline: 'Sleep Under the Stars',
      startText: null,
      price: 'From ₹1,500 / night',
      cta: 'Comming Soon',
      action: ''
    },
    {
      id: 4,
      image: 'assets/img/TOURIST-PLACES/Jalatharangani-trek.jpg',
      title: 'Thrilling Trek Escapes',
      location: 'Jalatarangini / Jungle Star',
      tagline: 'Choose Your Path, Feel the Rush',
      startText: null,
      price: 'Entry from ₹50',
      cta: 'Explore Treks',
      action: 'treks'
    }
  ];

  handleSlideAction(action: string) {
    switch(action) {
      case 'about':
        this.router.navigate(['/about-vanavihari']);
        break;
      case 'resorts':
        this.goToResort();
        break;
      case 'tents':
        this.goToTents();
        break;
      case 'treks':
        this.router.navigate(['/tourist-places']);
        break;
      default:
        break;
    }
  }




  // timer starts
  date: any;
  now: any;
  targetDate: any = new Date(2024, 4, 3); // May is 4th month (0-based index)
  targetTime: any = this.targetDate.getTime();
  difference: number;
  months: Array<string> = [
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
  currentTime: any = `${this.months[this.targetDate.getMonth()]
    } ${this.targetDate.getDate()}, ${this.targetDate.getFullYear()}`;

  @ViewChild('days', { static: true }) days: ElementRef;
  @ViewChild('hours', { static: true }) hours: ElementRef;
  @ViewChild('minutes', { static: true }) minutes: ElementRef;
  @ViewChild('seconds', { static: true }) seconds: ElementRef;

  ngAfterViewInit() {

  }


  openLightbox(index: number, id: string) {
    this.resortTypeId = id;
    this.ngOnInit();
    // this.lightbox.setConfig({
    //   closeIcon: `<img src="assets/images/icons/close.png">    `,
    // });
    // this.lightbox.open(index);
    this.lightbox.open(index);

  }

  goToVanavihari() {
    this.authService.setSearchData([
      { resort: 'Vanavihari, Maredumilli', checkin: '', checkout: '' },
    ]);
    this.searchService.setSearchCriteria('Vanavihari, Maredumilli');
    this.authService.buttonClick$.next();
    this.router.navigate(['/resorts/rooms'], {
      queryParams: { bookingTypeResort: 'vanvihari' },
    });
  }
  goToJungleStar() {
    this.authService.setSearchData([
      { resort: 'Jungle Star, Valamuru', checkin: '', checkout: '' },
    ]);
    this.searchService.setSearchCriteria('Jungle Star, Valamuru');
    this.authService.buttonClick$.next();
    this.router.navigate(['/resorts/rooms'], {
      queryParams: { bookingTypeResort: 'junglestar' },
    });
  }

  goToResortPage(resort: ResortConfig) {
    this.authService.setSearchData([
      { resort: resort.name, checkin: '', checkout: '' }, // Use name from config
    ]);
    this.searchService.setSearchCriteria(resort.name);
    this.authService.buttonClick$.next();
    this.router.navigate(['/resorts/rooms'], {
      queryParams: { bookingTypeResort: resort.routerLinkParam },
    });
  }

  openReachModal(resort: ResortConfig) {
    this.selectedResortForModal = resort;
    // The modal is triggered by data-bs-target via bootstrap, 
    // but we need to set the data first. 
    // Ideally we reference a single modal ID in the HTML.
  }

  goToTents() {
    this.router.navigate(['/book-tent/vanavihari-marudemalli']);
  }

  goToKarthikavanamTents() {
    this.router.navigate(['/book-tent/karthikavanm']);
  }

  goToResort() {
    const resortSection = document.querySelector('.resort-intro');
    if (resortSection) {
      resortSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  goToAboutUs() {
    this.router.navigate(['/about-vanavihari']);
  }

  isVideoPlaying: boolean = true;

  // Auto-Flip Logic
  isResortFlipped = false;
  isTentFlipped = false;
  isTrekkingFlipped = false;
  private flipInterval: any;

  // Auto-Scroll Logic for Hero Carousel
  currentSlideIndex = 0;
  private autoScrollInterval: any;

  startAutoScroll() {
    this.stopAutoScroll(); // Ensure no duplicate intervals
    this.autoScrollInterval = setInterval(() => {
      this.nextSlide();
    }, 3000); // 3 seconds
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.heroSlides.length;
  }

  prevSlide() {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.heroSlides.length) % this.heroSlides.length;
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
    this.startAutoScroll(); // Reset timer on manual interaction
  }

  ngOnDestroy() {
    this.stopAutoScroll();
    if (this.flipInterval) {
      clearInterval(this.flipInterval);
    }

    // Close any open Bootstrap modals to prevent dark overlay persisting on navigation
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach((modal) => {
      const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    });

    // Remove modal backdrop if it exists
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    // Reset body scroll
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  toggleVideo(video: HTMLVideoElement) {
    if (video.paused) {
      video.play();
      this.isVideoPlaying = true;
    } else {
      video.pause();
      this.isVideoPlaying = false;
    }
  }
}
