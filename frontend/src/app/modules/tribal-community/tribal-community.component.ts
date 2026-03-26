import { Component, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-tribal-community',
  templateUrl: './tribal-community.component.html',
  styleUrls: ['./tribal-community.component.scss'],
})
export class TribalCommunityComponent {
  heroSlides = [
    {
      id: 1,
      image: 'assets/img/tribal/1.jpg',
      title: 'Tribal Communities',
      location: 'Discover the rich traditions and timeless lifestyle of the indigenous tribes of the Eastern Ghats.',
      tagline: 'Heritage & Culture',
      cta: 'Explore Now',
      action: 'explore'
    },
    {
      id: 2,
      image: 'assets/img/tribal/2.jpg',
      title: 'Traditional Way of Life',
      location: 'Experience authentic tribal cooking and survival skills within the heart of the forest.',
      tagline: 'Authentic Experience',
      cta: 'Learn More',
      action: 'learn-more'
    }
  ];

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }
}
