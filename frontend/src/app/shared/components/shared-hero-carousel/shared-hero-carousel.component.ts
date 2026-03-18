import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

export interface CarouselSlide {
  image: string;
  title: string;
  location?: string;
  subtitle?: string;
  tagline?: string;
  price?: string;
  startText?: string;
  cta?: string;
  action?: string;
}

@Component({
  selector: 'app-shared-hero-carousel',
  templateUrl: './shared-hero-carousel.component.html',
  styleUrls: ['./shared-hero-carousel.component.scss']
})
export class SharedHeroCarouselComponent implements OnInit, OnDestroy {
  @Input() slides: CarouselSlide[] = [];
  @Input() carouselId: string = 'sharedCarouselFade';
  @Input() isRoomsCarousel: boolean = false;
  
  @Output() actionClicked = new EventEmitter<string>();

  currentSlideIndex = 0;
  private carouselElement: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  ngOnInit() {
    // We observe class changes on carousel items to update the slide index if bootstraps carousel moves it
    setTimeout(() => {
      this.carouselElement = document.getElementById(this.carouselId);
      if (this.carouselElement) {
        // Listen to bootstrap slide events if needed, or just use mutation observer on items
        this.carouselElement.addEventListener('slid.bs.carousel', this.onSlide.bind(this));
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.carouselElement) {
      this.carouselElement.removeEventListener('slid.bs.carousel', this.onSlide.bind(this));
    }
  }

  onSlide(event: any) {
    this.currentSlideIndex = event.to;
  }

  handleSlideAction(action?: string) {
    if (action) {
      this.actionClicked.emit(action);
    }
  }

  prevSlide() {
    if (this.carouselElement) {
      // @ts-ignore
      const bootstrap = window['bootstrap'];
      if (bootstrap && bootstrap.Carousel) {
        const carousel = bootstrap.Carousel.getInstance(this.carouselElement) || new bootstrap.Carousel(this.carouselElement);
        carousel.prev();
      }
    }
  }

  nextSlide() {
    if (this.carouselElement) {
      // @ts-ignore
      const bootstrap = window['bootstrap'];
      if (bootstrap && bootstrap.Carousel) {
        const carousel = bootstrap.Carousel.getInstance(this.carouselElement) || new bootstrap.Carousel(this.carouselElement);
        carousel.next();
      }
    }
  }
}
