import { Component, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-about-vanavihari',
  templateUrl: './about-vanavihari.component.html',
  styleUrls: ['./about-vanavihari.component.scss']
})
export class AboutVanavihariComponent {
  heroSlides = [
    {
      id: 1,
      image: 'assets/img/about_us-photo2.jpg',
      title: 'About Vanavihari',
      location: 'Discover the heart of eco-tourism in Maredumilli, where nature meets community.',
      tagline: 'Eco-Tourism Initiative',
      cta: 'Learn More',
      action: 'learn-more'
    }
  ];

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }

  handleSlideAction(action: string) {
    if (action === 'learn-more') {
      window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
    }
  }
}
