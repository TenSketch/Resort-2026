import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Lightbox } from 'ng-gallery/lightbox';
import { Gallery, GalleryItem, ImageItem, ImageSize } from 'ng-gallery';

export interface TouristAddOn {
  id: string;
  label: string;
  price?: number | string;
}

export interface TouristBookingSelection {
  name: string;
  location: string;
  type?: string;
  counts: {
    adults: number;
    children: number;
    vehicles: number;
    cameras: number;
    twoWheelers?: number;
    fourWheelers?: number;
  };
  addOns: string[]; // ids of selected addons
}

@Component({
  selector: 'app-tourist-spot-selection',
  templateUrl: './tourist-spot-selection.component.html',
  styleUrls: ['./tourist-spot-selection.component.scss'],
})
export class TouristSpotSelectionComponent {
  @Input() category?: string;
  @Input() name = '';
  @Input() location = '';
  @Input() type?: string;
  @Input() images: string[] = [];

  // Quick info
  @Input() entryFee?: string | number;
  @Input() parkingFee?: string | number;
  @Input() cameraFee?: string | number;
  @Input() fees?: { entryPerPerson?: number; parkingPerVehicle?: number; cameraPerCamera?: number; parkingTwoWheeler?: number; parkingFourWheeler?: number };
  @Input() ticketsLeftToday?: number;
  @Input() isSoldOut = false;

  // New fields
  @Input() difficulty?: string;
  @Input() distance?: string | number;
  @Input() elevationGain?: string | number;

  // Add-ons
  @Input() addOns: TouristAddOn[] = [];

  // Routing for details
  @Input() detailsLink: any[] | string = ['/tourist-destination'];
  @Input() detailsFragment?: string;
  // Should details open in a new tab? Default false for backwards compatibility
  @Input() openInNewTab = false;

  // Search state - controls whether "Add" button is enabled
  @Input() isSearchPerformed = false;

  @Output() addToBooking = new EventEmitter<TouristBookingSelection>();

  // Form state
  // Start adults at 0 per request; Add-to-booking will remain guarded until at least 1 adult
  adults = 1;
  children = 0;
  vehicles = 0;
  cameras = 0;
  twoWheelers = 0;
  fourWheelers = 0;
  selectedAddOnIds = new Set<string>();

  // Lightbox items
  items: GalleryItem[] = [];

  // Carousel state
  @ViewChild('cardContainer') cardContainer!: ElementRef;

  constructor(
    public lightbox: Lightbox,
    public gallery: Gallery,
    private router: Router,
    private locationSvc: Location
  ) { }

  private toNumber(val: unknown): number | undefined {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const n = parseInt(val.replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? undefined : n;
    }
    return undefined;
  }

  get unitEntry(): number | undefined {
    return this.fees?.entryPerPerson ?? this.toNumber(this.entryFee);
  }
  get unitParking(): number | undefined {
    return this.fees?.parkingPerVehicle ?? this.toNumber(this.parkingFee);
  }
  get parkingTwoWheeler(): number | undefined {
    return this.fees?.parkingTwoWheeler;
  }
  get parkingFourWheeler(): number | undefined {
    return this.fees?.parkingFourWheeler;
  }
  get unitCamera(): number | undefined {
    return this.fees?.cameraPerCamera ?? this.toNumber(this.cameraFee);
  }

  // Note: children input is hidden in the UI; keep children property for compatibility but
  // count only adults as 'people' for booking and estimation.
  get peopleCount(): number { return (this.adults || 0); }
  get addOnsTotal(): number {
    let total = 0;
    this.addOns.forEach(a => {
      if (this.selectedAddOnIds.has(a.id) && typeof a.price === 'number') total += a.price;
    });
    return total;
  }
  get estimatedTotal(): number | undefined {
    const e = this.unitEntry, p = this.unitParking, c = this.unitCamera;
    const p2 = this.parkingTwoWheeler, p4 = this.parkingFourWheeler;

    if (e === undefined && p === undefined && c === undefined && p2 === undefined && p4 === undefined && this.addOnsTotal === 0) return undefined;

    let parkingTotal = 0;
    if (p2 !== undefined && p4 !== undefined) {
      // Use split parking
      parkingTotal = (p2 || 0) * (this.twoWheelers || 0) + (p4 || 0) * (this.fourWheelers || 0);
    } else {
      // Use generic parking
      parkingTotal = (p || 0) * (this.vehicles || 0);
    }

    const base = (e || 0) * this.peopleCount + parkingTotal + (c || 0) * (this.cameras || 0);
    return base + this.addOnsTotal;
  }

  inc(field: 'adults' | 'children' | 'vehicles' | 'cameras' | 'twoWheelers' | 'fourWheelers') { (this as any)[field] = ((this as any)[field] || 0) + 1; }
  dec(field: 'adults' | 'children' | 'vehicles' | 'cameras' | 'twoWheelers' | 'fourWheelers') {
    const next = Math.max(0, ((this as any)[field] || 0) - 1);
    // allow adults to go to zero; the template will disable add-to-booking until adults >= 1
    (this as any)[field] = next;
  }

  toggleAddOn(id: string, checked: boolean) {
    if (checked) this.selectedAddOnIds.add(id);
    else this.selectedAddOnIds.delete(id);
  }

  onAddToBooking() {
    if (this.peopleCount <= 0) {
      // Guard: require at least one person
      return;
    }
    const payload: TouristBookingSelection = {
      name: this.name,
      location: this.location,
      type: this.type,
      counts: {
        adults: this.adults || 0,
        children: this.children || 0,
        vehicles: this.vehicles || 0,
        cameras: this.cameras || 0,
        twoWheelers: this.twoWheelers || 0,
        fourWheelers: this.fourWheelers || 0,
      },
      addOns: Array.from(this.selectedAddOnIds),
    };
    this.addToBooking.emit(payload);
  }

  get detailsHref(): string {
    const link = Array.isArray(this.detailsLink) ? this.detailsLink : [this.detailsLink];
    const tree = this.router.createUrlTree(link, { fragment: this.detailsFragment });
    // serializeUrl returns path like '/tourist-destination#jalatarangini'.
    // prepareExternalUrl adds the configured base/hashing strategy so the final output is '/#/tourist-destination#jalatarangini'.
    return this.locationSvc.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  setGalleryData(index: number) {
    this.items = this.images.map(
      (item) => new ImageItem({ src: item, thumb: item })
    );

    const lightboxRef = this.gallery.ref('tourist-spot-lightbox');

    const lightboxConfig = {
      closeIcon: `<img src="assets/images/icons/close.png">`,
      imageSize: ImageSize.Contain,
      thumbnails: null,
    };

    lightboxRef.setConfig(lightboxConfig);
    lightboxRef.load(this.items);
    this.lightbox.open(index, 'tourist-spot-lightbox');
  }

  openLightbox(index: number) {
    this.setGalleryData(index);
  }

  scrollLeft() {
    if (this.cardContainer && this.cardContainer.nativeElement) {
      const container = this.cardContainer.nativeElement as HTMLElement;
      const offset = Math.round(container.clientWidth * 0.7) || 200;
      container.scrollTo({ left: container.scrollLeft - offset, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.cardContainer && this.cardContainer.nativeElement) {
      const container = this.cardContainer.nativeElement as HTMLElement;
      const offset = Math.round(container.clientWidth * 0.7) || 200;
      container.scrollTo({ left: container.scrollLeft + offset, behavior: 'smooth' });
    }
  }
}
