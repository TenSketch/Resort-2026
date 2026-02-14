import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TouristBookingSelection } from '../../shared/tourist-spot-selection/tourist-spot-selection.component';
import { TouristSpotCategory, TouristSpotConfig, TOURIST_SPOT_CATEGORIES } from './tourist-spots.data';
import { TouristSpotService } from '../../services/tourist-spot.service';

export interface BookedTouristSpot {
  id: string;
  name: string;
  location: string;
  type?: string;
  difficulty?: 'Soft' | 'Medium' | 'Hard';
  counts: {
    adults: number;
    children: number;
    vehicles: number;
    cameras: number;
  };
  unitPrices: {
    entry: number;
    parking: number;
    camera: number;
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

  // Flattened local spots for easy lookup
  private localSpots: TouristSpotConfig[] = [];

  // Search state
  isSearchPerformed: boolean = true; // Always true to keep buttons active
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
  heroSlides: {
    id: number;
    image: string;
    title: string;
    location: string;
    subtitle: string | null;
    tagline: string;
    startText: string | null;
    price: string | null;
    cta: string;
    action: string;
  }[] = [];
  
  handleSlideAction(action: string) {
    if (action === 'explore') {
      const element = document.querySelector('.tourist-spots-list');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  constructor(
    private router: Router,
    private breakpointObserver: BreakpointObserver
    ,
    private touristSpotService: TouristSpotService
  ) {
    // Flatten local spots
    this.localSpots = TOURIST_SPOT_CATEGORIES.flatMap(c => c.spots);

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
        this.initHeroSlides();
      })
      .catch(err => {
        console.warn('Failed to load Trek Spots from backend', err);
        this.applyFilters();
        this.initHeroSlides();
      });

    // Detect mobile breakpoint
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  private getLocalMapUrl(backendName: string): string | undefined {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bName = normalize(backendName);

    // 1. Try exact or fuzzy name match
    const match = this.localSpots.find(s => {
      const lName = normalize(s.name);
      return bName.includes(lName) || lName.includes(bName);
    });
    if (match?.mapurl) return match.mapurl;

    // 2. Fallback to keyword matching if name match failed (handling spelling diffs)
    if (bName.includes('jalatarangini') || (bName.includes('soft') && bName.includes('trek'))) {
      return this.localSpots.find(s => s.id === 'soft-trek')?.mapurl;
    }
    if (bName.includes('amruthadhara')) {
      return this.localSpots.find(s => s.id === 'amruthadhara')?.mapurl;
    }
    if (bName.includes('junglestar') || (bName.includes('very') && bName.includes('hard'))) {
      return this.localSpots.find(s => s.id === 'hard-trek')?.mapurl;
    }

    return undefined;
  }

  ngAfterViewInit(): void {
    // ensure autoplay started after view init
    // ensure autoplay started after view init
  }

  ngOnDestroy(): void {
  }

  private initHeroSlides() {
    // Default placeholder
    const defaultSlides = [
      {
        id: 1,
        image: 'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls.jpg',
        title: 'Book Trek Spots',
        location: 'Maredumilli, Andhra Pradesh',
        subtitle: null,
        tagline: 'Discover Nature',
        startText: null,
        price: null,
        cta: 'Book Now',
        action: 'explore'
      }
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
        this.heroSlides = collected.map((img, index) => ({
          id: index + 1,
          image: img,
          title: 'Book Trek Spots',
          location: 'Maredumilli, Andhra Pradesh',
          subtitle: null,
          tagline: 'Discover Nature',
          startText: null,
          price: null,
          cta: 'Book Now',
          action: 'explore'
        }));
      } else {
        this.heroSlides = defaultSlides;
      }
    } else {
      this.heroSlides = defaultSlides;
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
        
        // Define Trek Specific Data
        let capacity = undefined;
        let timings = 'Morning - Evening';
        let inclusions = undefined;
        let notes = undefined;
        
        const nameLower = (s.name || s.title || '').toLowerCase();
        
        if (nameLower.includes('trek')) {
            if (nameLower.includes('soft') || nameLower.includes('jalatarangini')) {
                // Soft Trek Logic (1)
                capacity = { treksPerDay: 3, membersPerTrek: 30, totalCapacity: 90 };
                timings = '6:00 AM – 3:00 PM';
                inclusions = {
                    breakfast: ['Simple sandwich', 'Banana', 'Small tetra pack drink']
                };
            } else if (nameLower.includes('medium') || nameLower.includes('hard') && !nameLower.includes('very hard')) {
                // Medium/Hard Trek Logic (2) - Jungle Star -> Nellore
                // Assuming 'medium-trek' matches this
                capacity = { treksPerDay: 2, membersPerTrek: 30, totalCapacity: 60 };
                timings = '6:00 AM – 3:00 PM';
                inclusions = {
                     breakfast: ['Simple sandwich', 'Banana', 'Small tetra pack drink']
                };
            } else if (nameLower.includes('very hard') || nameLower.includes('gudisa')) {
                // Very Hard Trek Logic (3)
                 capacity = { treksPerDay: 1, membersPerTrek: 20, totalCapacity: 20 };
                 timings = '6:00 AM – 3:00 PM';
                 inclusions = {
                     lunch: ['Simple lunch included']
                 };
                 notes = [
                     'Vehicle charge is mandatory',
                     'Till Gudisa hills by vehicle and thereafter trekking to Mothugudem for the entire day.'
                 ];
            }
        }


        const cfg: TouristSpotConfig = {
          id,
          name: s.name || s.title || 'Untitled',
          location: s.address || '',
          category: rawCategory as any, // Allow dynamic string
          typeLabel: s.category || '',
          images: Array.isArray(s.images) ? s.images.map((i: any) => typeof i === 'string' ? i : (i.url || '')) : [],
          fees: {
            entryPerPerson: (function() {
              if (nameLower.includes('trek')) {
                if (nameLower.includes('very hard')) return 1200;
                if (nameLower.includes('medium') || nameLower.includes('hard')) return 800;
                return 500; // Soft/Default Trek
              }
              return Number(s.entryFees || 0);
            })(),
            parkingPerVehicle: 0, // Force 0 for all
            cameraPerCamera: Number(s.cameraFees || 0),
          },
          addOns: [], // Backend doesn't seem to return addOns yet, keep empty or map if added
          timing: 'morning-evening', // Default, logic to map from backend if available
          detailsFragment: s.slug || undefined, // Use slug as the section ID
          difficulty: undefined,
          distanceKm: undefined,
          elevationGainM: undefined,
          ticketsLeftToday: s.ticketsLeftToday ?? undefined,
          capacity,
          timings: timings !== 'Morning - Evening' ? timings : undefined,
          inclusions,
          notes,
          mapurl: s.mapurl || this.getLocalMapUrl(s.name || s.title || '') || undefined // Try backend first, then local fallback
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
      
      // Refresh booked spots with latest prices
      this.refreshBookedSpotsPrices();
    } catch (e) {
      console.warn('Error loading Trek Spots', e);
      // fallback
    }
  }

  private refreshBookedSpotsPrices() {
    let changed = false;
    this.bookedSpots.forEach(spot => {
      const freshPrices = this.getSpotPrices(spot.id);
      
      // Check if prices changed (simple check or just overwrite)
      // Overwrite to ensure latest data (e.g. removed parking fields)
      spot.unitPrices = freshPrices;
      
      // If parking fields are removed from data, ensure they are undefined in counts/unitPrices if needed
      // Cleanup complete: 2W/4W fields removed.
      
      this.recalculateSpotTotal(spot);
      changed = true;
    });

    if (changed) {
      this.persist();
    }
  }



  private persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.bookedSpots));
  }

  get grandTotal(): number {
    return this.bookedSpots.reduce((sum, spot) => sum + spot.total, 0);
  }

  onAddTouristBooking(selection: TouristBookingSelection, spotId: string) {
    // if (!this.searchCriteria?.visitDate && !localStorage.getItem('tempVisitDate')) {
    //   alert('Please select a visit date first');
    //   // Scroll to top or highlight date picker?
    //   document.querySelector('mat-form-field')?.scrollIntoView({ behavior: 'smooth' });
    //   return;
    // }

    // Check if spot already exists
    const existingIndex = this.bookedSpots.findIndex(spot => spot.id === spotId);

    // Define unit prices for each spot
    const spotPrices = this.getSpotPrices(spotId);

    // Default difficulty for Trek
    let difficulty: 'Soft' | 'Medium' | 'Hard' | undefined = undefined;
    if (selection.type?.includes('Trek')) {
      if (spotId === 'soft-trek') difficulty = 'Soft';
      else if (spotId === 'medium-trek') difficulty = 'Medium';
      else if (spotId === 'hard-trek') difficulty = 'Hard';
      else difficulty = 'Soft'; // Fallback

      // Ensure price matches difficulty
      if (difficulty === 'Soft') spotPrices.entry = 500;
      else if (difficulty === 'Medium') spotPrices.entry = 800;
      else if (difficulty === 'Hard') spotPrices.entry = 1200;
    }

    const peopleCount = selection.counts.adults + selection.counts.children;

    // Calculate parking - simplified to generic parking
    const parkingTotal = spotPrices.parking * selection.counts.vehicles;

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
      difficulty,
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

  incrementSpotCount(index: number, field: 'adults' | 'vehicles' | 'cameras') {
    const spot = this.bookedSpots[index];
    let currentValue = 0;

    if (field === 'adults') currentValue = spot.counts.adults;
    else if (field === 'vehicles') currentValue = spot.counts.vehicles;
    else if (field === 'cameras') currentValue = spot.counts.cameras;

    this.updateSpotCount(index, field, currentValue + 1);
  }

  decrementSpotCount(index: number, field: 'adults' | 'vehicles' | 'cameras') {
    const spot = this.bookedSpots[index];
    let currentValue = 0;

    if (field === 'adults') currentValue = spot.counts.adults;
    else if (field === 'vehicles') currentValue = spot.counts.vehicles;
    else if (field === 'cameras') currentValue = spot.counts.cameras;

    // Prevent going below 1 for adults, 0 for others
    if (field === 'adults' && currentValue <= 1) return;
    if (currentValue <= 0) return;

    this.updateSpotCount(index, field, currentValue - 1);
  }

  updateSpotCount(index: number, field: 'adults' | 'vehicles' | 'cameras', value: number) {
    if (value < 0) return;

    const spot = this.bookedSpots[index];

    // Update the specific field
    if (field === 'adults') {
      // Force minimum 1 adult
      // If value is null, undefined, 0, or negative, reset to 1
      if (!value || value < 1) {
        value = 1;
      }

      // For adults, we update the main count. 
      // Note: children are kept as is, but total people count will update
      spot.counts.adults = value;
      spot.peopleCount = spot.counts.adults + spot.counts.children;
    } else if (field === 'vehicles') {
      spot.counts.vehicles = value;
    } else if (field === 'cameras') {
      spot.counts.cameras = value;
    }

    // Recalculate totals
    this.recalculateSpotTotal(spot);
    this.persist();
  }

  updateSpotDifficulty(index: number, difficulty: 'Soft' | 'Medium' | 'Hard') {
    const spot = this.bookedSpots[index];
    spot.difficulty = difficulty;

    // Update fee based on difficulty
    if (difficulty === 'Soft') spot.unitPrices.entry = 500;
    else if (difficulty === 'Medium') spot.unitPrices.entry = 800;
    else if (difficulty === 'Hard') spot.unitPrices.entry = 1200;

    this.recalculateSpotTotal(spot);
    this.persist();
  }

  private recalculateSpotTotal(spot: BookedTouristSpot) {
    const spotPrices = spot.unitPrices;

    // Calculate parking
    const parkingTotal = spotPrices.parking * spot.counts.vehicles;

    // Update breakdown
    spot.breakdown.entry = spotPrices.entry * spot.peopleCount;
    spot.breakdown.parking = parkingTotal;
    spot.breakdown.camera = spotPrices.camera * spot.counts.cameras;

    spot.total = spot.breakdown.entry + spot.breakdown.parking + spot.breakdown.camera + spot.breakdown.addOns;
  }

  // Booking State
  visitDate: Date | null = null;
  minDate: Date = new Date(new Date().setDate(new Date().getDate() + 1)); // Tomorrow

  // Helper to get form controls for template
  // ...

  private showAddedToBookingFeedback(spotName: string) {
    const feedback = document.createElement('div');
    // Removed top-0 and mt-5, using explicit top style to clear navbar
    feedback.className = 'alert alert-success position-fixed start-50 translate-middle-x';
    feedback.style.zIndex = '9999';
    feedback.style.top = '100px'; // Position below the 80px navbar
    feedback.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i>${spotName} added to booking!`;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }

  proceedToCheckout() {
    if (this.bookedSpots.length === 0) {
      alert('Please add trek spots to your booking.');
      return;
    }

    if (!this.visitDate) {
      alert('Please select a visit date to proceed.');
      return;
    }

    // Validate visit date is not past or today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(this.visitDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      alert('Visit date must be tomorrow or later.');
      return;
    }

    // Calculate grand total
    const grandTotal = this.grandTotal;

    // Store booking data for checkout with proper structure
    const checkoutData = {
      spots: this.bookedSpots.map(spot => ({
        id: spot.id,
        name: spot.name,
        location: spot.location,
        type: spot.type,
        difficulty: spot.difficulty,
        counts: {
          adults: spot.counts.adults,
          children: spot.counts.children || 0,
          vehicles: spot.counts.vehicles || 0,
          cameras: spot.counts.cameras || 0,
        },
        unitPrices: {
          entry: spot.unitPrices.entry,
          parking: spot.unitPrices.parking,
          camera: spot.unitPrices.camera,
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
      visitDate: this.visitDate.toISOString(), // Use local visitDate
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('touristSpotsBooking', JSON.stringify(checkoutData));

    // Navigate to checkout page
    this.router.navigate(['/tourist-spots-checkout']);
  }

  private getSpotPrices(spotId: string): { entry: number; parking: number; camera: number } {
    const cfg = this.spotMap[spotId];
    if (!cfg) return { entry: 0, parking: 0, camera: 0 };
    const { entryPerPerson, parkingPerVehicle, cameraPerCamera } = cfg.fees;
    return {
      entry: entryPerPerson,
      parking: parkingPerVehicle || 0,
      camera: cameraPerCamera,
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
console.log(this.filteredCategories)
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
    console.log(this.filteredCategories)
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