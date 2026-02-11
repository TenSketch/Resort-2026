import { Component, Renderer2, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-tourist-places',
  templateUrl: './tourist-places.component.html',
  styleUrls: ['./tourist-places.component.scss'],
})
export class TouristPlacesComponent implements OnInit, AfterViewInit {
  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller
  ) {}

  heroSlides = [
    {
      id: 1,
      image: 'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls.jpg',
      title: 'Tourist Destinations',
      location: 'Explore the breathtaking waterfalls, lush forests, and serene picnic spots of Maredumilli.',
      subtitle: null,
      tagline: 'Discover Nature',
      startText: null,
      price: null,
      cta: 'Explore Now',
      action: 'explore'
    }
  ];

  // Store current main image for each section
  currentImages: { [key: string]: string } = {
    jalatarangini: 'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls.jpg',
    amruthadhara: 'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls.jpg',
    karthikavanam: 'assets/img/TOURIST-PLACES/karthikavanam-picnic-spot.jpg',
    mpca: 'assets/img/TOURIST-PLACES/MPCA.jpg',
    softTrek: 'assets/img/TOURIST-PLACES/Jalatharangani-trek.jpg',
    hardTrek: 'assets/img/TOURIST-PLACES/junglestar-trek-01.jpg',
    gudisa: 'assets/img/TOURIST-PLACES/gudisa-hills-1.jpg'
  };

  /**
   * Updates the main image for a specific section.
   * @param sectionKey - The key identifying the section (e.g., 'jalatarangini').
   * @param imagePath - The new image path to display.
   */
  setMainImage(sectionKey: string, imagePath: string): void {
    if (this.currentImages[sectionKey]) {
      this.currentImages[sectionKey] = imagePath;
    }
  }

  handleSlideAction(action: string) {
    if (action === 'explore') {
      const element = document.getElementById('jalatarangini-waterfall');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  ngOnInit() {
    // Don't scroll to top if there's a fragment
    this.route.fragment.subscribe((fragment: string | null) => {
      if (!fragment) {
        this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
      }
    });
  }

  ngAfterViewInit() {
    // Handle fragment scrolling after view is initialized
    this.route.fragment.subscribe((fragment: string | null) => {
      if (fragment) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          this.scrollToSection(fragment);
        }, 100);
      }
    });
  }

  private scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      // Calculate position with offset for fixed navbar
      const yOffset = -80; // Adjust based on your navbar height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      // Scroll to the calculated position
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      // Fallback: try Angular's ViewportScroller
      try {
        this.viewportScroller.scrollToAnchor(sectionId);
      } catch (e) {
        console.warn('Could not scroll to section:', sectionId);
      }
    }
  }
}