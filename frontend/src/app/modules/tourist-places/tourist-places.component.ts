import { Component, Renderer2, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { Gallery, GalleryItem, ImageItem, ImageSize } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';

@Component({
  selector: 'app-tourist-places',
  templateUrl: './tourist-places.component.html',
  styleUrls: ['./tourist-places.component.scss'],
})
export class TouristPlacesComponent implements OnInit, AfterViewInit {
  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    public gallery: Gallery,
    public lightbox: Lightbox
  ) { }

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
    },
    {
      id: 2,
      image: 'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls.jpg',
      title: 'Jalatarangini Waterfall',
      location: 'A picturesque cascade amidst lush forest and rocky terrain.',
      subtitle: null,
      tagline: 'Seasonal Wonder',
      startText: null,
      price: null,
      cta: 'View Details',
      action: 'jalatarangini'
    },
    {
      id: 3,
      image: 'assets/img/TOURIST-PLACES/karthikavanam-picnic-spot.jpg',
      title: 'Karthikavanam',
      location: 'A scenic wildlife viewing area developed by the Forest Department.',
      subtitle: null,
      tagline: 'Picnic Spot',
      startText: null,
      price: null,
      cta: 'Plan Visit',
      action: 'karthikavanam'
    }
  ];

  currentSlideIndex: number = 0;

  // Image data for Lightbox
  destinationImages: { [key: string]: string[] } = {
    jalatarangini: [
      'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls.jpg',
      'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls-01.jpg',
      'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls-02.jpg'
    ],
    amruthadhara: [
      'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls.jpg',
      'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls-01.jpg',
      'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls-02.jpg'
    ],
    karthikavanam: [
      'assets/img/TOURIST-PLACES/karthikavanam-picnic-spot.jpg',
      'assets/img/TOURIST-PLACES/karthikavanam-picnic-spot-01.jpg'
    ],
    mpca: [
      'assets/img/TOURIST-PLACES/MPCA.jpg',
      'assets/img/TOURIST-PLACES/MPCA-01.jpg'
    ],
    softTrek: [
      'assets/img/TOURIST-PLACES/Jalatharangani-trek.jpg',
      'assets/img/TOURIST-PLACES/Jalatharangani-entrance.jpg',
      'assets/img/TOURIST-PLACES/Jalatharangani-trek-01.jpg'
    ],
    hardTrek: [
      'assets/img/TOURIST-PLACES/junglestar-trek-01.jpg',
      'assets/img/TOURIST-PLACES/junglestar-trek-02.jpg',
      'assets/img/TOURIST-PLACES/junglestar-trek-03.jpg'
    ],
    gudisa: [
      'assets/img/TOURIST-PLACES/gudisa-hills-1.jpg',
      'assets/img/TOURIST-PLACES/gudisa-hills-2.jpg',
      'assets/img/TOURIST-PLACES/gudisa-hills-3.jpg'
    ]
  };

  /**
   * Opens the lightbox for a specific section and image index.
   */
  openLightbox(index: number, sectionKey: string) {
    const images = this.destinationImages[sectionKey];
    if (!images) return;

    const items: GalleryItem[] = images.map(
      (src) => new ImageItem({ src, thumb: src })
    );

    const lightboxRef = this.gallery.ref('destination-lightbox');
    lightboxRef.setConfig({
      imageSize: ImageSize.Contain,
      thumb: false,
      dots: true
    });
    lightboxRef.load(items);
    this.lightbox.open(index, 'destination-lightbox');
  }

  /**
   * Horizontal scroll handlers for the image carousels
   */
  scrollLeft(container: HTMLElement) {
    container.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight(container: HTMLElement) {
    container.scrollBy({ left: 300, behavior: 'smooth' });
  }

  handleSlideAction(action: string) {
    if (action === 'explore') {
      const element = document.getElementById('jalatarangini-waterfall');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action === 'jalatarangini') {
      this.scrollToSection('jalatarangini-waterfall');
    } else if (action === 'karthikavanam') {
      this.scrollToSection('karthikavanam-picnic-spot');
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

    // Listen to carousel slide event to update counter
    const carouselElement = document.getElementById('carouselExampleFade');
    if (carouselElement) {
      carouselElement.addEventListener('slid.bs.carousel', (event: any) => {
        this.currentSlideIndex = event.to;
      });
    }
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