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