import { Component, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TentService } from '../../services/tent.service';
import { TentSpotService } from '../../services/tent-spot.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Lightbox } from 'ng-gallery/lightbox';
import { Gallery, GalleryItem, ImageItem, ImageSize } from 'ng-gallery';

interface Tent {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  capacity: number;
  maxChildren?: number;
  image?: string;
  images?: string[];
  price?: number;
  accommodationType?: string;
  brand?: string;
  tentBase?: string;
  amenities?: string[];
}

interface ResortInfo {
  title: string;
  about: string;
}

@Component({
  selector: 'app-book-tent',
  templateUrl: './book-tent.component.html',
  styleUrls: ['./book-tent.component.scss']
})
export class BookTentComponent implements OnInit {
  resortKey: string = 'vanavihari';
  resortTitle: string = '';
  tents: Tent[] = [];
  selectedResortInfo: ResortInfo | null = null;
  selectedTentSpotId: string = '';
  selectedTentSpotName: string = '';
  searchCriteria: any = null;
  isSearchPerformed: boolean = false;
  isLoadingTents: boolean = false;
  // mimic test-room flags
  isMobile: boolean = false;
  bookedTents: any[] = [];
  private bookingStorageKey = 'booking_tents';
  @ViewChildren('cardContainer') cardContainers!: QueryList<ElementRef>;
  
  // Guest and children selection
  selectedGuestsValues: { [key: string]: number } = {};
  selectedChildrenValues: { [key: string]: number } = {};
  
  // Lightbox gallery items
  items: GalleryItem[] = [];
  currentTentId: string = '';

  ngAfterViewInit() {
    // nothing for now, placeholders accessible via cardContainers
  }

  constructor(
    private route: ActivatedRoute,
    private tentService: TentService,
    private tentSpotService: TentSpotService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    public lightbox: Lightbox,
    public gallery: Gallery
  ) { }

  ngOnInit(): void {
    // Subscribe to route parameter changes to handle navigation between tent spots
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') || '';
      
      // Clear existing data when slug changes
      this.tents = [];
      this.isSearchPerformed = false;
      this.searchCriteria = null;
      this.selectedTentSpotId = '';
      this.selectedTentSpotName = '';
      this.isLoadingTents = false;
      
      // Load tent spot by slug and auto-select it
      if (slug) {
        this.loadTentSpotBySlug(slug);
      } else {
        // No slug provided, show default state
        this.selectedResortInfo = {
          title: 'Tent Booking',
          about: 'Select a tent spot to view available tents.'
        };
      }
    });
    
    // load persisted booking (if any)
    this.loadBookingSummary();

    // detect mobile layout
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });

    // compute booking summary top offset (so it sits below the fixed navbar)
    this.updateBookingSummaryTop();
    // recalc on resize to handle responsive navbar height
    window.addEventListener('resize', this.updateBookingSummaryTop);
  }

  private loadTentSpotBySlug(slug: string): void {
    this.isLoadingTents = true;
    this.tentSpotService.getTentSpotBySlug(slug).subscribe({
      next: (response) => {
        if (response.success && response.tentSpot) {
          const spot = response.tentSpot;
          this.selectedTentSpotId = spot._id;
          this.selectedTentSpotName = spot.spotName;
          
          // Map slug to resortKey for backward compatibility with maps
          if (slug.includes('vanavihari')) {
            this.resortKey = 'vanavihari';
          } else if (slug.includes('karthikavanam')) {
            this.resortKey = 'karthikavanm';
          } else {
            this.resortKey = slug;
          }
          
          this.resortTitle = spot.spotName;
          this.selectedResortInfo = {
            title: spot.spotName,
            about: spot.rules || `${spot.spotName} offers eco-friendly tent stays in ${spot.location}.`
          };
          
          // Load all tents for this spot (without date filtering)
          this.loadAllTentsForSpot(spot._id);
        }
      },
      error: (err) => {
        this.isLoadingTents = false;
        console.error('Failed to load tent spot by slug', err);
        // Fallback to default
        this.selectedResortInfo = {
          title: 'Tent Booking',
          about: 'Select a tent spot to view available tents.'
        };
      }
    });
  }

  private loadAllTentsForSpot(tentSpotId: string): void {
    this.isLoadingTents = true;
    this.tentService.getTentsBySpot(tentSpotId).subscribe({
      next: (response) => {
        this.isLoadingTents = false;
        if (response.success) {
          this.tents = (response.tents || []).map((t: any) => this.enrichTentWithImages(t));
        }
      },
      error: (err) => {
        this.isLoadingTents = false;
        console.error('Failed to load tents for spot', err);
        this.tents = [];
      }
    });
  }

  ngOnDestroy(): void {
    // cleanup listener
    try { window.removeEventListener('resize', this.updateBookingSummaryTop); } catch { }
  }

  /**
   * Compute the fixed navbar height and expose it as a CSS variable
   * so .booking-summary-bar can use it as `top` value and sit below the nav.
   */
  private updateBookingSummaryTop = (): void => {
    try {
      const nav = document.querySelector('nav.navbar.fixed-top') as HTMLElement | null;
      const height = nav ? Math.ceil(nav.getBoundingClientRect().height) : 100;
      // add a small extra gap (4px) so the summary doesn't touch the navbar
      const offset = height + 4;
      document.documentElement.style.setProperty('--booking-summary-top', `${offset}px`);
    } catch (e) {
      // fallback: set a default
      document.documentElement.style.setProperty('--booking-summary-top', `100px`);
    }
  }

  /**
   * Open lightbox gallery for a specific tent at the given image index
   */
  openLightbox(index: number, tentId: string) {
    this.currentTentId = tentId;
    this.setGalleryData(index, tentId);
  }
  
  /**
   * Set up gallery data for the lightbox
   */
  setGalleryData(index: number, tentId: string) {
    const tent = this.tents.find(t => t.id === tentId);
    if (!tent || !tent.images) return;
    
    this.items = tent.images.map(
      (imageUrl) => new ImageItem({ src: imageUrl, thumb: imageUrl })
    );

    const lightboxRef = this.gallery.ref('lightbox');

    const lightboxConfig = {
      closeIcon: `<img src="assets/images/icons/close.png">`,
      imageSize: ImageSize.Contain,
      thumbnails: null,
    };

    lightboxRef.setConfig(lightboxConfig);
    lightboxRef.load(this.items);
    this.lightbox.open(index);
  }

  // --- Booking summary helpers (adapted from tourist spots) ---
  private persistBooking() {
    localStorage.setItem(this.bookingStorageKey, JSON.stringify(this.bookedTents));
  }

  loadBookingSummary() {
    const raw = localStorage.getItem(this.bookingStorageKey);
    try {
      this.bookedTents = raw ? JSON.parse(raw) : [];
      // Restore guest and children selections
      this.bookedTents.forEach((tent: any) => {
        if (tent.selectedGuests) this.selectedGuestsValues[tent.id] = tent.selectedGuests;
        if (tent.selectedChildren !== undefined) this.selectedChildrenValues[tent.id] = tent.selectedChildren;
      });
    } catch {
      this.bookedTents = [];
    }
  }

  onSearchSubmitted(criteria: { tentSpotId: string; checkinDate: string; checkoutDate: string }): void {
    this.searchCriteria = criteria;
    this.selectedTentSpotId = criteria.tentSpotId;
    this.isSearchPerformed = true;
    this.isLoadingTents = true;

    // Get tent spot details and update resort info
    this.tentSpotService.getTentSpotById(criteria.tentSpotId).subscribe({
      next: (response) => {
        if (response.success && response.tentSpot) {
          const spot = response.tentSpot;
          this.selectedTentSpotName = spot.spotName;
          
          // Update resort info when search is performed
          this.selectedResortInfo = {
            title: spot.spotName,
            about: spot.rules || `${spot.spotName} offers eco-friendly tent stays in ${spot.location}.`
          };
          
          // Update resortKey for map display
          const slug = spot.slugUrl || '';
          if (slug.includes('vanavihari')) {
            this.resortKey = 'vanavihari';
          } else if (slug.includes('karthikavanam')) {
            this.resortKey = 'karthikavanm';
          } else {
            this.resortKey = slug;
          }
        }
      },
      error: (err) => console.error('Failed to load tent spot details', err)
    });

    // Load available tents
    this.tentService.getAvailableTents(
      criteria.tentSpotId,
      criteria.checkinDate,
      criteria.checkoutDate
    ).subscribe({
      next: (response) => {
        this.isLoadingTents = false;
        if (response.success) {
          this.tents = (response.tents || []).map((t: any) => this.enrichTentWithImages(t));
        }
      },
      error: (err) => {
        this.isLoadingTents = false;
        console.error('Failed to load available tents', err);
        this.tents = [];
      }
    });
  }

  private enrichTentWithImages(tent: any): Tent {
    let images: string[] = [];
    
    // Check if tent has images array from Cloudinary
    if (tent.images && Array.isArray(tent.images) && tent.images.length > 0) {
      images = tent.images.map((img: any) => img.url || img).filter((url: string) => url);
    }
    
    // Fallback to old image structure if no Cloudinary images
    if (images.length === 0) {
      const base = tent.image || '';
      let folder = '';
      
      if (base) {
        folder = base.substring(0, base.lastIndexOf('/') + 1);
      } else {
        folder = `/assets/img/tent/${this.resortKey}/`;
      }
      
      images = [
        `${folder}tent1.jpg`,
        `${folder}tent2.jpg`,
        `${folder}tent3.jpg`,
        `${folder}tent4.jpg`,
      ];
    }
    
    // Add default placeholder images based on tent type if still no images
    if (images.length === 0) {
      const isTwoPerson = (tent.tentType?.tentType || tent.name || '').toLowerCase().includes('2 person');
      const isFourPerson = (tent.tentType?.tentType || tent.name || '').toLowerCase().includes('4 person');
      
      if (isTwoPerson) {
        const sharedFolder = `/assets/images/Tent/2 person/`;
        images = [
          `${sharedFolder}Gemini_Generated_Image_93fsiz93fsiz93fs.png`,
          `${sharedFolder}Screenshot 2025-10-07 202154.png`,
          `${sharedFolder}Screenshot 2025-10-07 202203.png`,
        ];
      } else if (isFourPerson) {
        const sharedFolder4 = `/assets/images/Tent/4 person/`;
        images = [
          `${sharedFolder4}Screenshot 2025-10-07 203154.png`,
          `${sharedFolder4}Screenshot 2025-10-07 203158.png`,
          `${sharedFolder4}Screenshot 2025-10-07 203202.png`,
        ];
      }
    }
    
    return {
      id: tent._id,
      name: tent.tentType?.tentType || tent.tentId || 'Tent',
      capacity: tent.noOfGuests || 2,
      maxChildren: tent.noOfChildren || tent.noOfGuests || 2,
      images,
      price: tent.rate,
      accommodationType: tent.tentType?.accommodationType || 'Camping Tent',
      brand: tent.tentType?.brand || 'Decathlon',
      tentBase: tent.tentType?.tentBase || 'Concrete',
      amenities: tent.tentType?.amenities || [],
    } as Tent;
  }

  addTentToBooking(tent: any) {
    if (!this.isSearchPerformed) {
      alert('Select a tent spot and dates first');
      return;
    }

    const existing = this.bookedTents.findIndex((b: any) => b.id === tent.id);
    const booked = {
      id: tent.id,
      name: tent.name || 'Tent',
      capacity: tent.capacity || 2,
      maxChildren: tent.maxChildren || tent.capacity || 2,
      price: Number(tent.price) || 0,
      total: Number(tent.price) || 0,
      tentSpotId: this.selectedTentSpotId,
      tentSpotName: this.selectedTentSpotName,
      checkinDate: this.searchCriteria.checkinDate,
      checkoutDate: this.searchCriteria.checkoutDate,
      selectedGuests: 1,
      selectedChildren: 0
    };
    if (existing >= 0) {
      this.bookedTents.splice(existing, 1, booked);
    } else {
      this.bookedTents = [...this.bookedTents, booked];
    }
    // Initialize selection values
    this.selectedGuestsValues[tent.id] = 1;
    this.selectedChildrenValues[tent.id] = 0;
    this.persistBooking();
    this.showAddedToBookingFeedback(booked.name);
  }

  removeTent(index: number) {
    const tent = this.bookedTents[index];
    if (tent) {
      delete this.selectedGuestsValues[tent.id];
      delete this.selectedChildrenValues[tent.id];
    }
    this.bookedTents.splice(index, 1);
    this.bookedTents = [...this.bookedTents];
    this.persistBooking();
  }

  get grandTotal(): number {
    return this.bookedTents.reduce((sum, t) => sum + (Number(t.total) || Number(t.price) || 0), 0);
  }

  // Guest selection methods
  onGuestsChange(tentId: string, value: number) {
    this.selectedGuestsValues[tentId] = value;
    const tent = this.bookedTents.find((t: any) => t.id === tentId);
    if (tent) {
      tent.selectedGuests = value;
      this.persistBooking();
    }
  }

  onChildrenChange(tentId: string, value: number) {
    this.selectedChildrenValues[tentId] = value;
    const tent = this.bookedTents.find((t: any) => t.id === tentId);
    if (tent) {
      tent.selectedChildren = value;
      this.persistBooking();
    }
  }

  getGuestOptions(tent: any): number[] {
    const max = tent.capacity || 2;
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  getChildrenOptions(tent: any): number[] {
    const max = tent.maxChildren || tent.capacity || 2;
    return Array.from({ length: max + 1 }, (_, i) => i); // 0 to max
  }

  isGuestSelectEmpty(): boolean {
    return this.bookedTents.some((tent: any) => !this.selectedGuestsValues[tent.id]);
  }

  getTotalGuests(): number {
    return Object.values(this.selectedGuestsValues).reduce((sum, val) => sum + (val || 0), 0);
  }

  getTotalChildren(): number {
    return Object.values(this.selectedChildrenValues).reduce((sum, val) => sum + (val || 0), 0);
  }

  proceedToCheckout() {
    if (this.bookedTents.length === 0) return;
    if (this.isGuestSelectEmpty()) {
      alert('Select number of guests for all tents');
      return;
    }
    
    // Get the first tent's data for tent spot info
    const firstTent = this.bookedTents[0];
    
    // Store complete booking data for checkout
    const bookingData = {
      tents: this.bookedTents.map(tent => ({
        id: tent.id,
        name: tent.name,
        tentTypeName: tent.name,
        tentId: tent.id,
        capacity: tent.capacity,
        maxChildren: tent.maxChildren,
        price: tent.price,
        selectedGuests: this.selectedGuestsValues[tent.id] || 1,
        selectedChildren: this.selectedChildrenValues[tent.id] || 0
      })),
      tentSpotId: firstTent.tentSpotId || this.selectedTentSpotId,
      tentSpotName: firstTent.tentSpotName || this.selectedTentSpotName,
      tentSpotLocation: this.selectedResortInfo?.about || '',
      checkinDate: firstTent.checkinDate || this.searchCriteria?.checkinDate,
      checkoutDate: firstTent.checkoutDate || this.searchCriteria?.checkoutDate,
      total: this.grandTotal,
      guests: this.getTotalGuests(),
      children: this.getTotalChildren(),
      numberOfTents: this.bookedTents.length,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('tentsBooking', JSON.stringify(bookingData));
    
    // Clear the booking summary after storing checkout data
    localStorage.removeItem(this.bookingStorageKey);
    this.bookedTents = [];
    
    // Navigate to checkout
    try {
      this.router.navigate(['/tent-checkout']);
    } catch (e) {
      console.log('Proceeding to checkout', bookingData);
    }
  }

  private showAddedToBookingFeedback(name: string) {
    const feedback = document.createElement('div');
    feedback.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-5';
    feedback.style.zIndex = '9999';
    feedback.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i>${name} added to booking!`;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }

  scrollLeft(index: number) {
    const el = this.cardContainers?.toArray()[index];
    if (el && el.nativeElement) {
      const container = el.nativeElement as HTMLElement;
      const offset = Math.round(container.clientWidth * 0.7) || 200;
      container.scrollTo({ left: container.scrollLeft - offset, behavior: 'smooth' });
    }
  }

  scrollRight(index: number) {
    const el = this.cardContainers?.toArray()[index];
    if (el && el.nativeElement) {
      const container = el.nativeElement as HTMLElement;
      const offset = Math.round(container.clientWidth * 0.7) || 200;
      container.scrollTo({ left: container.scrollLeft + offset, behavior: 'smooth' });
    }
  }

  // Booking summary logic removed (booking state handled elsewhere now)

  /**
   * Build a list of amenity items for display with icons.
   * The count for some items is based on the tent's capacity.
   */
  getAmenityItems(tent: Tent): { icon?: string; img?: string; text: string }[] {
    const cap = Number(tent.capacity) || 2;
    return [
      { icon: 'fas fa-bed', text: 'Beds' },
      { icon: 'fas fa-head-side-cough', text: 'Pillows' },
      { icon: 'fas fa-bed', text: 'Bed sheets' },
      { img: '/assets/icons/comforter.svg', icon: 'fas fa-blanket', text: 'Comforters' },
      { icon: 'fas fa-bath', text: 'Towels' },
      { icon: 'fas fa-chair', text: 'Chairs' }
    ];
  }
}
