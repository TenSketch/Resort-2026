import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TouristBookingSelection } from '../../shared/tourist-spot-selection/tourist-spot-selection.component';
import { TouristSpotCategory, TouristSpotConfig } from './tourist-spots.data';
import { TouristSpotService } from '../../services/tourist-spot.service';

export interface BookedTouristSpot {
  id: string;
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
  unitPrices: {
    entry: number;
    parking: number;
    camera: number;
    parkingTwoWheeler?: number;
    parkingFourWheeler?: number;
  };
  breakdown: {
    entry: number;
    parking: number;
    camera: number;
    addOns: number;
  };
  total: number;
  peopleCount: number;
  addOns: string[];
}

interface CategoryFilter {
  label: string;
  value: string;
  selected: boolean;
}

interface TimeFilter {
  label: string;
  value: string;
}

@Component({
  selector: 'app-tourist-spots-booking',
  templateUrl: './tourist-spots-booking.component.html',
  styleUrls: ['./tourist-spots-booking.component.scss']
})
export class TouristSpotsBookingComponent implements AfterViewInit, OnDestroy {
  bookedSpots: BookedTouristSpot[] = [];
  categories: TouristSpotCategory[] = [];
  filteredCategories: TouristSpotCategory[] = [];

  // Search state
  isSearchPerformed: boolean = false;
  searchCriteria: any = null;
  isLoadingSpots: boolean = false;

  // Accordion state
  isBookingSummaryExpanded: boolean = true;
  isFiltersExpanded: boolean = true;
  panelOpenState: boolean = false;
  isMobile: boolean = false;

  // Filter options
  categoryFilters: CategoryFilter[] = [
    { label: 'Waterfalls', value: 'Waterfall', selected: false },
    { label: 'Picnic Spots', value: 'Picnic', selected: false },
    { label: 'Eco Attractions', value: 'Eco', selected: false },
    { label: 'Trekking Trails', value: 'Trek', selected: false },
    { label: 'View Points', value: 'ViewPoint', selected: false }
  ];

  timeFilters: TimeFilter[] = [
    { label: 'All Time Durations', value: 'all' },
    { label: 'Morning to Afternoon', value: 'morning-afternoon' },
    { label: 'Morning to Evening', value: 'morning-evening' },
    { label: 'Morning and Evening', value: 'morning-and-evening' }
  ];

  selectedTimeFilter: string = 'all';

  // Flatten map for quick lookup usage (e.g., pricing)
  private spotMap: { [id: string]: TouristSpotConfig } = {};

  private storageKey = 'touristSpots_currentBooking';

  // Hero slideshow state
  heroImages: string[] = [];
  activeSlide: number = 0;
  private slideIntervalMs: number = 3000; // 3s per slide (user requested)
  private slideTimer: any = null;

  constructor(
    private router: Router,
    private breakpointObserver: BreakpointObserver
    ,
    private touristSpotService: TouristSpotService
  ) {
    // Load persisted state if present
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        this.bookedSpots = JSON.parse(raw) || [];
      } catch {
        this.bookedSpots = [];
      }
    }
    // Load all spots initially but keep Add button disabled until search
    this.loadTouristSpots()
      .then(() => {
        // Rebuild category filters dynamically
        this.categoryFilters = this.categories.map(c => ({
          label: c.title,
          value: c.key,
          selected: false
        }));

        this.applyFilters();
        this.initHeroImages();
        this.startAutoplay();
      })
      .catch(err => {
        console.warn('Failed to load tourist spots from backend', err);
        this.applyFilters();
        this.initHeroImages();
        this.startAutoplay();
      });

    // Detect mobile breakpoint
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  ngAfterViewInit(): void {
    // ensure autoplay started after view init
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private initHeroImages() {
    // Use default placeholder images initially
    this.heroImages = [
      'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls.jpg',
      'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls.jpg',
      'assets/img/TOURIST-PLACES/MPCA.jpg'
    ];

    // If categories are loaded, collect images from spots
    if (this.categories.length > 0) {
      const imgs: string[] = [];
      this.categories.forEach(cat => {
        cat.spots.forEach(s => {
          if (s.images && s.images.length) {
            imgs.push(s.images[0]);
          }
        });
      });

      // Deduplicate and keep up to 6 images
      const collected = Array.from(new Set(imgs)).slice(0, 6);
      if (collected.length > 0) {
        this.heroImages = collected;
      }
    }
  }

  private async loadTouristSpots(): Promise<void> {
    try {
      const resp: any = await firstValueFrom(this.touristSpotService.getAllTouristSpots());
      const list: any[] = Array.isArray(resp?.touristSpots) ? resp.touristSpots : [];

      // Map backend spots to TouristSpotConfig and group by category
      const groups: { [key: string]: TouristSpotConfig[] } = {};
      const categoryTitles: { [key: string]: string } = {};

      for (const s of list) {
        const id = s._id || s.slug || String(Math.random()).slice(2, 8);
        const rawCategory = s.category || 'Other';
        // Normalize key for grouping
        const catKey = rawCategory.toLowerCase().trim();

        // Store title if not set (first encounter wins, or valid casing)
        if (!categoryTitles[catKey]) categoryTitles[catKey] = rawCategory;

        const cfg: TouristSpotConfig = {
          id,
          name: s.name || s.title || 'Untitled',
          location: s.address || '',
          category: rawCategory as any, // Allow dynamic string
          typeLabel: s.category || '',
          images: Array.isArray(s.images) ? s.images.map((i: any) => typeof i === 'string' ? i : (i.url || '')) : [],
          fees: {
            entryPerPerson: Number(s.entryFees || 0),
            parkingPerVehicle: Number(s.parking2W || s.parking || 0),
            cameraPerCamera: Number(s.cameraFees || 0),
            parkingTwoWheeler: s.parking2W ? Number(s.parking2W) : undefined,
            parkingFourWheeler: s.parking4W ? Number(s.parking4W) : undefined,
          },
          addOns: [], // Backend doesn't seem to return addOns yet, keep empty or map if added
          timing: 'morning-evening', // Default, logic to map from backend if available
          detailsFragment: s.slug || undefined, // Use slug as the section ID
          difficulty: undefined,
          distanceKm: undefined,
          elevationGainM: undefined,
          ticketsLeftToday: s.ticketsLeftToday ?? undefined
        };

        if (!groups[catKey]) groups[catKey] = [];
        groups[catKey].push(cfg);
        // set map
        this.spotMap[cfg.id] = cfg;
      }

      // Build categories array
      const built: TouristSpotCategory[] = [];
      const knownIcons: any = {
        'waterfall': '🌊',
        'picnic': '🏞️',
        'trek': '🥾',
        'trekking': '🥾',
        'viewpoint': '🌅',
        'eco': '🌿',
        'temple': '🛕'
      };

      // Preferred order
      const preferred = ['waterfall', 'picnic', 'trek', 'viewpoint', 'eco'];

      // Add preferred first
      for (const k of preferred) {
        // match exact or partial
        const matchedKey = Object.keys(groups).find(g => g.includes(k) || k.includes(g));
        if (matchedKey && groups[matchedKey]) {
          built.push({
            key: matchedKey,
            title: categoryTitles[matchedKey],
            icon: knownIcons[k] || '📍',
            spots: groups[matchedKey]
          });
          delete groups[matchedKey];
        }
      }

      // Add remaining
      for (const k of Object.keys(groups)) {
        let icon = '📍';
        // Try to guess icon
        if (k.includes('water')) icon = '🌊';
        else if (k.includes('trek') || k.includes('hike')) icon = '🥾';
        else if (k.includes('view') || k.includes('hill')) icon = '🌅';
        else if (k.includes('forest') || k.includes('eco') || k.includes('garden')) icon = '🌿';

        built.push({
          key: k,
          title: categoryTitles[k],
          icon,
          spots: groups[k]
        });
      }

      this.categories = built;
    } catch (e) {
      console.warn('Error loading tourist spots', e);
      // fallback
    }
  }

  goToSlide(index: number) {
    this.activeSlide = index % this.heroImages.length;
    // reset timer so user interaction delays the next autoplay
    this.restartAutoplay();
  }

  private startAutoplay() {
    if (this.slideTimer) return;
    this.slideTimer = setInterval(() => {
      this.activeSlide = (this.activeSlide + 1) % this.heroImages.length;
    }, this.slideIntervalMs);
  }

  private stopAutoplay() {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }

  private restartAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  private persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.bookedSpots));
  }

  get grandTotal(): number {
    return this.bookedSpots.reduce((sum, spot) => sum + spot.total, 0);
  }

  onAddTouristBooking(selection: TouristBookingSelection, spotId: string) {
    if (!this.isSearchPerformed) {
      alert('Please select a visit date first');
      return;
    }

    // Check if spot already exists
    const existingIndex = this.bookedSpots.findIndex(spot => spot.id === spotId);

    // Define unit prices for each spot
    const spotPrices = this.getSpotPrices(spotId);

    const peopleCount = selection.counts.adults + selection.counts.children;

    // Calculate parking based on split or generic
    let parkingTotal = 0;
    if (spotPrices.parkingTwoWheeler !== undefined && spotPrices.parkingFourWheeler !== undefined) {
      // Use split parking calculation
      parkingTotal = (spotPrices.parkingTwoWheeler * (selection.counts.twoWheelers || 0)) +
        (spotPrices.parkingFourWheeler * (selection.counts.fourWheelers || 0));
    } else {
      // Use generic parking calculation
      parkingTotal = spotPrices.parking * selection.counts.vehicles;
    }

    // Calculate breakdown
    const breakdown = {
      entry: spotPrices.entry * peopleCount,
      parking: parkingTotal,
      camera: spotPrices.camera * selection.counts.cameras,
      addOns: this.calculateAddOnsTotal(selection.addOns, spotId)
    };

    const bookedSpot: BookedTouristSpot = {
      id: spotId,
      name: selection.name,
      location: selection.location,
      type: selection.type,
      counts: selection.counts,
      unitPrices: spotPrices,
      breakdown,
      total: breakdown.entry + breakdown.parking + breakdown.camera + breakdown.addOns,
      peopleCount,
      addOns: selection.addOns
    };

    if (existingIndex >= 0) {
      // Update existing spot
      this.bookedSpots.splice(existingIndex, 1, bookedSpot);
    } else {
      // Add new spot
      this.bookedSpots = [...this.bookedSpots, bookedSpot];
    }

    this.persist();
    this.showAddedToBookingFeedback(selection.name);
  }

  removeSpot(index: number) {
    this.bookedSpots.splice(index, 1);
    this.bookedSpots = [...this.bookedSpots];
    this.persist();
  }

  incrementSpotCount(index: number, field: 'adults' | 'vehicles' | 'cameras' | 'twoWheelers' | 'fourWheelers') {
    const spot = this.bookedSpots[index];
    let currentValue = 0;

    if (field === 'adults') currentValue = spot.counts.adults;
    else if (field === 'vehicles') currentValue = spot.counts.vehicles;
    else if (field === 'cameras') currentValue = spot.counts.cameras;
    else if (field === 'twoWheelers') currentValue = spot.counts.twoWheelers || 0;
    else if (field === 'fourWheelers') currentValue = spot.counts.fourWheelers || 0;

    this.updateSpotCount(index, field, currentValue + 1);
  }

  decrementSpotCount(index: number, field: 'adults' | 'vehicles' | 'cameras' | 'twoWheelers' | 'fourWheelers') {
    const spot = this.bookedSpots[index];
    let currentValue = 0;

    if (field === 'adults') currentValue = spot.counts.adults;
    else if (field === 'vehicles') currentValue = spot.counts.vehicles;
    else if (field === 'cameras') currentValue = spot.counts.cameras;
    else if (field === 'twoWheelers') currentValue = spot.counts.twoWheelers || 0;
    else if (field === 'fourWheelers') currentValue = spot.counts.fourWheelers || 0;

    // Prevent going below 1 for adults, 0 for others
    if (field === 'adults' && currentValue <= 1) return;
    if (currentValue <= 0) return;

    this.updateSpotCount(index, field, currentValue - 1);
  }

  updateSpotCount(index: number, field: 'adults' | 'vehicles' | 'cameras' | 'twoWheelers' | 'fourWheelers', value: number) {
    if (value < 0) return;

    const spot = this.bookedSpots[index];

    // Update the specific field
    if (field === 'adults') {
      // For adults, we update the main count. 
      // Note: children are kept as is, but total people count will update
      spot.counts.adults = value;
      spot.peopleCount = spot.counts.adults + spot.counts.children;
    } else if (field === 'vehicles') {
      spot.counts.vehicles = value;
    } else if (field === 'cameras') {
      spot.counts.cameras = value;
    } else if (field === 'twoWheelers') {
      spot.counts.twoWheelers = value;
    } else if (field === 'fourWheelers') {
      spot.counts.fourWheelers = value;
    }

    // Recalculate totals
    this.recalculateSpotTotal(spot);
    this.persist();
  }

  private recalculateSpotTotal(spot: BookedTouristSpot) {
    const spotPrices = spot.unitPrices;

    // Calculate parking
    let parkingTotal = 0;
    if (spotPrices.parkingTwoWheeler !== undefined && spotPrices.parkingFourWheeler !== undefined) {
      parkingTotal = (spotPrices.parkingTwoWheeler * (spot.counts.twoWheelers || 0)) +
        (spotPrices.parkingFourWheeler * (spot.counts.fourWheelers || 0));
    } else {
      parkingTotal = spotPrices.parking * spot.counts.vehicles;
    }

    // Update breakdown
    spot.breakdown.entry = spotPrices.entry * spot.peopleCount;
    spot.breakdown.parking = parkingTotal;
    spot.breakdown.camera = spotPrices.camera * spot.counts.cameras;

    spot.total = spot.breakdown.entry + spot.breakdown.parking + spot.breakdown.camera + spot.breakdown.addOns;
  }

  proceedToCheckout() {
    if (this.bookedSpots.length === 0) return;

    // Calculate grand total
    const grandTotal = this.grandTotal;

    // Store booking data for checkout with proper structure
    const checkoutData = {
      spots: this.bookedSpots.map(spot => ({
        id: spot.id,
        name: spot.name,
        location: spot.location,
        type: spot.type,
        counts: {
          adults: spot.counts.adults,
          children: spot.counts.children || 0,
          vehicles: spot.counts.vehicles || 0,
          cameras: spot.counts.cameras || 0,
          twoWheelers: spot.counts.twoWheelers || 0,
          fourWheelers: spot.counts.fourWheelers || 0
        },
        unitPrices: {
          entry: spot.unitPrices.entry,
          parking: spot.unitPrices.parking,
          camera: spot.unitPrices.camera,
          parkingTwoWheeler: spot.unitPrices.parkingTwoWheeler,
          parkingFourWheeler: spot.unitPrices.parkingFourWheeler
        },
        breakdown: {
          entry: spot.breakdown.entry,
          parking: spot.breakdown.parking,
          camera: spot.breakdown.camera,
          addOns: spot.breakdown.addOns
        },
        total: spot.total,
        addOns: spot.addOns || []
      })),
      total: grandTotal,
      visitDate: this.searchCriteria?.visitDate,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('touristSpotsBooking', JSON.stringify(checkoutData));

    // Navigate to checkout page
    this.router.navigate(['/tourist-spots-checkout']);
  }

  private getSpotPrices(spotId: string): { entry: number; parking: number; camera: number; parkingTwoWheeler?: number; parkingFourWheeler?: number } {
    const cfg = this.spotMap[spotId];
    if (!cfg) return { entry: 0, parking: 0, camera: 0 };
    const { entryPerPerson, parkingPerVehicle, cameraPerCamera, parkingTwoWheeler, parkingFourWheeler } = cfg.fees;
    return {
      entry: entryPerPerson,
      parking: parkingPerVehicle,
      camera: cameraPerCamera,
      parkingTwoWheeler,
      parkingFourWheeler
    };
  }

  private calculateAddOnsTotal(selectedAddOnIds: string[], spotId: string): number {
    const cfg = this.spotMap[spotId];
    if (!cfg) return 0;
    // Build price map from config addOns (numeric prices only)
    const priceMap: { [key: string]: number } = {};
    cfg.addOns.forEach(a => {
      if (typeof a.price === 'number') priceMap[a.id] = a.price;
    });
    return selectedAddOnIds.reduce((sum, id) => sum + (priceMap[id] || 0), 0);
  }

  private showAddedToBookingFeedback(spotName: string) {
    const feedback = document.createElement('div');
    feedback.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-5';
    feedback.style.zIndex = '9999';
    feedback.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i>${spotName} added to booking!`;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }

  // Filter methods
  applyFilters() {
    const selectedCategories = this.categoryFilters
      .filter(f => f.selected)
      .map(f => f.value);

    // If no category is selected, show all categories
    const shouldFilterByCategory = selectedCategories.length > 0;

    this.filteredCategories = this.categories.map(category => {
      // If we are filtering by category, and this category is NOT selected, return empty spots
      if (shouldFilterByCategory && !selectedCategories.includes(category.key)) {
        return { ...category, spots: [] };
      }

      let filteredSpots = category.spots;

      // Apply time filter (placeholder logic - adjust based on your data)
      if (this.selectedTimeFilter !== 'all') {
        filteredSpots = this.filterByTime(filteredSpots);
      }

      return {
        ...category,
        spots: filteredSpots
      };
    }).filter(category => category.spots.length > 0);
  }

  private filterByTime(spots: TouristSpotConfig[]): TouristSpotConfig[] {
    // Filter spots based on selected time filter
    if (this.selectedTimeFilter === 'all') {
      return spots;
    }

    return spots.filter(spot => {
      // Match the timing field with the selected filter
      return spot.timing === this.selectedTimeFilter;
    });
  }

  clearFilters() {
    // Reset all category filters
    this.categoryFilters.forEach(f => f.selected = false);
    // Reset time filter
    this.selectedTimeFilter = 'all';
    // Reapply filters
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    const hasCategoryFilter = this.categoryFilters.some(f => f.selected);
    const hasTimeFilter = this.selectedTimeFilter !== 'all';
    return hasCategoryFilter || hasTimeFilter;
  }

  hasAnySpots(): boolean {
    return this.filteredCategories.some(cat => cat.spots.length > 0);
  }

  // Accordion toggle methods
  toggleBookingSummary() {
    this.isBookingSummaryExpanded = !this.isBookingSummaryExpanded;
  }

  toggleFilters() {
    this.isFiltersExpanded = !this.isFiltersExpanded;
  }

  isSpotsAvailable() {
    return this.bookedSpots.length > 0;
  }

  /**
   * Handle search submission - enable booking for the selected date
   */
  onSearchSubmitted(criteria: { visitDate: string }): void {
    this.searchCriteria = criteria;
    this.isSearchPerformed = true;
    
    // In the future, you can filter spots based on availability for the selected date
    // For now, just enable the Add buttons by setting isSearchPerformed = true
  }
}